"""User repository — Firestore adapter implementing UserRepositoryPort."""
from logger import get_logger
from models import User
from repositories.base import BaseRepository
from ports import UserRepositoryPort


class UserRepository(BaseRepository, UserRepositoryPort):
    """Repository for user data access."""

    def __init__(self):
        super().__init__(User)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_email(self, email):
        """Find user by email."""
        docs = self._collection().where('email', '==', email).limit(1).stream()
        for doc in docs:
            user = self._deserialize(doc)
            self.logger.debug('find_by_email: email=%s found=%s', email, user is not None)
            return user
        self.logger.debug('find_by_email: email=%s found=False', email)
        return None

    def find_by_link(self, link):
        """Find user by custom link."""
        docs = self._collection().where('link', '==', link).limit(1).stream()
        for doc in docs:
            user = self._deserialize(doc)
            self.logger.debug('find_by_link: link=%s found=%s', link, user is not None)
            return user
        self.logger.debug('find_by_link: link=%s found=False', link)
        return None

    def find_by_email_confirmation_token(self, token):
        """Find user by e-mail confirmation token."""
        docs = self._collection().where('email_confirmation_token', '==', token).limit(1).stream()
        for doc in docs:
            user = self._deserialize(doc)
            self.logger.debug('find_by_email_confirmation_token: found=%s', user is not None)
            return user
        self.logger.debug('find_by_email_confirmation_token: found=False')
        return None

    def find_by_password_reset_token(self, token):
        """Find user by password reset token."""
        docs = self._collection().where('password_reset_token', '==', token).limit(1).stream()
        for doc in docs:
            user = self._deserialize(doc)
            self.logger.debug('find_by_password_reset_token: found=%s', user is not None)
            return user
        self.logger.debug('find_by_password_reset_token: found=False')
        return None
