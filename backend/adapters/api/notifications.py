"""Flask Blueprint for notifications routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.notification_service import NotificationService

notifications_bp = Blueprint('notifications', __name__)

notification_service = NotificationService()
logger = get_logger("routes.notifications")

@notifications_bp.route('/notifications', methods=['GET'])
def get_notifications():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = notification_service.get_notifications(user_id)
    return jsonify({'success': True, 'notifications': result}), 200

@notifications_bp.route('/notifications/preferences', methods=['GET', 'PUT'])
def notification_preferences():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'PUT':
        data = request.get_json(silent=True) or {}
        result = notification_service.update_preferences(user_id, data)
        return jsonify(result), 200

    result = notification_service.get_preferences(user_id)
    return jsonify({'success': True, 'preferences': result}), 200

@notifications_bp.route('/notifications/send', methods=['POST'])
def send_notification():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = notification_service.send_notification(user_id, data.get('notificationType'), data.get('title'), data.get('body'), data.get('channel', 'in_app'), data.get('priority', 'normal'), data)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@notifications_bp.route('/notifications/preferences/disable-type', methods=['POST'])
def disable_notification_type():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = notification_service.disable_type(user_id, data.get('notificationType'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@notifications_bp.route('/notifications/preferences/enable-type', methods=['POST'])
def enable_notification_type():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = notification_service.enable_type(user_id, data.get('notificationType'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
