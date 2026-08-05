"""Workflow Builder service — safe, auditable, idempotent automation engine."""
import hashlib
from logger import get_logger
from domain.exceptions import DomainError, WorkflowError
from repositories.phase6_repository import WorkflowRepository, WorkflowExecutionRepository


class WorkflowService:
    def __init__(self, wf_repo=None, exec_repo=None):
        self.wf_repo = wf_repo or WorkflowRepository()
        self.exec_repo = exec_repo or WorkflowExecutionRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_workflow(self, data):
        from models import Workflow
        try:
            wf = Workflow.create(
                user_id=data['userId'],
                name=data.get('name'),
                trigger=data.get('trigger'),
                description=data.get('description', ''),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        # Add actions and conditions
        try:
            for action in data.get('actions', []):
                wf.add_action(action.get('type'), action.get('params', {}))
            for cond in data.get('conditions', []):
                wf.add_condition(cond.get('type'), cond.get('params', {}))
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.wf_repo.add(wf)
        return {'success': True, 'workflow': wf.to_dict()}

    def get_workflows(self, user_id):
        wfs = self.wf_repo.find_by_user_id(user_id)
        return [w.to_dict() for w in wfs]

    def get_workflow(self, workflow_id):
        wf = self.wf_repo.get_by_id(workflow_id)
        if not wf:
            return None
        return wf.to_dict()

    def add_action(self, workflow_id, action_type, params=None):
        wf = self.wf_repo.get_by_id(workflow_id)
        if not wf:
            return {'success': False, 'errors': ['Workflow não encontrado']}
        try:
            wf.add_action(action_type, params or {})
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.wf_repo.save(wf)
        return {'success': True, 'workflow': wf.to_dict()}

    def add_condition(self, workflow_id, condition_type, params=None):
        wf = self.wf_repo.get_by_id(workflow_id)
        if not wf:
            return {'success': False, 'errors': ['Workflow não encontrado']}
        try:
            wf.add_condition(condition_type, params or {})
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.wf_repo.save(wf)
        return {'success': True, 'workflow': wf.to_dict()}

    def activate(self, workflow_id):
        wf = self.wf_repo.get_by_id(workflow_id)
        if not wf:
            return {'success': False, 'errors': ['Workflow não encontrado']}
        try:
            wf.validate()
        except WorkflowError as e:
            return {'success': False, 'errors': e.errors}
        wf.activate()
        self.wf_repo.save(wf)
        return {'success': True, 'workflow': wf.to_dict()}

    def pause(self, workflow_id):
        wf = self.wf_repo.get_by_id(workflow_id)
        if not wf:
            return {'success': False, 'errors': ['Workflow não encontrado']}
        wf.pause()
        self.wf_repo.save(wf)
        return {'success': True, 'workflow': wf.to_dict()}

    def trigger(self, trigger_type, trigger_data):
        """Trigger all active workflows matching the trigger type."""
        wfs = self.wf_repo.find_by_trigger(trigger_type)
        results = []
        for wf in wfs:
            result = self._execute(wf, trigger_data)
            results.append(result)
        return {'success': True, 'results': results}

    def _execute(self, wf, trigger_data):
        """Execute a single workflow with idempotency and loop protection."""
        # Idempotency: generate key from workflow + trigger data
        key_str = f'{wf.id}:{hashlib.sha256(str(trigger_data).encode()).hexdigest()[:16]}'
        existing = self.exec_repo.find_by_idempotency_key(key_str)
        if existing and existing.status == 'completed':
            self.logger.info(f'Workflow {wf.id} already executed for this trigger (idempotent)')
            return {'workflowId': wf.id, 'status': 'skipped', 'reason': 'idempotent'}

        # Loop protection
        if not wf.can_execute():
            self.logger.warning(f'Workflow {wf.id} exceeded execution limit')
            return {'workflowId': wf.id, 'status': 'skipped', 'reason': 'rate_limit'}

        from models import WorkflowExecution
        execution = WorkflowExecution.create(
            workflow_id=wf.id,
            trigger_data=trigger_data,
            idempotency_key=key_str,
        )
        self.exec_repo.add(execution)
        execution.start()
        self.exec_repo.save(execution)

        try:
            # Evaluate conditions
            conditions = wf.get_conditions()
            should_run = self._evaluate_conditions(conditions, trigger_data)
            if not should_run:
                execution.skip(reason='conditions_not_met')
                self.exec_repo.save(execution)
                wf.record_execution()
                self.wf_repo.save(wf)
                return {'workflowId': wf.id, 'status': 'skipped',
                        'reason': 'conditions_not_met'}

            # Execute actions
            actions = wf.get_actions()
            action_results = []
            for action in actions:
                result = self._execute_action(action, trigger_data)
                action_results.append(result)

            execution.complete(result={'actions': action_results})
            self.exec_repo.save(execution)
            wf.record_execution()
            self.wf_repo.save(wf)
            return {'workflowId': wf.id, 'status': 'completed',
                    'actions': action_results}

        except Exception as e:
            execution.fail(error=str(e))
            self.exec_repo.save(execution)
            wf.record_execution()
            self.wf_repo.save(wf)
            return {'workflowId': wf.id, 'status': 'failed', 'error': str(e)}

    def _evaluate_conditions(self, conditions, trigger_data):
        """Evaluate all conditions. Returns True if all pass."""
        for cond in conditions:
            cond_type = cond.get('type')
            params = cond.get('params', {})
            if not self._evaluate_condition(cond_type, params, trigger_data):
                return False
        return True

    def _evaluate_condition(self, cond_type, params, trigger_data):
        from domain.enums import WorkflowConditionType
        if cond_type == WorkflowConditionType.RATING_GTE.value:
            rating = trigger_data.get('rating', 0)
            return rating >= params.get('value', 0)
        elif cond_type == WorkflowConditionType.RATING_LTE.value:
            rating = trigger_data.get('rating', 0)
            return rating <= params.get('value', 0)
        elif cond_type == WorkflowConditionType.CLIENT_TAG_IS.value:
            return trigger_data.get('clientTag') == params.get('value')
        elif cond_type == WorkflowConditionType.SERVICE_IS.value:
            return trigger_data.get('serviceId') == params.get('value')
        elif cond_type == WorkflowConditionType.BRANCH_IS.value:
            return trigger_data.get('branchId') == params.get('value')
        elif cond_type == WorkflowConditionType.AMOUNT_GTE.value:
            return trigger_data.get('amount', 0) >= params.get('value', 0)
        elif cond_type == WorkflowConditionType.AMOUNT_LTE.value:
            return trigger_data.get('amount', 0) <= params.get('value', 0)
        elif cond_type == WorkflowConditionType.DAY_OF_WEEK.value:
            from datetime import date as dt_date
            d = trigger_data.get('date')
            if isinstance(d, str):
                d = dt_date.fromisoformat(d)
            return str(d.weekday()) in params.get('days', [])
        elif cond_type == WorkflowConditionType.TIME_RANGE.value:
            from datetime import time as dt_time
            t = trigger_data.get('time')
            start = params.get('start')
            end = params.get('end')
            if t and start and end:
                return start <= t <= end
            return True
        return True

    def _execute_action(self, action, trigger_data):
        """Execute a single workflow action (mock implementations)."""
        from domain.enums import WorkflowActionType
        action_type = action.get('type')
        params = action.get('params', {})
        self.logger.info(f'Executing action: {action_type} with params: {params}')

        if action_type == WorkflowActionType.SEND_NOTIFICATION.value:
            return {'action': action_type, 'status': 'sent',
                    'title': params.get('title', 'Notification')}
        elif action_type == WorkflowActionType.SEND_EMAIL.value:
            return {'action': action_type, 'status': 'sent',
                    'to': params.get('to', 'user@example.com')}
        elif action_type == WorkflowActionType.SEND_SMS.value:
            return {'action': action_type, 'status': 'sent'}
        elif action_type == WorkflowActionType.SEND_SURVEY.value:
            return {'action': action_type, 'status': 'sent',
                    'template': params.get('template', 'nps')}
        elif action_type == WorkflowActionType.REQUEST_REVIEW.value:
            return {'action': action_type, 'status': 'requested'}
        elif action_type == WorkflowActionType.CREATE_APPOINTMENT.value:
            return {'action': action_type, 'status': 'created'}
        elif action_type == WorkflowActionType.CREATE_TASK.value:
            return {'action': action_type, 'status': 'created',
                    'description': params.get('description', '')}
        elif action_type == WorkflowActionType.UPDATE_CLIENT_TAG.value:
            return {'action': action_type, 'status': 'updated',
                    'tag': params.get('tag', '')}
        elif action_type == WorkflowActionType.GENERATE_DOCUMENT.value:
            return {'action': action_type, 'status': 'generated'}
        elif action_type == WorkflowActionType.WEBHOOK.value:
            return {'action': action_type, 'status': 'called',
                    'url': params.get('url', '')}
        return {'action': action_type, 'status': 'unknown'}

    def get_executions(self, workflow_id):
        execs = self.exec_repo.find_by_workflow(workflow_id)
        return [e.to_dict() for e in execs]

    def manual_trigger(self, workflow_id, trigger_data=None):
        """Manually trigger a workflow."""
        wf = self.wf_repo.get_by_id(workflow_id)
        if not wf:
            return {'success': False, 'errors': ['Workflow não encontrado']}
        if wf.status != 'active':
            return {'success': False, 'errors': ['Workflow não está ativo']}
        result = self._execute(wf, trigger_data or {})
        return {'success': True, 'result': result}
