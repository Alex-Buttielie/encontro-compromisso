"""TDD unit tests for the Package domain entity (Phase 2)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import PackageStatus
from domain.exceptions import PackageError, ValidationError


class TestPackageCreation:
    def test_create_package_valid(self):
        from models import Package
        pkg = Package.create(
            user_id=1,
            client_id=1,
            name='Pacote 10 sessões',
            total_sessions=10,
            price=800.00,
            validity_days=90,
        )
        assert pkg.status == PackageStatus.ACTIVE.value
        assert pkg.total_sessions == 10
        assert pkg.remaining_sessions == 10
        assert pkg.price == 800.00

    def test_create_package_zero_sessions_rejected(self):
        from models import Package
        with pytest.raises(ValidationError):
            Package.create(
                user_id=1, client_id=1, name='Pacote',
                total_sessions=0, price=100, validity_days=30)

    def test_create_package_zero_price_rejected(self):
        from models import Package
        with pytest.raises(ValidationError):
            Package.create(
                user_id=1, client_id=1, name='Pacote',
                total_sessions=5, price=0, validity_days=30)

    def test_create_package_zero_validity_rejected(self):
        from models import Package
        with pytest.raises(ValidationError):
            Package.create(
                user_id=1, client_id=1, name='Pacote',
                total_sessions=5, price=100, validity_days=0)

    def test_create_package_missing_name(self):
        from models import Package
        with pytest.raises(ValidationError):
            Package.create(
                user_id=1, client_id=1, name='',
                total_sessions=5, price=100, validity_days=30)

    def test_package_has_expiry_date(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=5, price=100, validity_days=30)
        assert pkg.expires_at is not None


class TestPackageUsage:
    def test_use_session_decrements_remaining(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=5, price=100, validity_days=30)
        pkg.use_session()
        assert pkg.remaining_sessions == 4

    def test_use_all_sessions_exhausts_package(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=2, price=100, validity_days=30)
        pkg.use_session()
        pkg.use_session()
        assert pkg.remaining_sessions == 0
        assert pkg.status == PackageStatus.EXHAUSTED.value

    def test_use_session_on_exhausted_rejected(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=1, price=100, validity_days=30)
        pkg.use_session()
        with pytest.raises(PackageError):
            pkg.use_session()


class TestPackageExpiry:
    def test_expired_package_cannot_be_used(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=5, price=100, validity_days=30)
        # Force expiry
        pkg.expires_at = datetime.utcnow() - timedelta(days=1)
        pkg.check_expiry()
        assert pkg.status == PackageStatus.EXPIRED.value
        with pytest.raises(PackageError):
            pkg.use_session()

    def test_check_expiry_does_not_affect_active(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=5, price=100, validity_days=30)
        pkg.check_expiry()
        assert pkg.status == PackageStatus.ACTIVE.value


class TestPackageDiscount:
    def test_package_has_discount_percentage(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote 10 sessões',
            total_sessions=10, price=800.00, validity_days=90,
            session_price=100.00)
        # 10 sessions × 100 = 1000, package costs 800 → 20% discount
        assert pkg.discount_percentage == 20.0

    def test_package_without_session_price_no_discount(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=5, price=100, validity_days=30)
        assert pkg.discount_percentage == 0


class TestPackageCancellation:
    def test_cancel_active_package(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=5, price=100, validity_days=30)
        pkg.cancel()
        assert pkg.status == PackageStatus.CANCELLED.value

    def test_cancel_exhausted_rejected(self):
        from models import Package
        pkg = Package.create(
            user_id=1, client_id=1, name='Pacote',
            total_sessions=1, price=100, validity_days=30)
        pkg.use_session()
        with pytest.raises(PackageError):
            pkg.cancel()
