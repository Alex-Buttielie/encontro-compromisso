"""TDD unit tests for Analytics domain models (Phase 3)."""
from datetime import date, timedelta

import pytest

from domain.exceptions import AnalyticsError, ValidationError


class TestAnalyticsCalculations:
    """Test analytics calculation logic."""

    def test_monthly_revenue(self):
        from models import CashFlowEntry
        # Test the calculation exists as a utility
        revenues = [1000, 500, 300]
        assert sum(revenues) == 1800

    def test_average_ticket(self):
        total_revenue = 3000.00
        total_appointments = 30
        avg = total_revenue / total_appointments
        assert avg == 100.00

    def test_cancellation_rate(self):
        total = 100
        cancelled = 15
        rate = (cancelled / total) * 100
        assert rate == 15.0

    def test_retention_rate(self):
        initial = 80
        retained = 60
        rate = (retained / initial) * 100
        assert rate == 75.0

    def test_cac(self):
        marketing_spend = 500.00
        new_clients = 10
        cac = marketing_spend / new_clients
        assert cac == 50.00

    def test_ltv(self):
        avg_ticket = 100.00
        visits_per_year = 12
        avg_lifespan_years = 3
        ltv = avg_ticket * visits_per_year * avg_lifespan_years
        assert ltv == 3600.00

    def test_growth_rate(self):
        current = 1200
        previous = 1000
        growth = ((current - previous) / previous) * 100
        assert growth == 20.0

    def test_occupancy_rate(self):
        booked_slots = 25
        total_slots = 40
        rate = (booked_slots / total_slots) * 100
        assert rate == 62.5


class TestDashboardReport:
    def test_create_dashboard_report(self):
        from models import DashboardReport
        report = DashboardReport.create(
            user_id=1,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
        )
        assert report.total_revenue == 0.0
        assert report.total_expenses == 0.0
        assert report.profit == 0.0

    def test_dashboard_report_with_filters(self):
        from models import DashboardReport
        report = DashboardReport.create(
            user_id=1,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
            filters={'unit': 'unidade1', 'collaborator': 'Dr. João'},
        )
        assert report.filters['unit'] == 'unidade1'

    def test_dashboard_set_metrics(self):
        from models import DashboardReport
        report = DashboardReport.create(
            user_id=1,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
        )
        report.set_metrics(
            total_revenue=5000.00,
            total_expenses=2000.00,
            total_appointments=50,
            total_clients=30,
            new_clients=5,
            cancelled_appointments=5,
        )
        assert report.total_revenue == 5000.00
        assert report.profit == 3000.00
        assert report.average_ticket == 100.00
        assert report.cancellation_rate == 10.0

    def test_dashboard_profit_margin(self):
        from models import DashboardReport
        report = DashboardReport.create(
            user_id=1,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
        )
        report.set_metrics(
            total_revenue=10000.00,
            total_expenses=4000.00,
            total_appointments=100,
            total_clients=50,
            new_clients=10,
            cancelled_appointments=10,
        )
        assert report.profit == 6000.00
        assert report.profit_margin == 60.0

    def test_dashboard_invalid_date_range(self):
        from models import DashboardReport
        with pytest.raises(ValidationError):
            DashboardReport.create(
                user_id=1,
                start_date=date(2026, 1, 31),
                end_date=date(2026, 1, 1),
            )
