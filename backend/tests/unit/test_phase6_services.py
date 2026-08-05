"""Unit tests for Phase 6 services: WorkflowService, QuoteService, DocumentService, HomeCareService."""
import pytest

from domain.enums import (
    WorkflowTriggerType, WorkflowActionType, WorkflowStatus,
    QuoteStatus, ContractStatus,
)


class TestWorkflowService:
    def test_create_workflow(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            result = svc.create_workflow({
                'userId': 1,
                'name': 'Workflow Teste',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            assert result['success'] is True
            assert result['workflow']['name'] == 'Workflow Teste'
            assert result['workflow']['trigger'] == WorkflowTriggerType.MANUAL.value
            assert len(result['workflow']['actions']) == 1

    def test_create_workflow_invalid_trigger(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            result = svc.create_workflow({
                'userId': 1,
                'name': 'Invalid',
                'trigger': 'nonexistent_trigger',
            })
            assert result['success'] is False
            assert 'inválido' in result['errors'][0]

    def test_create_workflow_missing_name(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            result = svc.create_workflow({
                'userId': 1,
                'trigger': WorkflowTriggerType.MANUAL.value,
            })
            assert result['success'] is False

    def test_create_workflow_invalid_action(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            result = svc.create_workflow({
                'userId': 1,
                'name': 'WF',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': 'invalid_action', 'params': {}}],
            })
            assert result['success'] is False
            assert 'inválida' in result['errors'][0]

    def test_get_workflows(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            svc.create_workflow({
                'userId': 1, 'name': 'WF1',
                'trigger': WorkflowTriggerType.MANUAL.value,
            })
            wfs = svc.get_workflows(1)
            assert len(wfs) >= 1
            assert wfs[0]['name'] == 'WF1'

    def test_activate_workflow(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Activate',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            wf_id = create['workflow']['id']
            result = svc.activate(wf_id)
            assert result['success'] is True
            assert result['workflow']['status'] == WorkflowStatus.ACTIVE.value

    def test_activate_workflow_no_actions(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF No Actions',
                'trigger': WorkflowTriggerType.MANUAL.value,
            })
            wf_id = create['workflow']['id']
            result = svc.activate(wf_id)
            assert result['success'] is False

    def test_pause_workflow(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Pause',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            wf_id = create['workflow']['id']
            svc.activate(wf_id)
            result = svc.pause(wf_id)
            assert result['success'] is True
            assert result['workflow']['status'] == WorkflowStatus.PAUSED.value

    def test_trigger_workflow(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Trigger',
                'trigger': WorkflowTriggerType.APPOINTMENT_COMPLETED.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            wf_id = create['workflow']['id']
            svc.activate(wf_id)
            result = svc.trigger(
                WorkflowTriggerType.APPOINTMENT_COMPLETED.value,
                {'appointmentId': 1, 'clientId': 1},
            )
            assert result['success'] is True
            assert len(result['results']) >= 1
            assert result['results'][0]['status'] == 'completed'

    def test_trigger_workflow_idempotent(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Idempotent',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            wf_id = create['workflow']['id']
            svc.activate(wf_id)
            trigger_data = {'clientId': 1}
            svc.trigger(WorkflowTriggerType.MANUAL.value, trigger_data)
            result2 = svc.trigger(WorkflowTriggerType.MANUAL.value, trigger_data)
            assert result2['results'][0]['status'] == 'skipped'
            assert result2['results'][0]['reason'] == 'idempotent'

    def test_manual_trigger(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Manual',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_EMAIL.value, 'params': {'to': 'test@test.com'}}],
            })
            wf_id = create['workflow']['id']
            svc.activate(wf_id)
            result = svc.manual_trigger(wf_id, {'data': 'test'})
            assert result['success'] is True
            assert result['result']['status'] == 'completed'

    def test_manual_trigger_inactive(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Inactive',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            wf_id = create['workflow']['id']
            result = svc.manual_trigger(wf_id)
            assert result['success'] is False

    def test_add_action_to_workflow(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Add Action',
                'trigger': WorkflowTriggerType.MANUAL.value,
            })
            wf_id = create['workflow']['id']
            result = svc.add_action(wf_id, WorkflowActionType.SEND_SMS.value, {})
            assert result['success'] is True
            assert len(result['workflow']['actions']) == 1

    def test_add_condition_to_workflow(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Add Condition',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            wf_id = create['workflow']['id']
            from domain.enums import WorkflowConditionType
            result = svc.add_condition(wf_id, WorkflowConditionType.AMOUNT_GTE.value, {'value': 100})
            assert result['success'] is True
            assert len(result['workflow']['conditions']) == 1

    def test_get_executions(self, client, app):
        from services.workflow_service import WorkflowService
        with app.app_context():
            svc = WorkflowService()
            create = svc.create_workflow({
                'userId': 1, 'name': 'WF Exec',
                'trigger': WorkflowTriggerType.MANUAL.value,
                'actions': [{'type': WorkflowActionType.SEND_NOTIFICATION.value, 'params': {}}],
            })
            wf_id = create['workflow']['id']
            svc.activate(wf_id)
            svc.manual_trigger(wf_id, {'x': 1})
            execs = svc.get_executions(wf_id)
            assert len(execs) >= 1
            assert execs[0]['status'] == 'completed'


class TestQuoteService:
    def test_create_quote(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            result = svc.create_quote({
                'userId': 1, 'clientId': 1,
                'items': [{'description': 'Item 1', 'price': 100, 'quantity': 2}],
                'validUntil': '2026-12-31',
            })
            assert result['success'] is True
            assert result['quote']['status'] == QuoteStatus.DRAFT.value
            assert result['quote']['total'] == 200

    def test_create_quote_missing_items(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            result = svc.create_quote({
                'userId': 1, 'clientId': 1,
            })
            assert result['success'] is False

    def test_send_quote(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            create = svc.create_quote({
                'userId': 1, 'clientId': 1,
                'items': [{'description': 'Item', 'price': 50, 'quantity': 1}],
                'validUntil': '2026-12-31',
            })
            qid = create['quote']['id']
            result = svc.send_quote(qid)
            assert result['success'] is True
            assert result['quote']['status'] == QuoteStatus.SENT.value

    def test_approve_quote(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            create = svc.create_quote({
                'userId': 1, 'clientId': 1,
                'items': [{'description': 'Item', 'price': 50, 'quantity': 1}],
                'validUntil': '2026-12-31',
            })
            qid = create['quote']['id']
            svc.send_quote(qid)
            result = svc.approve_quote(qid)
            assert result['success'] is True
            assert result['quote']['status'] == QuoteStatus.APPROVED.value

    def test_reject_quote(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            create = svc.create_quote({
                'userId': 1, 'clientId': 1,
                'items': [{'description': 'Item', 'price': 50, 'quantity': 1}],
                'validUntil': '2026-12-31',
            })
            qid = create['quote']['id']
            svc.send_quote(qid)
            result = svc.reject_quote(qid, comment='Too expensive')
            assert result['success'] is True
            assert result['quote']['status'] == QuoteStatus.REJECTED.value

    def test_convert_quote(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            create = svc.create_quote({
                'userId': 1, 'clientId': 1,
                'items': [{'description': 'Item', 'price': 50, 'quantity': 1}],
                'validUntil': '2026-12-31',
            })
            qid = create['quote']['id']
            svc.send_quote(qid)
            svc.approve_quote(qid)
            result = svc.convert_quote(qid, target='appointment')
            assert result['success'] is True
            assert result['quote']['status'] == QuoteStatus.CONVERTED.value

    def test_add_comment(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            create = svc.create_quote({
                'userId': 1, 'clientId': 1,
                'items': [{'description': 'Item', 'price': 50, 'quantity': 1}],
                'validUntil': '2026-12-31',
            })
            qid = create['quote']['id']
            result = svc.add_comment(qid, 'Can you discount?')
            assert result['success'] is True
            assert len(result['quote']['comments']) == 1

    def test_get_quotes(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            svc.create_quote({
                'userId': 1, 'clientId': 1,
                'items': [{'description': 'Item', 'price': 50, 'quantity': 1}],
                'validUntil': '2026-12-31',
            })
            quotes = svc.get_quotes(1)
            assert len(quotes) >= 1

    def test_send_quote_not_found(self, client, app):
        from services.quote_service import QuoteService
        with app.app_context():
            svc = QuoteService()
            result = svc.send_quote(9999)
            assert result['success'] is False
            assert 'não encontrado' in result['errors'][0]


class TestDocumentService:
    def test_create_contract(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            result = svc.create_contract({
                'userId': 1, 'clientId': 1,
                'title': 'Contrato Teste',
                'body': 'Este é um contrato de teste.',
            })
            assert result['success'] is True
            assert result['contract']['title'] == 'Contrato Teste'
            assert result['contract']['status'] == ContractStatus.DRAFT.value

    def test_create_contract_missing_title(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            result = svc.create_contract({
                'userId': 1, 'body': 'Sem título',
            })
            assert result['success'] is False

    def test_send_contract(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            create = svc.create_contract({
                'userId': 1, 'title': 'C', 'body': 'Body',
            })
            cid = create['contract']['id']
            result = svc.send_contract(cid)
            assert result['success'] is True
            assert result['contract']['status'] == ContractStatus.SENT.value

    def test_sign_contract(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            create = svc.create_contract({
                'userId': 1, 'title': 'C', 'body': 'Body',
            })
            cid = create['contract']['id']
            svc.send_contract(cid)
            result = svc.sign_contract(cid, ip='127.0.0.1', user_agent='test')
            assert result['success'] is True
            assert result['contract']['status'] == ContractStatus.SIGNED.value

    def test_activate_contract(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            create = svc.create_contract({
                'userId': 1, 'title': 'C', 'body': 'Body',
            })
            cid = create['contract']['id']
            svc.send_contract(cid)
            svc.sign_contract(cid, ip='127.0.0.1', user_agent='test')
            result = svc.activate_contract(cid)
            assert result['success'] is True
            assert result['contract']['status'] == ContractStatus.ACTIVE.value

    def test_terminate_contract(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            create = svc.create_contract({
                'userId': 1, 'title': 'C', 'body': 'Body',
            })
            cid = create['contract']['id']
            svc.send_contract(cid)
            svc.sign_contract(cid, ip='127.0.0.1', user_agent='test')
            svc.activate_contract(cid)
            result = svc.terminate_contract(cid)
            assert result['success'] is True
            assert result['contract']['status'] == ContractStatus.TERMINATED.value

    def test_new_version(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            create = svc.create_contract({
                'userId': 1, 'title': 'C', 'body': 'Body v1',
            })
            cid = create['contract']['id']
            result = svc.new_version(cid, body='Body v2')
            assert result['success'] is True
            assert result['contract']['version'] == 2

    def test_get_contracts(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            svc.create_contract({'userId': 1, 'title': 'C1', 'body': 'B1'})
            svc.create_contract({'userId': 1, 'title': 'C2', 'body': 'B2'})
            contracts = svc.get_contracts(1)
            assert len(contracts) >= 2

    def test_send_contract_not_found(self, client, app):
        from services.document_service import DocumentService
        with app.app_context():
            svc = DocumentService()
            result = svc.send_contract(9999)
            assert result['success'] is False


class TestHomeCareService:
    def test_create_service_area(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            result = svc.create_service_area({
                'userId': 1, 'radiusKm': 10,
                'baseLat': -23.5, 'baseLng': -46.6,
            })
            assert result['success'] is True
            assert result['serviceArea']['radiusKm'] == 10

    def test_create_service_area_invalid_radius(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            result = svc.create_service_area({
                'userId': 1, 'radiusKm': -5,
                'baseLat': -23.5, 'baseLng': -46.6,
            })
            assert result['success'] is False

    def test_get_service_area(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            svc.create_service_area({
                'userId': 1, 'radiusKm': 15,
                'baseLat': -23.5, 'baseLng': -46.6,
            })
            area = svc.get_service_area(1)
            assert area is not None
            assert area['radiusKm'] == 15

    def test_get_service_area_not_configured(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            area = svc.get_service_area(999)
            assert area is None

    def test_check_coverage_within(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            svc.create_service_area({
                'userId': 1, 'radiusKm': 10,
                'baseLat': -23.5, 'baseLng': -46.6,
            })
            result = svc.check_coverage(1, -23.5, -46.6)
            assert result['within'] is True

    def test_check_coverage_outside(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            svc.create_service_area({
                'userId': 1, 'radiusKm': 5,
                'baseLat': -23.5, 'baseLng': -46.6,
            })
            result = svc.check_coverage(1, -23.0, -46.0)
            assert result['within'] is False

    def test_check_coverage_no_area(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            result = svc.check_coverage(999, -23.5, -46.6)
            assert result['within'] is False
            assert result['reason'] == 'no_service_area'

    def test_estimate_travel(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            svc.create_service_area({
                'userId': 1, 'radiusKm': 20,
                'baseLat': -23.5, 'baseLng': -46.6,
            })
            result = svc.estimate_travel(1, -23.5, -46.6)
            assert result['success'] is True
            assert 'distance_km' in result
            assert 'travel_time_min' in result

    def test_estimate_travel_no_area(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            result = svc.estimate_travel(999, -23.5, -46.6)
            assert result['success'] is False

    def test_check_schedule_conflict_no_area(self, client, app):
        from services.homecare_service import HomeCareService
        with app.app_context():
            svc = HomeCareService()
            result = svc.check_schedule_conflict(999, [], {})
            assert result['conflict'] is False
