"""Service catalog application service (thin orchestration)."""
from logger import get_logger
from models import Service
from domain.exceptions import DomainError
from repositories.service_repository import ServiceRepository


class ServiceService:
    """Coordinates persistence and the Service domain entity."""

    def __init__(self, service_repository=None):
        self.service_repository = service_repository or ServiceRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_service(self, data):
        """Create a new service. Pricing/duration invariants live in the entity."""
        try:
            service = Service.create(
                user_id=data['userId'],
                name=data.get('name'),
                price=data.get('price'),
                duration=data.get('duration'),
                description=data.get('description', ''),
                home_attendance=data.get('homeAttendance', False),
            )
        except DomainError as e:
            self.logger.warning('Service validation failed: user_id=%s errors=%s', data.get('userId'), e.errors)
            return {'success': False, 'errors': e.errors}

        self.service_repository.add(service)
        self.logger.info('Service created: user_id=%s service_id=%s', service.user_id, service.id)
        return {'success': True, 'service': service.to_dict()}

    def get_services_by_user_id(self, user_id):
        """Get all services for a user."""
        services = self.service_repository.find_by_user_id(user_id)
        self.logger.debug('Listed services: user_id=%s count=%s', user_id, len(services))
        return [s.to_dict() for s in services]

    def get_service_by_id(self, service_id, user_id):
        """Get service by ID."""
        service = self.service_repository.get_by_id(service_id, user_id)
        if not service:
            self.logger.warning('Service not found: user_id=%s service_id=%s', user_id, service_id)
            return None
        return service.to_dict()

    def update_service(self, service_id, user_id, data):
        """Update a service via its domain behavior."""
        service = self.service_repository.get_by_id(service_id, user_id)
        if not service:
            self.logger.warning('Update service failed: not found user_id=%s service_id=%s', user_id, service_id)
            return {'success': False, 'errors': ['Serviço não encontrado']}

        try:
            if 'name' in data:
                service.rename(data['name'])
            if 'description' in data:
                service.describe(data['description'])
            if 'price' in data:
                service.change_price(data['price'])
            if 'duration' in data:
                service.change_duration(data['duration'])
            if 'homeAttendance' in data:
                service.set_home_attendance(data['homeAttendance'])
        except DomainError as e:
            self.logger.warning('Update service failed: user_id=%s service_id=%s errors=%s', user_id, service_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.service_repository.save(service)
        self.logger.info('Service updated: user_id=%s service_id=%s', user_id, service_id)
        return {'success': True, 'service': service.to_dict()}

    def delete_service(self, service_id, user_id):
        """Delete a service."""
        service = self.service_repository.get_by_id(service_id, user_id)
        if not service:
            self.logger.warning('Delete service failed: not found user_id=%s service_id=%s', user_id, service_id)
            return {'success': False, 'errors': ['Serviço não encontrado']}

        self.service_repository.delete(service)
        self.logger.info('Service deleted: user_id=%s service_id=%s', user_id, service_id)
        return {'success': True}
