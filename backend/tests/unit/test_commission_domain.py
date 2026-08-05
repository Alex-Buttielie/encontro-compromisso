"""TDD unit tests for Commission domain models (Phase 4)."""
from datetime import date, timedelta

import pytest

from domain.enums import CommissionType, CommissionStatus
from domain.exceptions import CommissionError, ValidationError


class TestCommissionRule:
    def test_create_percentage_rule(self):
        from models import CommissionRule
        rule = CommissionRule.create(
            user_id=1, employee_id=1,
            commission_type=CommissionType.PERCENTAGE.value,
            value=10.0,
        )
        assert rule.commission_type == CommissionType.PERCENTAGE.value
        assert rule.value == 10.0

    def test_create_fixed_rule(self):
        from models import CommissionRule
        rule = CommissionRule.create(
            user_id=1, employee_id=1,
            commission_type=CommissionType.FIXED.value,
            value=50.0,
        )
        assert rule.commission_type == CommissionType.FIXED.value

    def test_create_rule_with_service(self):
        from models import CommissionRule
        rule = CommissionRule.create(
            user_id=1, employee_id=1,
            commission_type=CommissionType.PERCENTAGE.value,
            value=15.0,
            service_id=5,
        )
        assert rule.service_id == 5

    def test_create_rule_with_branch(self):
        from models import CommissionRule
        rule = CommissionRule.create(
            user_id=1, employee_id=1,
            commission_type=CommissionType.PERCENTAGE.value,
            value=12.0,
            branch_id=3,
        )
        assert rule.branch_id == 3

    def test_create_rule_missing_type(self):
        from models import CommissionRule
        with pytest.raises(ValidationError):
            CommissionRule.create(
                user_id=1, employee_id=1,
                commission_type='invalid',
                value=10.0,
            )

    def test_create_rule_negative_value(self):
        from models import CommissionRule
        with pytest.raises(ValidationError):
            CommissionRule.create(
                user_id=1, employee_id=1,
                commission_type=CommissionType.PERCENTAGE.value,
                value=-10.0,
            )

    def test_calculate_percentage_commission(self):
        from models import CommissionRule
        rule = CommissionRule.create(
            user_id=1, employee_id=1,
            commission_type=CommissionType.PERCENTAGE.value,
            value=10.0,
        )
        commission = rule.calculate(200.00)
        assert commission == 20.00

    def test_calculate_fixed_commission(self):
        from models import CommissionRule
        rule = CommissionRule.create(
            user_id=1, employee_id=1,
            commission_type=CommissionType.FIXED.value,
            value=50.0,
        )
        commission = rule.calculate(200.00)
        assert commission == 50.00

    def test_calculate_percentage_over_100(self):
        from models import CommissionRule
        rule = CommissionRule.create(
            user_id=1, employee_id=1,
            commission_type=CommissionType.PERCENTAGE.value,
            value=150.0,
        )
        commission = rule.calculate(100.00)
        assert commission == 150.00


class TestCommissionPayment:
    def test_create_commission_payment(self):
        from models import CommissionPayment
        payment = CommissionPayment.create(
            user_id=1, employee_id=1,
            appointment_id=1, service_id=1,
            amount=20.00, base_amount=200.00,
        )
        assert payment.status == CommissionStatus.PENDING.value
        assert payment.amount == 20.00

    def test_mark_paid(self):
        from models import CommissionPayment
        payment = CommissionPayment.create(
            user_id=1, employee_id=1,
            appointment_id=1, service_id=1,
            amount=20.00, base_amount=200.00,
        )
        payment.mark_paid()
        assert payment.status == CommissionStatus.PAID.value

    def test_mark_paid_already_paid(self):
        from models import CommissionPayment
        payment = CommissionPayment.create(
            user_id=1, employee_id=1,
            appointment_id=1, service_id=1,
            amount=20.00, base_amount=200.00,
        )
        payment.mark_paid()
        with pytest.raises(CommissionError):
            payment.mark_paid()

    def test_cancel_payment(self):
        from models import CommissionPayment
        payment = CommissionPayment.create(
            user_id=1, employee_id=1,
            appointment_id=1, service_id=1,
            amount=20.00, base_amount=200.00,
        )
        payment.cancel()
        assert payment.status == CommissionStatus.CANCELLED.value

    def test_cancel_already_paid(self):
        from models import CommissionPayment
        payment = CommissionPayment.create(
            user_id=1, employee_id=1,
            appointment_id=1, service_id=1,
            amount=20.00, base_amount=200.00,
        )
        payment.mark_paid()
        with pytest.raises(CommissionError):
            payment.cancel()

    def test_zero_amount_rejected(self):
        from models import CommissionPayment
        with pytest.raises(ValidationError):
            CommissionPayment.create(
                user_id=1, employee_id=1,
                appointment_id=1, service_id=1,
                amount=0, base_amount=200.00,
            )
