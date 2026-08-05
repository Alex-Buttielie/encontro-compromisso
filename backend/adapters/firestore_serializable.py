"""Firestore serialization mixin for infrastructure layer.

This mixin provides to_dict() and from_dict() methods that the
FirestoreRepository adapter uses to serialize/deserialize entities.

Domain entities (Entity subclass) are pure and don't know about
serialization. This mixin is applied by the repository adapter
when it needs to persist or reconstruct entities.

Usage in FirestoreRepository:
    data = self._serialize(entity)   # entity.to_dict() via mixin
    entity = self._deserialize(doc)  # Entity.from_dict() via mixin
"""
import datetime
import json


class FirestoreSerializable:
    """Mixin that adds Firestore serialization to domain entities.

    Entities that need persistence should use this mixin alongside Entity.
    The to_dict() method should be overridden by each entity to define
    which fields are persisted.

    This mixin lives in the infrastructure layer, NOT in the domain layer.
    """

    def to_dict(self):
        """Default serialization — override in each entity subclass.

        The default implementation serializes all instance attributes
        (from __dict__) to a dict, converting datetimes to ISO strings.
        This is used for persistence, not for API responses.
        """
        data = {}
        for key, value in self.__dict__.items():
            if key.startswith('_'):
                continue
            if isinstance(value, datetime.datetime):
                data[key] = value.isoformat()
            elif isinstance(value, datetime.date):
                data[key] = value.isoformat()
            elif isinstance(value, datetime.time):
                data[key] = value.isoformat()
            else:
                data[key] = value
        return data

    @staticmethod
    def _camel_to_snake(name):
        """Convert camelCase to snake_case."""
        import re
        s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    @classmethod
    def from_dict(cls, data):
        """Reconstruct an entity from a Firestore document dict.

        Converts camelCase keys to snake_case to match entity attributes.
        Skips keys that correspond to read-only properties (no setter) or methods.
        Handles datetime conversion for fields ending in '_at' or 'created_at'.
        """
        import re
        converted = {}
        # Get read-only property and method names to skip them
        skip_names = set()
        for attr_name in dir(cls):
            attr = getattr(cls, attr_name, None)
            if isinstance(attr, property) and not attr.fset:
                skip_names.add(attr_name)
            elif callable(attr) and not isinstance(attr, type):
                skip_names.add(attr_name)

        for key, value in (data or {}).items():
            snake_key = cls._camel_to_snake(key)
            if snake_key in skip_names:
                continue
            if isinstance(value, str) and (snake_key.endswith('_at') or snake_key == 'created_at' or snake_key.endswith('_start') or snake_key.endswith('_end')):
                try:
                    converted[snake_key] = datetime.datetime.fromisoformat(value)
                except (ValueError, TypeError):
                    converted[snake_key] = value
            elif isinstance(value, str) and (snake_key.endswith('_date') or snake_key in ('date', 'birthday', 'due_date', 'valid_until', 'start_date', 'end_date')):
                try:
                    converted[snake_key] = datetime.date.fromisoformat(value)
                except (ValueError, TypeError):
                    converted[snake_key] = value
            else:
                converted[snake_key] = value
        return cls(**converted)
