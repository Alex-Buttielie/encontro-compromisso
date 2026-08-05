"""Flask Blueprint for crm routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.crm_service import CRMService

crm_bp = Blueprint('crm', __name__)

crm_service = CRMService()
logger = get_logger("routes.crm")

@crm_bp.route('/crm/profiles/<int:client_id>', methods=['GET'])
def get_crm_profile(client_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = crm_service.get_profile(user_id, client_id)
    if result:
        return jsonify({'success': True, 'profile': result}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@crm_bp.route('/crm/profiles', methods=['GET'])
def list_crm_profiles():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = crm_service.get_by_segment(user_id, request.args.get('segment'))
    return jsonify({'success': True, 'profiles': result}), 200

@crm_bp.route('/crm/birthdays', methods=['GET'])
def crm_birthdays():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = crm_service.get_birthdays_today(user_id)
    return jsonify({'success': True, 'birthdays': result}), 200

@crm_bp.route('/crm/record-visit', methods=['POST'])
def crm_record_visit():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = crm_service.record_visit(user_id, data.get('clientId'), data.get('amount'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@crm_bp.route('/crm/surveys', methods=['POST'])
def create_survey():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = crm_service.create_survey(user_id, data.get('clientId'), data.get('appointmentId'))
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@crm_bp.route('/crm/surveys/<int:survey_id>/respond', methods=['POST'])
def respond_survey(survey_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = crm_service.respond_survey(survey_id, data.get('rating'), data.get('comment'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
