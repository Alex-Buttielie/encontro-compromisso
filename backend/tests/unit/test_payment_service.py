"""TDD unit tests for PaymentService (Phase 2)."""
import json

import pytest

from domain.enums import PaymentMethod, PaymentStatus
from domain.exceptions import IdempotencyError, PaymentError


class TestPaymentServiceCreate:
    def test_create_pix_payment(self, client, app, auth_header):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            result = svc.create_payment({
                'userId': 1,
                'amount': 100.00,
                'method': PaymentMethod.PIX.value,
                'description': 'Consulta - João',
            })
            assert result['success'] is True
            assert result['payment']['status'] == PaymentStatus.PROCESSING.value
            assert 'pix_qr_code' in result
            assert 'pix_copy_paste' in result

    def test_create_credit_card_payment(self, client, app, auth_header):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            result = svc.create_payment({
                'userId': 1,
                'amount': 600.00,
                'method': PaymentMethod.CREDIT_CARD.value,
                'description': 'Pacote 6 sessões',
                'installments': 6,
            })
            assert result['success'] is True
            assert result['payment']['status'] == PaymentStatus.AUTHORIZED.value
            assert result['payment']['installments'] == 6
            assert result['payment']['installmentAmount'] == 100.00

    def test_create_payment_with_split(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            result = svc.create_payment({
                'userId': 1,
                'amount': 100.00,
                'method': PaymentMethod.PIX.value,
                'description': 'Test split',
                'platformFee': 10.00,
                'providerAmount': 90.00,
            })
            assert result['success'] is True
            assert result['payment']['platformFee'] == 10.00
            assert result['payment']['providerAmount'] == 90.00

    def test_create_payment_idempotent_replay(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            data = {
                'userId': 1,
                'amount': 50.00,
                'method': PaymentMethod.PIX.value,
                'description': 'Test idempotency',
                'idempotencyKey': 'key-001',
            }
            r1 = svc.create_payment(data)
            assert r1['success'] is True
            r2 = svc.create_payment(data)
            assert r2['success'] is True
            assert r2.get('replay') is True
            assert r1['payment']['id'] == r2['payment']['id']

    def test_create_payment_idempotency_conflict(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            svc.create_payment({
                'userId': 1, 'amount': 50, 'method': PaymentMethod.PIX.value,
                'description': 'First', 'idempotencyKey': 'key-002',
            })
            with pytest.raises(IdempotencyError):
                svc.create_payment({
                    'userId': 1, 'amount': 100, 'method': PaymentMethod.PIX.value,
                    'description': 'Different', 'idempotencyKey': 'key-002',
                })

    def test_create_payment_invalid_amount(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            result = svc.create_payment({
                'userId': 1, 'amount': 0, 'method': PaymentMethod.PIX.value,
                'description': 'Test',
            })
            assert result['success'] is False


class TestPaymentServiceWebhook:
    def test_webhook_marks_paid(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            create_result = svc.create_payment({
                'userId': 1, 'amount': 100, 'method': PaymentMethod.PIX.value,
                'description': 'Test webhook',
            })
            tx_id = create_result['gateway_transaction_id']
            result = svc.process_webhook({
                'event': 'payment.paid',
                'transaction_id': tx_id,
                'status': 'paid',
            })
            assert result['success'] is True
            assert result['payment']['status'] == PaymentStatus.PAID.value

    def test_webhook_idempotent_skip(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            create_result = svc.create_payment({
                'userId': 1, 'amount': 100, 'method': PaymentMethod.PIX.value,
                'description': 'Test idempotent webhook',
            })
            tx_id = create_result['gateway_transaction_id']
            # First webhook
            r1 = svc.process_webhook({
                'event': 'payment.paid', 'transaction_id': tx_id, 'status': 'paid',
            })
            assert r1['success'] is True
            # Replay
            r2 = svc.process_webhook({
                'event': 'payment.paid', 'transaction_id': tx_id, 'status': 'paid',
            })
            assert r2['success'] is True
            assert r2.get('replay') is True

    def test_webhook_marks_failed(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            create_result = svc.create_payment({
                'userId': 1, 'amount': 100, 'method': PaymentMethod.PIX.value,
                'description': 'Test fail webhook',
            })
            tx_id = create_result['gateway_transaction_id']
            result = svc.process_webhook({
                'event': 'payment.failed', 'transaction_id': tx_id, 'status': 'failed',
            })
            assert result['success'] is True
            assert result['payment']['status'] == PaymentStatus.FAILED.value

    def test_webhook_credits_wallet_on_paid(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            create_result = svc.create_payment({
                'userId': 1, 'amount': 100, 'method': PaymentMethod.PIX.value,
                'description': 'Test wallet credit',
                'platformFee': 10.00,
                'providerAmount': 90.00,
            })
            tx_id = create_result['gateway_transaction_id']
            svc.process_webhook({
                'event': 'payment.paid', 'transaction_id': tx_id, 'status': 'paid',
            })
            # Check wallet was credited
            from repositories.wallet_repository import WalletRepository
            wallet_repo = WalletRepository()
            wallet = wallet_repo.find_by_user_id(1)
            assert wallet is not None
            assert wallet.balance == 90.00

    def test_webhook_unknown_transaction(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            result = svc.process_webhook({
                'event': 'payment.paid', 'transaction_id': 'nonexistent', 'status': 'paid',
            })
            assert result['success'] is False


class TestPaymentServiceRefund:
    def test_full_refund(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            create_result = svc.create_payment({
                'userId': 1, 'amount': 100, 'method': PaymentMethod.PIX.value,
                'description': 'Test refund',
            })
            payment_id = create_result['payment']['id']
            tx_id = create_result['gateway_transaction_id']
            svc.process_webhook({
                'event': 'payment.paid', 'transaction_id': tx_id, 'status': 'paid',
            })
            result = svc.refund_payment(payment_id)
            assert result['success'] is True
            assert result['payment']['status'] == PaymentStatus.FULLY_REFUNDED.value

    def test_partial_refund(self, client, app):
        from services.payment_service import PaymentService
        with app.app_context():
            svc = PaymentService()
            create_result = svc.create_payment({
                'userId': 1, 'amount': 100, 'method': PaymentMethod.PIX.value,
                'description': 'Test partial refund',
            })
            payment_id = create_result['payment']['id']
            tx_id = create_result['gateway_transaction_id']
            svc.process_webhook({
                'event': 'payment.paid', 'transaction_id': tx_id, 'status': 'paid',
            })
            result = svc.refund_payment(payment_id, amount=30.00)
            assert result['success'] is True
            assert result['payment']['status'] == PaymentStatus.PARTIALLY_REFUNDED.value
            assert result['payment']['refundedAmount'] == 30.00
