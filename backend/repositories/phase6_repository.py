"""Repositories for Phase 6 models — Firestore adapter implementing Phase6RepositoryPort."""
from logger import get_logger
from models import ServiceArea, Quote, Contract, CheckInOut, Workflow, WorkflowExecution
from repositories.base import BaseRepository
from ports import Phase6RepositoryPort


class ServiceAreaRepository(BaseRepository, Phase6RepositoryPort):
    def __init__(self):
        super().__init__(ServiceArea)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('active', '==', True).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None


class QuoteRepository(BaseRepository):
    def __init__(self):
        super().__init__(Quote)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_client(self, client_id):
        docs = self._collection().where('client_id', '==', client_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_status(self, user_id, status):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', status).stream()
        return [self._deserialize(doc) for doc in docs]


class ContractRepository(BaseRepository):
    def __init__(self):
        super().__init__(Contract)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_client(self, client_id):
        docs = self._collection().where('client_id', '==', client_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_versions(self, contract_id):
        docs = self._collection().stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            if str(data.get('id', '')) == str(contract_id) or str(data.get('parent_id', '')) == str(contract_id):
                results.append(self._deserialize(doc))
        return results


class CheckInOutRepository(BaseRepository):
    def __init__(self):
        super().__init__(CheckInOut)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_appointment(self, appointment_id):
        docs = self._collection().where('appointment_id', '==', appointment_id).stream()
        return [self._deserialize(doc) for doc in docs]


class WorkflowRepository(BaseRepository):
    def __init__(self):
        super().__init__(Workflow)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_active(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'active').stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_trigger(self, trigger_type):
        docs = self._collection().where('trigger', '==', trigger_type).where('status', '==', 'active').stream()
        return [self._deserialize(doc) for doc in docs]


class WorkflowExecutionRepository(BaseRepository):
    def __init__(self):
        super().__init__(WorkflowExecution)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_workflow(self, workflow_id):
        docs = self._collection().where('workflow_id', '==', workflow_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_idempotency_key(self, key):
        docs = self._collection().where('idempotency_key', '==', key).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None
