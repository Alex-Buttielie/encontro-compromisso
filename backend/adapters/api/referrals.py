"""Flask Blueprint for referrals routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.referral_service import ReferralService

referrals_bp = Blueprint('referrals', __name__)

referral_service = ReferralService()
logger = get_logger("routes.referrals")

@referrals_bp.route('/referrals', methods=['GET', 'POST'])
def referrals():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = referral_service.create_referral(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = referral_service.get_referrals(user_id)
    return jsonify({'success': True, 'referrals': result}), 200

@referrals_bp.route('/referrals/<int:ref_id>', methods=['GET'])
def get_referral(ref_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = referral_service.get_referral(ref_id)
    if item:
        return jsonify({'success': True, 'referral': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@referrals_bp.route('/referrals/code/<code>', methods=['GET'])
def get_referral_by_code(code):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = referral_service.get_by_code(code)
    if result:
        return jsonify({'success': True, 'referral': result}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@referrals_bp.route('/referrals/register', methods=['POST'])
def register_referral():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = referral_service.register_referral(data.get('code'), data.get('referredUserId'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@referrals_bp.route('/referrals/convert', methods=['POST'])
def convert_referral():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = referral_service.convert_referral(data.get('code'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@referrals_bp.route('/referrals/<int:ref_id>/reward', methods=['POST'])
def reward_referral(ref_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = referral_service.reward_referral(ref_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@referrals_bp.route('/referrals/<int:ref_id>/expire', methods=['POST'])
def expire_referral(ref_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = referral_service.expire_referral(ref_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@referrals_bp.route('/referrals/stats', methods=['GET'])
def referral_stats():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = referral_service.get_stats(user_id)
    return jsonify({'success': True, 'stats': result}), 200

@referrals_bp.route('/referrals/ranking', methods=['GET'])
def referral_ranking():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = referral_service.get_ranking(int(request.args.get('limit', 50)))
    return jsonify({'success': True, 'ranking': result}), 200
