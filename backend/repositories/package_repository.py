"""Package repository — Firestore adapter implementing PackageRepositoryPort."""
from logger import get_logger
from models import Package
from repositories.base import BaseRepository
from ports import PackageRepositoryPort


class PackageRepository(BaseRepository, PackageRepositoryPort):
    """Repository for package data access."""

    def __init__(self):
        super().__init__(Package)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        """Get all packages for a provider."""
        docs = self._collection().where('user_id', '==', user_id).stream()
        packages = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_user_id: user_id=%s count=%s', user_id, len(packages))
        return packages

    def find_by_client_id(self, client_id):
        """Get all packages for a client."""
        docs = self._collection().where('client_id', '==', client_id).stream()
        packages = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_client_id: client_id=%s count=%s', client_id, len(packages))
        return packages

    def find_active_by_client_id(self, client_id):
        """Get active packages for a client."""
        docs = self._collection().where('client_id', '==', client_id).where('status', '==', 'active').stream()
        packages = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_active_by_client_id: client_id=%s count=%s', client_id, len(packages))
        return packages
