"""Flask Blueprint for works routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.work_service import WorkService

works_bp = Blueprint('works', __name__)

work_service = WorkService()
logger = get_logger("routes.works")

@works_bp.route('/works', methods=['GET', 'POST'])
def works():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        result = work_service.create_work(user_id, data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = work_service.get_works_by_provider(user_id)
    return jsonify({'success': True, **paginate_list(result, 'works')}), 200

@works_bp.route('/works/<int:work_id>', methods=['GET', 'PUT', 'DELETE'])
def work_detail(work_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        work = work_service.get_work_by_id(work_id)
        if work:
            return jsonify({'success': True, 'work': work}), 200
        return jsonify({'success': False, 'errors': ['Trabalho não encontrado']}), 404

    if request.method == 'PUT':
        data = request.get_json(silent=True) or {}
        result = work_service.update_work(work_id, user_id, data)
        if result['success']:
            return jsonify(result), 200
        return jsonify(result), 400

    result = work_service.delete_work(work_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 404

@works_bp.route('/works/explore', methods=['GET'])
def explore_works():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    search = request.args.get('search', '')
    result = work_service.get_active_works(search=search or None)
    return jsonify({'success': True, 'works': result}), 200

@works_bp.route('/work-orders', methods=['POST'])
def create_work_order():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    data = request.get_json(silent=True) or {}
    result = work_service.create_order(
        work_id=data.get('workId'),
        client_user_id=user_id,
        field_data=data.get('fieldData', {}),
        notes=data.get('notes', ''),
    )
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@works_bp.route('/work-orders/received', methods=['GET'])
def received_orders():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = work_service.get_orders_by_provider(user_id)
    return jsonify({'success': True, **paginate_list(result, 'orders')}), 200

@works_bp.route('/work-orders/placed', methods=['GET'])
def placed_orders():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    result = work_service.get_orders_by_client(user_id)
    return jsonify({'success': True, **paginate_list(result, 'orders')}), 200

@works_bp.route('/work-orders/<int:order_id>/accept', methods=['POST'])
def accept_order(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    request.get_json(silent=True)
    result = work_service.accept_order(order_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@works_bp.route('/work-orders/<int:order_id>/reject', methods=['POST'])
def reject_order(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    request.get_json(silent=True)
    result = work_service.reject_order(order_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@works_bp.route('/work-orders/<int:order_id>/complete', methods=['POST'])
def complete_order(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    request.get_json(silent=True)
    result = work_service.complete_order(order_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@works_bp.route('/work-orders/<int:order_id>/cancel', methods=['POST'])
def cancel_order(order_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401
    request.get_json(silent=True)
    result = work_service.cancel_order(order_id, user_id, is_provider=False)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
