"""Flask Blueprint for giftcards routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.giftcard_service import GiftCardService

giftcards_bp = Blueprint('giftcards', __name__)

giftcard_service = GiftCardService()
logger = get_logger("routes.giftcards")

@giftcards_bp.route('/gift-cards', methods=['GET', 'POST'])
def gift_cards():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = giftcard_service.create_gift_card(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = giftcard_service.get_gift_cards_by_user(user_id)
    return jsonify({'success': True, 'giftCards': result}), 200

@giftcards_bp.route('/gift-cards/redeem', methods=['POST'])
def redeem_gift_card():
    data = request.get_json(silent=True) or {}
    result = giftcard_service.redeem_gift_card(data.get('code'), data.get('redeemedByEmail'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@giftcards_bp.route('/gift-cards/<code>/block', methods=['POST'])
def block_gift_card(code):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = giftcard_service.block_gift_card(code, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
