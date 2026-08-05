"""Transaction application service (thin orchestration over the entity)."""
from logger import get_logger
from models import Transaction
from domain.exceptions import DomainError
from repositories.transaction_repository import TransactionRepository


class TransactionService:
    """Coordinates persistence and the Transaction domain entity."""

    def __init__(self, transaction_repository=None):
        self.transaction_repository = transaction_repository or TransactionRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_transaction(self, data):
        """Create a new transaction. Invariants live in Transaction.create."""
        try:
            transaction = Transaction.create(
                user_id=data['userId'],
                type=data.get('type'),
                description=data.get('description'),
                amount=data.get('amount'),
                date=data.get('date'),
                category=data.get('category', ''),
                status=data.get('status'),
            )
        except DomainError as e:
            self.logger.warning('Transaction validation failed: user_id=%s errors=%s', data.get('userId'), e.errors)
            return {'success': False, 'errors': e.errors}

        self.transaction_repository.add(transaction)
        self.logger.info('Transaction created: user_id=%s transaction_id=%s amount=%s type=%s',
                         transaction.user_id, transaction.id, transaction.amount, transaction.type)
        return {'success': True, 'transaction': transaction.to_dict()}

    def get_transactions_by_user_id(self, user_id):
        """Get all transactions for a user."""
        transactions = self.transaction_repository.find_by_user_id(user_id)
        self.logger.debug('Listed transactions: user_id=%s count=%s', user_id, len(transactions))
        return [t.to_dict() for t in transactions]

    def get_transaction_by_id(self, transaction_id, user_id):
        """Get transaction by ID."""
        transaction = self.transaction_repository.get_by_id(transaction_id, user_id)
        if not transaction:
            self.logger.warning('Transaction not found: user_id=%s transaction_id=%s', user_id, transaction_id)
            return None
        return transaction.to_dict()

    def update_transaction(self, transaction_id, user_id, data):
        """Update a transaction via its domain behavior."""
        transaction = self.transaction_repository.get_by_id(transaction_id, user_id)
        if not transaction:
            self.logger.warning('Update transaction failed: not found user_id=%s transaction_id=%s', user_id, transaction_id)
            return {'success': False, 'errors': ['Transação não encontrada']}

        try:
            if 'type' in data:
                transaction.change_type(data['type'])
            if 'description' in data:
                transaction.redescribe(data['description'])
            if 'amount' in data:
                transaction.change_amount(data['amount'])
            if 'date' in data:
                transaction.change_date(data['date'])
            if 'category' in data:
                transaction.recategorize(data['category'])
            if 'status' in data:
                if data['status'] == 'paid':
                    if not transaction.is_paid:
                        transaction.mark_as_paid()
                elif data['status'] == 'pending':
                    transaction.mark_as_pending()
        except DomainError as e:
            self.logger.warning('Update transaction failed: user_id=%s transaction_id=%s errors=%s', user_id, transaction_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.transaction_repository.save(transaction)
        self.logger.info('Transaction updated: user_id=%s transaction_id=%s', user_id, transaction_id)
        return {'success': True, 'transaction': transaction.to_dict()}

    def mark_transaction_as_paid(self, transaction_id, user_id):
        """Explicit domain action: settle a pending transaction."""
        transaction = self.transaction_repository.get_by_id(transaction_id, user_id)
        if not transaction:
            self.logger.warning('Mark paid failed: not found user_id=%s transaction_id=%s', user_id, transaction_id)
            return {'success': False, 'errors': ['Transação não encontrada']}
        try:
            transaction.mark_as_paid()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.transaction_repository.save(transaction)
        self.logger.info('Transaction marked paid: user_id=%s transaction_id=%s', user_id, transaction_id)
        return {'success': True, 'transaction': transaction.to_dict()}

    def delete_transaction(self, transaction_id, user_id):
        """Delete a transaction."""
        transaction = self.transaction_repository.get_by_id(transaction_id, user_id)
        if not transaction:
            self.logger.warning('Delete transaction failed: not found user_id=%s transaction_id=%s', user_id, transaction_id)
            return {'success': False, 'errors': ['Transação não encontrada']}

        self.transaction_repository.delete(transaction)
        self.logger.info('Transaction deleted: user_id=%s transaction_id=%s', user_id, transaction_id)
        return {'success': True}

    def get_financial_summary(self, user_id):
        """Get financial summary using domain predicates (not raw strings)."""
        transactions = self.transaction_repository.find_by_user_id(user_id)
        total_income = sum(t.amount for t in transactions if t.is_income and t.is_paid)
        total_expenses = sum(t.amount for t in transactions if not t.is_income and t.is_paid)
        total_pending = sum(t.amount for t in transactions if t.is_income and not t.is_paid)
        summary = {
            'totalIncome': total_income,
            'totalExpenses': total_expenses,
            'profit': total_income - total_expenses,
            'totalPending': total_pending
        }
        self.logger.info('Financial summary: user_id=%s income=%s expenses=%s profit=%s',
                         user_id, total_income, total_expenses, summary['profit'])
        return summary

    def get_monthly_income(self, user_id, year, month):
        """Get monthly income for a user."""
        transactions = self.transaction_repository.find_by_month(user_id, year, month)
        income = sum(t.amount for t in transactions if t.is_income and t.is_paid)
        self.logger.debug('Monthly income: user_id=%s year=%s month=%s income=%s', user_id, year, month, income)
        return income
