"""Analytics application service."""
from datetime import date
from logger import get_logger
from domain.exceptions import DomainError
from models import DashboardReport
from domain.enums import AppointmentStatus, TransactionType
from repositories.transaction_repository import TransactionRepository
from repositories.appointment_repository import AppointmentRepository
from repositories.client_repository import ClientRepository
from repositories.service_repository import ServiceRepository
from database import get_db


class AnalyticsService:
    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)
        self._tx_repo = None
        self._apt_repo = None
        self._client_repo = None
        self._svc_repo = None

    @property
    def tx_repo(self):
        if self._tx_repo is None:
            self._tx_repo = TransactionRepository()
        return self._tx_repo

    @property
    def apt_repo(self):
        if self._apt_repo is None:
            self._apt_repo = AppointmentRepository()
        return self._apt_repo

    @property
    def client_repo(self):
        if self._client_repo is None:
            self._client_repo = ClientRepository()
        return self._client_repo

    @property
    def svc_repo(self):
        if self._svc_repo is None:
            self._svc_repo = ServiceRepository()
        return self._svc_repo

    def _query_transactions(self, user_id, start_date, end_date, tx_type=None, status=None):
        """Query transactions from Firestore with optional filters."""
        start_str = start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date)
        end_str = end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date)
        docs = get_db().collection('transaction').where('user_id', '==', user_id).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            doc_date = data.get('date', '')
            if not isinstance(doc_date, str):
                continue
            if doc_date < start_str or doc_date > end_str:
                continue
            if tx_type and data.get('type') != tx_type:
                continue
            if status and data.get('status') != status:
                continue
            results.append(data)
        return results

    def _query_appointments(self, user_id, start_date, end_date):
        """Query appointments from Firestore within date range."""
        start_str = start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date)
        end_str = end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date)
        docs = get_db().collection('appointment').where('user_id', '==', user_id).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            doc_date = data.get('date', '')
            if not isinstance(doc_date, str):
                continue
            if doc_date < start_str or doc_date > end_str:
                continue
            results.append(data)
        return results

    def get_dashboard(self, user_id, start_date, end_date, filters=None):
        """Generate executive dashboard with real data and filters."""
        if start_date is None:
            start_date = date.today().isoformat()
        if end_date is None:
            end_date = date.today().isoformat()
        report = DashboardReport.create(user_id, start_date, end_date, filters)

        revenue_txs = self._query_transactions(user_id, start_date, end_date, tx_type=TransactionType.INCOME.value)
        total_revenue = sum(t.get('amount', 0) for t in revenue_txs if t.get('status') == 'paid')

        expense_txs = self._query_transactions(user_id, start_date, end_date, tx_type=TransactionType.EXPENSE.value)
        total_expenses = sum(t.get('amount', 0) for t in expense_txs if t.get('status') == 'paid')

        appointments = self._query_appointments(user_id, start_date, end_date)
        total_appointments = len(appointments)
        cancelled = len([a for a in appointments if a.get('status') == AppointmentStatus.CANCELLED.value])

        all_clients = self.client_repo.find_by_user_id(user_id)
        total_clients = len(all_clients)

        start_str = start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date)
        end_str = end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date)
        new_clients = 0
        for c in all_clients:
            created = getattr(c, 'created_at', None)
            if created:
                created_str = created.isoformat() if hasattr(created, 'isoformat') else str(created)
                if start_str <= created_str <= end_str:
                    new_clients += 1

        report.set_metrics(
            total_revenue=total_revenue,
            total_expenses=total_expenses,
            total_appointments=total_appointments,
            total_clients=total_clients,
            new_clients=new_clients,
            cancelled_appointments=cancelled,
        )

        return report.to_dict()

    def get_revenue_report(self, user_id, start_date, end_date):
        """Monthly/annual revenue report."""
        txs = self._query_transactions(user_id, start_date, end_date, tx_type=TransactionType.INCOME.value, status='paid')

        by_month = {}
        for tx in txs:
            tx_date = tx.get('date', '')
            if isinstance(tx_date, str) and len(tx_date) >= 7:
                month_key = tx_date[:7]
                by_month[month_key] = by_month.get(month_key, 0) + tx.get('amount', 0)

        return {
            'totalRevenue': sum(by_month.values()),
            'byMonth': by_month,
            'period': f'{start_date} to {end_date}',
        }

    def get_top_services(self, user_id, start_date, end_date):
        """Most sold services in period."""
        appointments = self._query_appointments(user_id, start_date, end_date)
        cancelled_val = AppointmentStatus.CANCELLED.value

        service_count = {}
        for apt in appointments:
            if apt.get('status') == cancelled_val:
                continue
            service_id = apt.get('service_id')
            if service_id:
                svc = self.svc_repo.get_by_id(service_id)
                if svc:
                    name = getattr(svc, 'name', str(service_id))
                    service_count[name] = service_count.get(name, 0) + 1

        sorted_services = sorted(service_count.items(), key=lambda x: x[1], reverse=True)
        return [{'service': name, 'count': count} for name, count in sorted_services]

    def get_occupancy_rate(self, user_id, start_date, end_date):
        """Agenda occupancy rate."""
        appointments = self._query_appointments(user_id, start_date, end_date)
        cancelled_val = AppointmentStatus.CANCELLED.value

        booked = len([a for a in appointments if a.get('status') != cancelled_val])
        total = len(appointments)
        rate = (booked / total * 100) if total > 0 else 0.0

        return {
            'bookedSlots': booked,
            'totalSlots': total,
            'occupancyRate': round(rate, 2),
        }

    def get_growth_rate(self, user_id, start_date, end_date):
        """Growth rate compared to previous period."""
        from datetime import timedelta
        period_days = (end_date - start_date).days
        prev_start = start_date - timedelta(days=period_days)
        prev_end = start_date

        current_revenue = sum(
            t.get('amount', 0) for t in self._query_transactions(
                user_id, start_date, end_date,
                tx_type=TransactionType.INCOME.value, status='paid')
        )
        prev_revenue = sum(
            t.get('amount', 0) for t in self._query_transactions(
                user_id, prev_start, prev_end,
                tx_type=TransactionType.INCOME.value, status='paid')
        )

        growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0.0
        return {
            'currentRevenue': current_revenue,
            'previousRevenue': prev_revenue,
            'growthRate': round(growth, 2),
        }

    def get_retention_metrics(self, user_id):
        """Calculate retention, CAC, and LTV."""
        all_clients = self.client_repo.find_by_user_id(user_id)
        total_clients = len(all_clients)

        from datetime import timedelta
        cutoff = (date.today() - timedelta(days=90)).isoformat()
        docs = get_db().collection('appointment').where('user_id', '==', user_id).stream()
        active_client_ids = set()
        cancelled_val = AppointmentStatus.CANCELLED.value
        for doc in docs:
            data = doc.to_dict()
            doc_date = data.get('date', '')
            if isinstance(doc_date, str) and doc_date >= cutoff and data.get('status') != cancelled_val:
                cid = data.get('client_id')
                if cid:
                    active_client_ids.add(cid)

        active = len(active_client_ids)
        retention = (active / total_clients * 100) if total_clients > 0 else 0.0

        return {
            'totalClients': total_clients,
            'activeClients': active,
            'retentionRate': round(retention, 2),
        }
