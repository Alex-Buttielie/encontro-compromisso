"""Flask Blueprint for loyalty routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.loyalty_service import LoyaltyService

loyalty_bp = Blueprint('loyalty', __name__)

loyalty_service = LoyaltyService()
logger = get_logger("routes.loyalty")

@loyalty_bp.route('/loyalty/account', methods=['GET'])
def get_loyalty_account():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = loyalty_service.get_account(user_id)
    return jsonify({'success': True, 'account': result}), 200

@loyalty_bp.route('/loyalty/points/earn', methods=['POST'])
def earn_points():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    data = request.get_json(silent=True) or {}
    result = loyalty_service.earn_points(user_id, data.get('amount'), data.get('reason'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@loyalty_bp.route('/loyalty/points/spend', methods=['POST'])
def spend_points():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    data = request.get_json(silent=True) or {}
    result = loyalty_service.spend_points(user_id, data.get('amount'), data.get('reason'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@loyalty_bp.route('/loyalty/xp/earn', methods=['POST'])
def earn_xp():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    data = request.get_json(silent=True) or {}
    result = loyalty_service.earn_xp(user_id, data.get('amount'), data.get('reason'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@loyalty_bp.route('/loyalty/cashback', methods=['POST'])
def award_cashback():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    data = request.get_json(silent=True) or {}
    result = loyalty_service.award_cashback(
        user_id,
        data.get('paymentAmount'),
        data.get('rate', 0.05),
        data.get('cap'),
    )
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@loyalty_bp.route('/loyalty/ranking', methods=['GET'])
def loyalty_ranking():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = loyalty_service.get_ranking(user_id)
    return jsonify({'success': True, 'ranking': result}), 200

@loyalty_bp.route('/loyalty/missions', methods=['GET', 'POST'])
def missions():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = loyalty_service.create_mission(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = loyalty_service.get_missions(user_id)
    return jsonify({'success': True, 'missions': result}), 200

@loyalty_bp.route('/loyalty/medals', methods=['GET', 'POST'])
def medals():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = loyalty_service.create_medal(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = loyalty_service.get_medals(user_id)
    return jsonify({'success': True, 'medals': result}), 200

@loyalty_bp.route('/loyalty/medals/<int:medal_id>/award', methods=['POST'])
def award_medal(medal_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = loyalty_service.award_medal(user_id, medal_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
