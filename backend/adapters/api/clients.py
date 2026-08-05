"""Flask Blueprint for clients routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.client_service import ClientService

clients_bp = Blueprint('clients', __name__)

client_service = ClientService()
logger = get_logger("routes.clients")

@clients_bp.route('/clients', methods=['GET', 'POST'])
def clients():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = client_service.create_client(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = client_service.get_clients_by_user_id(user_id)
    return jsonify({'success': True, **paginate_list(result, 'clients')}), 200

@clients_bp.route('/clients/<int:client_id>', methods=['GET', 'PUT', 'DELETE'])
def client_detail(client_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        client = client_service.get_client_by_id(client_id, user_id)
        if client:
            return jsonify({'success': True, 'client': client}), 200
        return jsonify({'success': False, 'errors': ['Cliente não encontrado']}), 404

    if request.method == 'PUT':
        data = request.get_json(silent=True) or {}
        result = client_service.update_client(client_id, user_id, data)
        if result['success']:
            return jsonify(result), 200
        return jsonify(result), 400

    result = client_service.delete_client(client_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 404
