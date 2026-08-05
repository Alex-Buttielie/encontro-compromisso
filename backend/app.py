"""Flask REST API for Profissional OS."""
import logging
import os
import time
from datetime import datetime
from flask import Flask, request, jsonify, current_app
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, HTTPException

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from flask_socketio import SocketIO, emit, join_room

from config import Config
from database import init_app
from logger import get_logger, setup_logging

from adapters.api import (
    auth_bp, clients_bp, services_bp, appointments_bp,
    transactions_bp, works_bp, payments_bp, wallet_bp,
    packages_bp, giftcards_bp, loyalty_bp, crm_bp,
    erp_bp, inventory_bp, marketing_bp, analytics_bp,
    employees_bp, commissions_bp, branches_bp, social_bp,
    chat_bp, notifications_bp, homecare_bp, documents_bp,
    quotes_bp, checkin_bp, workflows_bp, subscriptions_bp,
    referrals_bp, ai_agents_bp, admin_bp, public_api_bp,
    lgpd_bp, cep_bp,
)

ALL_BLUEPRINTS = [
    auth_bp, clients_bp, services_bp, appointments_bp,
    transactions_bp, works_bp, payments_bp, wallet_bp,
    packages_bp, giftcards_bp, loyalty_bp, crm_bp,
    erp_bp, inventory_bp, marketing_bp, analytics_bp,
    employees_bp, commissions_bp, branches_bp, social_bp,
    chat_bp, notifications_bp, homecare_bp, documents_bp,
    quotes_bp, checkin_bp, workflows_bp, subscriptions_bp,
    referrals_bp, ai_agents_bp, admin_bp, public_api_bp,
    lgpd_bp, cep_bp,
]


def create_app(config_overrides=None):
    """Application factory."""
    setup_logging()

    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_DSN'),
        integrations=[FlaskIntegration()],
        traces_sample_rate=1.0 if os.environ.get('FLASK_DEBUG') else 0.1,
        environment=os.environ.get('SENTRY_ENV', 'development'),
    )

    app = Flask(__name__)
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)
    app.logger = get_logger(__name__)
    CORS(
        app,
        origins=Config.CORS_ORIGINS,
        supports_credentials=True,
        allow_headers=['Content-Type', 'Authorization'],
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    )
    init_app(app)
    from composition_root import wire_adapters
    wire_adapters(app)
    register_request_logging(app)
    register_error_handlers(app)
    register_dev_error_routes(app)
    register_blueprints(app)

    socketio = SocketIO(app, cors_allowed_origins=Config.CORS_ORIGINS, async_mode='threading')
    register_socket_events(socketio)
    app.socketio = socketio

    return app


def register_blueprints(app):
    """Register all API Blueprints."""
    for bp in ALL_BLUEPRINTS:
        app.register_blueprint(bp, url_prefix='/api')


def register_error_handlers(app):
    """Register error handlers."""
    logger = get_logger('app.errors')
    from domain.exceptions import DomainError
    from utils.error_log_store import log_error

    @app.errorhandler(BadRequest)
    def handle_bad_request(e):
        logger.warning('Bad request: %s', e)
        log_error(e, request, status_code=400)
        return jsonify({'success': False, 'errors': ['Dados inválidos']}), 400

    @app.errorhandler(DomainError)
    def handle_domain_error(e):
        logger.warning('Domain error: %s', e)
        log_error(e, request, status_code=400)
        return jsonify({'success': False, 'errors': e.errors}), 400

    @app.errorhandler(Exception)
    def handle_unexpected_error(e):
        if isinstance(e, HTTPException):
            return e
        logger.exception('Unhandled error on %s %s: %s', request.method, request.path, e)
        log_error(e, request, status_code=500)
        return jsonify({'success': False, 'errors': ['Erro interno no servidor']}), 500


def register_dev_error_routes(app):
    """Register development-only error log inspection endpoints."""
    import os
    from utils.error_log_store import get_errors, clear_errors

    is_dev = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')
    if not is_dev:
        return

    @app.route('/api/dev/errors', methods=['GET'])
    def list_error_logs():
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        error_type = request.args.get('type')
        errors, total = get_errors(limit=limit, offset=offset, error_type=error_type)
        return jsonify({'success': True, 'errors_log': errors, 'total': total,
                        'limit': limit, 'offset': offset})

    @app.route('/api/dev/errors', methods=['DELETE'])
    def clear_error_logs():
        clear_errors()
        return jsonify({'success': True, 'message': 'Error logs cleared'})


def register_socket_events(socketio):
    """Register WebSocket event handlers."""

    @socketio.on('connect')
    def on_connect():
        from adapters.api.helpers import get_current_user_id
        user_id = get_current_user_id()
        if user_id:
            join_room(f'user_{user_id}')

    @socketio.on('join_conversation')
    def on_join(data):
        if data and data.get('conversationId'):
            join_room(f'conversation_{data["conversationId"]}')


def register_request_logging(app):
    """Register before/after request hooks for access and performance logs."""
    logger = get_logger('app.requests')

    @app.before_request
    def log_request_start():
        request.start_time = time.time()
        from adapters.api.helpers import get_current_user_id
        logger.info(
            'IN  %s %s | user_id=%s | ip=%s',
            request.method,
            request.path,
            get_current_user_id() or 'anonymous',
            request.remote_addr
        )

    @app.after_request
    def log_request_end(response):
        duration_ms = (time.time() - getattr(request, 'start_time', time.time())) * 1000
        from adapters.api.helpers import get_current_user_id
        logger.info(
            'OUT %s %s | status=%s | duration=%.2fms | user_id=%s',
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            get_current_user_id() or 'anonymous'
        )
        return response


# Backward-compatible re-exports
from adapters.api.helpers import get_current_user_id, paginate_list, notify_user, notify_conversation


if __name__ == '__main__':
    app = create_app()
    app.socketio.run(app, host='0.0.0.0', port=5000, debug=Config.DEBUG)

