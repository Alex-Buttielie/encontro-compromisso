"""Repositories for Phase 8 models — Firestore adapter implementing Phase8RepositoryPort."""
from logger import get_logger
from models import AuditLog, ApiKey, Webhook, DataRequest, FeatureFlag
from repositories.base import BaseRepository
from ports import Phase8RepositoryPort


class AuditLogRepository(BaseRepository, Phase8RepositoryPort):
    def __init__(self):
        super().__init__(AuditLog)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_admin(self, admin_id, limit=100):
        docs = self._collection().where('admin_id', '==', admin_id).limit(limit).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_all(self, limit=100):
        docs = self._collection().limit(limit).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_action(self, action, limit=100):
        docs = self._collection().where('action', '==', action).limit(limit).stream()
        return [self._deserialize(doc) for doc in docs]


class ApiKeyRepository(BaseRepository):
    def __init__(self):
        super().__init__(ApiKey)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_key(self, key):
        docs = self._collection().where('key', '==', key).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None


class WebhookRepository(BaseRepository):
    def __init__(self):
        super().__init__(Webhook)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_active_by_event(self, event):
        docs = self._collection().where('status', '==', 'active').stream()
        return [self._deserialize(doc) for doc in docs]


class DataRequestRepository(BaseRepository):
    def __init__(self):
        super().__init__(DataRequest)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_pending(self):
        docs = self._collection().where('status', '==', 'pending').stream()
        return [self._deserialize(doc) for doc in docs]


class FeatureFlagRepository(BaseRepository):
    def __init__(self):
        super().__init__(FeatureFlag)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_key(self, key):
        docs = self._collection().where('key', '==', key).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_all(self):
        docs = self._collection().stream()
        return [self._deserialize(doc) for doc in docs]
