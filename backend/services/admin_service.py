"""Admin service — dashboard, user management, moderation, audit, feature flags."""
import json
from logger import get_logger
from domain.enums import AdminRole, AuditActionType
from domain.exceptions import DomainError, AdminError
from repositories.phase8_repository import (
    AuditLogRepository, FeatureFlagRepository,
)


class AdminService:
    def __init__(self, audit_repo=None, flag_repo=None):
        self.audit_repo = audit_repo or AuditLogRepository()
        self.flag_repo = flag_repo or FeatureFlagRepository()
        self.logger = get_logger(self.__class__.__name__)

    def _audit(self, admin_id, action, target_user_id=None, target_type=None,
               target_id=None, details='', ip_address=None, user_agent=None):
        from models import AuditLog
        log = AuditLog.create(
            admin_id=admin_id, action=action,
            target_user_id=target_user_id, target_type=target_type,
            target_id=target_id, details=details,
            ip_address=ip_address, user_agent=user_agent,
        )
        self.audit_repo.add(log)
        return log

    def check_permission(self, admin_role, permission):
        role = AdminRole.from_value(admin_role)
        if not role.can(permission):
            raise AdminError(f'Permissão negada: {permission}')

    def block_user(self, admin_id, admin_role, user_id, reason=''):
        self.check_permission(admin_role, 'accounts.block')
        from repositories.user_repository import UserRepository
        user_repo = UserRepository()
        user = user_repo.get_by_id(user_id)
        if not user:
            return {'success': False, 'errors': ['Usuário não encontrado']}
        user.status = 'blocked'
        user_repo.save(user)
        self._audit(admin_id, AuditActionType.USER_BLOCKED.value,
                     target_user_id=user_id, details=reason)
        return {'success': True, 'message': 'Usuário bloqueado'}

    def unblock_user(self, admin_id, admin_role, user_id):
        self.check_permission(admin_role, 'accounts.unblock')
        from repositories.user_repository import UserRepository
        user_repo = UserRepository()
        user = user_repo.get_by_id(user_id)
        if not user:
            return {'success': False, 'errors': ['Usuário não encontrado']}
        user.status = 'active'
        user_repo.save(user)
        self._audit(admin_id, AuditActionType.USER_UNBLOCKED.value,
                     target_user_id=user_id)
        return {'success': True, 'message': 'Usuário desbloqueado'}

    def approve_provider(self, admin_id, admin_role, user_id):
        self.check_permission(admin_role, 'profiles.moderate')
        from repositories.user_repository import UserRepository
        user_repo = UserRepository()
        user = user_repo.get_by_id(user_id)
        if not user:
            return {'success': False, 'errors': ['Usuário não encontrado']}
        user.is_approved = True
        user_repo.save(user)
        self._audit(admin_id, AuditActionType.PROVIDER_APPROVED.value,
                     target_user_id=user_id)
        return {'success': True, 'message': 'Prestador aprovado'}

    def reject_provider(self, admin_id, admin_role, user_id, reason=''):
        self.check_permission(admin_role, 'profiles.moderate')
        self._audit(admin_id, AuditActionType.PROVIDER_REJECTED.value,
                     target_user_id=user_id, details=reason)
        return {'success': True, 'message': 'Prestador rejeitado'}

    def moderate_post(self, admin_id, admin_role, post_id, action, reason=''):
        self.check_permission(admin_role, 'posts.moderate')
        self._audit(admin_id, AuditActionType.POST_MODERATED.value,
                     target_type='post', target_id=post_id,
                     details=f'{action}: {reason}')
        return {'success': True, 'message': f'Publicação {action}'}

    def get_audit_logs(self, admin_role, limit=100, action=None):
        self.check_permission(admin_role, 'audit.view')
        if action:
            logs = self.audit_repo.find_by_action(action, limit)
        else:
            logs = self.audit_repo.find_all(limit)
        return [log.to_dict() for log in logs]

    def get_dashboard(self, admin_role):
        self.check_permission(admin_role, 'reports.view')
        from repositories.user_repository import UserRepository
        from repositories.appointment_repository import AppointmentRepository
        from repositories.transaction_repository import TransactionRepository
        user_repo = UserRepository()
        appointment_repo = AppointmentRepository()
        transaction_repo = TransactionRepository()
        total_users = len(user_repo.get_all())
        total_appointments = len(appointment_repo.get_all())
        total_transactions = len(transaction_repo.get_all())
        return {
            'totalUsers': total_users,
            'totalAppointments': total_appointments,
            'totalTransactions': total_transactions,
        }

    # Feature flags
    def create_feature_flag(self, admin_id, admin_role, key, enabled=False,
                            description=None, rollout_percentage=100):
        self.check_permission(admin_role, 'feature_flags.manage')
        from models import FeatureFlag
        existing = self.flag_repo.find_by_key(key)
        if existing:
            return {'success': False, 'errors': ['Feature flag já existe']}
        flag = FeatureFlag.create(
            key=key, enabled=enabled, description=description,
            rollout_percentage=rollout_percentage,
        )
        self.flag_repo.add(flag)
        self._audit(admin_id, AuditActionType.FEATURE_FLAG_TOGGLED.value,
                     target_type='feature_flag', target_id=flag.id,
                     details=f'Created: {key}={enabled}')
        return {'success': True, 'flag': flag.to_dict()}

    def toggle_feature_flag(self, admin_id, admin_role, flag_id):
        self.check_permission(admin_role, 'feature_flags.manage')
        flag = self.flag_repo.get_by_id(flag_id)
        if not flag:
            return {'success': False, 'errors': ['Feature flag não encontrada']}
        flag.toggle()
        self.flag_repo.save(flag)
        self._audit(admin_id, AuditActionType.FEATURE_FLAG_TOGGLED.value,
                     target_type='feature_flag', target_id=flag_id,
                     details=f'{flag.key}={flag.enabled}')
        return {'success': True, 'flag': flag.to_dict()}

    def get_feature_flags(self, admin_role):
        self.check_permission(admin_role, 'reports.view')
        flags = self.flag_repo.find_all()
        return [f.to_dict() for f in flags]
