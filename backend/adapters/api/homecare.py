"""Flask Blueprint for homecare routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.homecare_service import HomeCareService

homecare_bp = Blueprint('homecare', __name__)

homecare_service = HomeCareService()
logger = get_logger("routes.homecare")

@homecare_bp.route('/homecare/service-area', methods=['GET', 'POST'])
def service_area():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = homecare_service.create_service_area(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = homecare_service.get_service_area(user_id)
    if result:
        return jsonify({'success': True, 'serviceArea': result}), 200
    return jsonify({'success': False, 'errors': ['Não configurada']}), 404

@homecare_bp.route('/homecare/check-coverage', methods=['POST'])
def check_coverage():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = homecare_service.check_coverage(user_id, float(data.get('lat', 0)), float(data.get('lng', 0)))
    return jsonify(result), 200

@homecare_bp.route('/homecare/estimate-travel', methods=['POST'])
def estimate_travel():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = homecare_service.estimate_travel(user_id, float(data.get('lat', 0)), float(data.get('lng', 0)))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@homecare_bp.route('/homecare/schedule-conflicts', methods=['POST'])
def schedule_conflicts():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = homecare_service.check_schedule_conflict(user_id, data.get('appointments', []), data.get('newLocation', {}))
    return jsonify(result), 200
