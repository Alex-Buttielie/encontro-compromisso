"""Service repository — Firestore adapter implementing ServiceRepositoryPort."""
from logger import get_logger
from models import Service
from repositories.base import BaseRepository
from ports import ServiceRepositoryPort


class ServiceRepository(BaseRepository, ServiceRepositoryPort):
    """Repository for service data access."""

    def __init__(self):
        super().__init__(Service)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        """Find all services for a user."""
        docs = self._collection().where('user_id', '==', user_id).stream()
        services = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_user_id: user_id=%s count=%s', user_id, len(services))
        return services
