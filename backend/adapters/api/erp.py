"""Flask Blueprint for erp routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.erp_service import ERPService

erp_bp = Blueprint('erp', __name__)

erp_service = ERPService()
logger = get_logger("routes.erp")

@erp_bp.route('/erp/cash-flow', methods=['GET', 'POST'])
def cash_flow():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = erp_service.create_cash_flow_entry(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = erp_service.get_cash_flow_entries(
        user_id, request.args.get('startDate'), request.args.get('endDate'))
    return jsonify({'success': True, 'entries': result}), 200

@erp_bp.route('/erp/cash-flow/summary', methods=['GET'])
def cash_flow_summary():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = erp_service.get_cash_flow_summary(
        user_id, request.args.get('startDate'), request.args.get('endDate'))
    return jsonify({'success': True, **result}), 200

@erp_bp.route('/erp/dre', methods=['GET'])
def get_dre():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = erp_service.get_dre(
        user_id, request.args.get('startDate'), request.args.get('endDate'))
    return jsonify({'success': True, 'dre': result}), 200

@erp_bp.route('/erp/cost-centers', methods=['GET', 'POST'])
def cost_centers():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = erp_service.create_cost_center(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = erp_service.get_cost_centers(user_id)
    return jsonify({'success': True, 'costCenters': result}), 200

@erp_bp.route('/erp/accounts-payable', methods=['GET', 'POST'])
def accounts_payable():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = erp_service.create_account_payable(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = erp_service.get_accounts_payable(user_id)
    return jsonify({'success': True, 'accountsPayable': result}), 200

@erp_bp.route('/erp/accounts-payable/<int:account_id>/pay', methods=['POST'])
def pay_account(account_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = erp_service.pay_account_payable(account_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@erp_bp.route('/erp/accounts-receivable', methods=['GET', 'POST'])
def accounts_receivable():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = erp_service.create_account_receivable(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = erp_service.get_accounts_receivable(user_id)
    return jsonify({'success': True, 'accountsReceivable': result}), 200

@erp_bp.route('/erp/accounts-receivable/<int:account_id>/receive', methods=['POST'])
def receive_account(account_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = erp_service.receive_account_receivable(account_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@erp_bp.route('/erp/periods', methods=['GET', 'POST'])
def financial_periods():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = erp_service.create_period(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = erp_service.get_periods(user_id)
    return jsonify({'success': True, 'periods': result}), 200

@erp_bp.route('/erp/periods/<int:period_id>/close', methods=['POST'])
def close_period(period_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = erp_service.close_period(period_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
