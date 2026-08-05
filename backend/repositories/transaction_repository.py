"""Transaction repository — Firestore adapter implementing TransactionRepositoryPort."""
from logger import get_logger
from models import Transaction
from repositories.base import BaseRepository
from ports import TransactionRepositoryPort


class TransactionRepository(BaseRepository, TransactionRepositoryPort):
    """Repository for transaction data access."""

    def __init__(self):
        super().__init__(Transaction)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        """Find all transactions for a user."""
        docs = self._collection().where('user_id', '==', user_id).stream()
        transactions = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_user_id: user_id=%s count=%s', user_id, len(transactions))
        return transactions

    def find_by_month(self, user_id, year, month):
        """Find transactions for a specific year/month."""
        month_str = f'{year}-{month + 1:02d}'
        docs = self._collection().where('user_id', '==', user_id).stream()
        transactions = []
        for doc in docs:
            data = doc.to_dict()
            date_val = data.get('date', '')
            if isinstance(date_val, str) and date_val.startswith(month_str):
                transactions.append(self._deserialize(doc))
        self.logger.debug('find_by_month: user_id=%s year=%s month=%s count=%s',
                          user_id, year, month, len(transactions))
        return transactions
