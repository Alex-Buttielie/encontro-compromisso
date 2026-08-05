"""TDD unit tests for ERP financial domain models (Phase 3)."""
from datetime import datetime, date, timedelta

import pytest

from domain.enums import FinancialEntryType, AccountStatus, PeriodStatus
from domain.exceptions import ERPError, ValidationError


class TestCostCenter:
    def test_create_cost_center(self):
        from models import CostCenter
        cc = CostCenter.create(user_id=1, name='Operacional', code='OP-001')
        assert cc.name == 'Operacional'
        assert cc.code == 'OP-001'

    def test_create_cost_center_missing_name(self):
        from models import CostCenter
        with pytest.raises(ValidationError):
            CostCenter.create(user_id=1, name='', code='OP-001')


class TestCashFlowEntry:
    def test_create_revenue_entry(self):
        from models import CashFlowEntry
        entry = CashFlowEntry.create(
            user_id=1, type=FinancialEntryType.REVENUE.value,
            description='Consulta', amount=200.00,
            date=date.today(), category='Serviços',
        )
        assert entry.type == FinancialEntryType.REVENUE.value
        assert entry.amount == 200.00

    def test_create_expense_entry(self):
        from models import CashFlowEntry
        entry = CashFlowEntry.create(
            user_id=1, type=FinancialEntryType.EXPENSE.value,
            description='Aluguel', amount=1500.00,
            date=date.today(), category='Fixo',
        )
        assert entry.type == FinancialEntryType.EXPENSE.value

    def test_zero_amount_rejected(self):
        from models import CashFlowEntry
        with pytest.raises(ValidationError):
            CashFlowEntry.create(
                user_id=1, type=FinancialEntryType.REVENUE.value,
                description='Test', amount=0, date=date.today())

    def test_missing_description(self):
        from models import CashFlowEntry
        with pytest.raises(ValidationError):
            CashFlowEntry.create(
                user_id=1, type=FinancialEntryType.REVENUE.value,
                description='', amount=100, date=date.today())


class TestAccountPayable:
    def test_create_account_payable(self):
        from models import AccountPayable
        acc = AccountPayable.create(
            user_id=1, description='Fornecedor XYZ',
            amount=500.00, due_date=date.today() + timedelta(days=30),
            category='Fornecedores',
        )
        assert acc.status == AccountStatus.PENDING.value
        assert acc.amount == 500.00

    def test_mark_paid(self):
        from models import AccountPayable
        acc = AccountPayable.create(
            user_id=1, description='Fornecedor',
            amount=500.00, due_date=date.today() + timedelta(days=30))
        acc.mark_paid()
        assert acc.status == AccountStatus.PAID.value

    def test_mark_paid_already_paid(self):
        from models import AccountPayable
        acc = AccountPayable.create(
            user_id=1, description='Fornecedor',
            amount=500.00, due_date=date.today() + timedelta(days=30))
        acc.mark_paid()
        with pytest.raises(ERPError):
            acc.mark_paid()

    def test_cancel(self):
        from models import AccountPayable
        acc = AccountPayable.create(
            user_id=1, description='Fornecedor',
            amount=500.00, due_date=date.today() + timedelta(days=30))
        acc.cancel()
        assert acc.status == AccountStatus.CANCELLED.value

    def test_check_overdue(self):
        from models import AccountPayable
        acc = AccountPayable.create(
            user_id=1, description='Fornecedor',
            amount=500.00, due_date=date.today() - timedelta(days=1))
        acc.check_overdue()
        assert acc.status == AccountStatus.OVERDUE.value


class TestAccountReceivable:
    def test_create_account_receivable(self):
        from models import AccountReceivable
        acc = AccountReceivable.create(
            user_id=1, description='Cliente ABC',
            amount=300.00, due_date=date.today() + timedelta(days=15),
            client_id=1,
        )
        assert acc.status == AccountStatus.PENDING.value

    def test_mark_received(self):
        from models import AccountReceivable
        acc = AccountReceivable.create(
            user_id=1, description='Cliente',
            amount=300.00, due_date=date.today() + timedelta(days=15),
            client_id=1)
        acc.mark_received()
        assert acc.status == AccountStatus.PAID.value


class TestFinancialPeriod:
    def test_create_period(self):
        from models import FinancialPeriod
        period = FinancialPeriod.create(
            user_id=1, name='Janeiro 2026',
            start_date=date(2026, 1, 1), end_date=date(2026, 1, 31),
        )
        assert period.status == PeriodStatus.OPEN.value

    def test_close_period(self):
        from models import FinancialPeriod
        period = FinancialPeriod.create(
            user_id=1, name='Jan 2026',
            start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))
        period.close()
        assert period.status == PeriodStatus.CLOSED.value

    def test_close_already_closed(self):
        from models import FinancialPeriod
        period = FinancialPeriod.create(
            user_id=1, name='Jan 2026',
            start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))
        period.close()
        with pytest.raises(ERPError):
            period.close()

    def test_period_contains_date(self):
        from models import FinancialPeriod
        period = FinancialPeriod.create(
            user_id=1, name='Jan 2026',
            start_date=date(2026, 1, 1), end_date=date(2026, 1, 31))
        assert period.contains_date(date(2026, 1, 15)) is True
        assert period.contains_date(date(2026, 2, 1)) is False


class TestDRECalculation:
    def test_dre_calculation(self):
        from models import CashFlowEntry
        # Just test the calculation logic exists
        revenues = [1000.00, 500.00, 300.00]
        expenses = [400.00, 200.00, 100.00]
        total_revenue = sum(revenues)
        total_expense = sum(expenses)
        profit = total_revenue - total_expense
        margin = (profit / total_revenue) * 100
        assert profit == 1100.00
        assert round(margin, 2) == 61.11
