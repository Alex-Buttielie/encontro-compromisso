"""ERP financial application service."""
from datetime import date
from logger import get_logger
from domain.exceptions import DomainError
from repositories.erp_repository import (
    CashFlowRepository, CostCenterRepository,
    AccountPayableRepository, AccountReceivableRepository,
    FinancialPeriodRepository,
)


class ERPService:
    def __init__(self, cash_flow_repo=None, cost_center_repo=None,
                 payable_repo=None, receivable_repo=None, period_repo=None):
        self.cash_flow_repo = cash_flow_repo or CashFlowRepository()
        self.cost_center_repo = cost_center_repo or CostCenterRepository()
        self.payable_repo = payable_repo or AccountPayableRepository()
        self.receivable_repo = receivable_repo or AccountReceivableRepository()
        self.period_repo = period_repo or FinancialPeriodRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_cash_flow_entry(self, data):
        from models import CashFlowEntry
        from datetime import date as dt_date
        try:
            raw_date = data.get('date')
            entry_date = dt_date.fromisoformat(raw_date) if isinstance(raw_date, str) else raw_date
            entry = CashFlowEntry.create(
                user_id=data['userId'],
                type=data.get('type'),
                description=data.get('description'),
                amount=data.get('amount'),
                date=entry_date,
                category=data.get('category', ''),
                cost_center_id=data.get('costCenterId'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.cash_flow_repo.add(entry)
        return {'success': True, 'entry': entry.to_dict()}

    def get_cash_flow_entries(self, user_id, start_date=None, end_date=None):
        if start_date and end_date:
            entries = self.cash_flow_repo.find_by_date_range(user_id, start_date, end_date)
        else:
            entries = self.cash_flow_repo.find_by_user_id(user_id)
        return [e.to_dict() for e in entries]

    def get_cash_flow_summary(self, user_id, start_date=None, end_date=None):
        if start_date and end_date:
            entries = self.cash_flow_repo.find_by_date_range(user_id, start_date, end_date)
        else:
            entries = self.cash_flow_repo.find_by_user_id(user_id)
        revenues = sum(e.amount for e in entries if e.type == 'revenue')
        expenses = sum(e.amount for e in entries if e.type == 'expense')
        profit = round(revenues - expenses, 2)
        margin = round((profit / revenues) * 100, 2) if revenues > 0 else 0.0
        return {
            'totalRevenue': round(revenues, 2),
            'totalExpenses': round(expenses, 2),
            'profit': profit,
            'margin': margin,
            'entryCount': len(entries),
        }

    def get_dre(self, user_id, start_date=None, end_date=None):
        summary = self.get_cash_flow_summary(user_id, start_date, end_date)
        return {
            'revenue': summary['totalRevenue'],
            'expenses': summary['totalExpenses'],
            'profit': summary['profit'],
            'margin': summary['margin'],
        }

    def create_cost_center(self, data):
        from models import CostCenter
        try:
            cc = CostCenter.create(
                user_id=data['userId'],
                name=data.get('name'),
                code=data.get('code'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.cost_center_repo.add(cc)
        return {'success': True, 'costCenter': cc.to_dict()}

    def get_cost_centers(self, user_id):
        centers = self.cost_center_repo.find_by_user_id(user_id)
        return [c.to_dict() for c in centers]

    def create_account_payable(self, data):
        from models import AccountPayable
        from datetime import date as dt_date
        try:
            raw_due = data.get('dueDate')
            due_date = dt_date.fromisoformat(raw_due) if isinstance(raw_due, str) else raw_due
            acc = AccountPayable.create(
                user_id=data['userId'],
                description=data.get('description'),
                amount=data.get('amount'),
                due_date=due_date,
                category=data.get('category', ''),
                supplier_id=data.get('supplierId'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.payable_repo.add(acc)
        return {'success': True, 'account': acc.to_dict()}

    def pay_account_payable(self, account_id):
        acc = self.payable_repo.get_by_id(account_id)
        if not acc:
            return {'success': False, 'errors': ['Conta não encontrada']}
        try:
            acc.mark_paid()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.payable_repo.save(acc)
        return {'success': True, 'account': acc.to_dict()}

    def get_accounts_payable(self, user_id):
        accounts = self.payable_repo.find_by_user_id(user_id)
        return [a.to_dict() for a in accounts]

    def create_account_receivable(self, data):
        from models import AccountReceivable
        from datetime import date as dt_date
        try:
            raw_due = data.get('dueDate')
            due_date = dt_date.fromisoformat(raw_due) if isinstance(raw_due, str) else raw_due
            acc = AccountReceivable.create(
                user_id=data['userId'],
                description=data.get('description'),
                amount=data.get('amount'),
                due_date=due_date,
                client_id=data.get('clientId'),
                category=data.get('category', ''),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.receivable_repo.add(acc)
        return {'success': True, 'account': acc.to_dict()}

    def receive_account_receivable(self, account_id):
        acc = self.receivable_repo.get_by_id(account_id)
        if not acc:
            return {'success': False, 'errors': ['Conta não encontrada']}
        try:
            acc.mark_received()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.receivable_repo.save(acc)
        return {'success': True, 'account': acc.to_dict()}

    def get_accounts_receivable(self, user_id):
        accounts = self.receivable_repo.find_by_user_id(user_id)
        return [a.to_dict() for a in accounts]

    def create_period(self, data):
        from models import FinancialPeriod
        from datetime import date as dt_date
        try:
            raw_start = data.get('startDate')
            raw_end = data.get('endDate')
            start_date = dt_date.fromisoformat(raw_start) if isinstance(raw_start, str) else raw_start
            end_date = dt_date.fromisoformat(raw_end) if isinstance(raw_end, str) else raw_end
            period = FinancialPeriod.create(
                user_id=data['userId'],
                name=data.get('name'),
                start_date=start_date,
                end_date=end_date,
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.period_repo.add(period)
        return {'success': True, 'period': period.to_dict()}

    def close_period(self, period_id):
        period = self.period_repo.get_by_id(period_id)
        if not period:
            return {'success': False, 'errors': ['Período não encontrado']}
        try:
            period.close()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.period_repo.save(period)
        return {'success': True, 'period': period.to_dict()}

    def get_periods(self, user_id):
        periods = self.period_repo.find_by_user_id(user_id)
        return [p.to_dict() for p in periods]
