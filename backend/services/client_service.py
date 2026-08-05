"""Client application service (thin orchestration over the rich domain)."""
from logger import get_logger
from models import Client
from domain.exceptions import DomainError
from repositories.client_repository import ClientRepository


class ClientService:
    """Coordinates persistence and the Client domain entity."""

    def __init__(self, client_repository=None):
        self.client_repository = client_repository or ClientRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_client(self, data):
        """Create a new client. Invariants live in Client.create."""
        try:
            client = Client.create(
                user_id=data['userId'],
                name=data.get('name'),
                email=data.get('email', ''),
                phone=data.get('phone', ''),
                address=data.get('address', ''),
                notes=data.get('notes', ''),
                cep=data.get('cep', ''),
                rua=data.get('rua', ''),
                numero=data.get('numero', ''),
                complemento=data.get('complemento', ''),
                bairro=data.get('bairro', ''),
                cidade=data.get('cidade', ''),
                estado=data.get('estado', ''),
            )
        except DomainError as e:
            self.logger.warning('Client validation failed: user_id=%s errors=%s', data.get('userId'), e.errors)
            return {'success': False, 'errors': e.errors}

        self.client_repository.add(client)
        self.logger.info('Client created: user_id=%s client_id=%s', client.user_id, client.id)
        return {'success': True, 'client': client.to_dict()}

    def get_clients_by_user_id(self, user_id):
        """Get all clients for a user."""
        clients = self.client_repository.find_by_user_id(user_id)
        self.logger.debug('Listed clients: user_id=%s count=%s', user_id, len(clients))
        return [c.to_dict() for c in clients]

    def get_clients_paginated(self, user_id, page=1, limit=20):
        """Get paginated clients for a user."""
        clients, total, pages = self.client_repository.get_paginated(user_id, page, limit)
        self.logger.debug('Paginated clients: user_id=%s page=%s limit=%s total=%s', user_id, page, limit, total)
        return {
            'clients': [c.to_dict() for c in clients],
            'total': total,
            'page': page,
            'limit': limit,
            'pages': pages,
        }

    def get_client_by_id(self, client_id, user_id):
        """Get client by ID."""
        client = self.client_repository.get_by_id(client_id, user_id)
        if not client:
            self.logger.warning('Client not found: user_id=%s client_id=%s', user_id, client_id)
            return None
        return client.to_dict()

    def update_client(self, client_id, user_id, data):
        """Update a client via its domain behavior."""
        client = self.client_repository.get_by_id(client_id, user_id)
        if not client:
            self.logger.warning('Update client failed: not found user_id=%s client_id=%s', user_id, client_id)
            return {'success': False, 'errors': ['Cliente não encontrado']}

        try:
            client.update_contact(
                name=data.get('name'),
                email=data.get('email'),
                phone=data.get('phone'),
                address=data.get('address'),
                notes=data.get('notes'),
                cep=data.get('cep'),
                rua=data.get('rua'),
                numero=data.get('numero'),
                complemento=data.get('complemento'),
                bairro=data.get('bairro'),
                cidade=data.get('cidade'),
                estado=data.get('estado'),
            )
        except DomainError as e:
            self.logger.warning('Update client failed: user_id=%s client_id=%s errors=%s', user_id, client_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.client_repository.save(client)
        self.logger.info('Client updated: user_id=%s client_id=%s', user_id, client_id)
        return {'success': True, 'client': client.to_dict()}

    def delete_client(self, client_id, user_id):
        """Delete a client."""
        client = self.client_repository.get_by_id(client_id, user_id)
        if not client:
            self.logger.warning('Delete client failed: not found user_id=%s client_id=%s', user_id, client_id)
            return {'success': False, 'errors': ['Cliente não encontrado']}

        self.client_repository.delete(client)
        self.logger.info('Client deleted: user_id=%s client_id=%s', user_id, client_id)
        return {'success': True}

    def search_clients(self, user_id, search_term):
        """Search clients by name."""
        if not search_term:
            return [c.to_dict() for c in self.client_repository.find_by_user_id(user_id)]
        clients = self.client_repository.search_by_name(user_id, search_term)
        self.logger.info('Client search: user_id=%s term=%s count=%s', user_id, search_term, len(clients))
        return [c.to_dict() for c in clients]
