"""TDD unit tests for the Wallet and LedgerEntry domain entities (Phase 2)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import LedgerEntryType
from domain.exceptions import WalletError, ValidationError


class TestWalletCreation:
    def test_create_wallet_for_user(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        assert wallet.user_id == 1
        assert wallet.balance == 0.0

    def test_wallet_balance_starts_zero(self):
        from models import Wallet
        wallet = Wallet.create(user_id=2)
        assert wallet.balance == 0.0
        assert wallet.balance_money.amount == 0.0


class TestWalletCredit:
    def test_credit_increases_balance(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(50.00, LedgerEntryType.CREDIT, 'Pagamento recebido')
        assert wallet.balance == 50.00

    def test_credit_zero_rejected(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        with pytest.raises(ValidationError):
            wallet.credit(0, LedgerEntryType.CREDIT, 'Test')

    def test_credit_negative_rejected(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        with pytest.raises(ValidationError):
            wallet.credit(-10, LedgerEntryType.CREDIT, 'Test')

    def test_credit_creates_ledger_entry(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        entry = wallet.credit(100.00, LedgerEntryType.CREDIT, 'Depósito')
        assert entry is not None
        assert entry.type == LedgerEntryType.CREDIT.value
        assert entry.amount == 100.00
        assert entry.description == 'Depósito'
        assert entry.balance_after == 100.00


class TestWalletDebit:
    def test_debit_decreases_balance(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(100.00, LedgerEntryType.CREDIT, 'Initial')
        wallet.debit(30.00, LedgerEntryType.DEBIT, 'Pagamento')
        assert wallet.balance == 70.00

    def test_debit_insufficient_balance(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(50.00, LedgerEntryType.CREDIT, 'Initial')
        with pytest.raises(WalletError):
            wallet.debit(100.00, LedgerEntryType.DEBIT, 'Too much')

    def test_debit_zero_rejected(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(100.00, LedgerEntryType.CREDIT, 'Initial')
        with pytest.raises(ValidationError):
            wallet.debit(0, LedgerEntryType.DEBIT, 'Test')

    def test_debit_creates_ledger_entry(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(100.00, LedgerEntryType.CREDIT, 'Initial')
        entry = wallet.debit(30.00, LedgerEntryType.DEBIT, 'Saque')
        assert entry.type == LedgerEntryType.DEBIT.value
        assert entry.amount == 30.00
        assert entry.balance_after == 70.00


class TestWalletWithdrawal:
    def test_withdrawal_decreases_balance(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(200.00, LedgerEntryType.CREDIT, 'Initial')
        wallet.withdraw(150.00)
        assert wallet.balance == 50.00

    def test_withdrawal_insufficient_balance(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(50.00, LedgerEntryType.CREDIT, 'Initial')
        with pytest.raises(WalletError):
            wallet.withdraw(100.00)


class TestWalletTransfer:
    def test_transfer_between_wallets(self):
        from models import Wallet
        sender = Wallet.create(user_id=1)
        receiver = Wallet.create(user_id=2)
        sender.credit(100.00, LedgerEntryType.CREDIT, 'Initial')
        sender.transfer_to(receiver, 40.00)
        assert sender.balance == 60.00
        assert receiver.balance == 40.00

    def test_transfer_insufficient_balance(self):
        from models import Wallet
        sender = Wallet.create(user_id=1)
        receiver = Wallet.create(user_id=2)
        sender.credit(30.00, LedgerEntryType.CREDIT, 'Initial')
        with pytest.raises(WalletError):
            sender.transfer_to(receiver, 50.00)

    def test_transfer_self_rejected(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(100.00, LedgerEntryType.CREDIT, 'Initial')
        with pytest.raises(WalletError):
            wallet.transfer_to(wallet, 50.00)


class TestWalletCashback:
    def test_cashback_credits_balance(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        wallet.credit(10.00, LedgerEntryType.CASHBACK, 'Cashback 10%')
        assert wallet.balance == 10.00

    def test_cashback_ledger_entry_type(self):
        from models import Wallet
        wallet = Wallet.create(user_id=1)
        entry = wallet.credit(5.00, LedgerEntryType.CASHBACK, 'Cashback')
        assert entry.type == LedgerEntryType.CASHBACK.value


class TestLedgerEntryImmutability:
    def test_ledger_entry_has_required_fields(self):
        from models import LedgerEntry
        entry = LedgerEntry(
            wallet_id=1,
            type=LedgerEntryType.CREDIT.value,
            amount=100.00,
            description='Test',
            balance_after=100.00,
            reference_type='payment',
            reference_id='pay-001',
            metadata_json='{}',
        )
        assert entry.type == LedgerEntryType.CREDIT.value
        assert entry.amount == 100.00
        assert entry.balance_after == 100.00
        assert entry.reference_type == 'payment'

    def test_ledger_entry_metadata(self):
        from models import LedgerEntry
        entry = LedgerEntry(
            wallet_id=1,
            type=LedgerEntryType.CREDIT.value,
            amount=50.00,
            description='Test',
            balance_after=50.00,
            metadata_json='{"coupon": "OFF10"}',
        )
        assert entry.extra_metadata == {'coupon': 'OFF10'}
