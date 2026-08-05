"""Integration tests for authentication flows via Flask test client.

Covers: registration (with terms), login, email confirmation,
password reset, password change, and account deletion.
"""
import json

from repositories.user_repository import UserRepository


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def register_user(client, email='alice@example.com', password='secret123',
                  name='Alice', role='provider', profession='Dentista',
                  terms=True, privacy=True):
    """POST /api/auth/register and return the parsed response."""
    payload = {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
        'profession': profession,
        'termsAccepted': terms,
        'privacyAccepted': privacy,
    }
    resp = client.post('/api/auth/register',
                       data=json.dumps(payload),
                       content_type='application/json')
    return resp


def login_user(client, email='alice@example.com', password='secret123'):
    """POST /api/auth/login and return the parsed response."""
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': password}),
                       content_type='application/json')
    return resp


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------
class TestRegistration:
    def test_register_success(self, client):
        resp = register_user(client)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['success'] is True
        assert data['user']['email'] == 'alice@example.com'
        assert data['user']['emailConfirmed'] is False

    def test_register_missing_terms_rejected(self, client):
        resp = register_user(client, terms=False)
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False
        assert any('Termos de Uso' in e for e in data['errors'])

    def test_register_missing_privacy_rejected(self, client):
        resp = register_user(client, privacy=False)
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False
        assert any('Política de Privacidade' in e for e in data['errors'])

    def test_register_duplicate_email(self, client):
        register_user(client)
        resp = register_user(client)
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False
        assert any('já cadastrado' in e for e in data['errors'])

    def test_register_weak_password(self, client):
        resp = register_user(client, password='123')
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False
        assert any('Senha' in e for e in data['errors'])


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class TestLogin:
    def test_login_success(self, client):
        register_user(client)
        resp = login_user(client)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True
        assert data['user']['email'] == 'alice@example.com'

    def test_login_wrong_password(self, client):
        register_user(client)
        resp = login_user(client, password='wrongpass')
        assert resp.status_code == 401
        data = resp.get_json()
        assert data['success'] is False

    def test_login_unknown_email(self, client):
        resp = login_user(client, email='nobody@example.com')
        assert resp.status_code == 401
        data = resp.get_json()
        assert data['success'] is False

    def test_login_deleted_account_blocked(self, client, app, auth_header):
        register_user(client)
        # Soft-delete the user directly via the API
        resp = client.delete('/api/auth/account', headers=auth_header)
        assert resp.status_code == 200
        # Attempt to login
        resp = login_user(client)
        assert resp.status_code == 401
        data = resp.get_json()
        assert data['success'] is False


# ---------------------------------------------------------------------------
# Email confirmation
# ---------------------------------------------------------------------------
class TestEmailConfirmation:
    def test_confirm_email_success(self, client, app):
        register_user(client)
        # Grab the token from the DB
        with app.app_context():
            user = UserRepository().find_by_email('alice@example.com')
            token = getattr(user, 'email_confirmation_token', None)
        resp = client.post('/api/auth/confirm-email',
                           data=json.dumps({'token': token}),
                           content_type='application/json')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True
        assert data['user']['emailConfirmed'] is True

    def test_confirm_email_invalid_token(self, client):
        register_user(client)
        resp = client.post('/api/auth/confirm-email',
                           data=json.dumps({'token': 'invalid-token'}),
                           content_type='application/json')
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False

    def test_confirm_email_missing_token(self, client):
        resp = client.post('/api/auth/confirm-email',
                           data=json.dumps({}),
                           content_type='application/json')
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------
class TestPasswordReset:
    def test_password_reset_request_always_succeeds(self, client):
        register_user(client)
        resp = client.post('/api/auth/password-reset/request',
                           data=json.dumps({'email': 'alice@example.com'}),
                           content_type='application/json')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True

    def test_password_reset_request_unknown_email(self, client):
        resp = client.post('/api/auth/password-reset/request',
                           data=json.dumps({'email': 'nobody@example.com'}),
                           content_type='application/json')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True

    def test_password_reset_execute_success(self, client, app):
        register_user(client)
        # Request reset
        client.post('/api/auth/password-reset/request',
                    data=json.dumps({'email': 'alice@example.com'}),
                    content_type='application/json')
        # Grab the token
        with app.app_context():
            user = UserRepository().find_by_email('alice@example.com')
            token = getattr(user, 'password_reset_token', None)
        # Execute reset
        resp = client.post('/api/auth/password-reset/execute',
                           data=json.dumps({'token': token, 'password': 'newpass456'}),
                           content_type='application/json')
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True
        # Login with new password
        resp = login_user(client, password='newpass456')
        assert resp.status_code == 200

    def test_password_reset_execute_invalid_token(self, client):
        resp = client.post('/api/auth/password-reset/execute',
                           data=json.dumps({'token': 'bad-token', 'password': 'newpass456'}),
                           content_type='application/json')
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False

    def test_password_reset_execute_weak_password(self, client, app):
        register_user(client)
        client.post('/api/auth/password-reset/request',
                    data=json.dumps({'email': 'alice@example.com'}),
                    content_type='application/json')
        with app.app_context():
            user = UserRepository().find_by_email('alice@example.com')
            token = getattr(user, 'password_reset_token', None)
        resp = client.post('/api/auth/password-reset/execute',
                           data=json.dumps({'token': token, 'password': '123'}),
                           content_type='application/json')
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False


# ---------------------------------------------------------------------------
# Change password (authenticated)
# ---------------------------------------------------------------------------
class TestChangePassword:
    def test_change_password_success(self, client, auth_header):
        register_user(client)
        resp = client.post('/api/auth/change-password',
                           data=json.dumps({
                               'currentPassword': 'secret123',
                               'newPassword': 'newpass456',
                           }),
                           content_type='application/json',
                           headers=auth_header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True
        # Login with new password
        resp = login_user(client, password='newpass456')
        assert resp.status_code == 200

    def test_change_password_wrong_current(self, client, auth_header):
        register_user(client)
        resp = client.post('/api/auth/change-password',
                           data=json.dumps({
                               'currentPassword': 'wrongpass',
                               'newPassword': 'newpass456',
                           }),
                           content_type='application/json',
                           headers=auth_header)
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False

    def test_change_password_weak_new(self, client, auth_header):
        register_user(client)
        resp = client.post('/api/auth/change-password',
                           data=json.dumps({
                               'currentPassword': 'secret123',
                               'newPassword': '123',
                           }),
                           content_type='application/json',
                           headers=auth_header)
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False

    def test_change_password_unauthorized(self, client):
        resp = client.post('/api/auth/change-password',
                           data=json.dumps({
                               'currentPassword': 'secret123',
                               'newPassword': 'newpass456',
                           }),
                           content_type='application/json')
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Account deletion
# ---------------------------------------------------------------------------
class TestAccountDeletion:
    def test_delete_account_success(self, client, app, auth_header):
        register_user(client)
        resp = client.delete('/api/auth/account', headers=auth_header)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True
        # Verify soft-delete in DB
        with app.app_context():
            user = UserRepository().find_by_email('alice@example.com')
            assert getattr(user, 'is_deleted', False) is True

    def test_delete_account_unauthorized(self, client):
        resp = client.delete('/api/auth/account')
        assert resp.status_code == 401

    def test_delete_account_already_deleted(self, client, auth_header):
        register_user(client)
        # First deletion
        resp = client.delete('/api/auth/account', headers=auth_header)
        assert resp.status_code == 200
        # Second deletion
        resp = client.delete('/api/auth/account', headers=auth_header)
        assert resp.status_code == 400
        data = resp.get_json()
        assert data['success'] is False
