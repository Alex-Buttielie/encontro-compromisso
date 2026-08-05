"""Chat and notification repository — Firestore adapter implementing ChatRepositoryPort."""
from logger import get_logger
from models import Chat, Message, NotificationPreference, Notification
from repositories.base import BaseRepository
from ports import ChatRepositoryPort


class ChatRepository(BaseRepository, ChatRepositoryPort):
    def __init__(self):
        super().__init__(Chat)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_active(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('active', '==', True).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_between_users(self, user_id, participant_a, participant_b):
        docs = self._collection().where('user_id', '==', user_id).stream()
        for doc in docs:
            data = doc.to_dict()
            a, b = data.get('participant_a_id'), data.get('participant_b_id')
            if (a == participant_a and b == participant_b) or (a == participant_b and b == participant_a):
                return self._deserialize(doc)
        return None


class MessageRepository(BaseRepository):
    def __init__(self):
        super().__init__(Message)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_chat(self, chat_id):
        docs = self._collection().where('chat_id', '==', chat_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_undeleted(self, chat_id):
        docs = self._collection().where('chat_id', '==', chat_id).where('deleted', '==', False).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_unread(self, chat_id, sender_id):
        docs = self._collection().where('chat_id', '==', chat_id).where('status', '==', 'sent').stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            if data.get('sender_id') != sender_id:
                results.append(self._deserialize(doc))
        return results


class NotificationPreferenceRepository(BaseRepository):
    def __init__(self):
        super().__init__(NotificationPreference)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_by_user_and_branch(self, user_id, branch_id):
        docs = self._collection().where('user_id', '==', user_id).where('branch_id', '==', branch_id).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def get_or_create(self, user_id, branch_id=None):
        pref = self.find_by_user_id(user_id) if not branch_id else \
            self.find_by_user_and_branch(user_id, branch_id)
        if not pref:
            pref = NotificationPreference.create(user_id, branch_id)
            self.add(pref)
        return pref


class NotificationRepository(BaseRepository):
    def __init__(self):
        super().__init__(Notification)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_pending(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'pending').stream()
        return [self._deserialize(doc) for doc in docs]
