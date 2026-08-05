"""Wallet repository — Firestore adapter implementing WalletRepositoryPort."""
from logger import get_logger
from models import Wallet
from repositories.base import BaseRepository
from ports import WalletRepositoryPort


class WalletRepository(BaseRepository, WalletRepositoryPort):
    """Repository for wallet data access."""

    def __init__(self):
        super().__init__(Wallet)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        """Find wallet by user ID."""
        docs = self._collection().where('user_id', '==', user_id).limit(1).stream()
        for doc in docs:
            wallet = self._deserialize(doc)
            self.logger.debug('find_by_user_id: user_id=%s found=%s', user_id, wallet is not None)
            return wallet
        self.logger.debug('find_by_user_id: user_id=%s found=False', user_id)
        return None

    def get_or_create(self, user_id):
        """Get existing wallet or create a new one."""
        wallet = self.find_by_user_id(user_id)
        if not wallet:
            wallet = Wallet.create(user_id=user_id)
            self.add(wallet)
        return wallet
