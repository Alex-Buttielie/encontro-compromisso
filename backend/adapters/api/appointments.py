"""Flask Blueprint for appointments routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.appointment_service import AppointmentService

appointments_bp = Blueprint('appointments', __name__)

appointment_service = AppointmentService()
logger = get_logger("routes.appointments")

@appointments_bp.route('/appointments', methods=['GET', 'POST'])
def appointments():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = appointment_service.create_appointment(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    date_param = request.args.get('date')
    if date_param:
        result = appointment_service.get_appointments_by_date(user_id, date_param)
    else:
        result = appointment_service.get_appointments_by_user_id(user_id)
    return jsonify({'success': True, 'appointments': result}), 200

@appointments_bp.route('/appointments/today', methods=['GET'])
def appointments_today():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = appointment_service.get_today_appointments(user_id)
    return jsonify({'success': True, 'appointments': result}), 200

@appointments_bp.route('/appointments/upcoming', methods=['GET'])
def appointments_upcoming():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = appointment_service.get_upcoming_appointments(user_id)
    return jsonify({'success': True, 'appointments': result}), 200

@appointments_bp.route('/appointments/<int:appointment_id>/confirm', methods=['POST'])
def confirm_appointment(appointment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = appointment_service.confirm_appointment(appointment_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@appointments_bp.route('/appointments/<int:appointment_id>/complete', methods=['POST'])
def complete_appointment(appointment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = appointment_service.complete_appointment(appointment_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@appointments_bp.route('/appointments/<int:appointment_id>/cancel', methods=['POST'])
def cancel_appointment(appointment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = appointment_service.cancel_appointment(appointment_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
