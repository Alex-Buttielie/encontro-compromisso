"""Flask Blueprint for subscriptions routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.subscription_service import SubscriptionService

subscriptions_bp = Blueprint('subscriptions', __name__)

subscription_service = SubscriptionService()
logger = get_logger("routes.subscriptions")

@subscriptions_bp.route('/subscriptions', methods=['GET', 'POST'])
def subscriptions():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = subscription_service.create_subscription(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = subscription_service.get_subscriptions(user_id)
    return jsonify({'success': True, 'subscriptions': result}), 200

@subscriptions_bp.route('/subscriptions/<int:sub_id>', methods=['GET'])
def get_subscription(sub_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = subscription_service.get_subscription(sub_id)
    if item:
        return jsonify({'success': True, 'subscription': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@subscriptions_bp.route('/subscriptions/<int:sub_id>/suspend', methods=['POST'])
def suspend_subscription(sub_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = subscription_service.suspend(sub_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@subscriptions_bp.route('/subscriptions/<int:sub_id>/cancel', methods=['POST'])
def cancel_subscription(sub_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = subscription_service.cancel(sub_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@subscriptions_bp.route('/subscriptions/<int:sub_id>/reactivate', methods=['POST'])
def reactivate_subscription(sub_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = subscription_service.reactivate(sub_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@subscriptions_bp.route('/subscriptions/<int:sub_id>/billing', methods=['POST'])
def process_billing(sub_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = subscription_service.process_billing(sub_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@subscriptions_bp.route('/subscriptions/<int:sub_id>/billing/fail', methods=['POST'])
def fail_billing(sub_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = subscription_service.fail_billing(sub_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@subscriptions_bp.route('/subscriptions/<int:sub_id>/billing/history', methods=['GET'])
def billing_history(sub_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = subscription_service.get_billing_history(sub_id)
    return jsonify({'success': True, 'billings': result}), 200

@subscriptions_bp.route('/billings/<int:billing_id>/retry', methods=['POST'])
def retry_billing(billing_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = subscription_service.retry_billing(billing_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
