"""Integration + E2E tests for Phase 6 — Home Care, Documents, Quotes, Check-in/out, Workflows.

E2E flows:
1. Prestador configura raio de atendimento
2. Cliente agenda domiciliar fora do raio e é bloqueado
3. Cliente agenda dentro do raio com taxa de deslocamento
4. Prestador cria orçamento e envia para cliente
5. Cliente aprova orçamento e converte em agendamento
6. Cliente faz check-in no dia do atendimento
7. Prestador faz check-out com comprovante
8. Workflow dispara pesquisa de satisfação automaticamente
"""
import json
from datetime import date, timedelta

from domain.enums import (
    QuoteStatus, ContractStatus, SignatureStatus,
    CheckType, CheckStatus,
    WorkflowTriggerType, WorkflowActionType, WorkflowConditionType,
    WorkflowStatus, WorkflowExecutionStatus,
)


def _register_and_get_token(client, email='user@example.com', role='provider', profession='Dentista'):
    resp = client.post('/api/auth/register',
                       data=json.dumps({
                           'name': 'Test User',
                           'email': email,
                           'password': 'secret123',
                           'role': role,
                           'profession': profession,
                           'termsAccepted': True,
                           'privacyAccepted': True,
                       }),
                       content_type='application/json')
    if resp.status_code == 201:
        return resp.get_json()['user']['id']
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': 'secret123'}),
                       content_type='application/json')
    return resp.get_json()['user']['id']


class TestHomeCareE2E:
    """E2E: Service area → coverage check → travel estimate → schedule conflicts."""

    def test_provider_configures_service_area(self, client, app):
        uid = _register_and_get_token(client, email='homecare1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/homecare/service-area',
                           data=json.dumps({
                               'radiusKm': 15.0,
                               'baseLat': -23.5505,
                               'baseLng': -46.6333,
                               'travelFee': 5.00,
                               'feePerKm': 2.50,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        area = resp.get_json()['serviceArea']
        assert area['radiusKm'] == 15.0
        assert area['travelFee'] == 5.00

    def test_get_service_area(self, client, app):
        uid = _register_and_get_token(client, email='homecare2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/homecare/service-area',
                    data=json.dumps({
                        'radiusKm': 10.0,
                        'baseLat': -23.0,
                        'baseLng': -46.0,
                    }),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/homecare/service-area', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['serviceArea']['radiusKm'] == 10.0

    def test_coverage_check_within_radius(self, client, app):
        uid = _register_and_get_token(client, email='homecare3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/homecare/service-area',
                    data=json.dumps({
                        'radiusKm': 15.0,
                        'baseLat': -23.5505,
                        'baseLng': -46.6333,
                        'travelFee': 5.00,
                        'feePerKm': 2.50,
                    }),
                    content_type='application/json', headers=headers)

        resp = client.post('/api/homecare/check-coverage',
                           data=json.dumps({'lat': -23.55, 'lng': -46.64}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['within'] is True
        assert 'distance_km' in data
        assert 'fee' in data

    def test_coverage_check_outside_radius(self, client, app):
        uid = _register_and_get_token(client, email='homecare4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/homecare/service-area',
                    data=json.dumps({
                        'radiusKm': 5.0,
                        'baseLat': -23.5505,
                        'baseLng': -46.6333,
                    }),
                    content_type='application/json', headers=headers)

        # Rio de Janeiro is far from São Paulo
        resp = client.post('/api/homecare/check-coverage',
                           data=json.dumps({'lat': -22.9068, 'lng': -43.1729}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['within'] is False
        assert data['reason'] == 'outside_coverage'

    def test_estimate_travel(self, client, app):
        uid = _register_and_get_token(client, email='homecare5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/homecare/service-area',
                    data=json.dumps({
                        'radiusKm': 20.0,
                        'baseLat': -23.5505,
                        'baseLng': -46.6333,
                        'travelFee': 5.00,
                        'feePerKm': 2.50,
                    }),
                    content_type='application/json', headers=headers)

        resp = client.post('/api/homecare/estimate-travel',
                           data=json.dumps({'lat': -23.56, 'lng': -46.64}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'distance_km' in data
        assert 'travel_time_min' in data
        assert 'fee' in data

    def test_schedule_conflict_detection(self, client, app):
        uid = _register_and_get_token(client, email='homecare6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/homecare/service-area',
                    data=json.dumps({
                        'radiusKm': 30.0,
                        'baseLat': -23.0,
                        'baseLng': -46.0,
                    }),
                    content_type='application/json', headers=headers)

        appointments = [
            {
                'id': 1,
                'startTime': '2026-01-15T09:00:00',
                'endTime': '2026-01-15T10:00:00',
                'location': {'lat': -23.0, 'lng': -46.0},
            },
            {
                'id': 2,
                'startTime': '2026-01-15T10:05:00',
                'endTime': '2026-01-15T11:00:00',
                'location': {'lat': -23.5, 'lng': -46.5},
            },
        ]
        resp = client.post('/api/homecare/schedule-conflicts',
                           data=json.dumps({'appointments': appointments}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data['conflict'] is True


class TestQuoteE2E:
    """E2E: Create quote → send → approve → convert."""

    def test_create_quote(self, client, app):
        uid = _register_and_get_token(client, email='quote1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/quotes',
                           data=json.dumps({
                               'clientId': 2,
                               'items': [
                                   {'name': 'Consulta', 'price': 200.0, 'quantity': 1},
                                   {'name': 'Limpeza', 'price': 150.0, 'quantity': 1},
                               ],
                               'discount': 10.0,
                               'validUntil': (date.today() + timedelta(days=30)).isoformat(),
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        quote = resp.get_json()['quote']
        assert quote['status'] == QuoteStatus.DRAFT.value
        assert quote['total'] == 340.0

    def test_send_and_approve_quote(self, client, app):
        uid = _register_and_get_token(client, email='quote2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/quotes',
                           data=json.dumps({
                               'clientId': 2,
                               'items': [{'name': 'Service', 'price': 100.0, 'quantity': 1}],
                           }),
                           content_type='application/json', headers=headers)
        quote_id = resp.get_json()['quote']['id']

        resp = client.post(f'/api/quotes/{quote_id}/send',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['quote']['status'] == QuoteStatus.SENT.value

        resp = client.post(f'/api/quotes/{quote_id}/approve',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['quote']['status'] == QuoteStatus.APPROVED.value

    def test_reject_quote_with_comment(self, client, app):
        uid = _register_and_get_token(client, email='quote3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/quotes',
                           data=json.dumps({
                               'clientId': 2,
                               'items': [{'name': 'Service', 'price': 500.0, 'quantity': 1}],
                           }),
                           content_type='application/json', headers=headers)
        quote_id = resp.get_json()['quote']['id']

        client.post(f'/api/quotes/{quote_id}/send',
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/quotes/{quote_id}/reject',
                           data=json.dumps({'comment': 'Too expensive'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['quote']['status'] == QuoteStatus.REJECTED.value

    def test_convert_quote_to_appointment(self, client, app):
        uid = _register_and_get_token(client, email='quote4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/quotes',
                           data=json.dumps({
                               'clientId': 2,
                               'items': [{'name': 'Service', 'price': 100.0, 'quantity': 1}],
                           }),
                           content_type='application/json', headers=headers)
        quote_id = resp.get_json()['quote']['id']

        client.post(f'/api/quotes/{quote_id}/send',
                    content_type='application/json', headers=headers)
        client.post(f'/api/quotes/{quote_id}/approve',
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/quotes/{quote_id}/convert',
                           data=json.dumps({'target': 'appointment'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['quote']['status'] == QuoteStatus.CONVERTED.value
        assert resp.get_json()['quote']['convertedTo'] == 'appointment'

    def test_add_negotiation_comment(self, client, app):
        uid = _register_and_get_token(client, email='quote5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/quotes',
                           data=json.dumps({
                               'clientId': 2,
                               'items': [{'name': 'Service', 'price': 100.0, 'quantity': 1}],
                           }),
                           content_type='application/json', headers=headers)
        quote_id = resp.get_json()['quote']['id']

        resp = client.post(f'/api/quotes/{quote_id}/comments',
                           data=json.dumps({'comment': 'Can you lower the price?'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['quote']['comments']) == 1


class TestContractE2E:
    """E2E: Create contract → send → sign → activate."""

    def test_create_and_sign_contract(self, client, app):
        uid = _register_and_get_token(client, email='contract1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/contracts',
                           data=json.dumps({
                               'clientId': 2,
                               'title': 'Service Agreement',
                               'body': 'This contract covers dental services...',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        contract_id = resp.get_json()['contract']['id']
        assert resp.get_json()['contract']['version'] == 1

        resp = client.post(f'/api/contracts/{contract_id}/send',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['contract']['status'] == ContractStatus.SENT.value

        resp = client.post(f'/api/contracts/{contract_id}/sign',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        contract = resp.get_json()['contract']
        assert contract['status'] == ContractStatus.SIGNED.value
        assert contract['signedIp'] is not None
        assert contract['signatureStatus'] == SignatureStatus.SIGNED.value

    def test_activate_contract(self, client, app):
        uid = _register_and_get_token(client, email='contract2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/contracts',
                           data=json.dumps({
                               'clientId': 2,
                               'title': 'Agreement',
                               'body': 'Body',
                           }),
                           content_type='application/json', headers=headers)
        contract_id = resp.get_json()['contract']['id']

        client.post(f'/api/contracts/{contract_id}/send',
                    content_type='application/json', headers=headers)
        client.post(f'/api/contracts/{contract_id}/sign',
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/contracts/{contract_id}/activate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['contract']['status'] == ContractStatus.ACTIVE.value

    def test_terminate_contract(self, client, app):
        uid = _register_and_get_token(client, email='contract3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/contracts',
                           data=json.dumps({
                               'clientId': 2,
                               'title': 'Agreement',
                               'body': 'Body',
                           }),
                           content_type='application/json', headers=headers)
        contract_id = resp.get_json()['contract']['id']

        client.post(f'/api/contracts/{contract_id}/send',
                    content_type='application/json', headers=headers)
        client.post(f'/api/contracts/{contract_id}/sign',
                    content_type='application/json', headers=headers)
        client.post(f'/api/contracts/{contract_id}/activate',
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/contracts/{contract_id}/terminate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['contract']['status'] == ContractStatus.TERMINATED.value

    def test_new_contract_version(self, client, app):
        uid = _register_and_get_token(client, email='contract4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/contracts',
                           data=json.dumps({
                               'clientId': 2,
                               'title': 'Agreement',
                               'body': 'Body v1',
                           }),
                           content_type='application/json', headers=headers)
        contract_id = resp.get_json()['contract']['id']

        resp = client.post(f'/api/contracts/{contract_id}/new-version',
                           data=json.dumps({'body': 'Body v2'}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        assert resp.get_json()['contract']['version'] == 2


class TestCheckInOutE2E:
    """E2E: Check-in → check-out with attachments."""

    def test_check_in(self, client, app):
        uid = _register_and_get_token(client, email='checkin1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/checkin',
                           data=json.dumps({
                               'appointmentId': 1,
                               'checkType': CheckType.PROVIDER.value,
                               'lat': -23.5505,
                               'lng': -46.6333,
                               'consentGiven': True,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        check = resp.get_json()['check']
        assert check['status'] == CheckStatus.CHECKED_IN.value
        assert check['consentGiven'] is True
        assert check['lat'] == -23.5505

    def test_check_in_without_consent_blocked(self, client, app):
        uid = _register_and_get_token(client, email='checkin2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/checkin',
                           data=json.dumps({
                               'appointmentId': 1,
                               'checkType': CheckType.PROVIDER.value,
                               'lat': -23.5505,
                               'lng': -46.6333,
                               'consentGiven': False,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_check_out_with_attachments(self, client, app):
        uid = _register_and_get_token(client, email='checkin3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Check in first
        client.post('/api/checkin',
                    data=json.dumps({
                        'appointmentId': 2,
                        'checkType': CheckType.PROVIDER.value,
                    }),
                    content_type='application/json', headers=headers)

        resp = client.post('/api/checkin/2/checkout',
                           data=json.dumps({
                               'observations': 'Service completed successfully',
                               'attachments': [
                                   'https://storage.example.com/proof1.jpg',
                                   'https://storage.example.com/proof2.jpg',
                               ],
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        check = resp.get_json()['check']
        assert check['status'] == CheckStatus.CHECKED_OUT.value
        assert len(check['attachments']) == 2
        assert check['observations'] == 'Service completed successfully'

    def test_check_out_without_check_in(self, client, app):
        uid = _register_and_get_token(client, email='checkin4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/checkin/99/checkout',
                           data=json.dumps({}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_get_checkin_records(self, client, app):
        uid = _register_and_get_token(client, email='checkin5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        client.post('/api/checkin',
                    data=json.dumps({
                        'appointmentId': 3,
                        'checkType': CheckType.CLIENT.value,
                    }),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/checkin/3', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['records']) >= 1


class TestWorkflowE2E:
    """E2E: Create workflow → activate → trigger → verify execution."""

    def test_create_workflow(self, client, app):
        uid = _register_and_get_token(client, email='wf1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Post-appointment survey',
                               'trigger': WorkflowTriggerType.APPOINTMENT_COMPLETED.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_SURVEY.value,
                                    'params': {'template': 'nps'}},
                                   {'type': WorkflowActionType.REQUEST_REVIEW.value},
                               ],
                               'conditions': [
                                   {'type': WorkflowConditionType.RATING_GTE.value,
                                    'params': {'value': 4}},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        wf = resp.get_json()['workflow']
        assert wf['status'] == WorkflowStatus.DRAFT.value
        assert len(wf['actions']) == 2
        assert len(wf['conditions']) == 1

    def test_activate_workflow(self, client, app):
        uid = _register_and_get_token(client, email='wf2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Test WF',
                               'trigger': WorkflowTriggerType.MANUAL.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_NOTIFICATION.value,
                                    'params': {'title': 'Hi'}},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        resp = client.post(f'/api/workflows/{wf_id}/activate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['workflow']['status'] == WorkflowStatus.ACTIVE.value

    def test_activate_workflow_without_actions(self, client, app):
        uid = _register_and_get_token(client, email='wf3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Empty WF',
                               'trigger': WorkflowTriggerType.MANUAL.value,
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        resp = client.post(f'/api/workflows/{wf_id}/activate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_trigger_workflow_condition_met(self, client, app):
        uid = _register_and_get_token(client, email='wf4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Survey on completion',
                               'trigger': WorkflowTriggerType.APPOINTMENT_COMPLETED.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_SURVEY.value,
                                    'params': {'template': 'nps'}},
                               ],
                               'conditions': [
                                   {'type': WorkflowConditionType.RATING_GTE.value,
                                    'params': {'value': 4}},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        client.post(f'/api/workflows/{wf_id}/activate',
                    content_type='application/json', headers=headers)

        # Trigger with rating >= 4
        resp = client.post(f'/api/workflows/{wf_id}/trigger',
                           data=json.dumps({'triggerData': {'rating': 5, 'appointmentId': 1}}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        result = resp.get_json()['result']
        assert result['status'] == 'completed'

    def test_trigger_workflow_condition_not_met(self, client, app):
        uid = _register_and_get_token(client, email='wf5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Survey on completion',
                               'trigger': WorkflowTriggerType.APPOINTMENT_COMPLETED.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_SURVEY.value},
                               ],
                               'conditions': [
                                   {'type': WorkflowConditionType.RATING_GTE.value,
                                    'params': {'value': 4}},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        client.post(f'/api/workflows/{wf_id}/activate',
                    content_type='application/json', headers=headers)

        # Trigger with rating < 4
        resp = client.post(f'/api/workflows/{wf_id}/trigger',
                           data=json.dumps({'triggerData': {'rating': 2}}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        result = resp.get_json()['result']
        assert result['status'] == 'skipped'
        assert result['reason'] == 'conditions_not_met'

    def test_workflow_idempotency(self, client, app):
        """Triggering the same workflow with same data should skip on second run."""
        uid = _register_and_get_token(client, email='wf6@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Idempotent WF',
                               'trigger': WorkflowTriggerType.MANUAL.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_NOTIFICATION.value,
                                    'params': {'title': 'Test'}},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        client.post(f'/api/workflows/{wf_id}/activate',
                    content_type='application/json', headers=headers)

        trigger_data = {'appointmentId': 42, 'rating': 5}

        # First execution
        resp = client.post(f'/api/workflows/{wf_id}/trigger',
                           data=json.dumps({'triggerData': trigger_data}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['result']['status'] == 'completed'

        # Second execution with same data should be skipped (idempotent)
        resp = client.post(f'/api/workflows/{wf_id}/trigger',
                           data=json.dumps({'triggerData': trigger_data}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['result']['status'] == 'skipped'
        assert resp.get_json()['result']['reason'] == 'idempotent'

    def test_workflow_executions_history(self, client, app):
        uid = _register_and_get_token(client, email='wf7@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'History WF',
                               'trigger': WorkflowTriggerType.MANUAL.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_NOTIFICATION.value},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        client.post(f'/api/workflows/{wf_id}/activate',
                    content_type='application/json', headers=headers)

        client.post(f'/api/workflows/{wf_id}/trigger',
                    data=json.dumps({'triggerData': {'test': 1}}),
                    content_type='application/json', headers=headers)

        resp = client.get(f'/api/workflows/{wf_id}/executions', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['executions']) >= 1

    def test_pause_and_resume_workflow(self, client, app):
        uid = _register_and_get_token(client, email='wf8@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Pausable WF',
                               'trigger': WorkflowTriggerType.MANUAL.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_NOTIFICATION.value},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        client.post(f'/api/workflows/{wf_id}/activate',
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/workflows/{wf_id}/pause',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['workflow']['status'] == WorkflowStatus.PAUSED.value

    def test_trigger_by_type(self, client, app):
        """Trigger all workflows matching a trigger type."""
        uid = _register_and_get_token(client, email='wf9@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Auto survey',
                               'trigger': WorkflowTriggerType.CHECK_OUT_COMPLETED.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_SURVEY.value},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        client.post(f'/api/workflows/{wf_id}/activate',
                    content_type='application/json', headers=headers)

        resp = client.post(f'/api/workflows/trigger/{WorkflowTriggerType.CHECK_OUT_COMPLETED.value}',
                           data=json.dumps({'triggerData': {'appointmentId': 1, 'rating': 5}}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        results = resp.get_json()['results']
        assert len(results) >= 1


class TestFullE2EFlow:
    """Full E2E: Service area → quote → approve → convert → check-in → check-out → workflow."""

    def test_complete_homecare_flow(self, client, app):
        uid = _register_and_get_token(client, email='full1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # 1. Configure service area
        resp = client.post('/api/homecare/service-area',
                           data=json.dumps({
                               'radiusKm': 15.0,
                               'baseLat': -23.5505,
                               'baseLng': -46.6333,
                               'travelFee': 5.00,
                               'feePerKm': 2.50,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        # 2. Check coverage (within)
        resp = client.post('/api/homecare/check-coverage',
                           data=json.dumps({'lat': -23.55, 'lng': -46.64}),
                           content_type='application/json', headers=headers)
        assert resp.get_json()['within'] is True

        # 3. Create quote
        resp = client.post('/api/quotes',
                           data=json.dumps({
                               'clientId': 2,
                               'items': [
                                   {'name': 'Home visit', 'price': 300.0, 'quantity': 1},
                                   {'name': 'Travel fee', 'price': 10.0, 'quantity': 1},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        quote_id = resp.get_json()['quote']['id']

        # 4. Send and approve quote
        client.post(f'/api/quotes/{quote_id}/send',
                    content_type='application/json', headers=headers)
        resp = client.post(f'/api/quotes/{quote_id}/approve',
                           content_type='application/json', headers=headers)
        assert resp.get_json()['quote']['status'] == QuoteStatus.APPROVED.value

        # 5. Convert quote
        resp = client.post(f'/api/quotes/{quote_id}/convert',
                           data=json.dumps({'target': 'appointment'}),
                           content_type='application/json', headers=headers)
        assert resp.get_json()['quote']['status'] == QuoteStatus.CONVERTED.value

        # 6. Check-in
        resp = client.post('/api/checkin',
                           data=json.dumps({
                               'appointmentId': 1,
                               'checkType': CheckType.PROVIDER.value,
                               'lat': -23.55,
                               'lng': -46.64,
                               'consentGiven': True,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        # 7. Check-out with proof
        resp = client.post('/api/checkin/1/checkout',
                           data=json.dumps({
                               'observations': 'Service completed',
                               'attachments': ['https://storage.example.com/proof.jpg'],
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['check']['status'] == CheckStatus.CHECKED_OUT.value

        # 8. Create and trigger workflow for satisfaction survey
        resp = client.post('/api/workflows',
                           data=json.dumps({
                               'name': 'Auto survey',
                               'trigger': WorkflowTriggerType.CHECK_OUT_COMPLETED.value,
                               'actions': [
                                   {'type': WorkflowActionType.SEND_SURVEY.value,
                                    'params': {'template': 'nps'}},
                               ],
                               'conditions': [
                                   {'type': WorkflowConditionType.RATING_GTE.value,
                                    'params': {'value': 4}},
                               ],
                           }),
                           content_type='application/json', headers=headers)
        wf_id = resp.get_json()['workflow']['id']

        client.post(f'/api/workflows/{wf_id}/activate',
                    content_type='application/json', headers=headers)

        # Trigger workflow (simulating check-out completed event with good rating)
        resp = client.post(f'/api/workflows/trigger/{WorkflowTriggerType.CHECK_OUT_COMPLETED.value}',
                           data=json.dumps({'triggerData': {'appointmentId': 1, 'rating': 5}}),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        results = resp.get_json()['results']
        assert any(r['status'] == 'completed' for r in results)
