"""Marketing repository — Firestore adapter implementing MarketingRepositoryPort."""
from logger import get_logger
from models import Campaign, Coupon
from repositories.base import BaseRepository
from ports import MarketingRepositoryPort


class CampaignRepository(BaseRepository, MarketingRepositoryPort):
    def __init__(self):
        super().__init__(Campaign)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_status(self, user_id, status):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', status).stream()
        return [self._deserialize(doc) for doc in docs]


class CouponRepository(BaseRepository):
    def __init__(self):
        super().__init__(Coupon)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_code(self, code):
        docs = self._collection().where('code', '==', code.upper()).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]
