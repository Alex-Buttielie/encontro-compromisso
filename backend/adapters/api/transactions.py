"""Flask Blueprint for transactions routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from datetime import datetime
from services.transaction_service import TransactionService

transactions_bp = Blueprint('transactions', __name__)

transaction_service = TransactionService()
logger = get_logger("routes.transactions")

@transactions_bp.route('/transactions', methods=['GET', 'POST'])
def transactions():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = transaction_service.create_transaction(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = transaction_service.get_transactions_by_user_id(user_id)
    return jsonify({'success': True, **paginate_list(result, 'transactions')}), 200

@transactions_bp.route('/transactions/<int:transaction_id>', methods=['GET'])
def transaction_detail(transaction_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = transaction_service.get_transaction_by_id(transaction_id, user_id)
    if result:
        return jsonify({'success': True, 'transaction': result}), 200
    return jsonify({'success': False, 'errors': ['Transação não encontrada']}), 404

@transactions_bp.route('/transactions/<int:transaction_id>/pay', methods=['POST'])
def pay_transaction(transaction_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = transaction_service.mark_transaction_as_paid(transaction_id, user_id)
    return jsonify(result), (200 if result['success'] else 400)

@transactions_bp.route('/finance/summary', methods=['GET'])
def finance_summary():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = transaction_service.get_financial_summary(user_id)
    return jsonify({'success': True, 'summary': result}), 200

@transactions_bp.route('/finance/monthly-income', methods=['GET'])
def monthly_income():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    year = int(request.args.get('year', datetime.now().year))
    month = int(request.args.get('month', datetime.now().month))
    result = transaction_service.get_monthly_income(user_id, year, month)
    return jsonify({'success': True, 'income': result}), 200
