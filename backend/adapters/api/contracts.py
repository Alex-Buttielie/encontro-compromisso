"""Flask Blueprint for contracts routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.document_service import DocumentService

contracts_bp = Blueprint('contracts', __name__)

document_service = DocumentService()
logger = get_logger("routes.contracts")

@contracts_bp.route('/contracts', methods=['GET', 'POST'])
def contracts():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = document_service.create_contract(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = document_service.get_contracts(user_id)
    return jsonify({'success': True, 'contracts': result}), 200

@contracts_bp.route('/contracts/<int:contract_id>', methods=['GET'])
def get_contract(contract_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = document_service.get_contract(contract_id)
    if item:
        return jsonify({'success': True, 'contract': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@contracts_bp.route('/contracts/<int:contract_id>/send', methods=['POST'])
def send_contract(contract_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = document_service.send_contract(contract_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@contracts_bp.route('/contracts/<int:contract_id>/sign', methods=['POST'])
def sign_contract(contract_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = document_service.sign_contract(contract_id, request.remote_addr or '0.0.0.0', request.headers.get('User-Agent', ''))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@contracts_bp.route('/contracts/<int:contract_id>/activate', methods=['POST'])
def activate_contract(contract_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = document_service.activate_contract(contract_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@contracts_bp.route('/contracts/<int:contract_id>/terminate', methods=['POST'])
def terminate_contract(contract_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = document_service.terminate_contract(contract_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@contracts_bp.route('/contracts/<int:contract_id>/versions', methods=['POST'])
def contract_versions(contract_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = document_service.get_versions(contract_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@contracts_bp.route('/contracts/<int:contract_id>/new-version', methods=['POST'])
def new_contract_version(contract_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = document_service.new_version(contract_id, data.get('body'), data.get('variables', {}))
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400
