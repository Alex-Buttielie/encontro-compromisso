"""Base Entity class for the domain layer.

This is the pure domain base class — it has ZERO dependencies on any
infrastructure (no Firestore, no SQLAlchemy, no serialization logic).

Each entity owns its invariants and behavior. Persistence concerns
(serialize/deserialize, collection names) are handled by adapters
in the infrastructure layer via a SerializationMixin.

Usage in domain models:
    from domain.entity import Entity

    class User(Entity):
        @classmethod
        def create(cls, name, email, ...):
            # factory with invariant validation
            return cls(name=name, email=email, ...)

        def confirm_email(self, token):
            # domain behavior
            ...
"""
import datetime


class Entity:
    """Pure domain entity base class.

    Provides:
    - __init__ accepting arbitrary kwargs as attributes
    - Default id and created_at if not provided
    - __repr__ for debugging

    Does NOT provide:
    - to_dict() / from_dict()  →  handled by SerializationMixin in adapters
    - collection name          →  handled by repository adapters
    - any persistence logic
    """

    def __init__(self, **kwargs):
        self.id = kwargs.pop('id', None)
        self.created_at = kwargs.pop('created_at', datetime.datetime.utcnow())
        for key, value in kwargs.items():
            setattr(self, key, value)

    def __repr__(self):
        return f'<{self.__class__.__name__} id={getattr(self, "id", None)}>'
