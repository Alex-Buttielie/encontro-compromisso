"""Chat application service with WebSocket support."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.chat_repository import (
    ChatRepository, MessageRepository,
)


class ChatService:
    def __init__(self, chat_repo=None, message_repo=None):
        self.chat_repo = chat_repo or ChatRepository()
        self.message_repo = message_repo or MessageRepository()
        self.logger = get_logger(self.__class__.__name__)
        # WebSocket clients: { user_id: set(socket_ids) }
        self._ws_clients = {}

    def register_ws_client(self, user_id, socket_id):
        if user_id not in self._ws_clients:
            self._ws_clients[user_id] = set()
        self._ws_clients[user_id].add(socket_id)

    def unregister_ws_client(self, user_id, socket_id):
        if user_id in self._ws_clients:
            self._ws_clients[user_id].discard(socket_id)
            if not self._ws_clients[user_id]:
                del self._ws_clients[user_id]

    def is_user_online(self, user_id):
        return user_id in self._ws_clients and len(self._ws_clients[user_id]) > 0

    def create_chat(self, data):
        from models import Chat
        try:
            chat = Chat.create(
                user_id=data['userId'],
                chat_type=data.get('chatType', 'client_provider'),
                participant_a_id=data.get('participantAId'),
                participant_b_id=data.get('participantBId'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.chat_repo.add(chat)
        return {'success': True, 'chat': chat.to_dict()}

    def get_chats(self, user_id):
        chats = self.chat_repo.find_active(user_id)
        return [c.to_dict() for c in chats]

    def get_chat(self, chat_id):
        chat = self.chat_repo.get_by_id(chat_id)
        if not chat:
            return None
        return chat.to_dict()

    def send_message(self, data):
        from models import Message
        try:
            msg = Message.create(
                chat_id=data['chatId'],
                sender_id=data['senderId'],
                message_type=data.get('messageType', 'text'),
                content=data.get('content', ''),
                media_url=data.get('mediaUrl'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.message_repo.add(msg)
        # If recipient is online, mark as delivered
        chat = self.chat_repo.get_by_id(data['chatId'])
        if chat:
            recipient_id = (chat.participant_b_id
                           if data['senderId'] == chat.participant_a_id
                           else chat.participant_a_id)
            if self.is_user_online(recipient_id):
                msg.mark_delivered()
                self.message_repo.save(msg)
        return {'success': True, 'message': msg.to_dict()}

    def get_messages(self, chat_id):
        messages = self.message_repo.find_undeleted(chat_id)
        return [m.to_dict() for m in messages]

    def mark_read(self, chat_id, reader_id):
        unread = self.message_repo.find_unread(chat_id, reader_id)
        for msg in unread:
            try:
                msg.mark_read()
            except DomainError:
                pass
        self.message_repo.save_all(unread) if hasattr(self.message_repo, 'save_all') else \
            [self.message_repo.save(m) for m in unread]
        return {'success': True, 'markedRead': len(unread)}

    def delete_message(self, message_id):
        msg = self.message_repo.get_by_id(message_id)
        if not msg:
            return {'success': False, 'errors': ['Mensagem não encontrada']}
        msg.delete()
        self.message_repo.save(msg)
        return {'success': True}

    def block_chat(self, chat_id, blocked_by):
        chat = self.chat_repo.get_by_id(chat_id)
        if not chat:
            return {'success': False, 'errors': ['Chat não encontrado']}
        chat.block(blocked_by)
        self.chat_repo.save(chat)
        return {'success': True, 'chat': chat.to_dict()}

    def unblock_chat(self, chat_id):
        chat = self.chat_repo.get_by_id(chat_id)
        if not chat:
            return {'success': False, 'errors': ['Chat não encontrado']}
        chat.unblock()
        self.chat_repo.save(chat)
        return {'success': True, 'chat': chat.to_dict()}

    def send_auto_message(self, chat_id, sender_id, content):
        """Send an automatic message (e.g., appointment confirmation)."""
        from models import Message
        try:
            msg = Message.create(
                chat_id=chat_id, sender_id=sender_id,
                message_type='auto', content=content,
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.message_repo.add(msg)
        return {'success': True, 'message': msg.to_dict()}

    def delete_chat_history(self, chat_id):
        """LGPD: Delete all messages in a chat."""
        messages = self.message_repo.find_by_chat(chat_id)
        for msg in messages:
            msg.delete()
        [self.message_repo.save(m) for m in messages]
        return {'success': True, 'deletedCount': len(messages)}
