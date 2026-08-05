"""Flask Blueprint for employees routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.employee_service import EmployeeService

employees_bp = Blueprint('employees', __name__)

employee_service = EmployeeService()
logger = get_logger("routes.employees")

@employees_bp.route('/employees', methods=['GET', 'POST'])
def employees():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = employee_service.create_employee(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = employee_service.get_employees(user_id)
    return jsonify({'success': True, 'employees': result}), 200

@employees_bp.route('/employees/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = employee_service.get_employee(employee_id)
    if item:
        return jsonify({'success': True, 'employee': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@employees_bp.route('/employees/accept-invite', methods=['POST'])
def accept_invite():
    data = request.get_json(silent=True) or {}
    result = employee_service.accept_invite(data.get('token'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@employees_bp.route('/employees/<int:employee_id>/suspend', methods=['POST'])
def suspend_employee(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = employee_service.suspend_employee(employee_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@employees_bp.route('/employees/<int:employee_id>/terminate', methods=['POST'])
def terminate_employee(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = employee_service.terminate_employee(employee_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@employees_bp.route('/employees/<int:employee_id>/reactivate', methods=['POST'])
def reactivate_employee(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = employee_service.reactivate_employee(employee_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@employees_bp.route('/employees/<int:employee_id>/permissions', methods=['PUT'])
def update_permissions(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = employee_service.update_permissions(employee_id, data.get('permissions', []), user_id)
    return jsonify(result), 200

@employees_bp.route('/employees/<int:employee_id>/history', methods=['GET'])
def employee_history(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = employee_service.get_history(employee_id)
    return jsonify({'success': True, 'history': result}), 200

@employees_bp.route('/employees/<int:employee_id>/productivity', methods=['GET'])
def employee_productivity(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    from datetime import date as dt_date
    start = request.args.get('startDate')
    end = request.args.get('endDate')
    start = dt_date.fromisoformat(start) if start else None
    end = dt_date.fromisoformat(end) if end else None
    result = employee_service.get_productivity(user_id, employee_id, start, end)
    return jsonify({'success': True, **result}), 200
