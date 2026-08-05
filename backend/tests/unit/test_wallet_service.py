"""TDD unit tests for WalletService (Phase 2)."""
import pytest

from domain.enums import LedgerEntryType
from domain.exceptions import WalletError


class TestWalletService:
    def test_get_wallet_creates_if_not_exists(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            result = svc.get_wallet(1)
            assert result['userId'] == 1
            assert result['balance'] == 0.0

    def test_get_balance(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            svc.credit_cashback(1, 50.00, 'Test cashback')
            result = svc.get_balance(1)
            assert result['balance'] == 50.00

    def test_withdraw_success(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            svc.credit_cashback(1, 100.00, 'Initial')
            result = svc.withdraw(1, 60.00)
            assert result['success'] is True
            assert result['wallet']['balance'] == 40.00

    def test_withdraw_insufficient(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            svc.credit_cashback(1, 30.00, 'Initial')
            result = svc.withdraw(1, 100.00)
            assert result['success'] is False

    def test_transfer_between_users(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            svc.credit_cashback(1, 100.00, 'Initial')
            result = svc.transfer(1, 2, 40.00)
            assert result['success'] is True
            assert result['sender']['balance'] == 60.00
            assert result['receiver']['balance'] == 40.00

    def test_transfer_self_rejected(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            svc.credit_cashback(1, 100.00, 'Initial')
            result = svc.transfer(1, 1, 40.00)
            assert result['success'] is False

    def test_credit_cashback(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            result = svc.credit_cashback(1, 15.00, 'Cashback 10%')
            assert result['success'] is True
            assert result['wallet']['balance'] == 15.00

    def test_credit_promotional(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            result = svc.credit_promotional(1, 20.00, 'Bônus de boas-vindas')
            assert result['success'] is True
            assert result['wallet']['balance'] == 20.00

    def test_statement_shows_entries(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            svc.credit_cashback(1, 50.00, 'First')
            svc.credit_promotional(1, 20.00, 'Second')
            statement = svc.get_statement(1)
            assert len(statement) == 2
            assert statement[0]['type'] == LedgerEntryType.CASHBACK.value
            assert statement[1]['type'] == LedgerEntryType.PROMOTIONAL.value

    def test_tenant_isolation(self, client, app):
        from services.wallet_service import WalletService
        with app.app_context():
            svc = WalletService()
            svc.credit_cashback(1, 100.00, 'User 1')
            svc.credit_cashback(2, 50.00, 'User 2')
            w1 = svc.get_wallet(1)
            w2 = svc.get_wallet(2)
            assert w1['balance'] == 100.00
            assert w2['balance'] == 50.00
