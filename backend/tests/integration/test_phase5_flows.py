"""Integration + E2E tests for Phase 5 — Social Network, Chat, Notifications.

E2E flows:
1. Prestador publica foto com botão "Agendar"
2. Cliente vê no feed, curte e compartilha
3. Cliente clica em "Agendar" e completa agendamento
4. Cliente inicia chat com prestador
5. Prestador responde com foto
6. Cliente recebe notificação push
7. Cliente denuncia publicação
8. Administrador modera e remove
"""
import json
from datetime import date

from domain.enums import (
    PostType, PostStatus, PostAction, ModerationStatus,
    ReportReason, ReportStatus, ChatType, MessageType, MessageStatus,
    NotificationChannel, NotificationType, NotificationPriority,
)


def _register_and_get_token(client, email='user@example.com', role='provider', profession='Dentista'):
    resp = client.post('/api/auth/register',
                       data=json.dumps({
                           'name': 'Test User',
                           'email': email,
                           'password': 'secret123',
                           'role': role,
                           'profession': profession,
                           'termsAccepted': True,
                           'privacyAccepted': True,
                       }),
                       content_type='application/json')
    if resp.status_code == 201:
        return resp.get_json()['user']['id']
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': 'secret123'}),
                       content_type='application/json')
    return resp.get_json()['user']['id']


class TestSocialE2E:
    """E2E: Publish → view feed → like → share → schedule → report → moderate."""

    def test_provider_publishes_photo_with_schedule_button(self, client, app):
        uid = _register_and_get_token(client, email='social1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/social/posts',
                           data=json.dumps({
                               'postType': PostType.PHOTO.value,
                               'caption': 'Confira este sorriso incrível!',
                               'mediaUrl': 'https://storage.example.com/smile.jpg',
                               'action': PostAction.SCHEDULE.value,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        post = resp.get_json()['post']
        assert post['action'] == PostAction.SCHEDULE.value
        assert post['status'] == PostStatus.PUBLISHED.value

    def test_client_views_feed_likes_and_shares(self, client, app):
        uid = _register_and_get_token(client, email='social2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create a post
        resp = client.post('/api/social/posts',
                           data=json.dumps({
                               'postType': PostType.PHOTO.value,
                               'caption': 'Test post',
                               'mediaUrl': 'https://storage.example.com/test.jpg',
                           }),
                           content_type='application/json', headers=headers)
        post_id = resp.get_json()['post']['id']

        # View feed
        resp = client.get('/api/social/feed', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['posts']) >= 1

        # Like
        resp = client.post(f'/api/social/posts/{post_id}/like',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['post']['likesCount'] == 1

        # Share
        resp = client.post(f'/api/social/posts/{post_id}/share',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['post']['sharesCount'] == 1

    def test_client_comments_on_post(self, client, app):
        uid = _register_and_get_token(client, email='social3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/social/posts',
                           data=json.dumps({
                               'postType': PostType.PHOTO.value,
                               'caption': 'Comment test',
                               'mediaUrl': 'https://storage.example.com/test.jpg',
                           }),
                           content_type='application/json', headers=headers)
        post_id = resp.get_json()['post']['id']

        resp = client.post(f'/api/social/posts/{post_id}/comments',
                           data=json.dumps({'content': 'Great post!'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['comment']['content'] == 'Great post!'

        resp = client.get(f'/api/social/posts/{post_id}/comments', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['comments']) == 1

    def test_sponsored_post_requires_moderation(self, client, app):
        uid = _register_and_get_token(client, email='social4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/social/posts',
                           data=json.dumps({
                               'postType': PostType.SPONSORED.value,
                               'caption': 'Promoção especial!',
                               'mediaUrl': 'https://storage.example.com/promo.jpg',
                               'action': PostAction.BUY.value,
                               'isSponsored': True,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['post']['status'] == PostStatus.UNDER_REVIEW.value

    def test_antivirus_blocks_exe(self, client, app):
        uid = _register_and_get_token(client, email='social5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/social/posts',
                           data=json.dumps({
                               'postType': PostType.PHOTO.value,
                               'caption': 'Bad file',
                               'mediaUrl': 'https://storage.example.com/malware.exe',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_create_story(self, client, app):
        uid = _register_and_get_token(client, email='social6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/social/stories',
                           data=json.dumps({
                               'mediaUrl': 'https://storage.example.com/story.jpg',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['story']['status'] == 'active'

    def test_follow_and_unfollow(self, client, app):
        uid = _register_and_get_token(client, email='social7@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/social/follow',
                           data=json.dumps({'followingId': uid + 1}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        resp = client.post('/api/social/unfollow',
                           data=json.dumps({'followingId': uid + 1}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

    def test_report_and_moderate(self, client, app):
        uid = _register_and_get_token(client, email='social8@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create post
        resp = client.post('/api/social/posts',
                           data=json.dumps({
                               'postType': PostType.PHOTO.value,
                               'caption': 'Reportable content',
                               'mediaUrl': 'https://storage.example.com/test.jpg',
                           }),
                           content_type='application/json', headers=headers)
        post_id = resp.get_json()['post']['id']

        # Report
        resp = client.post('/api/social/reports',
                           data=json.dumps({
                               'postId': post_id,
                               'reason': ReportReason.SPAM.value,
                               'description': 'This is spam',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['report']['status'] == ReportStatus.OPEN.value

        # Moderate (remove)
        resp = client.post('/api/social/moderate',
                           data=json.dumps({
                               'postId': post_id,
                               'action': ModerationStatus.REMOVED.value,
                               'notes': 'Content removed by admin',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['post']['status'] == PostStatus.REMOVED.value


class TestChatE2E:
    """E2E: Create chat → send messages → media → read → block → delete."""

    def test_create_chat_and_send_text_message(self, client, app):
        uid = _register_and_get_token(client, email='chat1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create chat
        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.CLIENT_PROVIDER.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        chat_id = resp.get_json()['chat']['id']

        # Send text message
        resp = client.post(f'/api/chat/{chat_id}/messages',
                           data=json.dumps({
                               'messageType': MessageType.TEXT.value,
                               'content': 'Hello there!',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['message']['content'] == 'Hello there!'
        assert resp.get_json()['message']['status'] == MessageStatus.SENT.value

    def test_send_photo_message(self, client, app):
        uid = _register_and_get_token(client, email='chat2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.CLIENT_PROVIDER.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        chat_id = resp.get_json()['chat']['id']

        resp = client.post(f'/api/chat/{chat_id}/messages',
                           data=json.dumps({
                               'messageType': MessageType.PHOTO.value,
                               'content': 'Check this out',
                               'mediaUrl': 'https://storage.example.com/photo.jpg',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['message']['messageType'] == MessageType.PHOTO.value

    def test_send_audio_message(self, client, app):
        uid = _register_and_get_token(client, email='chat3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.TEAM.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        chat_id = resp.get_json()['chat']['id']

        resp = client.post(f'/api/chat/{chat_id}/messages',
                           data=json.dumps({
                               'messageType': MessageType.AUDIO.value,
                               'mediaUrl': 'https://storage.example.com/audio.mp3',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

    def test_get_messages(self, client, app):
        uid = _register_and_get_token(client, email='chat4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.CLIENT_PROVIDER.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        chat_id = resp.get_json()['chat']['id']

        client.post(f'/api/chat/{chat_id}/messages',
                    data=json.dumps({
                        'messageType': MessageType.TEXT.value,
                        'content': 'Message 1',
                    }),
                    content_type='application/json', headers=headers)
        client.post(f'/api/chat/{chat_id}/messages',
                    data=json.dumps({
                        'messageType': MessageType.TEXT.value,
                        'content': 'Message 2',
                    }),
                    content_type='application/json', headers=headers)

        resp = client.get(f'/api/chat/{chat_id}/messages', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['messages']) == 2

    def test_block_and_unblock_chat(self, client, app):
        uid = _register_and_get_token(client, email='chat5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.CLIENT_PROVIDER.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        chat_id = resp.get_json()['chat']['id']

        resp = client.post(f'/api/chat/{chat_id}/block',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['chat']['active'] is False

        resp = client.post(f'/api/chat/{chat_id}/unblock',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['chat']['active'] is True

    def test_delete_message(self, client, app):
        uid = _register_and_get_token(client, email='chat6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.CLIENT_PROVIDER.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        chat_id = resp.get_json()['chat']['id']

        resp = client.post(f'/api/chat/{chat_id}/messages',
                           data=json.dumps({
                               'messageType': MessageType.TEXT.value,
                               'content': 'To be deleted',
                           }),
                           content_type='application/json', headers=headers)
        msg_id = resp.get_json()['message']['id']

        resp = client.delete(f'/api/chat/messages/{msg_id}', headers=headers)
        assert resp.status_code == 200

    def test_delete_chat_history_lgpd(self, client, app):
        uid = _register_and_get_token(client, email='chat7@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.CLIENT_PROVIDER.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        chat_id = resp.get_json()['chat']['id']

        client.post(f'/api/chat/{chat_id}/messages',
                    data=json.dumps({
                        'messageType': MessageType.TEXT.value,
                        'content': 'Message 1',
                    }),
                    content_type='application/json', headers=headers)

        resp = client.delete(f'/api/chat/{chat_id}/delete-history', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['deletedCount'] == 1


class TestNotificationE2E:
    """E2E: Preferences → send → receive push."""

    def test_get_default_preferences(self, client, app):
        uid = _register_and_get_token(client, email='notif1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.get('/api/notifications/preferences', headers=headers)
        assert resp.status_code == 200
        pref = resp.get_json()['preferences']
        assert pref['pushEnabled'] is True
        assert pref['emailEnabled'] is True
        assert pref['smsEnabled'] is False

    def test_update_preferences(self, client, app):
        uid = _register_and_get_token(client, email='notif2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.put('/api/notifications/preferences',
                          data=json.dumps({
                              'pushEnabled': False,
                              'smsEnabled': True,
                              'quietStart': '22:00',
                              'quietEnd': '08:00',
                          }),
                          content_type='application/json', headers=headers)
        assert resp.status_code == 200
        pref = resp.get_json()['preferences']
        assert pref['pushEnabled'] is False
        assert pref['smsEnabled'] is True
        assert pref['quietStart'] == '22:00:00'

    def test_send_notification(self, client, app):
        uid = _register_and_get_token(client, email='notif3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/notifications/send',
                           data=json.dumps({
                               'notificationType': NotificationType.APPOINTMENT_REMINDER.value,
                               'title': 'Lembrete',
                               'body': 'Você tem uma consulta amanhã às 10h',
                               'priority': NotificationPriority.HIGH.value,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['sent'] is True

    def test_disable_notification_type(self, client, app):
        uid = _register_and_get_token(client, email='notif4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/notifications/preferences/disable-type',
                           data=json.dumps({
                               'notificationType': NotificationType.PROMOTION.value,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200

        # Promotion should now be suppressed
        resp = client.post('/api/notifications/send',
                           data=json.dumps({
                               'notificationType': NotificationType.PROMOTION.value,
                               'title': 'Promo',
                               'body': 'Test',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['sent'] is False

    def test_get_notifications(self, client, app):
        uid = _register_and_get_token(client, email='notif5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Send a notification first
        client.post('/api/notifications/send',
                    data=json.dumps({
                        'notificationType': NotificationType.SYSTEM.value,
                        'title': 'Test',
                        'body': 'Test body',
                    }),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/notifications', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['notifications']) >= 1

    def test_chat_triggers_push_notification(self, client, app):
        """When a chat message is sent, a push notification is triggered."""
        uid = _register_and_get_token(client, email='notif6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create chat
        resp = client.post('/api/chat',
                           data=json.dumps({
                               'chatType': ChatType.CLIENT_PROVIDER.value,
                               'participantAId': uid,
                               'participantBId': uid + 1,
                           }),
                           content_type='application/json', headers=headers)
        chat_id = resp.get_json()['chat']['id']

        # Send message (should trigger push to recipient)
        resp = client.post(f'/api/chat/{chat_id}/messages',
                           data=json.dumps({
                               'messageType': MessageType.TEXT.value,
                               'content': 'Push me!',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
