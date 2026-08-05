"""Document and contract service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.phase6_repository import ContractRepository


class DocumentService:
    def __init__(self, contract_repo=None):
        self.contract_repo = contract_repo or ContractRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_contract(self, data):
        from models import Contract
        try:
            contract = Contract.create(
                user_id=data['userId'],
                client_id=data.get('clientId'),
                title=data.get('title'),
                body=data.get('body', ''),
                template_id=data.get('templateId'),
                variables=data.get('variables'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.contract_repo.add(contract)
        return {'success': True, 'contract': contract.to_dict()}

    def get_contracts(self, user_id):
        contracts = self.contract_repo.find_by_user_id(user_id)
        return [c.to_dict() for c in contracts]

    def get_contract(self, contract_id):
        contract = self.contract_repo.get_by_id(contract_id)
        if not contract:
            return None
        return contract.to_dict()

    def send_contract(self, contract_id):
        contract = self.contract_repo.get_by_id(contract_id)
        if not contract:
            return {'success': False, 'errors': ['Contrato não encontrado']}
        try:
            contract.send()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.contract_repo.save(contract)
        return {'success': True, 'contract': contract.to_dict()}

    def sign_contract(self, contract_id, ip, user_agent):
        contract = self.contract_repo.get_by_id(contract_id)
        if not contract:
            return {'success': False, 'errors': ['Contrato não encontrado']}
        try:
            contract.sign(ip=ip, user_agent=user_agent)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.contract_repo.save(contract)
        return {'success': True, 'contract': contract.to_dict()}

    def activate_contract(self, contract_id):
        contract = self.contract_repo.get_by_id(contract_id)
        if not contract:
            return {'success': False, 'errors': ['Contrato não encontrado']}
        try:
            contract.activate()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.contract_repo.save(contract)
        return {'success': True, 'contract': contract.to_dict()}

    def terminate_contract(self, contract_id):
        contract = self.contract_repo.get_by_id(contract_id)
        if not contract:
            return {'success': False, 'errors': ['Contrato não encontrado']}
        try:
            contract.terminate()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.contract_repo.save(contract)
        return {'success': True, 'contract': contract.to_dict()}

    def new_version(self, contract_id, body=None, variables=None):
        contract = self.contract_repo.get_by_id(contract_id)
        if not contract:
            return {'success': False, 'errors': ['Contrato não encontrado']}
        new = contract.new_version(body=body, variables=variables)
        self.contract_repo.add(new)
        return {'success': True, 'contract': new.to_dict()}

    def get_versions(self, contract_id):
        versions = self.contract_repo.find_versions(contract_id)
        return [v.to_dict() for v in versions]
