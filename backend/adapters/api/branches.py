"""Flask Blueprint for branches routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.branch_service import BranchService

branches_bp = Blueprint('branches', __name__)

branch_service = BranchService()
logger = get_logger("routes.branches")

@branches_bp.route('/branches', methods=['GET', 'POST'])
def branches():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = branch_service.create_branch(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = branch_service.get_branches(user_id)
    return jsonify({'success': True, 'branches': result}), 200

@branches_bp.route('/branches/<int:branch_id>/deactivate', methods=['POST'])
def deactivate_branch(branch_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.deactivate_branch(branch_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@branches_bp.route('/branches/<int:branch_id>/reactivate', methods=['POST'])
def reactivate_branch(branch_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.reactivate_branch(branch_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@branches_bp.route('/transfers', methods=['GET', 'POST'])
def transfers():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = branch_service.create_transfer(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = branch_service.get_transfers(user_id)
    return jsonify({'success': True, 'transfers': result}), 200

@branches_bp.route('/transfers/pending', methods=['GET'])
def pending_transfers():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.get_pending_transfers(user_id)
    return jsonify({'success': True, 'transfers': result}), 200

@branches_bp.route('/transfers/<int:transfer_id>/approve', methods=['POST'])
def approve_transfer(transfer_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.approve_transfer(transfer_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@branches_bp.route('/transfers/<int:transfer_id>/reject', methods=['POST'])
def reject_transfer(transfer_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.reject_transfer(transfer_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@branches_bp.route('/transfers/<int:transfer_id>/ship', methods=['POST'])
def ship_transfer(transfer_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.ship_transfer(transfer_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@branches_bp.route('/transfers/<int:transfer_id>/complete', methods=['POST'])
def complete_transfer(transfer_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.complete_transfer(transfer_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@branches_bp.route('/transfers/<int:transfer_id>/cancel', methods=['POST'])
def cancel_transfer(transfer_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = branch_service.cancel_transfer(transfer_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@branches_bp.route('/branches/consolidated-report', methods=['GET'])
def consolidated_report():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    from datetime import date as dt_date
    start = request.args.get('startDate')
    end = request.args.get('endDate')
    start = dt_date.fromisoformat(start) if start else None
    end = dt_date.fromisoformat(end) if end else None
    result = branch_service.get_consolidated_report(user_id, start, end)
    return jsonify({'success': True, 'report': result}), 200
