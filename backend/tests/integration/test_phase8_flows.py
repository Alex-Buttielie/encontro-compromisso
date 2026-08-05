"""Integration + E2E tests for Phase 8 — Admin, Public API, LGPD, Webhooks.

E2E flows:
1. Administrador bloqueia conta de usuário.
2. Administrador aprova cadastro de prestador.
3. Administrador modera publicação denunciada.
4. Terceiro consome API pública com chave válida.
5. Usuário solicita exportação de dados.
6. Sistema gera arquivo e registra em auditoria.
7. Usuário solicita exclusão de conta.
8. Sistema exclui dados e registra em auditoria.
"""
import json

from domain.enums import (
    AdminRole, AuditActionType, ApiKeyStatus, WebhookStatus,
    DataRequestType, DataRequestStatus,
)


def _register_and_get_token(client, email='user@example.com', role='provider', profession='Dentista'):
    resp = client.post('/api/auth/register',
                       data=json.dumps({
                           'name': 'Test User',
                           'email': email,
                           'password': 'secret123',
                           'role': role,
                           'profession': profession,
                           'termsAccepted': True,
                           'privacyAccepted': True,
                       }),
                       content_type='application/json')
    if resp.status_code == 201:
        return resp.get_json()['user']['id']
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': 'secret123'}),
                       content_type='application/json')
    return resp.get_json()['user']['id']


class TestAdminE2E:
    """E2E: Admin blocks user, approves provider, moderates post, views audit."""

    def test_admin_dashboard(self, client, app):
        uid = _register_and_get_token(client, email='admin1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.get('/api/admin/dashboard?role=admin', headers=headers)
        assert resp.status_code == 200
        assert 'dashboard' in resp.get_json()

    def test_admin_block_user(self, client, app):
        admin_id = _register_and_get_token(client, email='admin2@test.com')
        user_id = _register_and_get_token(client, email='blocked@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        resp = client.post(f'/api/admin/users/{user_id}/block',
                           data=json.dumps({'role': 'admin', 'reason': 'Spam'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True

    def test_admin_unblock_user(self, client, app):
        admin_id = _register_and_get_token(client, email='admin3@test.com')
        user_id = _register_and_get_token(client, email='unblock@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        client.post(f'/api/admin/users/{user_id}/block',
                    data=json.dumps({'role': 'admin'}),
                    content_type='application/json', headers=headers)
        resp = client.post(f'/api/admin/users/{user_id}/unblock',
                           data=json.dumps({'role': 'admin'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

    def test_admin_approve_provider(self, client, app):
        admin_id = _register_and_get_token(client, email='admin4@test.com')
        provider_id = _register_and_get_token(client, email='provider1@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        resp = client.post(f'/api/admin/users/{provider_id}/approve',
                           data=json.dumps({'role': 'admin'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

    def test_admin_reject_provider(self, client, app):
        admin_id = _register_and_get_token(client, email='admin5@test.com')
        provider_id = _register_and_get_token(client, email='provider2@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        resp = client.post(f'/api/admin/users/{provider_id}/reject',
                           data=json.dumps({'role': 'admin', 'reason': 'Incomplete'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

    def test_admin_moderate_post(self, client, app):
        admin_id = _register_and_get_token(client, email='admin6@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        resp = client.post('/api/admin/moderate/post/1',
                           data=json.dumps({'role': 'moderator', 'action': 'removed', 'reason': 'Spam'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

    def test_admin_audit_logs(self, client, app):
        admin_id = _register_and_get_token(client, email='admin7@test.com')
        user_id = _register_and_get_token(client, email='audited@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        client.post(f'/api/admin/users/{user_id}/block',
                    data=json.dumps({'role': 'admin'}),
                    content_type='application/json', headers=headers)
        resp = client.get('/api/admin/audit?role=admin', headers=headers)
        assert resp.status_code == 200
        logs = resp.get_json()['auditLogs']
        assert len(logs) >= 1
        assert logs[0]['action'] == AuditActionType.USER_BLOCKED.value

    def test_admin_permission_denied(self, client, app):
        admin_id = _register_and_get_token(client, email='admin8@test.com')
        user_id = _register_and_get_token(client, email='target8@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        # read_only cannot block users
        resp = client.post(f'/api/admin/users/{user_id}/block',
                           data=json.dumps({'role': 'read_only'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_feature_flags(self, client, app):
        admin_id = _register_and_get_token(client, email='admin9@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}
        resp = client.post('/api/admin/feature-flags',
                           data=json.dumps({
                               'role': 'admin',
                               'key': 'new_dashboard',
                               'enabled': True,
                               'description': 'New dashboard v2',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        flag_id = resp.get_json()['flag']['id']
        assert resp.get_json()['flag']['enabled'] is True

        resp = client.post(f'/api/admin/feature-flags/{flag_id}/toggle',
                           data=json.dumps({'role': 'admin'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['flag']['enabled'] is False

        resp = client.get('/api/admin/feature-flags?role=admin', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['flags']) >= 1


class TestPublicApiE2E:
    """E2E: API keys, public API consumption, rate limiting, webhooks."""

    def test_create_api_key(self, client, app):
        uid = _register_and_get_token(client, email='apikey1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/api-keys',
                           data=json.dumps({
                               'name': 'My App',
                               'scopes': ['read:users'],
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        key_data = resp.get_json()['apiKey']
        assert key_data['status'] == ApiKeyStatus.ACTIVE.value
        assert 'key' in key_data
        assert key_data['key'].startswith('pos_')

    def test_revoke_api_key(self, client, app):
        uid = _register_and_get_token(client, email='apikey2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/api-keys',
                           data=json.dumps({'name': 'App', 'scopes': ['read:users']}),
                           content_type='application/json', headers=headers)
        key_id = resp.get_json()['apiKey']['id']
        resp = client.post(f'/api/api-keys/{key_id}/revoke',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['apiKey']['status'] == ApiKeyStatus.REVOKED.value

    def test_public_api_with_valid_key(self, client, app):
        uid = _register_and_get_token(client, email='apikey3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/api-keys',
                           data=json.dumps({'name': 'App', 'scopes': ['read:users']}),
                           content_type='application/json', headers=headers)
        api_key = resp.get_json()['apiKey']['key']
        resp = client.get('/api/v1/users',
                          headers={'X-API-Key': api_key})
        assert resp.status_code == 200
        assert resp.get_json()['success'] is True
        assert 'data' in resp.get_json()

    def test_public_api_without_key(self, client, app):
        resp = client.get('/api/v1/users')
        assert resp.status_code == 401

    def test_public_api_invalid_scope(self, client, app):
        uid = _register_and_get_token(client, email='apikey4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/api-keys',
                           data=json.dumps({'name': 'App', 'scopes': ['read:appointments']}),
                           content_type='application/json', headers=headers)
        api_key = resp.get_json()['apiKey']['key']
        resp = client.get('/api/v1/users',
                          headers={'X-API-Key': api_key})
        assert resp.status_code == 403

    def test_public_api_health(self, client, app):
        resp = client.get('/api/v1/health')
        assert resp.status_code == 200
        assert resp.get_json()['status'] == 'ok'

    def test_openapi_spec(self, client, app):
        resp = client.get('/api/docs/openapi.json')
        assert resp.status_code == 200
        spec = resp.get_json()
        assert spec['openapi'] == '3.0.0'
        assert 'paths' in spec

    def test_create_webhook(self, client, app):
        uid = _register_and_get_token(client, email='wh1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/webhooks',
                           data=json.dumps({
                               'url': 'https://example.com/webhook',
                               'events': ['appointment.created', 'payment.received'],
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['webhook']['status'] == WebhookStatus.ACTIVE.value

    def test_webhook_invalid_url(self, client, app):
        uid = _register_and_get_token(client, email='wh2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/webhooks',
                           data=json.dumps({'url': 'not-a-url', 'events': ['test']}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_disable_webhook(self, client, app):
        uid = _register_and_get_token(client, email='wh3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/webhooks',
                           data=json.dumps({'url': 'https://example.com/wh', 'events': ['test']}),
                           content_type='application/json', headers=headers)
        wh_id = resp.get_json()['webhook']['id']
        resp = client.post(f'/api/webhooks/{wh_id}/disable',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['webhook']['status'] == WebhookStatus.DISABLED.value


class TestLgpdE2E:
    """E2E: Data export, data deletion, audit trail."""

    def test_create_export_request(self, client, app):
        uid = _register_and_get_token(client, email='lgpd1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/lgpd/requests',
                           data=json.dumps({'requestType': DataRequestType.EXPORT.value}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['dataRequest']['status'] == DataRequestStatus.PENDING.value
        assert resp.get_json()['dataRequest']['requestType'] == DataRequestType.EXPORT.value

    def test_process_export_request(self, client, app):
        uid = _register_and_get_token(client, email='lgpd2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/lgpd/requests',
                           data=json.dumps({'requestType': DataRequestType.EXPORT.value}),
                           content_type='application/json', headers=headers)
        req_id = resp.get_json()['dataRequest']['id']
        resp = client.post(f'/api/lgpd/requests/{req_id}/process',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['dataRequest']['status'] == DataRequestStatus.COMPLETED.value
        assert 'exportData' in resp.get_json()
        assert 'user' in resp.get_json()['exportData']

    def test_create_deletion_request(self, client, app):
        uid = _register_and_get_token(client, email='lgpd3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/lgpd/requests',
                           data=json.dumps({'requestType': DataRequestType.DELETION.value}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['dataRequest']['requestType'] == DataRequestType.DELETION.value

    def test_process_deletion_request(self, client, app):
        uid = _register_and_get_token(client, email='lgpd4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/lgpd/requests',
                           data=json.dumps({'requestType': DataRequestType.DELETION.value}),
                           content_type='application/json', headers=headers)
        req_id = resp.get_json()['dataRequest']['id']
        resp = client.post(f'/api/lgpd/requests/{req_id}/process',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['dataRequest']['status'] == DataRequestStatus.COMPLETED.value

    def test_reject_lgpd_request(self, client, app):
        uid = _register_and_get_token(client, email='lgpd5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        resp = client.post('/api/lgpd/requests',
                           data=json.dumps({'requestType': DataRequestType.EXPORT.value}),
                           content_type='application/json', headers=headers)
        req_id = resp.get_json()['dataRequest']['id']
        resp = client.post(f'/api/lgpd/requests/{req_id}/reject',
                           data=json.dumps({'reason': 'Invalid request'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['dataRequest']['status'] == DataRequestStatus.REJECTED.value

    def test_list_lgpd_requests(self, client, app):
        uid = _register_and_get_token(client, email='lgpd6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}
        client.post('/api/lgpd/requests',
                    data=json.dumps({'requestType': DataRequestType.EXPORT.value}),
                    content_type='application/json', headers=headers)
        resp = client.get('/api/lgpd/requests', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['dataRequests']) >= 1


class TestFullE2EFlow:
    """Full E2E: Admin blocks → approves → moderates → API consumption → LGPD export → deletion."""

    def test_complete_admin_flow(self, client, app):
        admin_id = _register_and_get_token(client, email='full8@test.com')
        target_id = _register_and_get_token(client, email='target8@test.com')
        headers = {'Authorization': f'Bearer {admin_id}'}

        # 1. Admin blocks user
        resp = client.post(f'/api/admin/users/{target_id}/block',
                           data=json.dumps({'role': 'admin', 'reason': 'Violation'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

        # 2. Admin unblocks user
        resp = client.post(f'/api/admin/users/{target_id}/unblock',
                           data=json.dumps({'role': 'admin'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

        # 3. Admin approves provider
        resp = client.post(f'/api/admin/users/{target_id}/approve',
                           data=json.dumps({'role': 'admin'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

        # 4. Audit logs show all actions
        resp = client.get('/api/admin/audit?role=admin', headers=headers)
        assert resp.status_code == 200
        logs = resp.get_json()['auditLogs']
        actions = [log['action'] for log in logs]
        assert AuditActionType.USER_BLOCKED.value in actions
        assert AuditActionType.USER_UNBLOCKED.value in actions
        assert AuditActionType.PROVIDER_APPROVED.value in actions

    def test_complete_api_and_lgpd_flow(self, client, app):
        uid = _register_and_get_token(client, email='full_lgpd@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # 5. Create API key
        resp = client.post('/api/api-keys',
                           data=json.dumps({'name': 'My App', 'scopes': ['read:users']}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        api_key = resp.get_json()['apiKey']['key']

        # 6. Consume public API with key
        resp = client.get('/api/v1/users', headers={'X-API-Key': api_key})
        assert resp.status_code == 200

        # 7. Request data export
        resp = client.post('/api/lgpd/requests',
                           data=json.dumps({'requestType': DataRequestType.EXPORT.value}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        export_req_id = resp.get_json()['dataRequest']['id']

        # 8. Process export — system generates data and records audit
        resp = client.post(f'/api/lgpd/requests/{export_req_id}/process',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['dataRequest']['status'] == DataRequestStatus.COMPLETED.value
        assert 'exportData' in resp.get_json()

        # 9. Request data deletion
        resp = client.post('/api/lgpd/requests',
                           data=json.dumps({'requestType': DataRequestType.DELETION.value}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        deletion_req_id = resp.get_json()['dataRequest']['id']

        # 10. Process deletion — system deletes data and records audit
        resp = client.post(f'/api/lgpd/requests/{deletion_req_id}/process',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['dataRequest']['status'] == DataRequestStatus.COMPLETED.value

        # 11. Verify audit trail has both actions
        resp = client.get('/api/admin/audit?role=admin', headers=headers)
        assert resp.status_code == 200
        logs = resp.get_json()['auditLogs']
        actions = [log['action'] for log in logs]
        assert AuditActionType.DATA_EXPORTED.value in actions
        assert AuditActionType.DATA_DELETED.value in actions
