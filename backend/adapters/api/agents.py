"""Flask Blueprint for agents routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.ai_agent_service import AIAgentService

agents_bp = Blueprint('agents', __name__)

ai_agent_service = AIAgentService()
logger = get_logger("routes.agents")

@agents_bp.route('/agents', methods=['GET', 'POST'])
def agents():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = ai_agent_service.configure_agent(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = ai_agent_service.get_agents(user_id)
    return jsonify({'success': True, 'agents': result}), 200

@agents_bp.route('/agents/<int:agent_id>', methods=['GET'])
def get_agent(agent_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    item = ai_agent_service.get_agent(agent_id)
    if item:
        return jsonify({'success': True, 'agent': item}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@agents_bp.route('/agents/<int:agent_id>/enable', methods=['POST'])
def enable_agent(agent_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.enable_agent(agent_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/<int:agent_id>/disable', methods=['POST'])
def disable_agent(agent_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.disable_agent(agent_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/<int:agent_id>/pause', methods=['POST'])
def pause_agent(agent_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.pause_agent(agent_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/<int:agent_id>/consent', methods=['POST'])
def set_agent_consent(agent_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.set_consent(agent_id, data.get('consentGiven', False))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/execute', methods=['POST'])
def execute_agent():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.execute(user_id, data.get('agentType'), data.get('prompt'), data.get('context', {}))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/executions/<int:execution_id>', methods=['GET'])
def get_agent_execution(execution_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = ai_agent_service.get_execution(execution_id)
    if result:
        return jsonify({'success': True, 'execution': result}), 200
    return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

@agents_bp.route('/agents/executions', methods=['GET'])
def list_agent_executions():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = ai_agent_service.get_executions(user_id, request.args.get('agentType'), int(request.args.get('limit', 50)))
    return jsonify({'success': True, 'executions': result}), 200

@agents_bp.route('/agents/executions/<int:execution_id>/propose-action', methods=['POST'])
def propose_agent_action(execution_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.propose_action(execution_id, data.get('actionType'), data.get('payload', {}))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/executions/<int:execution_id>/approve', methods=['POST'])
def approve_agent_action(execution_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.approve_action(execution_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/executions/<int:execution_id>/reject', methods=['POST'])
def reject_agent_action(execution_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = ai_agent_service.reject_action(execution_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@agents_bp.route('/agents/audit', methods=['GET'])
def agent_audit_trail():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = ai_agent_service.get_audit_trail(user_id, int(request.args.get('limit', 50)))
    return jsonify({'success': True, 'auditTrail': result}), 200

@agents_bp.route('/agents/usage', methods=['GET'])
def agent_usage_stats():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = ai_agent_service.get_usage_stats(user_id)
    return jsonify({'success': True, 'agents': result}), 200
