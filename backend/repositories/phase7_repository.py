"""Repositories for Phase 7 models — Firestore adapter implementing Phase7RepositoryPort."""
from logger import get_logger
from models import Subscription, Billing, Referral, AgentConfig, AgentExecution
from repositories.base import BaseRepository
from ports import Phase7RepositoryPort


class SubscriptionRepository(BaseRepository, Phase7RepositoryPort):
    def __init__(self):
        super().__init__(Subscription)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_active(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'active').limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None


class BillingRepository(BaseRepository):
    def __init__(self):
        super().__init__(Billing)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_subscription(self, subscription_id):
        docs = self._collection().where('subscription_id', '==', subscription_id).stream()
        return [self._deserialize(doc) for doc in docs]


class ReferralRepository(BaseRepository):
    def __init__(self):
        super().__init__(Referral)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_referrer(self, referrer_id):
        docs = self._collection().where('referrer_id', '==', referrer_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_code(self, code):
        docs = self._collection().where('code', '==', code).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_converted_count(self, referrer_id):
        docs = self._collection().where('referrer_id', '==', referrer_id).where('status', '==', 'converted').stream()
        return sum(1 for _ in docs)

    def find_rewarded_count(self, referrer_id):
        docs = self._collection().where('referrer_id', '==', referrer_id).where('status', '==', 'rewarded').stream()
        return sum(1 for _ in docs)

    def find_ranking(self, limit=10):
        """Return top referrers by converted count."""
        from collections import Counter
        docs = self._collection().stream()
        counter = Counter()
        for doc in docs:
            data = doc.to_dict()
            referrer_id = data.get('referrer_id')
            if referrer_id:
                counter[referrer_id] += 1
        return counter.most_common(limit)


class AgentConfigRepository(BaseRepository):
    def __init__(self):
        super().__init__(AgentConfig)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_user_and_type(self, user_id, agent_type):
        docs = self._collection().where('user_id', '==', user_id).where('agent_type', '==', agent_type).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_enabled(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'enabled').stream()
        return [self._deserialize(doc) for doc in docs]


class AgentExecutionRepository(BaseRepository):
    def __init__(self):
        super().__init__(AgentExecution)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id, limit=50):
        docs = self._collection().where('user_id', '==', user_id).limit(limit).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_agent_type(self, user_id, agent_type, limit=50):
        docs = self._collection().where('user_id', '==', user_id).where('agent_type', '==', agent_type).limit(limit).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_pending_actions(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'completed').stream()
        return [self._deserialize(doc) for doc in docs]
