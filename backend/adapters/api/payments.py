"""Flask Blueprint for payments routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.payment_service import PaymentService

payments_bp = Blueprint('payments', __name__)

payment_service = PaymentService()
logger = get_logger("routes.payments")

@payments_bp.route('/payments', methods=['GET', 'POST'])
def payments():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = payment_service.create_payment(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = payment_service.get_payments_by_user(user_id)
    return jsonify({'success': True, 'payments': result}), 200

@payments_bp.route('/payments/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = payment_service.get_payment(payment_id)
    if result:
        return jsonify({'success': True, 'payment': result}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@payments_bp.route('/payments/<int:payment_id>/refund', methods=['POST'])
def refund_payment(payment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    amount = data.get('amount')
    result = payment_service.refund_payment(payment_id, amount)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@payments_bp.route('/webhooks/payment', methods=['POST'])
def payment_webhook():
    data = request.get_json(silent=True) or {}
    result = payment_service.process_webhook(data)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
