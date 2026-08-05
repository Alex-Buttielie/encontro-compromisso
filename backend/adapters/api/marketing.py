"""Flask Blueprint for marketing routes."""
from datetime import date
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.marketing_service import MarketingService

marketing_bp = Blueprint('marketing', __name__)

marketing_service = MarketingService()
logger = get_logger("routes.marketing")

@marketing_bp.route('/marketing/campaigns', methods=['GET', 'POST'])
def campaigns():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = marketing_service.create_campaign(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = marketing_service.get_campaigns(user_id)
    return jsonify({'success': True, 'campaigns': result}), 200

@marketing_bp.route('/marketing/campaigns/<int:campaign_id>/schedule', methods=['POST'])
def schedule_campaign(campaign_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    scheduled = data.get('scheduledDate')
    if scheduled and isinstance(scheduled, str):
        scheduled = date.fromisoformat(scheduled)
    result = marketing_service.schedule_campaign(campaign_id, scheduled)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@marketing_bp.route('/marketing/campaigns/<int:campaign_id>/start', methods=['POST'])
def start_campaign(campaign_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = marketing_service.start_campaign(campaign_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@marketing_bp.route('/marketing/campaigns/<int:campaign_id>/send', methods=['POST'])
def send_campaign(campaign_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = marketing_service.send_campaign(campaign_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@marketing_bp.route('/marketing/campaigns/<int:campaign_id>/complete', methods=['POST'])
def complete_campaign(campaign_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = marketing_service.complete_campaign(campaign_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@marketing_bp.route('/marketing/campaigns/<int:campaign_id>/cancel', methods=['POST'])
def cancel_campaign(campaign_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = marketing_service.cancel_campaign(campaign_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@marketing_bp.route('/marketing/coupons', methods=['GET', 'POST'])
def coupons():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = marketing_service.create_coupon(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = marketing_service.get_coupons(user_id)
    return jsonify({'success': True, 'coupons': result}), 200

@marketing_bp.route('/marketing/coupons/validate', methods=['POST'])
def validate_coupon():
    data = request.get_json(silent=True) or {}
    result = marketing_service.validate_coupon(data.get('code'), data.get('amount'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@marketing_bp.route('/marketing/conversion-report', methods=['GET'])
def conversion_report():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = marketing_service.get_conversion_report(user_id)
    return jsonify({'success': True, 'report': result}), 200
