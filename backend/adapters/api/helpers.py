"""Shared utilities for API route handlers."""
from flask import request, jsonify, current_app
from logger import get_logger


def get_current_user_id():
    """Extract user ID from Authorization header (JWT or legacy numeric ID)."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            import jwt as jwt_lib
            from config import Config
            payload = jwt_lib.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            return payload['user_id']
        except (jwt_lib.InvalidTokenError, KeyError, ImportError):
            pass
        try:
            return int(token)
        except (ValueError, IndexError):
            return None
    return None


def require_auth():
    """Return user_id if authenticated, else (None, error_response)."""
    user_id = get_current_user_id()
    if not user_id:
        return None, (jsonify({'success': False, 'errors': ['Não autorizado']}), 401)
    return user_id, None


def paginate_list(items, key='items'):
    """Paginate a list of items from a GET route."""
    page = request.args.get('page')
    if page is None:
        return {key: items}

    page = max(1, int(page))
    limit = min(100, max(1, int(request.args.get('limit', 20))))
    total = len(items)
    offset = (page - 1) * limit
    paged = items[offset:offset + limit]
    pages = (total + limit - 1) // limit if limit > 0 else 1
    return {
        key: paged,
        'total': total,
        'page': page,
        'limit': limit,
        'pages': pages,
    }


def notify_user(user_id, event, data):
    """Emit an event to a specific user's room via Socket.IO."""
    socketio = getattr(current_app, 'socketio', None)
    if socketio:
        socketio.emit(event, data, room=f'user_{user_id}')


def notify_conversation(conv_id, message):
    """Emit a new message to a conversation room via Socket.IO."""
    socketio = getattr(current_app, 'socketio', None)
    if socketio:
        socketio.emit('new_message', message, room=f'conversation_{conv_id}')
