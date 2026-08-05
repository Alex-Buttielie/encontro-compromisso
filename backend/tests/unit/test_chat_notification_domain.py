"""TDD unit tests for Chat and Notification domain models (Phase 5)."""
from datetime import datetime, time, timedelta

import pytest

from domain.enums import (
    ChatType, MessageType, MessageStatus,
    NotificationChannel, NotificationType, NotificationPriority,
    MESSAGE_STATUS_TRANSITIONS,
)
from domain.exceptions import ChatError, NotificationError, ValidationError


class TestChat:
    def test_create_client_provider_chat(self):
        from models import Chat
        chat = Chat.create(
            user_id=1, chat_type=ChatType.CLIENT_PROVIDER.value,
            participant_a_id=1, participant_b_id=2,
        )
        assert chat.chat_type == ChatType.CLIENT_PROVIDER.value
        assert chat.active is True

    def test_create_team_chat(self):
        from models import Chat
        chat = Chat.create(
            user_id=1, chat_type=ChatType.TEAM.value,
            participant_a_id=1, participant_b_id=3,
        )
        assert chat.chat_type == ChatType.TEAM.value

    def test_create_chat_missing_participant(self):
        from models import Chat
        with pytest.raises(ValidationError):
            Chat.create(
                user_id=1, chat_type=ChatType.CLIENT_PROVIDER.value,
                participant_a_id=1, participant_b_id=None,
            )

    def test_chat_block(self):
        from models import Chat
        chat = Chat.create(
            user_id=1, chat_type=ChatType.CLIENT_PROVIDER.value,
            participant_a_id=1, participant_b_id=2,
        )
        chat.block(blocked_by=1)
        assert chat.active is False
        assert chat.blocked_by == 1

    def test_chat_unblock(self):
        from models import Chat
        chat = Chat.create(
            user_id=1, chat_type=ChatType.CLIENT_PROVIDER.value,
            participant_a_id=1, participant_b_id=2,
        )
        chat.block(blocked_by=1)
        chat.unblock()
        assert chat.active is True

    def test_chat_archive(self):
        from models import Chat
        chat = Chat.create(
            user_id=1, chat_type=ChatType.CLIENT_PROVIDER.value,
            participant_a_id=1, participant_b_id=2,
        )
        chat.archive()
        assert chat.active is False


class TestMessage:
    def test_create_text_message(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.TEXT.value,
            content='Hello there!',
        )
        assert msg.status == MessageStatus.SENT.value
        assert msg.content == 'Hello there!'

    def test_create_photo_message(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.PHOTO.value,
            content='Check this out',
            media_url='https://storage.example.com/photo.jpg',
        )
        assert msg.message_type == MessageType.PHOTO.value
        assert msg.media_url is not None

    def test_create_audio_message(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.AUDIO.value,
            media_url='https://storage.example.com/audio.mp3',
        )
        assert msg.message_type == MessageType.AUDIO.value

    def test_create_location_message(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.LOCATION.value,
            content='-23.5505,-46.6333',
        )
        assert msg.message_type == MessageType.LOCATION.value

    def test_create_auto_message(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.AUTO.value,
            content='Thank you for your appointment!',
        )
        assert msg.message_type == MessageType.AUTO.value

    def test_text_message_empty_content(self):
        from models import Message
        with pytest.raises(ValidationError):
            Message.create(
                chat_id=1, sender_id=1,
                message_type=MessageType.TEXT.value,
                content='',
            )

    def test_media_message_missing_url(self):
        from models import Message
        with pytest.raises(ValidationError):
            Message.create(
                chat_id=1, sender_id=1,
                message_type=MessageType.PHOTO.value,
                content='Photo',
            )

    def test_mark_delivered(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.TEXT.value,
            content='Test',
        )
        msg.mark_delivered()
        assert msg.status == MessageStatus.DELIVERED.value

    def test_mark_read(self):
        from models import Message
        with pytest.raises(ValidationError):
            Message.create(
                chat_id=1, sender_id=1,
                message_type=MessageType.TEXT.value,
                content='',
            )

    def test_mark_read_correct(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.TEXT.value,
            content='Test',
        )
        msg.mark_delivered()
        msg.mark_read()
        assert msg.status == MessageStatus.READ.value

    def test_mark_read_without_delivered(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.TEXT.value,
            content='Test',
        )
        with pytest.raises(ChatError):
            msg.mark_read()

    def test_mark_failed(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.TEXT.value,
            content='Test',
        )
        msg.mark_failed()
        assert msg.status == MessageStatus.FAILED.value

    def test_delete_message(self):
        from models import Message
        msg = Message.create(
            chat_id=1, sender_id=1,
            message_type=MessageType.TEXT.value,
            content='Test',
        )
        msg.delete()
        assert msg.deleted is True
        assert msg.deleted_at is not None


class TestNotificationPreference:
    def test_create_default_preferences(self):
        from models import NotificationPreference
        pref = NotificationPreference.create(user_id=1)
        assert pref.push_enabled is True
        assert pref.email_enabled is True
        assert pref.sms_enabled is False
        assert pref.whatsapp_enabled is False

    def test_create_with_quiet_hours(self):
        from models import NotificationPreference
        from datetime import time as dt_time
        pref = NotificationPreference.create(
            user_id=1,
            quiet_start=dt_time(22, 0),
            quiet_end=dt_time(8, 0),
        )
        assert pref.quiet_start == dt_time(22, 0)
        assert pref.quiet_end == dt_time(8, 0)

    def test_is_quiet_time(self):
        from models import NotificationPreference
        from datetime import time as dt_time
        pref = NotificationPreference.create(
            user_id=1,
            quiet_start=dt_time(22, 0),
            quiet_end=dt_time(8, 0),
        )
        assert pref.is_quiet_time(dt_time(23, 0)) is True
        assert pref.is_quiet_time(dt_time(3, 0)) is True
        assert pref.is_quiet_time(dt_time(14, 0)) is False

    def test_is_quiet_time_no_quiet_hours(self):
        from models import NotificationPreference
        from datetime import time as dt_time
        pref = NotificationPreference.create(user_id=1)
        assert pref.is_quiet_time(dt_time(23, 0)) is False

    def test_enable_disable_channel(self):
        from models import NotificationPreference
        pref = NotificationPreference.create(user_id=1)
        pref.push_enabled = False
        assert pref.push_enabled is False

    def test_is_type_enabled(self):
        from models import NotificationPreference
        pref = NotificationPreference.create(user_id=1)
        assert pref.is_type_enabled(NotificationType.APPOINTMENT_REMINDER.value) is True
        pref.disable_type(NotificationType.PROMOTION.value)
        assert pref.is_type_enabled(NotificationType.PROMOTION.value) is False

    def test_is_type_enabled_when_disabled(self):
        from models import NotificationPreference
        pref = NotificationPreference.create(user_id=1)
        pref.disable_type(NotificationType.SECURITY_ALERT.value)
        assert pref.is_type_enabled(NotificationType.SECURITY_ALERT.value) is False

    def test_should_send_respects_quiet_hours(self):
        from models import NotificationPreference
        from datetime import time as dt_time
        pref = NotificationPreference.create(
            user_id=1,
            quiet_start=dt_time(22, 0),
            quiet_end=dt_time(8, 0),
        )
        # Non-urgent during quiet hours should not send
        assert pref.should_send(
            NotificationType.PROMOTION.value,
            NotificationPriority.LOW.value,
            dt_time(23, 0),
        ) is False
        # Urgent during quiet hours should send
        assert pref.should_send(
            NotificationType.SECURITY_ALERT.value,
            NotificationPriority.URGENT.value,
            dt_time(23, 0),
        ) is True


class TestNotification:
    def test_create_notification(self):
        from models import Notification
        notif = Notification.create(
            user_id=1,
            notification_type=NotificationType.APPOINTMENT_REMINDER.value,
            title='Lembrete',
            body='Você tem uma consulta amanhã às 10h',
            channel=NotificationChannel.PUSH.value,
        )
        assert notif.status == 'pending'
        assert notif.priority == NotificationPriority.NORMAL.value

    def test_create_notification_missing_title(self):
        from models import Notification
        with pytest.raises(ValidationError):
            Notification.create(
                user_id=1,
                notification_type=NotificationType.SYSTEM.value,
                title='', body='Test',
                channel=NotificationChannel.PUSH.value,
            )

    def test_mark_sent(self):
        from models import Notification
        notif = Notification.create(
            user_id=1,
            notification_type=NotificationType.CHAT_MESSAGE.value,
            title='Nova mensagem', body='Test',
            channel=NotificationChannel.PUSH.value,
        )
        notif.mark_sent()
        assert notif.status == 'sent'

    def test_mark_failed(self):
        from models import Notification
        notif = Notification.create(
            user_id=1,
            notification_type=NotificationType.SYSTEM.value,
            title='Test', body='Test',
            channel=NotificationChannel.SMS.value,
        )
        notif.mark_failed()
        assert notif.status == 'failed'
