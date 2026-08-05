"""Flask Blueprint for public_api routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from models import User
from services.public_api_service import PublicApiService, sanitize_input

public_api_bp = Blueprint('public_api', __name__)

public_api_service = PublicApiService()
logger = get_logger("routes.public_api")

@public_api_bp.route('/api-keys', methods=['GET', 'POST'])
def api_keys():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        result = public_api_service.get_api_keys(user_id)
        return jsonify({'success': True, 'apiKeys': result}), 200

    data = request.get_json(silent=True) or {}
    result = public_api_service.create_api_key(user_id, data.get('name'), data.get('scopes', []))
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@public_api_bp.route('/api-keys/<int:key_id>/revoke', methods=['POST'])
def revoke_api_key(key_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = public_api_service.revoke_api_key(user_id, key_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@public_api_bp.route('/webhooks', methods=['GET', 'POST'])
def webhooks():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        result = public_api_service.get_webhooks(user_id)
        return jsonify({'success': True, 'webhooks': result}), 200

    data = request.get_json(silent=True) or {}
    result = public_api_service.create_webhook(user_id, data.get('url'), data.get('events', []))
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@public_api_bp.route('/webhooks/<int:webhook_id>/disable', methods=['POST'])
def disable_webhook(webhook_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = public_api_service.disable_webhook(user_id, webhook_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@public_api_bp.route('/v1/health', methods=['GET'])
def public_api_health():
    return jsonify({'success': True, 'status': 'ok', 'version': 'v1'}), 200

@public_api_bp.route('/v1/users', methods=['GET'])
def public_api_users():
    api_key_str = request.headers.get('X-API-Key', '')
    api_key = public_api_service.authenticate(api_key_str)
    if not api_key:
        return jsonify({'success': False, 'errors': ['API key inválida']}), 401
    if not public_api_service.check_rate_limit(api_key.id):
        return jsonify({'success': False, 'errors': ['Rate limit excedido']}), 429
    try:
        public_api_service.check_scope(api_key, 'read:users')
    except Exception as e:
        return jsonify({'success': False, 'errors': [str(e)]}), 403
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('perPage', 20))
    from database import get_db
    offset = (page - 1) * per_page
    docs = get_db().collection('user').limit(per_page + 1).offset(offset).stream()
    items = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        items.append(data)
    has_more = len(items) > per_page
    users = [{
        'id': u.get('id'), 'name': u.get('name'), 'email': u.get('email'), 'role': u.get('role'),
    } for u in items[:per_page]]
    return jsonify({
        'success': True, 'data': users,
        'page': page, 'perPage': per_page,
        'total': None,
        'hasMore': has_more,
    }), 200

@public_api_bp.route('/docs/openapi.json', methods=['GET'])
def openapi_spec():
    spec = {
        'openapi': '3.0.0',
        'info': {
            'title': 'Profissional OS API',
            'version': '1.0.0',
            'description': 'API pública do Profissional OS',
        },
        'servers': [{'url': '/api/v1'}],
        'paths': {
            '/health': {'get': {'summary': 'Health check'}},
            '/users': {'get': {
                'summary': 'List users',
                'security': [{'ApiKeyAuth': ['read:users']}],
            }},
        },
        'components': {
            'securitySchemes': {
                'ApiKeyAuth': {
                    'type': 'apiKey',
                    'in': 'header',
                    'name': 'X-API-Key',
                },
            },
        },
    }
    return jsonify(spec), 200
