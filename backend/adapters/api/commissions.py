"""Flask Blueprint for commissions routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.commission_service import CommissionService

commissions_bp = Blueprint('commissions', __name__)

commission_service = CommissionService()
logger = get_logger("routes.commissions")

@commissions_bp.route('/commissions/rules', methods=['GET', 'POST'])
def commission_rules():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = commission_service.create_rule(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = commission_service.get_rules(user_id)
    return jsonify({'success': True, 'rules': result}), 200

@commissions_bp.route('/commissions/rules/employee/<int:employee_id>', methods=['GET'])
def commission_rules_by_employee(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = commission_service.get_rules_by_employee(user_id, employee_id)
    return jsonify({'success': True, 'rules': result}), 200

@commissions_bp.route('/commissions/calculate', methods=['POST'])
def calculate_commission():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = commission_service.calculate_commission(
        user_id, data.get('employeeId'), data.get('baseAmount'),
        data.get('serviceId'), data.get('branchId'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@commissions_bp.route('/commissions/payments', methods=['GET'])
def commission_payments():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = commission_service.get_payments(user_id)
    return jsonify({'success': True, 'payments': result}), 200

@commissions_bp.route('/commissions/payments/employee/<int:employee_id>', methods=['GET'])
def commission_payments_by_employee(employee_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = commission_service.get_payments_by_employee(user_id, employee_id)
    return jsonify({'success': True, 'payments': result}), 200

@commissions_bp.route('/commissions/payments/<int:payment_id>/pay', methods=['POST'])
def pay_commission(payment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = commission_service.mark_paid(payment_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@commissions_bp.route('/commissions/payments/<int:payment_id>/cancel', methods=['POST'])
def cancel_commission(payment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = commission_service.cancel_payment(payment_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@commissions_bp.route('/commissions/report', methods=['GET'])
def commission_report():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = commission_service.get_commission_report(user_id)
    return jsonify({'success': True, 'report': result}), 200
