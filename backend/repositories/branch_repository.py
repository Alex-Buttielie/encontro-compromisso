"""Branch and stock transfer repository — Firestore adapter implementing BranchRepositoryPort."""
from logger import get_logger
from models import Branch, StockTransfer
from repositories.base import BaseRepository
from ports import BranchRepositoryPort


class BranchRepository(BaseRepository, BranchRepositoryPort):
    def __init__(self):
        super().__init__(Branch)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_active(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('active', '==', True).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_headquarters(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('branch_type', '==', 'headquarters').limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None


class StockTransferRepository(BaseRepository):
    def __init__(self):
        super().__init__(StockTransfer)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_branch(self, user_id, branch_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            if data.get('from_branch_id') == branch_id or data.get('to_branch_id') == branch_id:
                results.append(self._deserialize(doc))
        return results

    def find_by_product(self, product_id):
        docs = self._collection().where('product_id', '==', product_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_pending(self, user_id):
        pending_statuses = ['requested', 'approved', 'in_transit']
        docs = self._collection().where('user_id', '==', user_id).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            if data.get('status') in pending_statuses:
                results.append(self._deserialize(doc))
        return results
