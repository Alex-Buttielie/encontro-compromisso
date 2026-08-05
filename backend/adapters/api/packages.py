"""Flask Blueprint for packages routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.package_service import PackageService

packages_bp = Blueprint('packages', __name__)

package_service = PackageService()
logger = get_logger("routes.packages")

@packages_bp.route('/packages', methods=['GET', 'POST'])
def packages():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = package_service.create_package(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = package_service.get_packages_by_user(user_id)
    return jsonify({'success': True, 'packages': result}), 200

@packages_bp.route('/packages/<int:package_id>/use', methods=['POST'])
def use_package_session(package_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = package_service.use_session(package_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@packages_bp.route('/packages/<int:package_id>/cancel', methods=['POST'])
def cancel_package(package_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = package_service.cancel_package(package_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
