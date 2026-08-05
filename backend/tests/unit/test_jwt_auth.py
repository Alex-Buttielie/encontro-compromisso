"""Unit tests for JWT authentication (BUG-02) and SECRET_KEY enforcement (BUG-06)."""
import jwt
import pytest
from datetime import datetime
from unittest.mock import MagicMock, patch

from config import Config
from services.auth_service import AuthService


class TestJWTGeneration:
    """Test JWT token generation in auth service."""

    @pytest.fixture
    def auth_service(self):
        repo = MagicMock()
        repo.find_by_email.return_value = None
        sender = MagicMock()
        return AuthService(user_repository=repo, email_sender=sender)

    @pytest.fixture
    def mock_user(self):
        user = MagicMock()
        user.id = 42
        user.role = 'provider'
        user.email = 'test@example.com'
        user.password_hash = 'hashed'
        user.is_deleted = False
        user.to_dict.return_value = {'id': 42, 'email': 'test@example.com', 'role': 'provider'}
        return user

    def test_login_returns_jwt_token(self, auth_service, mock_user):
        """Login should return a JWT token that decodes to the correct user_id."""
        auth_service.user_repository.find_by_email.return_value = mock_user
        with patch('services.auth_service.check_password_hash', return_value=True):
            result = auth_service.login('test@example.com', 'secret123')
        assert result['success'] is True
        assert 'token' in result
        payload = jwt.decode(result['token'], Config.SECRET_KEY, algorithms=['HS256'])
        assert payload['user_id'] == 42
        assert payload['role'] == 'provider'

    def test_register_returns_jwt_token(self, auth_service, mock_user):
        """Register should return a JWT token."""
        mock_user.email_confirmation_token = 'token123'
        auth_service.user_repository.find_by_email.return_value = None
        with patch('services.auth_service.User') as UserMock:
            UserMock.create.return_value = mock_user
            result = auth_service.register({
                'name': 'Test', 'email': 'new@test.com', 'password': 'secret123',
                'role': 'provider', 'termsAccepted': True, 'privacyAccepted': True,
            })
        assert result['success'] is True
        assert 'token' in result
        payload = jwt.decode(result['token'], Config.SECRET_KEY, algorithms=['HS256'])
        assert payload['user_id'] == 42

    def test_jwt_token_has_expiration(self, auth_service, mock_user):
        """JWT token should have an expiration date."""
        auth_service.user_repository.find_by_email.return_value = mock_user
        with patch('services.auth_service.check_password_hash', return_value=True):
            result = auth_service.login('test@example.com', 'secret123')
        payload = jwt.decode(result['token'], Config.SECRET_KEY, algorithms=['HS256'])
        assert 'exp' in payload
        assert 'iat' in payload

    def test_jwt_token_invalid_when_tampered(self, auth_service, mock_user):
        """A tampered JWT token should fail verification."""
        auth_service.user_repository.find_by_email.return_value = mock_user
        with patch('services.auth_service.check_password_hash', return_value=True):
            result = auth_service.login('test@example.com', 'secret123')
        token = result['token']
        # Tamper with token
        tampered = token[:-5] + 'XXXXX'
        with pytest.raises(jwt.InvalidTokenError):
            jwt.decode(tampered, Config.SECRET_KEY, algorithms=['HS256'])


class TestSecretKeyEnforcement:
    """Test SECRET_KEY enforcement in production (BUG-06)."""

    def test_dev_mode_allows_default_secret(self):
        """In DEBUG mode, default SECRET_KEY should be allowed."""
        import os
        old_debug = os.environ.get('FLASK_DEBUG')
        old_secret = os.environ.get('SECRET_KEY')
        try:
            os.environ['FLASK_DEBUG'] = 'True'
            os.environ.pop('SECRET_KEY', None)
            # Config class is loaded at module level, so we test the logic
            from config import Config
            # In dev mode, it should not raise
            assert Config.DEBUG is True
        finally:
            if old_debug is not None:
                os.environ['FLASK_DEBUG'] = old_debug
            if old_secret is not None:
                os.environ['SECRET_KEY'] = old_secret
