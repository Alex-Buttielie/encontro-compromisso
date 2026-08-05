"""Notification application service with multi-channel support."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.chat_repository import (
    NotificationPreferenceRepository, NotificationRepository,
)
from services.email_sender import get_email_sender


class MockPushSender:
    """Mock FCM push notification sender."""
    def __init__(self):
        self.logger = get_logger('MockPushSender')
        self.sent = []

    def send(self, token, title, body, data=None):
        self.logger.info(f'MOCK PUSH | token={token} | title={title} | body={body}')
        self.sent.append({'token': token, 'title': title, 'body': body, 'data': data})
        return True


class MockSMSSender:
    """Mock SMS sender."""
    def __init__(self):
        self.logger = get_logger('MockSMSSender')
        self.sent = []

    def send(self, phone, message):
        self.logger.info(f'MOCK SMS | phone={phone} | message={message}')
        self.sent.append({'phone': phone, 'message': message})
        return True


class NotificationService:
    def __init__(self, pref_repo=None, notif_repo=None,
                 push_sender=None, sms_sender=None, email_sender=None):
        self.pref_repo = pref_repo or NotificationPreferenceRepository()
        self.notif_repo = notif_repo or NotificationRepository()
        self.push_sender = push_sender or MockPushSender()
        self.sms_sender = sms_sender or MockSMSSender()
        self.email_sender = email_sender or get_email_sender()
        self.logger = get_logger(self.__class__.__name__)

    def get_preferences(self, user_id):
        pref = self.pref_repo.get_or_create(user_id)
        return pref.to_dict()

    def update_preferences(self, user_id, data):
        pref = self.pref_repo.get_or_create(user_id)
        if 'pushEnabled' in data:
            pref.push_enabled = data['pushEnabled']
        if 'smsEnabled' in data:
            pref.sms_enabled = data['smsEnabled']
        if 'emailEnabled' in data:
            pref.email_enabled = data['emailEnabled']
        if 'whatsappEnabled' in data:
            pref.whatsapp_enabled = data['whatsappEnabled']
        if 'inAppEnabled' in data:
            pref.in_app_enabled = data['inAppEnabled']
        if 'quietStart' in data:
            from datetime import time as dt_time
            pref.quiet_start = dt_time.fromisoformat(data['quietStart']) if data['quietStart'] else None
        if 'quietEnd' in data:
            from datetime import time as dt_time
            pref.quiet_end = dt_time.fromisoformat(data['quietEnd']) if data['quietEnd'] else None
        if 'disabledTypes' in data:
            import json
            pref.disabled_types_json = json.dumps(data['disabledTypes'])
        self.pref_repo.save(pref)
        return {'success': True, 'preferences': pref.to_dict()}

    def disable_type(self, user_id, notification_type):
        pref = self.pref_repo.get_or_create(user_id)
        pref.disable_type(notification_type)
        self.pref_repo.save(pref)
        return {'success': True, 'preferences': pref.to_dict()}

    def enable_type(self, user_id, notification_type):
        pref = self.pref_repo.get_or_create(user_id)
        pref.enable_type(notification_type)
        self.pref_repo.save(pref)
        return {'success': True, 'preferences': pref.to_dict()}

    def send_notification(self, user_id, notification_type, title, body,
                          channel=None, priority='normal', data=None):
        """Send a notification respecting user preferences."""
        from models import Notification
        from domain.enums import NotificationChannel, NotificationPriority

        pref = self.pref_repo.get_or_create(user_id)

        # Check if should send based on preferences
        if not pref.should_send(notification_type, priority):
            self.logger.info(f'Notification suppressed for user {user_id}: '
                           f'type={notification_type} priority={priority}')
            return {'success': True, 'sent': False, 'reason': 'suppressed'}

        # Determine channel
        if not channel:
            if pref.push_enabled:
                channel = NotificationChannel.PUSH.value
            elif pref.email_enabled:
                channel = NotificationChannel.EMAIL.value
            elif pref.in_app_enabled:
                channel = NotificationChannel.IN_APP.value
            else:
                channel = NotificationChannel.IN_APP.value

        # Check channel enabled
        channel_enabled = {
            'push': pref.push_enabled,
            'sms': pref.sms_enabled,
            'email': pref.email_enabled,
            'whatsapp': pref.whatsapp_enabled,
            'in_app': pref.in_app_enabled,
        }.get(channel, False)

        if not channel_enabled:
            # Fallback to in_app
            channel = NotificationChannel.IN_APP.value

        try:
            notif = Notification.create(
                user_id=user_id,
                notification_type=notification_type,
                title=title, body=body,
                channel=channel, priority=priority,
                data=data,
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.notif_repo.add(notif)

        # Deliver via appropriate channel
        if channel == NotificationChannel.PUSH.value:
            self.push_sender.send(
                token=f'user-{user_id}', title=title, body=body, data=data)
        elif channel == NotificationChannel.SMS.value:
            self.sms_sender.send(phone=f'+55-{user_id}', message=f'{title}: {body}')
        elif channel == NotificationChannel.EMAIL.value:
            self.email_sender.send(
                to=f'user{user_id}@example.com',
                subject=title, body=body,
            )

        notif.mark_sent()
        self.notif_repo.save(notif)
        return {'success': True, 'sent': True, 'notification': notif.to_dict()}

    def get_notifications(self, user_id):
        notifs = self.notif_repo.find_by_user_id(user_id)
        return [n.to_dict() for n in notifs]

    def send_appointment_reminder(self, user_id, appointment_data):
        return self.send_notification(
            user_id=user_id,
            notification_type='appointment_reminder',
            title='Lembrete de agendamento',
            body=f'Você tem um agendamento em {appointment_data.get("time", "breve")}.',
            priority='high',
            data=appointment_data,
        )

    def send_chat_notification(self, user_id, sender_name, message_preview):
        return self.send_notification(
            user_id=user_id,
            notification_type='chat_message',
            title=f'Nova mensagem de {sender_name}',
            body=message_preview[:100],
            priority='normal',
        )

    def send_security_alert(self, user_id, title, body):
        return self.send_notification(
            user_id=user_id,
            notification_type='security_alert',
            title=title, body=body,
            priority='urgent',
        )
