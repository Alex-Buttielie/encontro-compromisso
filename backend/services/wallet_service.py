"""Wallet application service (thin orchestration over the domain)."""
from logger import get_logger
from models import Wallet
from domain.enums import LedgerEntryType
from domain.exceptions import DomainError, WalletError
from repositories.wallet_repository import WalletRepository


class WalletService:
    """Coordinates wallet operations with tenant isolation."""

    def __init__(self, wallet_repository=None):
        self.wallet_repository = wallet_repository or WalletRepository()
        self.logger = get_logger(self.__class__.__name__)

    def get_wallet(self, user_id):
        """Get or create a wallet for the user."""
        wallet = self.wallet_repository.get_or_create(user_id)
        return wallet.to_dict(include_statement=True)

    def get_balance(self, user_id):
        """Get wallet balance for a user."""
        wallet = self.wallet_repository.get_or_create(user_id)
        return {'balance': wallet.balance, 'balanceFormatted': wallet.balance_money.formatted()}

    def get_statement(self, user_id):
        """Get the full ledger statement for a user."""
        wallet = self.wallet_repository.get_or_create(user_id)
        return wallet.get_statement()

    def withdraw(self, user_id, amount):
        """Withdraw funds from the wallet."""
        wallet = self.wallet_repository.get_or_create(user_id)
        try:
            wallet.withdraw(amount)
        except DomainError as e:
            self.logger.warning('Withdrawal failed: user_id=%s errors=%s', user_id, e.errors)
            return {'success': False, 'errors': e.errors}
        self.wallet_repository.save(wallet)
        self.logger.info('Withdrawal: user_id=%s amount=%s', user_id, amount)
        return {'success': True, 'wallet': wallet.to_dict()}

    def transfer(self, sender_user_id, receiver_user_id, amount):
        """Transfer funds between two users' wallets."""
        sender = self.wallet_repository.get_or_create(sender_user_id)
        receiver = self.wallet_repository.get_or_create(receiver_user_id)
        try:
            sender.transfer_to(receiver, amount)
        except DomainError as e:
            self.logger.warning('Transfer failed: sender=%s receiver=%s errors=%s',
                                sender_user_id, receiver_user_id, e.errors)
            return {'success': False, 'errors': e.errors}
        self.wallet_repository.save(sender)
        self.wallet_repository.save(receiver)
        self.logger.info('Transfer: from=%s to=%s amount=%s', sender_user_id, receiver_user_id, amount)
        return {'success': True, 'sender': sender.to_dict(), 'receiver': receiver.to_dict()}

    def credit_cashback(self, user_id, amount, reason='Cashback'):
        """Credit cashback to a user's wallet."""
        wallet = self.wallet_repository.get_or_create(user_id)
        try:
            wallet.credit(amount, LedgerEntryType.CASHBACK, reason,
                          reference_type='cashback', reference_id=reason)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.wallet_repository.save(wallet)
        self.logger.info('Cashback credited: user_id=%s amount=%s', user_id, amount)
        return {'success': True, 'wallet': wallet.to_dict()}

    def credit_promotional(self, user_id, amount, reason='Crédito promocional'):
        """Credit promotional credits to a user's wallet."""
        wallet = self.wallet_repository.get_or_create(user_id)
        try:
            wallet.credit(amount, LedgerEntryType.PROMOTIONAL, reason)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.wallet_repository.save(wallet)
        self.logger.info('Promotional credit: user_id=%s amount=%s', user_id, amount)
        return {'success': True, 'wallet': wallet.to_dict()}
