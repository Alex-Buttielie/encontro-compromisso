"""Commission repository — Firestore adapter implementing CommissionRepositoryPort."""
from logger import get_logger
from models import CommissionRule, CommissionPayment
from repositories.base import BaseRepository
from ports import CommissionRepositoryPort


class CommissionRuleRepository(BaseRepository, CommissionRepositoryPort):
    def __init__(self):
        super().__init__(CommissionRule)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('active', '==', True).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_employee(self, user_id, employee_id):
        docs = self._collection().where('user_id', '==', user_id).where('employee_id', '==', employee_id).where('active', '==', True).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_employee_and_service(self, user_id, employee_id, service_id):
        docs = self._collection().where('user_id', '==', user_id).where('employee_id', '==', employee_id).where('service_id', '==', service_id).where('active', '==', True).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_by_employee_and_branch(self, user_id, employee_id, branch_id):
        docs = self._collection().where('user_id', '==', user_id).where('employee_id', '==', employee_id).where('branch_id', '==', branch_id).where('active', '==', True).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None


class CommissionPaymentRepository(BaseRepository):
    def __init__(self):
        super().__init__(CommissionPayment)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_employee(self, user_id, employee_id):
        docs = self._collection().where('user_id', '==', user_id).where('employee_id', '==', employee_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_pending(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'pending').stream()
        return [self._deserialize(doc) for doc in docs]

    def find_paid(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'paid').stream()
        return [self._deserialize(doc) for doc in docs]
