"""TDD unit tests for the Payment domain entity (Phase 2)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import PaymentMethod, PaymentStatus
from domain.exceptions import InvalidStateTransition, PaymentError, ValidationError


class TestPaymentCreation:
    def test_create_payment_with_valid_data(self):
        from models import Payment
        payment = Payment.create(
            user_id=1,
            amount=100.00,
            method=PaymentMethod.PIX.value,
            description='Consulta - João',
        )
        assert payment.status == PaymentStatus.PENDING.value
        assert payment.amount == 100.00
        assert payment.method == PaymentMethod.PIX.value
        assert payment.idempotency_key is not None

    def test_create_payment_with_idempotency_key(self):
        from models import Payment
        payment = Payment.create(
            user_id=1,
            amount=50.00,
            method=PaymentMethod.CREDIT_CARD.value,
            description='Sessão - Maria',
            idempotency_key='abc-123',
        )
        assert payment.idempotency_key == 'abc-123'

    def test_create_payment_zero_amount_rejected(self):
        from models import Payment
        with pytest.raises(ValidationError):
            Payment.create(
                user_id=1,
                amount=0,
                method=PaymentMethod.PIX.value,
                description='Test',
            )

    def test_create_payment_negative_amount_rejected(self):
        from models import Payment
        with pytest.raises(ValidationError):
            Payment.create(
                user_id=1,
                amount=-10,
                method=PaymentMethod.PIX.value,
                description='Test',
            )

    def test_create_payment_missing_description(self):
        from models import Payment
        with pytest.raises(ValidationError):
            Payment.create(
                user_id=1,
                amount=100,
                method=PaymentMethod.PIX.value,
                description='',
            )

    def test_create_payment_invalid_method(self):
        from models import Payment
        with pytest.raises(ValidationError):
            Payment.create(
                user_id=1,
                amount=100,
                method='crypto',
                description='Test',
            )


class TestPaymentStateMachine:
    def test_pending_to_authorized(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.authorize()
        assert payment.status == PaymentStatus.AUTHORIZED.value

    def test_pending_to_processing(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.start_processing()
        assert payment.status == PaymentStatus.PROCESSING.value

    def test_processing_to_paid(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.start_processing()
        payment.mark_paid()
        assert payment.status == PaymentStatus.PAID.value

    def test_paid_to_failed_not_allowed(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.start_processing()
        payment.mark_paid()
        with pytest.raises(InvalidStateTransition):
            payment.fail()

    def test_pending_to_cancelled(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.cancel()
        assert payment.status == PaymentStatus.CANCELLED.value

    def test_paid_to_partially_refunded(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.start_processing()
        payment.mark_paid()
        payment.partial_refund(30.00)
        assert payment.status == PaymentStatus.PARTIALLY_REFUNDED.value
        assert payment.refunded_amount == 30.00

    def test_partial_refund_exceeds_amount(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.start_processing()
        payment.mark_paid()
        with pytest.raises(PaymentError):
            payment.partial_refund(150.00)

    def test_paid_to_fully_refunded(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.start_processing()
        payment.mark_paid()
        payment.full_refund()
        assert payment.status == PaymentStatus.FULLY_REFUNDED.value
        assert payment.refunded_amount == 100.00

    def test_paid_to_disputed(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.CREDIT_CARD.value, description='Test')
        payment.start_processing()
        payment.mark_paid()
        payment.dispute()
        assert payment.status == PaymentStatus.DISPUTED.value

    def test_fail_from_pending(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.fail()
        assert payment.status == PaymentStatus.FAILED.value

    def test_terminal_cannot_transition(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.PIX.value, description='Test')
        payment.fail()
        with pytest.raises(InvalidStateTransition):
            payment.mark_paid()


class TestPaymentSplit:
    def test_split_payment(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.CREDIT_CARD.value, description='Test')
        payment.set_split(
            platform_fee=10.00,
            provider_amount=90.00,
        )
        assert payment.platform_fee == 10.00
        assert payment.provider_amount == 90.00

    def test_split_must_balance(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=100, method=PaymentMethod.CREDIT_CARD.value, description='Test')
        with pytest.raises(PaymentError):
            payment.set_split(
                platform_fee=10.00,
                provider_amount=80.00,
            )


class TestPaymentInstallments:
    def test_set_installments(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=600, method=PaymentMethod.CREDIT_CARD.value, description='Test')
        payment.set_installments(6)
        assert payment.installments == 6
        assert payment.installment_amount == 100.00

    def test_installments_only_credit_card(self):
        from models import Payment
        payment = Payment.create(
            user_id=1, amount=600, method=PaymentMethod.PIX.value, description='Test')
        with pytest.raises(PaymentError):
            payment.set_installments(3)
