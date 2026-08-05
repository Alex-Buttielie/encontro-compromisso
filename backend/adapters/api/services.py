"""Flask Blueprint for services routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.service_service import ServiceService

services_bp = Blueprint('services', __name__)

service_service = ServiceService()
logger = get_logger("routes.services")

@services_bp.route('/services', methods=['GET', 'POST'])
def services():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = service_service.create_service(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = service_service.get_services_by_user_id(user_id)
    return jsonify({'success': True, **paginate_list(result, 'services')}), 200

@services_bp.route('/services/<int:service_id>', methods=['GET', 'PUT', 'DELETE'])
def service_detail(service_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        service = service_service.get_service_by_id(service_id, user_id)
        if service:
            return jsonify({'success': True, 'service': service}), 200
        return jsonify({'success': False, 'errors': ['Serviço não encontrado']}), 404

    if request.method == 'PUT':
        data = request.get_json(silent=True) or {}
        result = service_service.update_service(service_id, user_id, data)
        if result['success']:
            return jsonify(result), 200
        return jsonify(result), 400

    result = service_service.delete_service(service_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 404
