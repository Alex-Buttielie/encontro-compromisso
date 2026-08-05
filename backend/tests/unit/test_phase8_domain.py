"""TDD unit tests for Phase 8 — Admin, AuditLog, ApiKey, Webhook, DataRequest, FeatureFlag."""
import pytest

from domain.enums import (
    AdminRole, AuditActionType, ApiKeyStatus, WebhookStatus,
    DataRequestType, DataRequestStatus, DATA_REQUEST_TRANSITIONS,
)
from domain.exceptions import (
    AdminError, ApiError, LgpdError, ValidationError,
)


# --- AdminRole permissions ---

class TestAdminRole:
    def test_super_admin_has_all_permissions(self):
        role = AdminRole.SUPER_ADMIN
        assert role.can('users.manage')
        assert role.can('anything.else')

    def test_admin_cannot_manage_feature_flags(self):
        role = AdminRole.ADMIN
        assert role.can('users.manage')
        assert not role.can('nonexistent.permission')

    def test_moderator_can_moderate(self):
        role = AdminRole.MODERATOR
        assert role.can('posts.moderate')
        assert role.can('comments.moderate')
        assert not role.can('users.manage')

    def test_support_can_block(self):
        role = AdminRole.SUPPORT
        assert role.can('accounts.block')
        assert not role.can('plans.manage')

    def test_read_only_cannot_manage(self):
        role = AdminRole.READ_ONLY
        assert role.can('users.view')
        assert not role.can('users.manage')


# --- AuditLog ---

class TestAuditLog:
    def test_create_audit_log(self):
        from models import AuditLog
        log = AuditLog.create(
            admin_id=1, action=AuditActionType.USER_BLOCKED.value,
            target_user_id=2, details='Blocked for spam',
        )
        assert log.admin_id == 1
        assert log.action == AuditActionType.USER_BLOCKED.value
        assert log.target_user_id == 2
        assert log.details == 'Blocked for spam'

    def test_audit_log_missing_action(self):
        from models import AuditLog
        with pytest.raises(ValidationError):
            AuditLog.create(admin_id=1, action='', target_user_id=2)

    def test_audit_log_to_dict(self):
        from models import AuditLog
        log = AuditLog.create(
            admin_id=1, action=AuditActionType.PROVIDER_APPROVED.value,
            target_user_id=2, details='Approved',
        )
        d = log.to_dict()
        assert d['action'] == AuditActionType.PROVIDER_APPROVED.value
        assert d['adminId'] == 1
        assert d['targetUserId'] == 2


# --- ApiKey ---

class TestApiKey:
    def test_create_api_key(self):
        from models import ApiKey
        key = ApiKey.create(
            user_id=1, name='My App',
            scopes=['read:users', 'read:appointments'],
        )
        assert key.status == ApiKeyStatus.ACTIVE.value
        assert key.key is not None
        assert len(key.key) > 0
        assert 'read:users' in key.scopes

    def test_api_key_missing_name(self):
        from models import ApiKey
        with pytest.raises(ValidationError):
            ApiKey.create(user_id=1, name='', scopes=['read:users'])

    def test_api_key_revoke(self):
        from models import ApiKey
        key = ApiKey.create(user_id=1, name='App', scopes=['read:users'])
        key.revoke()
        assert key.status == ApiKeyStatus.REVOKED.value
        assert key.revoked_at is not None

    def test_api_key_has_scope(self):
        from models import ApiKey
        key = ApiKey.create(user_id=1, name='App', scopes=['read:users', 'write:appointments'])
        assert key.has_scope('read:users') is True
        assert key.has_scope('read:appointments') is False

    def test_api_key_has_wildcard_scope(self):
        from models import ApiKey
        key = ApiKey.create(user_id=1, name='App', scopes=['*'])
        assert key.has_scope('read:users') is True
        assert key.has_scope('anything') is True

    def test_api_key_is_valid(self):
        from models import ApiKey
        key = ApiKey.create(user_id=1, name='App', scopes=['read:users'])
        assert key.is_valid() is True
        key.revoke()
        assert key.is_valid() is False


# --- Webhook ---

class TestWebhook:
    def test_create_webhook(self):
        from models import Webhook
        wh = Webhook.create(
            user_id=1, url='https://example.com/webhook',
            events=['appointment.created', 'payment.received'],
        )
        assert wh.status == WebhookStatus.ACTIVE.value
        assert wh.url == 'https://example.com/webhook'
        assert 'appointment.created' in wh.events

    def test_webhook_missing_url(self):
        from models import Webhook
        with pytest.raises(ValidationError):
            Webhook.create(user_id=1, url='', events=['test'])

    def test_webhook_invalid_url(self):
        from models import Webhook
        with pytest.raises(ValidationError):
            Webhook.create(user_id=1, url='not-a-url', events=['test'])

    def test_webhook_disable(self):
        from models import Webhook
        wh = Webhook.create(user_id=1, url='https://example.com/wh', events=['test'])
        wh.disable()
        assert wh.status == WebhookStatus.DISABLED.value

    def test_webhook_mark_failing(self):
        from models import Webhook
        wh = Webhook.create(user_id=1, url='https://example.com/wh', events=['test'])
        wh.mark_failing()
        assert wh.status == WebhookStatus.FAILING.value

    def test_webhook_matches_event(self):
        from models import Webhook
        wh = Webhook.create(user_id=1, url='https://example.com/wh',
                            events=['appointment.created', 'payment.received'])
        assert wh.matches_event('appointment.created') is True
        assert wh.matches_event('user.deleted') is False

    def test_webhook_record_delivery(self):
        from models import Webhook
        wh = Webhook.create(user_id=1, url='https://example.com/wh', events=['test'])
        wh.record_delivery(status_code=200, success=True)
        assert wh.delivery_count == 1
        assert wh.success_count == 1

    def test_webhook_record_failed_delivery(self):
        from models import Webhook
        wh = Webhook.create(user_id=1, url='https://example.com/wh', events=['test'])
        wh.record_delivery(status_code=500, success=False)
        assert wh.delivery_count == 1
        assert wh.failure_count == 1


# --- DataRequest (LGPD) ---

class TestDataRequest:
    def test_create_data_request(self):
        from models import DataRequest
        req = DataRequest.create(
            user_id=1, request_type=DataRequestType.EXPORT.value,
        )
        assert req.status == DataRequestStatus.PENDING.value
        assert req.request_type == DataRequestType.EXPORT.value

    def test_data_request_missing_type(self):
        from models import DataRequest
        with pytest.raises(ValidationError):
            DataRequest.create(user_id=1, request_type='')

    def test_data_request_start_processing(self):
        from models import DataRequest
        req = DataRequest.create(user_id=1, request_type=DataRequestType.EXPORT.value)
        req.start_processing()
        assert req.status == DataRequestStatus.PROCESSING.value

    def test_data_request_complete(self):
        from models import DataRequest
        req = DataRequest.create(user_id=1, request_type=DataRequestType.EXPORT.value)
        req.start_processing()
        req.complete(result_url='https://example.com/export/123')
        assert req.status == DataRequestStatus.COMPLETED.value
        assert req.result_url == 'https://example.com/export/123'
        assert req.completed_at is not None

    def test_data_request_reject(self):
        from models import DataRequest
        req = DataRequest.create(user_id=1, request_type=DataRequestType.DELETION.value)
        req.reject(reason='Cannot delete: active subscriptions')
        assert req.status == DataRequestStatus.REJECTED.value
        assert 'active subscriptions' in req.rejection_reason

    def test_data_request_complete_without_processing(self):
        from models import DataRequest
        req = DataRequest.create(user_id=1, request_type=DataRequestType.EXPORT.value)
        with pytest.raises(LgpdError):
            req.complete(result_url='https://example.com/export/123')

    def test_data_request_to_dict(self):
        from models import DataRequest
        req = DataRequest.create(user_id=1, request_type=DataRequestType.DELETION.value)
        d = req.to_dict()
        assert d['requestType'] == DataRequestType.DELETION.value
        assert d['status'] == DataRequestStatus.PENDING.value


# --- FeatureFlag ---

class TestFeatureFlag:
    def test_create_feature_flag(self):
        from models import FeatureFlag
        flag = FeatureFlag.create(
            key='new_dashboard', enabled=True,
            description='New dashboard v2',
        )
        assert flag.key == 'new_dashboard'
        assert flag.enabled is True

    def test_feature_flag_missing_key(self):
        from models import FeatureFlag
        with pytest.raises(ValidationError):
            FeatureFlag.create(key='', enabled=True)

    def test_feature_flag_toggle(self):
        from models import FeatureFlag
        flag = FeatureFlag.create(key='test_flag', enabled=False)
        flag.toggle()
        assert flag.enabled is True
        flag.toggle()
        assert flag.enabled is False

    def test_feature_flag_is_enabled(self):
        from models import FeatureFlag
        flag = FeatureFlag.create(key='test_flag', enabled=True)
        assert flag.is_enabled() is True

    def test_feature_flag_with_rollout_percentage(self):
        from models import FeatureFlag
        flag = FeatureFlag.create(key='gradual', enabled=True, rollout_percentage=50)
        assert flag.rollout_percentage == 50
