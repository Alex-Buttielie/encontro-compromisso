from unittest.mock import MagicMock

import pytest
from werkzeug.security import check_password_hash, generate_password_hash

from models import User
from services.auth_service import AuthService


def make_user(**overrides):
    defaults = dict(
        name='Ana Prestadora',
        email='ana@example.com',
        password_hash=generate_password_hash('SenhaAtual123'),
        role='provider',
        profession='Cabeleireira',
        terms_accepted=True,
        privacy_accepted=True,
    )
    defaults.update(overrides)
    user = User.create(**defaults)
    user.id = 1
    return user


@pytest.fixture
def user_repository():
    return MagicMock()


@pytest.fixture
def email_sender():
    return MagicMock()


@pytest.fixture
def auth_service(user_repository, email_sender):
    return AuthService(user_repository=user_repository, email_sender=email_sender)


class TestRegisterRequiresConsent:
    def test_register_without_terms_acceptance_fails(self, auth_service, user_repository):
        user_repository.find_by_email.return_value = None
        result = auth_service.register({
            'name': 'Novo Usuário',
            'email': 'novo@example.com',
            'password': 'SenhaValida123',
            'role': 'client',
        })
        assert result['success'] is False
        assert 'É necessário aceitar os Termos de Uso' in result['errors']

    def test_register_with_consent_sends_confirmation_email(self, auth_service, user_repository, email_sender):
        user_repository.find_by_email.return_value = None
        result = auth_service.register({
            'name': 'Novo Usuário',
            'email': 'novo@example.com',
            'password': 'SenhaValida123',
            'role': 'client',
            'termsAccepted': True,
            'privacyAccepted': True,
        })
        assert result['success'] is True
        user_repository.add.assert_called_once()
        email_sender.send.assert_called_once()
        assert email_sender.send.call_args.kwargs['to'] == 'novo@example.com'


class TestEmailConfirmationFlow:
    def test_confirm_email_with_valid_token_succeeds(self, auth_service, user_repository):
        user = make_user()
        token = user.email_confirmation_token
        user_repository.find_by_email_confirmation_token.return_value = user

        result = auth_service.confirm_email(token)

        assert result['success'] is True
        assert user.email_confirmed is True
        user_repository.save.assert_called_once_with(user)

    def test_confirm_email_with_unknown_token_fails(self, auth_service, user_repository):
        user_repository.find_by_email_confirmation_token.return_value = None
        result = auth_service.confirm_email('token-desconhecido')
        assert result['success'] is False

    def test_confirm_email_without_token_fails(self, auth_service, user_repository):
        result = auth_service.confirm_email('')
        assert result['success'] is False
        user_repository.find_by_email_confirmation_token.assert_not_called()


class TestPasswordRecoveryFlow:
    def test_request_password_reset_for_existing_user_sends_email(self, auth_service, user_repository, email_sender):
        user = make_user()
        user_repository.find_by_email.return_value = user

        result = auth_service.request_password_reset('ana@example.com')

        assert result['success'] is True
        assert user.password_reset_token
        email_sender.send.assert_called_once()
        user_repository.save.assert_called_once_with(user)

    def test_request_password_reset_for_unknown_email_does_not_leak(self, auth_service, user_repository, email_sender):
        user_repository.find_by_email.return_value = None

        result = auth_service.request_password_reset('desconhecido@example.com')

        assert result['success'] is True
        email_sender.send.assert_not_called()

    def test_reset_password_with_valid_token_updates_hash(self, auth_service, user_repository):
        user = make_user()
        token = user.generate_password_reset_token()
        user_repository.find_by_password_reset_token.return_value = user

        result = auth_service.reset_password(token, 'NovaSenha123')

        assert result['success'] is True
        assert check_password_hash(user.password_hash, 'NovaSenha123')

    def test_reset_password_with_short_password_fails(self, auth_service, user_repository):
        result = auth_service.reset_password('algum-token', '123')
        assert result['success'] is False
        user_repository.find_by_password_reset_token.assert_not_called()

    def test_reset_password_with_invalid_token_fails(self, auth_service, user_repository):
        user_repository.find_by_password_reset_token.return_value = None
        result = auth_service.reset_password('token-invalido', 'NovaSenha123')
        assert result['success'] is False


class TestChangePassword:
    def test_change_password_with_correct_current_password_succeeds(self, auth_service, user_repository):
        user = make_user()
        user_repository.get_by_id.return_value = user

        result = auth_service.change_password(user.id, 'SenhaAtual123', 'SenhaNova456')

        assert result['success'] is True
        assert check_password_hash(user.password_hash, 'SenhaNova456')

    def test_change_password_with_wrong_current_password_fails(self, auth_service, user_repository):
        user = make_user()
        user_repository.get_by_id.return_value = user

        result = auth_service.change_password(user.id, 'SenhaErrada', 'SenhaNova456')

        assert result['success'] is False

    def test_change_password_user_not_found_fails(self, auth_service, user_repository):
        user_repository.get_by_id.return_value = None
        result = auth_service.change_password(999, 'qualquer', 'SenhaNova456')
        assert result['success'] is False


class TestDeleteAccount:
    def test_delete_account_marks_user_deleted(self, auth_service, user_repository):
        user = make_user()
        user_repository.get_by_id.return_value = user

        result = auth_service.delete_account(user.id)

        assert result['success'] is True
        assert user.is_deleted is True
        user_repository.save.assert_called_once_with(user)

    def test_delete_account_user_not_found_fails(self, auth_service, user_repository):
        user_repository.get_by_id.return_value = None
        result = auth_service.delete_account(999)
        assert result['success'] is False


class TestLoginBlocksDeletedAccounts:
    def test_login_fails_for_deleted_account(self, auth_service, user_repository):
        user = make_user()
        user.mark_deleted()
        user_repository.find_by_email.return_value = user

        result = auth_service.login('ana@example.com', 'SenhaAtual123')

        assert result['success'] is False
