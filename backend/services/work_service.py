"""Work application service (thin orchestration over the domain)."""
from logger import get_logger
from models import Work, WorkOrder
from domain.exceptions import DomainError
from repositories.work_repository import WorkRepository, WorkOrderRepository
from repositories.user_repository import UserRepository


class WorkService:
    """Orchestrates work creation, updates, and catalog browsing."""

    def __init__(self, work_repository=None, work_order_repository=None, user_repository=None):
        self.work_repository = work_repository or WorkRepository()
        self.work_order_repository = work_order_repository or WorkOrderRepository()
        self.user_repository = user_repository or UserRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_work(self, provider_id, data):
        """Create a new work for a provider."""
        try:
            work = Work.create(
                provider_id=provider_id,
                title=data.get('title'),
                price=data.get('price'),
                description=data.get('description', ''),
                category=data.get('category', ''),
                custom_fields=data.get('customFields', []),
            )
        except DomainError as e:
            self.logger.warning('Work creation failed: provider_id=%s errors=%s', provider_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.work_repository.add(work)
        self.logger.info('Work created: id=%s provider_id=%s', work.id, provider_id)
        return {'success': True, 'work': work.to_dict()}

    def update_work(self, work_id, provider_id, data):
        """Update a work owned by the provider."""
        work = self.work_repository.get_by_id(work_id)
        if not work or work.provider_id != provider_id:
            return {'success': False, 'errors': ['Trabalho não encontrado']}

        try:
            work.update(
                title=data.get('title'),
                description=data.get('description'),
                price=data.get('price'),
                category=data.get('category'),
                custom_fields=data.get('customFields'),
                active=data.get('active'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.work_repository.save(work)
        return {'success': True, 'work': work.to_dict()}

    def delete_work(self, work_id, provider_id):
        """Delete a work owned by the provider."""
        work = self.work_repository.get_by_id(work_id)
        if not work or work.provider_id != provider_id:
            return {'success': False, 'errors': ['Trabalho não encontrado']}
        self.work_repository.delete(work)
        return {'success': True}

    def get_works_by_provider(self, provider_id):
        """Get all works by a provider."""
        works = self.work_repository.get_by_provider(provider_id)
        return [w.to_dict() for w in works]

    def get_work_by_id(self, work_id, include_provider=False):
        """Get a single work by ID."""
        work = self.work_repository.get_by_id(work_id)
        if not work:
            return None
        if include_provider:
            provider = self.user_repository.get_by_id(work.provider_id)
            if provider:
                work.provider = provider
        return work.to_dict(include_provider=include_provider)

    def get_active_works(self, search=None):
        """Get all active works for the catalog (explore)."""
        if search:
            works = self.work_repository.search(search)
        else:
            works = self.work_repository.get_active_works()
        for w in works:
            provider = self.user_repository.get_by_id(w.provider_id)
            if provider:
                w.provider = provider
        return [w.to_dict(include_provider=True) for w in works]

    # --- Work Orders ---

    def create_order(self, work_id, client_user_id, field_data, notes=''):
        """Client places an order on a work."""
        work = self.work_repository.get_by_id(work_id)
        if not work or not work.active:
            return {'success': False, 'errors': ['Trabalho não disponível']}

        try:
            order = WorkOrder.create(
                work=work,
                client_user_id=client_user_id,
                field_data=field_data,
                notes=notes,
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.work_order_repository.add(order)
        order.work = work
        self.logger.info('Work order created: id=%s work_id=%s client=%s', order.id, work_id, client_user_id)
        return {'success': True, 'order': order.to_dict(include_work=True)}

    def get_orders_by_provider(self, provider_id):
        """Get all orders received by a provider."""
        orders = self.work_order_repository.get_by_provider(provider_id)
        return [o.to_dict(include_work=True, include_client=True) for o in orders]

    def get_orders_by_client(self, client_user_id):
        """Get all orders placed by a client."""
        orders = self.work_order_repository.get_by_client(client_user_id)
        return [o.to_dict(include_work=True) for o in orders]

    def accept_order(self, order_id, provider_id):
        """Provider accepts an order."""
        order = self.work_order_repository.get_by_id(order_id)
        if not order or order.provider_id != provider_id:
            return {'success': False, 'errors': ['Pedido não encontrado']}
        try:
            order.accept()
        except DomainError as e:
            return {'success': False, 'errors': [str(e)]}
        self.work_order_repository.save(order)
        return {'success': True, 'order': order.to_dict(include_work=True, include_client=True)}

    def reject_order(self, order_id, provider_id):
        """Provider rejects an order."""
        order = self.work_order_repository.get_by_id(order_id)
        if not order or order.provider_id != provider_id:
            return {'success': False, 'errors': ['Pedido não encontrado']}
        try:
            order.reject()
        except DomainError as e:
            return {'success': False, 'errors': [str(e)]}
        self.work_order_repository.save(order)
        return {'success': True, 'order': order.to_dict(include_work=True, include_client=True)}

    def complete_order(self, order_id, provider_id):
        """Provider marks an order as completed."""
        order = self.work_order_repository.get_by_id(order_id)
        if not order or order.provider_id != provider_id:
            return {'success': False, 'errors': ['Pedido não encontrado']}
        try:
            order.complete()
        except DomainError as e:
            return {'success': False, 'errors': [str(e)]}
        self.work_order_repository.save(order)
        return {'success': True, 'order': order.to_dict(include_work=True, include_client=True)}

    def cancel_order(self, order_id, user_id, is_provider):
        """Cancel an order (provider or client can cancel)."""
        order = self.work_order_repository.get_by_id(order_id)
        if not order:
            return {'success': False, 'errors': ['Pedido não encontrado']}
        if is_provider and order.provider_id != user_id:
            return {'success': False, 'errors': ['Pedido não encontrado']}
        if not is_provider and order.client_user_id != user_id:
            return {'success': False, 'errors': ['Pedido não encontrado']}
        try:
            order.cancel()
        except DomainError as e:
            return {'success': False, 'errors': [str(e)]}
        self.work_order_repository.save(order)
        return {'success': True, 'order': order.to_dict(include_work=True)}
