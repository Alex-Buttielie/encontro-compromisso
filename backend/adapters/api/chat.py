"""Flask Blueprint for chat routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, paginate_list
from services.chat_service import ChatService
from services.notification_service import NotificationService

chat_bp = Blueprint('chat', __name__)

chat_service = ChatService()
notification_service = NotificationService()
logger = get_logger("routes.chat")

@chat_bp.route('/chat', methods=['GET', 'POST'])
def chats():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = chat_service.create_chat(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = chat_service.get_chats(user_id)
    return jsonify({'success': True, 'chats': result}), 200

@chat_bp.route('/chat/<int:chat_id>', methods=['GET'])
def get_chat(chat_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = chat_service.get_chat(chat_id)
    if item:
        return jsonify({'success': True, 'chat': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@chat_bp.route('/chat/<int:chat_id>/messages', methods=['GET', 'POST'])
def chat_messages(chat_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['chatId'] = chat_id
        data['senderId'] = user_id
        result = chat_service.send_message(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = chat_service.get_messages(chat_id)
    return jsonify({'success': True, 'messages': result}), 200

@chat_bp.route('/chat/<int:chat_id>/read', methods=['POST'])
def mark_chat_read(chat_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = chat_service.mark_read(chat_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@chat_bp.route('/chat/<int:chat_id>/block', methods=['POST'])
def block_chat(chat_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = chat_service.block_chat(chat_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@chat_bp.route('/chat/<int:chat_id>/unblock', methods=['POST'])
def unblock_chat(chat_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = chat_service.unblock_chat(chat_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@chat_bp.route('/chat/<int:chat_id>/delete-history', methods=['DELETE'])
def delete_chat_history(chat_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = chat_service.delete_chat_history(chat_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@chat_bp.route('/chat/messages/<int:message_id>', methods=['DELETE'])
def delete_message(message_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = chat_service.delete_message(message_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
