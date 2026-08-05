"""LGPD service — data export, correction, deletion, portability with audit."""
import json
from logger import get_logger
from domain.enums import AuditActionType, DataRequestStatus
from domain.exceptions import DomainError, LgpdError
from repositories.phase8_repository import DataRequestRepository, AuditLogRepository
from repositories.user_repository import UserRepository


class LgpdService:
    def __init__(self, req_repo=None, audit_repo=None):
        self.req_repo = req_repo or DataRequestRepository()
        self.audit_repo = audit_repo or AuditLogRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_request(self, user_id, request_type):
        from models import DataRequest
        try:
            req = DataRequest.create(user_id=user_id, request_type=request_type)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.req_repo.add(req)
        return {'success': True, 'dataRequest': req.to_dict()}

    def get_requests(self, user_id):
        reqs = self.req_repo.find_by_user_id(user_id)
        return [r.to_dict() for r in reqs]

    def get_request(self, req_id):
        req = self.req_repo.get_by_id(req_id)
        if not req:
            return None
        return req.to_dict()

    def process_export(self, admin_id, req_id):
        """Process a data export request — collects user data and generates JSON."""
        req = self.req_repo.get_by_id(req_id)
        if not req:
            return {'success': False, 'errors': ['Solicitação não encontrada']}
        if req.request_type != 'export':
            return {'success': False, 'errors': ['Solicitação não é de exportação']}

        req.start_processing()
        self.req_repo.save(req)

        # Collect user data
        from repositories.user_repository import UserRepository as _UserRepo
        from repositories.client_repository import ClientRepository as _ClientRepo
        from repositories.appointment_repository import AppointmentRepository as _AptRepo
        from repositories.transaction_repository import TransactionRepository as _TxRepo
        user_repo = _UserRepo()
        user = user_repo.get_by_id(req.user_id)
        if not user:
            req.reject(reason='Usuário não encontrado')
            self.req_repo.save(req)
            return {'success': False, 'errors': ['Usuário não encontrado']}

        export_data = {
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'profession': getattr(user, 'profession', None),
                'created_at': user.created_at.isoformat() if user.created_at else None,
            },
            'clients': [],
            'appointments': [],
            'transactions': [],
        }

        client_repo = _ClientRepo()
        clients = client_repo.find_by_user_id(req.user_id)
        for c in clients:
            export_data['clients'].append({
                'id': c.id, 'name': c.name, 'email': c.email,
                'phone': c.phone, 'created_at': c.created_at.isoformat() if c.created_at else None,
            })

        apt_repo = _AptRepo()
        appts = apt_repo.find_by_user_id(req.user_id)
        for a in appts:
            export_data['appointments'].append({
                'id': a.id, 'date': str(a.date), 'time': a.time,
                'status': a.status, 'client_id': a.client_id,
            })

        tx_repo = _TxRepo()
        txns = tx_repo.find_by_user_id(req.user_id)
        for t in txns:
            export_data['transactions'].append({
                'id': t.id, 'type': t.type, 'amount': float(t.amount),
                'date': str(t.date), 'description': t.description,
            })

        result_url = f'/api/lgpd/exports/{req.id}'
        req.complete(result_url=result_url)
        self.req_repo.save(req)

        # Audit
        from models import AuditLog
        log = AuditLog.create(
            admin_id=admin_id, action=AuditActionType.DATA_EXPORTED.value,
            target_user_id=req.user_id,
            details=f'Export completed for request #{req.id}',
        )
        self.audit_repo.add(log)

        return {
            'success': True,
            'dataRequest': req.to_dict(),
            'exportData': export_data,
        }

    def process_deletion(self, admin_id, req_id):
        """Process a data deletion request — anonymizes and removes user data.

        Per LGPD requirements:
        - Delete personal data: Client, Appointment, Transaction, Payment, Wallet,
          LoyaltyAccount, Post, Message, Chat, Notification
        - Anonymize User (name, email, status)
        - Revoke: ApiKey, Webhook
        - Keep: AuditLog (anonymized), DataRequest (as record of the request)
        """
        req = self.req_repo.get_by_id(req_id)
        if not req:
            return {'success': False, 'errors': ['Solicitação não encontrada']}
        if req.request_type != 'deletion':
            return {'success': False, 'errors': ['Solicitação não é de exclusão']}

        req.start_processing()
        self.req_repo.save(req)

        from models import (
            User, Client, Appointment, Transaction, Payment, Wallet,
            LedgerEntry, Package, GiftCard, LoyaltyAccount, LoyaltyTransaction,
            ClientProfile, SatisfactionSurvey, CostCenter, CashFlowEntry,
            AccountPayable, AccountReceivable, FinancialPeriod,
            Supplier, Product, StockMovement, Campaign, Coupon,
            DashboardReport, Branch, Employee, EmployeeHistory,
            CommissionRule, CommissionPayment, StockTransfer,
            Post, Comment, Story, Follow, Report, ModerationLog,
            Chat, Message, Notification, NotificationPreference,
            ApiKey, Webhook, AuditLog,
        )
        from database import get_db

        firestore = get_db()
        uid = req.user_id

        user_repo = UserRepository()
        user = user_repo.get_by_id(uid)
        if not user:
            req.reject(reason='Usuário não encontrado')
            self.req_repo.save(req)
            return {'success': False, 'errors': ['Usuário não encontrado']}

        # Helper to delete all docs in a collection where user_id matches
        def _delete_by_user_id(collection_name):
            col = firestore.collection(collection_name)
            docs = col.where('user_id', '==', uid).stream()
            for doc in docs:
                doc.reference.delete()

        def _delete_by_field(collection_name, field, value):
            col = firestore.collection(collection_name)
            docs = col.where(field, '==', value).stream()
            for doc in docs:
                doc.reference.delete()

        # 1. Delete personal data
        _delete_by_user_id('clients')
        _delete_by_user_id('appointments')
        _delete_by_user_id('transactions')
        _delete_by_user_id('payments')
        _delete_by_user_id('packages')
        _delete_by_user_id('client_profiles')
        _delete_by_user_id('satisfaction_surveys')
        _delete_by_user_id('notifications')
        _delete_by_user_id('notification_preferences')

        # Delete LedgerEntry via wallet_id
        wallet_docs = list(firestore.collection('wallets').where('user_id', '==', uid).stream())
        for w_doc in wallet_docs:
            _delete_by_field('ledger_entries', 'wallet_id', int(w_doc.id))
            w_doc.reference.delete()

        # Delete LoyaltyTransaction via account_id
        loyalty_docs = list(firestore.collection('loyalty_accounts').where('user_id', '==', uid).stream())
        for la_doc in loyalty_docs:
            _delete_by_field('loyalty_transactions', 'account_id', int(la_doc.id))
            la_doc.reference.delete()

        # 2. Delete social data (posts, messages, chats)
        _delete_by_user_id('posts')
        _delete_by_user_id('comments')
        _delete_by_user_id('stories')
        _delete_by_user_id('reports')
        _delete_by_user_id('moderation_logs')
        _delete_by_user_id('messages')
        # Follow: delete where follower_id or following_id matches
        for doc in firestore.collection('follows').where('follower_id', '==', uid).stream():
            doc.reference.delete()
        for doc in firestore.collection('follows').where('following_id', '==', uid).stream():
            doc.reference.delete()
        # Chat: delete where participant_a_id or participant_b_id matches
        for doc in firestore.collection('chats').where('participant_a_id', '==', uid).stream():
            doc.reference.delete()
        for doc in firestore.collection('chats').where('participant_b_id', '==', uid).stream():
            doc.reference.delete()

        # 3. Delete ERP/financial data
        _delete_by_user_id('cost_centers')
        _delete_by_user_id('cash_flow_entries')
        _delete_by_user_id('accounts_payable')
        _delete_by_user_id('accounts_receivable')
        _delete_by_user_id('financial_periods')

        # 4. Delete inventory data
        _delete_by_user_id('suppliers')
        _delete_by_user_id('stock_movements')
        _delete_by_user_id('products')

        # 5. Delete marketing data
        _delete_by_user_id('campaigns')
        _delete_by_user_id('coupons')

        # 6. Delete analytics
        _delete_by_user_id('dashboard_reports')

        # 7. Delete multi-unit / employee data
        _delete_by_user_id('branches')
        _delete_by_user_id('employees')
        _delete_by_user_id('employee_histories')
        _delete_by_user_id('commission_rules')
        _delete_by_user_id('commission_payments')
        _delete_by_user_id('stock_transfers')

        # 8. Delete gift cards (user as provider)
        _delete_by_user_id('gift_cards')

        # 9. Revoke API keys and disable webhooks
        for doc in firestore.collection('api_keys').where('user_id', '==', uid).stream():
            data = doc.to_dict()
            data['revoked'] = True
            doc.reference.set(data)

        for doc in firestore.collection('webhooks').where('user_id', '==', uid).stream():
            data = doc.to_dict()
            data['enabled'] = False
            doc.reference.set(data)

        # 10. Anonymize user data (keep for referential integrity of audit logs)
        user.name = 'Deleted User'
        user.email = f'deleted_{uid}@deleted.local'
        user.status = 'deleted'
        user_repo.save(user)

        req.complete()
        self.req_repo.save(req)

        # Audit — keep AuditLog with anonymized reference
        log = AuditLog.create(
            admin_id=admin_id, action=AuditActionType.DATA_DELETED.value,
            target_user_id=uid,
            details=f'Data deletion completed for request #{req.id}',
        )
        self.audit_repo.add(log)

        return {'success': True, 'dataRequest': req.to_dict()}

    def reject_request(self, admin_id, req_id, reason=''):
        req = self.req_repo.get_by_id(req_id)
        if not req:
            return {'success': False, 'errors': ['Solicitação não encontrada']}
        try:
            req.reject(reason=reason)
        except LgpdError as e:
            return {'success': False, 'errors': [str(e)]}
        req.processed_by = admin_id
        self.req_repo.save(req)
        return {'success': True, 'dataRequest': req.to_dict()}
