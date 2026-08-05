"""Quote (orcamento) service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.phase6_repository import QuoteRepository


class QuoteService:
    def __init__(self, quote_repo=None):
        self.quote_repo = quote_repo or QuoteRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_quote(self, data):
        from models import Quote
        try:
            quote = Quote.create(
                user_id=data['userId'],
                client_id=data.get('clientId'),
                items=data.get('items', []),
                discount=data.get('discount', 0.0),
                valid_until=data.get('validUntil'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.quote_repo.add(quote)
        return {'success': True, 'quote': quote.to_dict()}

    def get_quotes(self, user_id):
        quotes = self.quote_repo.find_by_user_id(user_id)
        return [q.to_dict() for q in quotes]

    def get_quote(self, quote_id):
        quote = self.quote_repo.get_by_id(quote_id)
        if not quote:
            return None
        return quote.to_dict()

    def send_quote(self, quote_id):
        quote = self.quote_repo.get_by_id(quote_id)
        if not quote:
            return {'success': False, 'errors': ['Orçamento não encontrado']}
        try:
            quote.send()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.quote_repo.save(quote)
        return {'success': True, 'quote': quote.to_dict()}

    def approve_quote(self, quote_id):
        quote = self.quote_repo.get_by_id(quote_id)
        if not quote:
            return {'success': False, 'errors': ['Orçamento não encontrado']}
        try:
            quote.approve()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.quote_repo.save(quote)
        return {'success': True, 'quote': quote.to_dict()}

    def reject_quote(self, quote_id, comment=''):
        quote = self.quote_repo.get_by_id(quote_id)
        if not quote:
            return {'success': False, 'errors': ['Orçamento não encontrado']}
        try:
            quote.reject(comment=comment)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.quote_repo.save(quote)
        return {'success': True, 'quote': quote.to_dict()}

    def convert_quote(self, quote_id, target='appointment'):
        quote = self.quote_repo.get_by_id(quote_id)
        if not quote:
            return {'success': False, 'errors': ['Orçamento não encontrado']}
        try:
            quote.convert(target=target)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.quote_repo.save(quote)
        return {'success': True, 'quote': quote.to_dict()}

    def add_comment(self, quote_id, comment):
        quote = self.quote_repo.get_by_id(quote_id)
        if not quote:
            return {'success': False, 'errors': ['Orçamento não encontrado']}
        quote.add_comment(comment)
        self.quote_repo.save(quote)
        return {'success': True, 'quote': quote.to_dict()}
