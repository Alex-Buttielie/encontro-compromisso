"""Loyalty repository — Firestore adapter implementing LoyaltyRepositoryPort."""
from logger import get_logger
from models import LoyaltyAccount, Mission, Medal
from repositories.base import BaseRepository
from ports import LoyaltyRepositoryPort


class LoyaltyRepository(BaseRepository, LoyaltyRepositoryPort):
    """Repository for loyalty account data access."""

    def __init__(self):
        super().__init__(LoyaltyAccount)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        """Find loyalty account by user ID."""
        docs = self._collection().where('user_id', '==', user_id).limit(1).stream()
        for doc in docs:
            account = self._deserialize(doc)
            self.logger.debug('find_by_user_id: user_id=%s found=%s', user_id, account is not None)
            return account
        self.logger.debug('find_by_user_id: user_id=%s found=False', user_id)
        return None

    def get_or_create(self, user_id, provider_id):
        """Get existing loyalty account or create a new one."""
        account = self.find_by_user_id(user_id)
        if not account:
            account = LoyaltyAccount.create(user_id=user_id, provider_id=provider_id)
            self.add(account)
        return account


class MissionRepository(BaseRepository):
    """Repository for mission data access."""

    def __init__(self):
        super().__init__(Mission)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_provider_id(self, provider_id):
        """Get all missions for a provider."""
        docs = self._collection().where('provider_id', '==', provider_id).stream()
        missions = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_provider_id: provider_id=%s count=%s', provider_id, len(missions))
        return missions

    def find_active_by_provider_id(self, provider_id):
        """Get active missions for a provider."""
        docs = self._collection().where('provider_id', '==', provider_id).where('active', '==', True).stream()
        missions = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_active_by_provider_id: provider_id=%s count=%s', provider_id, len(missions))
        return missions


class MedalRepository(BaseRepository):
    """Repository for medal data access."""

    def __init__(self):
        super().__init__(Medal)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_provider_id(self, provider_id):
        """Get all medals for a provider."""
        docs = self._collection().where('provider_id', '==', provider_id).stream()
        medals = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_provider_id: provider_id=%s count=%s', provider_id, len(medals))
        return medals
