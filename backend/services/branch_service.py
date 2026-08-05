"""Branch and multi-unit application service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.branch_repository import BranchRepository, StockTransferRepository
from repositories.inventory_repository import ProductRepository


class BranchService:
    def __init__(self, branch_repo=None, transfer_repo=None, product_repo=None):
        self.branch_repo = branch_repo or BranchRepository()
        self.transfer_repo = transfer_repo or StockTransferRepository()
        self.product_repo = product_repo or ProductRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_branch(self, data):
        from models import Branch
        try:
            branch = Branch.create(
                user_id=data['userId'],
                name=data.get('name'),
                branch_type=data.get('branchType', 'branch'),
                address=data.get('address', ''),
                phone=data.get('phone', ''),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.branch_repo.add(branch)
        return {'success': True, 'branch': branch.to_dict()}

    def get_branches(self, user_id):
        branches = self.branch_repo.find_by_user_id(user_id)
        return [b.to_dict() for b in branches]

    def deactivate_branch(self, branch_id):
        branch = self.branch_repo.get_by_id(branch_id)
        if not branch:
            return {'success': False, 'errors': ['Unidade não encontrada']}
        branch.deactivate()
        self.branch_repo.save(branch)
        return {'success': True, 'branch': branch.to_dict()}

    def reactivate_branch(self, branch_id):
        branch = self.branch_repo.get_by_id(branch_id)
        if not branch:
            return {'success': False, 'errors': ['Unidade não encontrada']}
        branch.reactivate()
        self.branch_repo.save(branch)
        return {'success': True, 'branch': branch.to_dict()}

    # --- Stock Transfers ---

    def create_transfer(self, data):
        from models import StockTransfer
        try:
            transfer = StockTransfer.create(
                user_id=data['userId'],
                product_id=data['productId'],
                from_branch_id=data['fromBranchId'],
                to_branch_id=data['toBranchId'],
                quantity=data.get('quantity'),
                reason=data.get('reason', ''),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.transfer_repo.add(transfer)
        return {'success': True, 'transfer': transfer.to_dict()}

    def get_transfers(self, user_id):
        transfers = self.transfer_repo.find_by_user_id(user_id)
        return [t.to_dict() for t in transfers]

    def get_pending_transfers(self, user_id):
        transfers = self.transfer_repo.find_pending(user_id)
        return [t.to_dict() for t in transfers]

    def approve_transfer(self, transfer_id):
        transfer = self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            return {'success': False, 'errors': ['Transferência não encontrada']}
        try:
            transfer.approve()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.transfer_repo.save(transfer)
        return {'success': True, 'transfer': transfer.to_dict()}

    def reject_transfer(self, transfer_id):
        transfer = self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            return {'success': False, 'errors': ['Transferência não encontrada']}
        try:
            transfer.reject()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.transfer_repo.save(transfer)
        return {'success': True, 'transfer': transfer.to_dict()}

    def ship_transfer(self, transfer_id):
        transfer = self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            return {'success': False, 'errors': ['Transferência não encontrada']}
        try:
            transfer.ship()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.transfer_repo.save(transfer)
        return {'success': True, 'transfer': transfer.to_dict()}

    def complete_transfer(self, transfer_id):
        """Complete transfer: update stock on both sides."""
        transfer = self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            return {'success': False, 'errors': ['Transferência não encontrada']}
        try:
            transfer.complete()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        # Deduct from source product
        product = self.product_repo.get_by_id(transfer.product_id)
        if product:
            try:
                product.consume_stock(
                    transfer.quantity,
                    f'Transferência #{transfer.id} para unidade {transfer.to_branch_id}')
            except DomainError:
                pass  # Log but don't fail the transfer
            # Add to destination (same product, just record movement)
            product.add_stock(
                transfer.quantity,
                f'Transferência #{transfer.id} da unidade {transfer.from_branch_id}')
            self.product_repo.save(product)
        self.transfer_repo.save(transfer)
        return {'success': True, 'transfer': transfer.to_dict()}

    def cancel_transfer(self, transfer_id):
        transfer = self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            return {'success': False, 'errors': ['Transferência não encontrada']}
        try:
            transfer.cancel()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.transfer_repo.save(transfer)
        return {'success': True, 'transfer': transfer.to_dict()}

    # --- Consolidated Reports ---

    def get_consolidated_report(self, user_id, start_date=None, end_date=None):
        """Consolidated report across all branches."""
        from domain.enums import TransactionType, AppointmentStatus
        from database import get_db
        from datetime import date as dt_date
        if not start_date:
            start_date = dt_date.today().replace(day=1)
        if not end_date:
            end_date = dt_date.today()

        start_str = start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date)
        end_str = end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date)

        branches = self.branch_repo.find_by_user_id(user_id)
        branch_reports = []
        for branch in branches:
            tx_docs = get_db().collection('transaction').where('user_id', '==', user_id).stream()
            txs = []
            for doc in tx_docs:
                data = doc.to_dict()
                doc_date = data.get('date', '')
                if isinstance(doc_date, str) and start_str <= doc_date <= end_str:
                    txs.append(data)
            revenue = sum(t.get('amount', 0) for t in txs
                         if t.get('type') == TransactionType.INCOME.value and t.get('status') == 'paid')
            expenses = sum(t.get('amount', 0) for t in txs
                          if t.get('type') == TransactionType.EXPENSE.value and t.get('status') == 'paid')
            apt_docs = get_db().collection('appointment').where('user_id', '==', user_id).stream()
            appointments = []
            for doc in apt_docs:
                data = doc.to_dict()
                doc_date = data.get('date', '')
                if isinstance(doc_date, str) and start_str <= doc_date <= end_str:
                    appointments.append(data)
            branch_reports.append({
                'branchId': branch.id,
                'branchName': branch.name,
                'revenue': round(revenue, 2),
                'expenses': round(expenses, 2),
                'profit': round(revenue - expenses, 2),
                'appointments': len(appointments),
            })

        total_revenue = sum(b['revenue'] for b in branch_reports)
        total_expenses = sum(b['expenses'] for b in branch_reports)
        return {
            'branches': branch_reports,
            'totalRevenue': round(total_revenue, 2),
            'totalExpenses': round(total_expenses, 2),
            'totalProfit': round(total_revenue - total_expenses, 2),
            'period': f'{start_date} to {end_date}',
        }
