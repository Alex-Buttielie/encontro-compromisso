"""Flask Blueprint for admin routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.admin_service import AdminService

admin_bp = Blueprint('admin', __name__)

admin_service = AdminService()
logger = get_logger("routes.admin")

@admin_bp.route('/admin/users', methods=['GET'])
def admin_users():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    from repositories.user_repository import UserRepository
    user_repo = UserRepository()
    users = user_repo.get_all()
    result = [{'id': u.id, 'name': u.name, 'email': u.email, 'role': u.role, 'status': getattr(u, 'status', 'active')} for u in users]
    return jsonify({'success': True, 'users': result}), 200

@admin_bp.route('/admin/dashboard', methods=['GET'])
def admin_dashboard():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = admin_service.get_dashboard(request.args.get('adminRole', 'admin'))
    return jsonify({'success': True, 'dashboard': result}), 200

@admin_bp.route('/admin/users/<int:target_user_id>/block', methods=['POST'])
def admin_block_user(target_user_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = admin_service.block_user(target_user_id, data.get('adminRole') or data.get('role', 'admin'), user_id, data.get('reason'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@admin_bp.route('/admin/users/<int:target_user_id>/unblock', methods=['POST'])
def admin_unblock_user(target_user_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = admin_service.unblock_user(target_user_id, data.get('adminRole') or data.get('role', 'admin'), user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@admin_bp.route('/admin/users/<int:target_user_id>/approve', methods=['POST'])
def admin_approve_provider(target_user_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = admin_service.approve_provider(target_user_id, data.get('adminRole') or data.get('role', 'admin'), user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@admin_bp.route('/admin/users/<int:target_user_id>/reject', methods=['POST'])
def admin_reject_provider(target_user_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = admin_service.reject_provider(target_user_id, data.get('adminRole') or data.get('role', 'admin'), user_id, data.get('reason'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@admin_bp.route('/admin/moderate/post/<int:post_id>', methods=['POST'])
def admin_moderate_post(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = admin_service.moderate_post(user_id, data.get('adminRole') or data.get('role', 'admin'), post_id, data.get('action'), data.get('reason'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@admin_bp.route('/admin/audit', methods=['GET'])
def admin_audit_logs():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = admin_service.get_audit_logs(request.args.get('adminRole', 'admin'), int(request.args.get('limit', 50)), request.args.get('action'))
    return jsonify({'success': True, 'auditLogs': result}), 200

@admin_bp.route('/admin/feature-flags', methods=['GET', 'POST'])
def admin_feature_flags():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        result = admin_service.create_feature_flag(user_id, data.get('adminRole', 'admin'), data.get('key'), data.get('enabled', True), data.get('description'), data.get('rolloutPercentage', 100))
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = admin_service.get_feature_flags(request.args.get('adminRole', 'admin'))
    return jsonify({'success': True, 'flags': result}), 200

@admin_bp.route('/admin/feature-flags/<int:flag_id>/toggle', methods=['POST'])
def admin_toggle_flag(flag_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = admin_service.toggle_feature_flag(user_id, data.get('adminRole', 'admin'), flag_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
