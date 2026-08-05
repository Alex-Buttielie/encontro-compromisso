from datetime import datetime, timedelta

import pytest

from domain.exceptions import InvalidStateTransition, InvalidTokenError, ValidationError
from domain.terms import CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION
from models import User


def make_user(**overrides):
    defaults = dict(
        name='Ana Prestadora',
        email='ana@example.com',
        password_hash='hashed-password',
        role='provider',
        profession='Cabeleireira',
        terms_accepted=True,
        privacy_accepted=True,
    )
    defaults.update(overrides)
    return User.create(**defaults)


class TestTermsAndPrivacyAcceptance:
    def test_registration_requires_terms_acceptance(self):
        with pytest.raises(ValidationError) as exc:
            make_user(terms_accepted=False)
        assert 'É necessário aceitar os Termos de Uso' in exc.value.errors

    def test_registration_requires_privacy_acceptance(self):
        with pytest.raises(ValidationError) as exc:
            make_user(privacy_accepted=False)
        assert 'É necessário aceitar a Política de Privacidade' in exc.value.errors

    def test_registration_records_accepted_versions(self):
        user = make_user()
        assert user.terms_accepted_version == CURRENT_TERMS_VERSION
        assert user.privacy_accepted_version == CURRENT_PRIVACY_VERSION
        assert user.terms_accepted_at is not None
        assert user.privacy_accepted_at is not None


class TestEmailConfirmation:
    def test_new_user_starts_unconfirmed_with_a_token(self):
        user = make_user()
        assert user.email_confirmed is False
        assert user.email_confirmation_token
        assert user.email_confirmation_expires_at is not None

    def test_confirm_email_with_valid_token_succeeds(self):
        user = make_user()
        token = user.email_confirmation_token
        user.confirm_email(token)
        assert user.email_confirmed is True
        assert user.email_confirmation_token is None
        assert user.email_confirmation_expires_at is None

    def test_confirm_email_with_wrong_token_fails(self):
        user = make_user()
        with pytest.raises(InvalidTokenError):
            user.confirm_email('token-invalido')
        assert user.email_confirmed is False

    def test_confirm_email_with_expired_token_fails(self):
        user = make_user()
        token = user.email_confirmation_token
        user.email_confirmation_expires_at = datetime.utcnow() - timedelta(seconds=1)
        with pytest.raises(InvalidTokenError):
            user.confirm_email(token)
        assert user.email_confirmed is False


class TestPasswordReset:
    def test_generate_password_reset_token_sets_expiry(self):
        user = make_user()
        token = user.generate_password_reset_token()
        assert token
        assert user.password_reset_token == token
        assert user.password_reset_expires_at > datetime.utcnow()

    def test_reset_password_with_valid_token_updates_hash(self):
        user = make_user()
        token = user.generate_password_reset_token()
        user.reset_password(token, 'new-hashed-password')
        assert user.password_hash == 'new-hashed-password'
        assert user.password_reset_token is None
        assert user.password_reset_expires_at is None

    def test_reset_password_with_wrong_token_fails(self):
        user = make_user()
        user.generate_password_reset_token()
        with pytest.raises(InvalidTokenError):
            user.reset_password('token-errado', 'new-hashed-password')

    def test_reset_password_with_expired_token_fails(self):
        user = make_user()
        token = user.generate_password_reset_token()
        user.password_reset_expires_at = datetime.utcnow() - timedelta(seconds=1)
        with pytest.raises(InvalidTokenError):
            user.reset_password(token, 'new-hashed-password')

    def test_reset_password_without_prior_token_fails(self):
        user = make_user()
        with pytest.raises(InvalidTokenError):
            user.reset_password('qualquer-token', 'new-hashed-password')

    def test_change_password_updates_hash_directly(self):
        user = make_user()
        user.change_password('another-hashed-password')
        assert user.password_hash == 'another-hashed-password'


class TestAccountDeletion:
    def test_mark_deleted_sets_timestamp(self):
        user = make_user()
        assert user.is_deleted is False
        user.mark_deleted()
        assert user.is_deleted is True
        assert user.deleted_at is not None

    def test_mark_deleted_twice_raises(self):
        user = make_user()
        user.mark_deleted()
        with pytest.raises(InvalidStateTransition):
            user.mark_deleted()
