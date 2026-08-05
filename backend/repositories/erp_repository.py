"""ERP financial repository — Firestore adapter implementing ERPRepositoryPort."""
from logger import get_logger
from models import CashFlowEntry, CostCenter, AccountPayable, AccountReceivable, FinancialPeriod
from repositories.base import BaseRepository
from ports import ERPRepositoryPort


class CashFlowRepository(BaseRepository, ERPRepositoryPort):
    def __init__(self):
        super().__init__(CashFlowEntry)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_date_range(self, user_id, start_date, end_date):
        start_str = start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date)
        end_str = end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date)
        docs = self._collection().where('user_id', '==', user_id).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            doc_date = data.get('date', '')
            if isinstance(doc_date, str) and start_str <= doc_date <= end_str:
                results.append(self._deserialize(doc))
        return results


class CostCenterRepository(BaseRepository):
    def __init__(self):
        super().__init__(CostCenter)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]


class AccountPayableRepository(BaseRepository):
    def __init__(self):
        super().__init__(AccountPayable)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_pending(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'pending').stream()
        return [self._deserialize(doc) for doc in docs]


class AccountReceivableRepository(BaseRepository):
    def __init__(self):
        super().__init__(AccountReceivable)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_pending(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'pending').stream()
        return [self._deserialize(doc) for doc in docs]


class FinancialPeriodRepository(BaseRepository):
    def __init__(self):
        super().__init__(FinancialPeriod)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_open_period(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'open').limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None
