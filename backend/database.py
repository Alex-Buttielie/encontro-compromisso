"""Firestore database setup and compatibility layer.

This module provides:
- init_app() / get_db() — Firestore client lifecycle
- FirestoreModel — backward-compat base class that combines the pure
  domain Entity with the FirestoreSerializable mixin.

In the hexagonal architecture:
- domain/entity.py defines the pure Entity (no infra deps)
- adapters/firestore_serializable.py defines serialization
- database.py bridges them for backward compatibility

New code should depend on domain.entity.Entity and ports.* interfaces.
"""
from logger import get_logger
from domain.entity import Entity
from adapters.firestore_serializable import FirestoreSerializable

_logger = get_logger('database')

_db = None


def init_app(app):
    """Initialize Firestore with the Flask app."""
    from firebase_config import init_firebase
    global _db
    _db = init_firebase()
    _logger.info('Firestore initialized')


def get_db():
    """Get the Firestore client instance."""
    global _db
    if _db is None:
        from firebase_config import get_firestore
        _db = get_firestore()
    return _db


class FirestoreModel(Entity, FirestoreSerializable):
    """Backward-compat base class combining pure Entity + Firestore serialization.

    Existing models inherit from this and keep their to_dict()/from_dict()
    overrides. New models should inherit from Entity directly and use
    FirestoreSerializable only when needed by the Firestore adapter.
    """

    collection = None  # Override in subclass (infra concern, kept for compat)

