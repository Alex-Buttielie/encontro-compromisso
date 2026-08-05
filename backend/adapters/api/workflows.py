"""Flask Blueprint for workflows routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.workflow_service import WorkflowService

workflows_bp = Blueprint('workflows', __name__)

workflow_service = WorkflowService()
logger = get_logger("routes.workflows")

@workflows_bp.route('/workflows', methods=['GET', 'POST'])
def workflows():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = workflow_service.create_workflow(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = workflow_service.get_workflows(user_id)
    return jsonify({'success': True, 'workflows': result}), 200

@workflows_bp.route('/workflows/<int:workflow_id>', methods=['GET'])
def get_workflow(workflow_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = workflow_service.get_workflow(workflow_id)
    if item:
        return jsonify({'success': True, 'workflow': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@workflows_bp.route('/workflows/<int:workflow_id>/activate', methods=['POST'])
def activate_workflow(workflow_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = workflow_service.activate(workflow_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@workflows_bp.route('/workflows/<int:workflow_id>/pause', methods=['POST'])
def pause_workflow(workflow_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = workflow_service.pause(workflow_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@workflows_bp.route('/workflows/<int:workflow_id>/trigger', methods=['POST'])
def trigger_workflow(workflow_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = workflow_service.manual_trigger(workflow_id, data.get('triggerData', {}))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@workflows_bp.route('/workflows/<int:workflow_id>/executions', methods=['GET'])
def workflow_executions(workflow_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = workflow_service.get_executions(workflow_id)
    return jsonify({'success': True, 'executions': result}), 200

@workflows_bp.route('/workflows/trigger/<trigger_type>', methods=['POST'])
def trigger_by_type(trigger_type):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = workflow_service.trigger(trigger_type, data.get('triggerData', {}))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400
