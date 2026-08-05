"""Work and WorkOrder repositories — Firestore adapters."""
from models import Work, WorkOrder
from repositories.base import BaseRepository
from ports import WorkRepositoryPort, WorkOrderRepositoryPort


class WorkRepository(BaseRepository, WorkRepositoryPort):
    """Repository for Work data access."""

    def __init__(self):
        super().__init__(Work)

    def get_by_provider(self, provider_id):
        """Get all works by a provider, newest first."""
        docs = self._collection().where('provider_id', '==', provider_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def get_active_works(self):
        """Get all active works from all providers (for explore/catalog)."""
        docs = self._collection().where('active', '==', True).stream()
        return [self._deserialize(doc) for doc in docs]

    def search(self, term):
        """Search active works by title, description, or category."""
        term_lower = term.lower()
        docs = self._collection().where('active', '==', True).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            title = (data.get('title') or '').lower()
            description = (data.get('description') or '').lower()
            category = (data.get('category') or '').lower()
            if term_lower in title or term_lower in description or term_lower in category:
                results.append(self._deserialize(doc))
        return results


class WorkOrderRepository(BaseRepository, WorkOrderRepositoryPort):
    """Repository for WorkOrder data access."""

    def __init__(self):
        super().__init__(WorkOrder)

    def get_by_provider(self, provider_id):
        """Get all orders received by a provider."""
        docs = self._collection().where('provider_id', '==', provider_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def get_by_client(self, client_user_id):
        """Get all orders placed by a client user."""
        docs = self._collection().where('client_user_id', '==', client_user_id).stream()
        return [self._deserialize(doc) for doc in docs]
