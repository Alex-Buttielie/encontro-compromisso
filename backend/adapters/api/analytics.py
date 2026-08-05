"""Flask Blueprint for analytics routes."""
from datetime import date
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.analytics_service import AnalyticsService

analytics_bp = Blueprint('analytics', __name__)

analytics_service = AnalyticsService()
logger = get_logger("routes.analytics")


def _parse_date(val):
    if not val:
        return None
    try:
        return date.fromisoformat(val)
    except (ValueError, TypeError):
        return None


@analytics_bp.route('/analytics/dashboard', methods=['GET'])
def analytics_dashboard():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    filters = {}
    for key in ('unit', 'collaborator', 'service', 'status'):
        val = request.args.get(key)
        if val:
            filters[key] = val

    result = analytics_service.get_dashboard(
        user_id, _parse_date(request.args.get('startDate')),
        _parse_date(request.args.get('endDate')), filters)
    return jsonify({'success': True, 'dashboard': result}), 200

@analytics_bp.route('/analytics/revenue', methods=['GET'])
def analytics_revenue():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = analytics_service.get_revenue_report(
        user_id, _parse_date(request.args.get('startDate')),
        _parse_date(request.args.get('endDate')))
    return jsonify({'success': True, **result}), 200

@analytics_bp.route('/analytics/top-services', methods=['GET'])
def analytics_top_services():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = analytics_service.get_top_services(
        user_id, _parse_date(request.args.get('startDate')),
        _parse_date(request.args.get('endDate')))
    return jsonify({'success': True, 'services': result}), 200

@analytics_bp.route('/analytics/occupancy', methods=['GET'])
def analytics_occupancy():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = analytics_service.get_occupancy_rate(
        user_id, _parse_date(request.args.get('startDate')),
        _parse_date(request.args.get('endDate')))
    return jsonify({'success': True, **result}), 200

@analytics_bp.route('/analytics/growth', methods=['GET'])
def analytics_growth():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = analytics_service.get_growth_rate(
        user_id, _parse_date(request.args.get('startDate')),
        _parse_date(request.args.get('endDate')))
    return jsonify({'success': True, **result}), 200

@analytics_bp.route('/analytics/retention', methods=['GET'])
def analytics_retention():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = analytics_service.get_retention_metrics(user_id)
    return jsonify({'success': True, **result}), 200
