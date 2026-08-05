"""Flask Blueprint for auth routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

auth_service = AuthService()
logger = get_logger("routes.auth")

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    result = auth_service.register(data)
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    result = auth_service.login(data.get('email'), data.get('password'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 401

@auth_bp.route('/auth/profile', methods=['GET', 'PUT'])
def profile():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        user = auth_service.get_user_by_id(user_id)
        if user:
            return jsonify({'success': True, 'user': user}), 200
        return jsonify({'success': False, 'errors': ['Usuário não encontrado']}), 404

    data = request.get_json(silent=True) or {}
    result = auth_service.update_profile(user_id, data)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@auth_bp.route('/auth/confirm-email', methods=['POST'])
def confirm_email():
    data = request.get_json(silent=True) or {}
    result = auth_service.confirm_email(data.get('token'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@auth_bp.route('/auth/password-reset/request', methods=['POST'])
def password_reset_request():
    data = request.get_json(silent=True) or {}
    result = auth_service.request_password_reset(data.get('email'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@auth_bp.route('/auth/password-reset/execute', methods=['POST'])
def password_reset_execute():
    data = request.get_json(silent=True) or {}
    result = auth_service.reset_password(data.get('token'), data.get('newPassword') or data.get('password'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@auth_bp.route('/auth/change-password', methods=['POST'])
def change_password():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = auth_service.change_password(user_id, data.get('currentPassword'), data.get('newPassword'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@auth_bp.route('/auth/account', methods=['DELETE'])
def delete_account():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = auth_service.delete_account(user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
