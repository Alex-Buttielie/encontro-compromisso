"""Flask Blueprint for lgpd routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.lgpd_service import LgpdService

lgpd_bp = Blueprint('lgpd', __name__)

lgpd_service = LgpdService()
logger = get_logger("routes.lgpd")

@lgpd_bp.route('/lgpd/requests', methods=['GET', 'POST'])
def lgpd_requests():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        result = lgpd_service.create_request(user_id, data.get('requestType'))
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = lgpd_service.get_requests(user_id)
    return jsonify({'success': True, 'dataRequests': result}), 200

@lgpd_bp.route('/lgpd/requests/<int:req_id>', methods=['GET'])
def get_lgpd_request(req_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = lgpd_service.get_request(req_id)
    if item:
        return jsonify({'success': True, 'dataRequest': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@lgpd_bp.route('/lgpd/requests/<int:req_id>/process', methods=['POST'])
def process_lgpd_request(req_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    req = lgpd_service.get_request(req_id)
    if not req:
        return jsonify({'success': False, 'errors': ['Solicitação não encontrada']}), 404

    if req.get('requestType') == 'export':
        result = lgpd_service.process_export(user_id, req_id)
    elif req.get('requestType') == 'deletion':
        result = lgpd_service.process_deletion(user_id, req_id)
    else:
        return jsonify({'success': False, 'errors': ['Tipo de solicitação desconhecido']}), 400

    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@lgpd_bp.route('/lgpd/requests/<int:req_id>/reject', methods=['POST'])
def reject_lgpd_request(req_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = lgpd_service.reject_request(user_id, req_id, data.get('reason'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
