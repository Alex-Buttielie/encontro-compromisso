"""Team/Employee repository — Firestore adapter implementing TeamRepositoryPort."""
from logger import get_logger
from models import Employee, EmployeeHistory
from repositories.base import BaseRepository
from ports import TeamRepositoryPort


class EmployeeRepository(BaseRepository, TeamRepositoryPort):
    def __init__(self):
        super().__init__(Employee)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_email(self, user_id, email):
        docs = self._collection().where('user_id', '==', user_id).where('email', '==', email).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_by_invite_token(self, token):
        docs = self._collection().where('invite_token', '==', token).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_by_branch(self, user_id, branch_id):
        docs = self._collection().where('user_id', '==', user_id).where('branch_id', '==', branch_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_active(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'active').stream()
        return [self._deserialize(doc) for doc in docs]


class EmployeeHistoryRepository(BaseRepository):
    def __init__(self):
        super().__init__(EmployeeHistory)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_employee_id(self, employee_id):
        docs = self._collection().where('employee_id', '==', employee_id).stream()
        return [self._deserialize(doc) for doc in docs]
