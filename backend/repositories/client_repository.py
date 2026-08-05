"""Client repository — Firestore adapter implementing ClientRepositoryPort."""
from logger import get_logger
from models import Client
from repositories.base import BaseRepository
from ports import ClientRepositoryPort


class ClientRepository(BaseRepository, ClientRepositoryPort):
    """Repository for client data access."""

    def __init__(self):
        super().__init__(Client)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        """Find all clients for a user."""
        docs = self._collection().where('user_id', '==', user_id).stream()
        clients = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_user_id: user_id=%s count=%s', user_id, len(clients))
        return clients

    def search_by_name(self, user_id, search_term):
        """Search clients by name."""
        term_lower = search_term.lower()
        docs = self._collection().where('user_id', '==', user_id).stream()
        clients = []
        for doc in docs:
            data = doc.to_dict()
            name = (data.get('name') or '').lower()
            if term_lower in name:
                clients.append(self._deserialize(doc))
        self.logger.debug('search_by_name: user_id=%s term=%s count=%s', user_id, search_term, len(clients))
        return clients
