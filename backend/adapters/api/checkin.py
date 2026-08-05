"""Flask Blueprint for checkin routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.checkin_service import CheckInOutService

checkin_bp = Blueprint('checkin', __name__)

checkin_service = CheckInOutService()
logger = get_logger("routes.checkin")

@checkin_bp.route('/checkin', methods=['POST'])
def check_in():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    data['userId'] = user_id
    result = checkin_service.check_in(data)
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@checkin_bp.route('/checkin/<int:appointment_id>/checkout', methods=['POST'])
def check_out(appointment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = checkin_service.check_out(appointment_id, user_id, data.get('observations'), data.get('attachments', []))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@checkin_bp.route('/checkin/<int:appointment_id>/no-show', methods=['POST'])
def mark_no_show(appointment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = checkin_service.mark_no_show(appointment_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@checkin_bp.route('/checkin/<int:appointment_id>', methods=['GET'])
def get_checkin_records(appointment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = checkin_service.get_by_appointment(appointment_id)
    return jsonify({'success': True, 'records': result}), 200
