"""Integration tests for JWT authentication flows (BUG-02)."""
import json
import jwt
from config import Config


def register_user(client, email='jwtuser@example.com', password='secret123'):
    resp = client.post('/api/auth/register',
                       data=json.dumps({
                           'name': 'JWT User', 'email': email, 'password': password,
                           'role': 'provider', 'profession': 'Dentista',
                           'termsAccepted': True, 'privacyAccepted': True,
                       }),
                       content_type='application/json')
    return resp


def login_user(client, email='jwtuser@example.com', password='secret123'):
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': password}),
                       content_type='application/json')
    return resp


class TestJWTAuth:
    def test_login_returns_jwt_token(self, client):
        """Login response should include a valid JWT token."""
        register_user(client)
        resp = login_user(client)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True
        assert 'token' in data
        # Token should be a valid JWT (3 parts separated by dots)
        assert data['token'].count('.') == 2

    def test_register_returns_jwt_token(self, client):
        """Register response should include a valid JWT token."""
        resp = register_user(client)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['success'] is True
        assert 'token' in data
        assert data['token'].count('.') == 2

    def test_jwt_token_decodes_to_correct_user(self, client):
        """JWT token should decode to the correct user_id."""
        register_user(client)
        resp = login_user(client)
        data = resp.get_json()
        payload = jwt.decode(data['token'], Config.SECRET_KEY, algorithms=['HS256'])
        assert payload['user_id'] == data['user']['id']
        assert payload['role'] == 'provider'

    def test_jwt_token_works_for_auth(self, client):
        """JWT token should work as Authorization header for /api/auth/profile."""
        register_user(client)
        resp = login_user(client)
        token = resp.get_json()['token']
        # Use JWT token for profile request
        resp = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True
        assert data['user']['email'] == 'jwtuser@example.com'

    def test_invalid_jwt_token_rejected(self, client):
        """An invalid JWT token should be rejected."""
        register_user(client)
        resp = client.get('/api/auth/profile',
                          headers={'Authorization': 'Bearer invalid.jwt.token'})
        assert resp.status_code == 401

    def test_no_auth_header_rejected(self, client):
        """Missing Authorization header should return 401."""
        register_user(client)
        resp = client.get('/api/auth/profile')
        assert resp.status_code == 401

    def test_legacy_numeric_token_still_works(self, client):
        """Legacy numeric user ID should still work for backward compatibility."""
        register_user(client)
        # Use numeric user ID (legacy)
        resp = client.get('/api/auth/profile', headers={'Authorization': 'Bearer 1'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['success'] is True

    def test_tampered_jwt_rejected(self, client):
        """A tampered JWT token should be rejected."""
        register_user(client)
        resp = login_user(client)
        token = resp.get_json()['token']
        # Tamper with token
        tampered = token[:-5] + 'XXXXX'
        resp = client.get('/api/auth/profile',
                          headers={'Authorization': f'Bearer {tampered}'})
        assert resp.status_code == 401
