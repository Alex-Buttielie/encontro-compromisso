"""Flask Blueprint for quotes routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.quote_service import QuoteService

quotes_bp = Blueprint('quotes', __name__)

quote_service = QuoteService()
logger = get_logger("routes.quotes")

@quotes_bp.route('/quotes', methods=['GET', 'POST'])
def quotes():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        result = quote_service.get_quotes(user_id)
        return jsonify({'success': True, 'quotes': result}), 200

    data = request.get_json(silent=True) or {}
    data['userId'] = user_id
    result = quote_service.create_quote(data)
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@quotes_bp.route('/quotes/<int:quote_id>', methods=['GET'])
def get_quote(quote_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = quote_service.get_quote(quote_id)
    if item:
        return jsonify({'success': True, 'quote': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@quotes_bp.route('/quotes/<int:quote_id>/send', methods=['POST'])
def send_quote(quote_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = quote_service.send_quote(quote_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@quotes_bp.route('/quotes/<int:quote_id>/approve', methods=['POST'])
def approve_quote(quote_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = quote_service.approve_quote(quote_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@quotes_bp.route('/quotes/<int:quote_id>/reject', methods=['POST'])
def reject_quote(quote_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = quote_service.reject_quote(quote_id, data.get('comment'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@quotes_bp.route('/quotes/<int:quote_id>/convert', methods=['POST'])
def convert_quote(quote_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = quote_service.convert_quote(quote_id, data.get('target'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@quotes_bp.route('/quotes/<int:quote_id>/comments', methods=['POST'])
def quote_comment(quote_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = quote_service.add_comment(quote_id, data.get('comment'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
