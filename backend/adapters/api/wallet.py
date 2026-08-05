"""Flask Blueprint for wallet routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.wallet_service import WalletService

wallet_bp = Blueprint('wallet', __name__)

wallet_service = WalletService()
logger = get_logger("routes.wallet")

@wallet_bp.route('/wallet', methods=['GET'])
def get_wallet():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = wallet_service.get_wallet(user_id)
    return jsonify({'success': True, 'wallet': result}), 200

@wallet_bp.route('/wallet/balance', methods=['GET'])
def get_wallet_balance():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = wallet_service.get_balance(user_id)
    return jsonify({'success': True, 'balance': result}), 200

@wallet_bp.route('/wallet/statement', methods=['GET'])
def get_wallet_statement():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = wallet_service.get_statement(user_id)
    return jsonify({'success': True, 'statement': result}), 200

@wallet_bp.route('/wallet/withdraw', methods=['POST'])
def wallet_withdraw():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = wallet_service.withdraw(user_id, data.get('amount'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@wallet_bp.route('/wallet/transfer', methods=['POST'])
def wallet_transfer():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = wallet_service.transfer(user_id, data.get('receiverUserId'), data.get('amount'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
