"""Package application service (thin orchestration over the domain)."""
from logger import get_logger
from models import Package
from domain.exceptions import DomainError
from repositories.package_repository import PackageRepository


class PackageService:
    """Coordinates session package operations."""

    def __init__(self, package_repository=None):
        self.package_repository = package_repository or PackageRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_package(self, data):
        """Create a new session package."""
        from datetime import date as date_cls

        validity_days = data.get('validityDays')
        valid_until = data.get('validUntil')
        if not validity_days and valid_until:
            try:
                target = date_cls.fromisoformat(valid_until)
                today = date_cls.today()
                validity_days = max((target - today).days, 1)
            except (ValueError, TypeError):
                pass

        try:
            pkg = Package.create(
                user_id=data['userId'],
                client_id=data.get('clientId'),
                name=data.get('name'),
                total_sessions=data.get('totalSessions'),
                price=data.get('price'),
                validity_days=validity_days,
                session_price=data.get('sessionPrice'),
            )
        except DomainError as e:
            self.logger.warning('Package validation failed: errors=%s', e.errors)
            return {'success': False, 'errors': e.errors}

        self.package_repository.add(pkg)
        self.logger.info('Package created: id=%s user_id=%s', pkg.id, pkg.user_id)
        return {'success': True, 'package': pkg.to_dict()}

    def use_session(self, package_id, user_id):
        """Use one session from a package."""
        pkg = self.package_repository.get_by_id(package_id, user_id)
        if not pkg:
            return {'success': False, 'errors': ['Pacote não encontrado']}

        try:
            pkg.use_session()
        except DomainError as e:
            self.logger.warning('Use session failed: package_id=%s errors=%s', package_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.package_repository.save(pkg)
        self.logger.info('Session used: package_id=%s remaining=%s', package_id, pkg.remaining_sessions)
        return {'success': True, 'package': pkg.to_dict()}

    def get_packages_by_user(self, user_id):
        """Get all packages for a provider."""
        packages = self.package_repository.find_by_user_id(user_id)
        return [p.to_dict() for p in packages]

    def get_packages_by_client(self, client_id):
        """Get all packages for a client."""
        packages = self.package_repository.find_by_client_id(client_id)
        return [p.to_dict() for p in packages]

    def cancel_package(self, package_id, user_id):
        """Cancel an active package."""
        pkg = self.package_repository.get_by_id(package_id, user_id)
        if not pkg:
            return {'success': False, 'errors': ['Pacote não encontrado']}

        try:
            pkg.cancel()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.package_repository.save(pkg)
        self.logger.info('Package cancelled: id=%s', package_id)
        return {'success': True, 'package': pkg.to_dict()}

    def check_expiry(self, package_id, user_id):
        """Check and update expiry status of a package."""
        pkg = self.package_repository.get_by_id(package_id, user_id)
        if not pkg:
            return {'success': False, 'errors': ['Pacote não encontrado']}

        pkg.check_expiry()
        self.package_repository.save(pkg)
        return {'success': True, 'package': pkg.to_dict()}
