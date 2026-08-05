"""Firestore repository adapter — implements ports.RepositoryPort.

This is an infrastructure adapter. It uses the Firestore client to
persist and retrieve domain entities. Services depend on the port
interface, not on this concrete implementation.

To swap databases (e.g. to PostgreSQL), create a new adapter that
implements the same ports.RepositoryPort interface.
"""
from logger import get_logger
from database import get_db
from ports import RepositoryPort
from adapters.firestore_serializable import FirestoreSerializable


class BaseRepository(RepositoryPort):
    """Firestore implementation of RepositoryPort."""

    def __init__(self, model):
        self.model = model
        self.collection_name = getattr(model, 'collection', model.__name__.lower())
        self.logger = get_logger(f'{self.__class__.__name__}')

    def _collection(self):
        return get_db().collection(self.collection_name)

    def _next_id(self):
        """Get the next sequential integer ID from the counters collection."""
        import google.cloud.firestore as firestore
        db = get_db()
        counter_ref = db.collection('counters').document(self.collection_name)

        @firestore.transactional
        def _increment(transaction):
            snapshot = counter_ref.get(transaction=transaction)
            current = snapshot.get('value') if snapshot.exists else 0
            new_value = current + 1
            transaction.set(counter_ref, {'value': new_value})
            return new_value

        transaction = db.transaction()
        return _increment(transaction)

    def _serialize(self, entity):
        """Convert entity to a dict for Firestore storage.

        Uses the base FirestoreSerializable.to_dict() which serializes
        all raw instance attributes (not the API response version).
        This ensures all domain attributes are persisted.
        """
        import datetime
        data = FirestoreSerializable.to_dict(entity)
        converted = {}
        for key, value in data.items():
            if isinstance(value, datetime.datetime):
                converted[key] = value.isoformat()
            elif isinstance(value, datetime.date):
                converted[key] = value.isoformat()
            elif isinstance(value, datetime.time):
                converted[key] = value.isoformat()
            elif isinstance(value, list):
                converted[key] = [
                    FirestoreSerializable.to_dict(v) if hasattr(v, '__dict__') and not isinstance(v, dict) else v
                    for v in value
                ]
            else:
                converted[key] = value
        return converted

    @staticmethod
    def _camel_to_snake(name):
        """Convert camelCase to snake_case."""
        import re
        s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    def _deserialize(self, doc_snapshot):
        """Convert a Firestore document snapshot to a model instance."""
        if not doc_snapshot.exists:
            return None
        data = doc_snapshot.to_dict()
        data['id'] = int(doc_snapshot.id) if doc_snapshot.id.isdigit() else doc_snapshot.id
        return self.model.from_dict(data)

    def add(self, entity):
        """Add a new entity with an auto-generated sequential ID."""
        entity_id = self._next_id()
        entity.id = entity_id
        data = self._serialize(entity)
        self._collection().document(str(entity_id)).set(data)
        self.logger.debug('Entity added: model=%s id=%s', self.model.__name__, entity_id)
        return entity

    def get_by_id(self, entity_id, user_id=None):
        """Get entity by ID, optionally scoped by user."""
        doc = self._collection().document(str(entity_id)).get()
        if not doc.exists:
            return None
        entity = self._deserialize(doc)
        if user_id is not None and hasattr(entity, 'user_id') and entity.user_id != user_id:
            return None
        self.logger.debug('Entity lookup: model=%s id=%s user_id=%s found=%s',
                          self.model.__name__, entity_id, user_id, entity is not None)
        return entity

    def get_all(self, user_id=None):
        """Get all entities, optionally scoped by user."""
        query = self._collection()
        if user_id is not None:
            query = query.where('user_id', '==', user_id)
        docs = query.stream()
        entities = [self._deserialize(doc) for doc in docs]
        self.logger.debug('Entity list: model=%s user_id=%s count=%s',
                          self.model.__name__, user_id, len(entities))
        return entities

    def get_paginated(self, user_id=None, page=1, limit=20):
        """Get paginated entities, optionally scoped by user."""
        query = self._collection()
        if user_id is not None:
            query = query.where('user_id', '==', user_id)
        total_query = query
        docs = list(total_query.stream())
        total = len(docs)
        offset = (page - 1) * limit
        page_docs = docs[offset:offset + limit]
        entities = [self._deserialize(doc) for doc in page_docs]
        pages = (total + limit - 1) // limit if limit > 0 else 1
        self.logger.debug('Paginated list: model=%s user_id=%s page=%s limit=%s total=%s',
                          self.model.__name__, user_id, page, limit, total)
        return entities, total, pages

    def save(self, entity):
        """Persist an entity that was mutated through its domain behavior."""
        data = self._serialize(entity)
        self._collection().document(str(entity.id)).set(data)
        self.logger.debug('Entity saved: model=%s id=%s', self.model.__name__, entity.id)
        return entity

    def delete(self, entity):
        """Delete an entity."""
        entity_id = entity.id
        self._collection().document(str(entity_id)).delete()
        self.logger.debug('Entity deleted: model=%s id=%s', self.model.__name__, entity_id)
