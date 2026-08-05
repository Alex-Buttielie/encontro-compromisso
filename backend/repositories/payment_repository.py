"""Payment repository — Firestore adapter implementing PaymentRepositoryPort."""
from logger import get_logger
from models import Payment
from repositories.base import BaseRepository
from ports import PaymentRepositoryPort


class PaymentRepository(BaseRepository, PaymentRepositoryPort):
    """Repository for payment data access."""

    def __init__(self):
        super().__init__(Payment)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_idempotency_key(self, key):
        """Find payment by idempotency key (for webhook dedup)."""
        docs = self._collection().where('idempotency_key', '==', key).limit(1).stream()
        for doc in docs:
            payment = self._deserialize(doc)
            self.logger.debug('find_by_idempotency_key: key=%s found=%s', key, payment is not None)
            return payment
        self.logger.debug('find_by_idempotency_key: key=%s found=False', key)
        return None

    def find_by_user_id(self, user_id):
        """Get all payments for a user."""
        docs = self._collection().where('user_id', '==', user_id).stream()
        payments = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_user_id: user_id=%s count=%s', user_id, len(payments))
        return payments

    def find_by_gateway_transaction_id(self, gateway_tx_id):
        """Find payment by gateway transaction ID (for webhook reconciliation)."""
        docs = self._collection().where('gateway_transaction_id', '==', gateway_tx_id).limit(1).stream()
        for doc in docs:
            payment = self._deserialize(doc)
            self.logger.debug('find_by_gateway_transaction_id: gateway_tx_id=%s found=%s', gateway_tx_id, payment is not None)
            return payment
        self.logger.debug('find_by_gateway_transaction_id: gateway_tx_id=%s found=False', gateway_tx_id)
        return None
