"""Flask Blueprint for inventory routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.inventory_service import InventoryService

inventory_bp = Blueprint('inventory', __name__)

inventory_service = InventoryService()
logger = get_logger("routes.inventory")

@inventory_bp.route('/inventory/suppliers', methods=['GET', 'POST'])
def suppliers():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = inventory_service.create_supplier(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = inventory_service.get_suppliers(user_id)
    return jsonify({'success': True, 'suppliers': result}), 200

@inventory_bp.route('/inventory/products', methods=['GET', 'POST'])
def products():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = inventory_service.create_product(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = inventory_service.get_products(user_id)
    return jsonify({'success': True, 'products': result}), 200

@inventory_bp.route('/inventory/products/<int:product_id>/add-stock', methods=['POST'])
def add_stock(product_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = inventory_service.add_stock(product_id, data.get('quantity'), data.get('reason', 'Entrada de estoque'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@inventory_bp.route('/inventory/products/<int:product_id>/consume', methods=['POST'])
def consume_stock(product_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = inventory_service.consume_stock(product_id, data.get('quantity'), data.get('reason', 'Consumo por serviço'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@inventory_bp.route('/inventory/alerts', methods=['GET'])
def stock_alerts():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = inventory_service.get_low_stock_alerts(user_id)
    return jsonify({'success': True, 'alerts': result}), 200

@inventory_bp.route('/inventory/movements', methods=['GET'])
def stock_movements():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    product_id = request.args.get('productId', type=int)
    result = inventory_service.get_movements(product_id)
    return jsonify({'success': True, 'movements': result}), 200
