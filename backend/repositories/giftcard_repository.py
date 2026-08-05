"""Gift card repository — Firestore adapter implementing GiftCardRepositoryPort."""
from logger import get_logger
from models import GiftCard
from repositories.base import BaseRepository
from ports import GiftCardRepositoryPort


class GiftCardRepository(BaseRepository, GiftCardRepositoryPort):
    """Repository for gift card data access."""

    def __init__(self):
        super().__init__(GiftCard)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_code(self, code):
        """Find gift card by its secure code."""
        docs = self._collection().where('code', '==', code).limit(1).stream()
        for doc in docs:
            gc = self._deserialize(doc)
            self.logger.debug('find_by_code: found=%s', gc is not None)
            return gc
        self.logger.debug('find_by_code: found=False')
        return None

    def find_by_user_id(self, user_id):
        """Get all gift cards created by a user."""
        docs = self._collection().where('user_id', '==', user_id).stream()
        cards = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_user_id: user_id=%s count=%s', user_id, len(cards))
        return cards
