"""Authentication application service (thin orchestration over the domain)."""
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from logger import get_logger
from models import User
from domain.exceptions import DomainError
from repositories.user_repository import UserRepository
from services.email_sender import get_email_sender
from config import Config


class AuthService:
    """Coordinates credentials and the User domain entity."""

    def __init__(self, user_repository=None, email_sender=None):
        self.user_repository = user_repository or UserRepository()
        self.email_sender = email_sender or get_email_sender()
        self.logger = get_logger(self.__class__.__name__)

    def _generate_token(self, user):
        """Generate a JWT token for the given user."""
        payload = {
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + Config.JWT_EXPIRATION,
            'iat': datetime.utcnow(),
        }
        return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

    def register(self, data):
        """Register a new user. Profile invariants live in User.create."""
        email = data.get('email')

        # Password is a credential concern (not a domain invariant of User)
        password = data.get('password')
        if not password or len(password) < 6:
            self.logger.warning('Registration validation failed: weak password email=%s', email)
            return {'success': False, 'errors': ['Senha deve ter pelo menos 6 caracteres']}

        if email and self.user_repository.find_by_email(email):
            self.logger.warning('Registration failed: email already registered: %s', email)
            return {'success': False, 'errors': ['E-mail já cadastrado']}

        try:
            user = User.create(
                name=data.get('name'),
                email=email,
                password_hash=generate_password_hash(password),
                role=data.get('role', 'provider'),
                profession=data.get('profession', ''),
                phone=data.get('phone', ''),
                address=data.get('address', ''),
                bio=data.get('bio', ''),
                link=data.get('link', ''),
                cep=data.get('cep', ''),
                rua=data.get('rua', ''),
                numero=data.get('numero', ''),
                complemento=data.get('complemento', ''),
                bairro=data.get('bairro', ''),
                cidade=data.get('cidade', ''),
                estado=data.get('estado', ''),
                terms_accepted=bool(data.get('termsAccepted')),
                privacy_accepted=bool(data.get('privacyAccepted')),
            )
        except DomainError as e:
            self.logger.warning('Registration validation failed: email=%s errors=%s', email, e.errors)
            return {'success': False, 'errors': e.errors}

        self.user_repository.add(user)
        self._send_confirmation_email(user)
        self.logger.info('User registered: id=%s email=%s', user.id, email)
        token = self._generate_token(user)
        return {'success': True, 'user': user.to_dict(), 'token': token}

    def login(self, email, password):
        """Authenticate user."""
        self.logger.info('Authentication attempt: email=%s', email)
        user = self.user_repository.find_by_email(email)
        if not user or user.is_deleted:
            self.logger.warning('Authentication failed: user not found: %s', email)
            return {'success': False, 'errors': ['E-mail ou senha incorretos']}

        if not check_password_hash(user.password_hash, password):
            self.logger.warning('Authentication failed: invalid password: %s', email)
            return {'success': False, 'errors': ['E-mail ou senha incorretos']}

        self.logger.info('Authentication success: user_id=%s email=%s', user.id, email)
        token = self._generate_token(user)
        return {'success': True, 'user': user.to_dict(), 'token': token}

    def confirm_email(self, token):
        """Confirm a user's e-mail address using a previously issued token."""
        if not token:
            return {'success': False, 'errors': ['Token é obrigatório']}

        user = self.user_repository.find_by_email_confirmation_token(token)
        if not user:
            self.logger.warning('Email confirmation failed: token not found')
            return {'success': False, 'errors': ['Token de confirmação inválido']}

        try:
            user.confirm_email(token)
        except DomainError as e:
            self.logger.warning('Email confirmation failed: user_id=%s errors=%s', user.id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.user_repository.save(user)
        self.logger.info('Email confirmed: user_id=%s', user.id)
        return {'success': True, 'user': user.to_dict()}

    def request_password_reset(self, email):
        """Issue a password reset token and e-mail it to the user.

        Always returns success to avoid leaking which e-mails are registered.
        """
        user = self.user_repository.find_by_email(email) if email else None
        if user and not user.is_deleted:
            token = user.generate_password_reset_token()
            self.user_repository.save(user)
            self._send_password_reset_email(user, token)
            self.logger.info('Password reset requested: user_id=%s', user.id)
        else:
            self.logger.info('Password reset requested for unknown email=%s', email)
        return {'success': True}

    def reset_password(self, token, new_password):
        """Reset the password using a previously issued token."""
        if not token:
            return {'success': False, 'errors': ['Token é obrigatório']}
        if not new_password or len(new_password) < 6:
            return {'success': False, 'errors': ['Senha deve ter pelo menos 6 caracteres']}

        user = self.user_repository.find_by_password_reset_token(token)
        if not user:
            self.logger.warning('Password reset failed: token not found')
            return {'success': False, 'errors': ['Token de redefinição inválido']}

        try:
            user.reset_password(token, generate_password_hash(new_password))
        except DomainError as e:
            self.logger.warning('Password reset failed: user_id=%s errors=%s', user.id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.user_repository.save(user)
        self.logger.info('Password reset: user_id=%s', user.id)
        return {'success': True}

    def change_password(self, user_id, current_password, new_password):
        """Change the password of an authenticated user."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            self.logger.warning('Change password failed: user not found: user_id=%s', user_id)
            return {'success': False, 'errors': ['Usuário não encontrado']}

        if not check_password_hash(user.password_hash, current_password or ''):
            self.logger.warning('Change password failed: wrong current password: user_id=%s', user_id)
            return {'success': False, 'errors': ['Senha atual incorreta']}

        if not new_password or len(new_password) < 6:
            return {'success': False, 'errors': ['Nova senha deve ter pelo menos 6 caracteres']}

        user.change_password(generate_password_hash(new_password))
        self.user_repository.save(user)
        self.logger.info('Password changed: user_id=%s', user_id)
        return {'success': True}

    def delete_account(self, user_id):
        """Soft-delete a user's account (LGPD account deletion request)."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            self.logger.warning('Delete account failed: user not found: user_id=%s', user_id)
            return {'success': False, 'errors': ['Usuário não encontrado']}

        try:
            user.mark_deleted()
        except DomainError as e:
            self.logger.warning('Delete account failed: user_id=%s errors=%s', user_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.user_repository.save(user)
        self.logger.info('Account deleted: user_id=%s', user_id)
        return {'success': True}

    def _send_confirmation_email(self, user):
        link = f'https://profissional-os.com/confirmar-email?token={user.email_confirmation_token}'
        self.email_sender.send(
            to=user.email,
            subject='Confirme seu e-mail - Profissional OS',
            body=f'Olá {user.name}, confirme seu e-mail acessando: {link}',
        )

    def _send_password_reset_email(self, user, token):
        link = f'https://profissional-os.com/redefinir-senha?token={token}'
        self.email_sender.send(
            to=user.email,
            subject='Redefinição de senha - Profissional OS',
            body=f'Olá {user.name}, redefina sua senha acessando: {link}',
        )

    def get_user_by_id(self, user_id):
        """Get user by ID."""
        user = self.user_repository.get_by_id(user_id)
        if not user:
            self.logger.warning('User not found: user_id=%s', user_id)
            return None
        return user.to_dict()

    def update_profile(self, user_id, data):
        """Update user profile via its domain behavior."""
        self.logger.info('Profile update requested: user_id=%s', user_id)
        user = self.user_repository.get_by_id(user_id)
        if not user:
            self.logger.warning('Profile update failed: user not found: user_id=%s', user_id)
            return {'success': False, 'errors': ['Usuário não encontrado']}

        try:
            user.update_profile(
                name=data.get('name'),
                profession=data.get('profession'),
                phone=data.get('phone'),
                address=data.get('address'),
                bio=data.get('bio'),
                link=data.get('link'),
                cep=data.get('cep'),
                rua=data.get('rua'),
                numero=data.get('numero'),
                complemento=data.get('complemento'),
                bairro=data.get('bairro'),
                cidade=data.get('cidade'),
                estado=data.get('estado'),
            )
        except DomainError as e:
            self.logger.warning('Profile update failed: user_id=%s errors=%s', user_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.user_repository.save(user)
        self.logger.info('Profile updated: user_id=%s', user_id)
        return {'success': True, 'user': user.to_dict()}
