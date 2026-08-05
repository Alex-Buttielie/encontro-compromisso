"""TDD unit tests for Home Care, Quote, Document, Check-in/out, Workflow domain models (Phase 6)."""
from datetime import date, datetime, timedelta

import pytest

from domain.enums import (
    QuoteStatus, ContractStatus, SignatureStatus,
    CheckType, CheckStatus, RouteStatus,
    WorkflowTriggerType, WorkflowActionType, WorkflowConditionType,
    WorkflowStatus, WorkflowExecutionStatus,
    QUOTE_TRANSITIONS, CONTRACT_TRANSITIONS,
)
from domain.exceptions import (
    HomeCareError, DocumentError, QuoteError, WorkflowError, ValidationError,
)


# --- Geo / Distance helpers ---

class TestDistanceCalc:
    def test_haversine_distance_zero(self):
        from models import haversine_distance
        d = haversine_distance(-23.5505, -46.6333, -23.5505, -46.6333)
        assert d == pytest.approx(0.0, abs=0.01)

    def test_haversine_distance_known(self):
        from models import haversine_distance
        # Sao Paulo to Rio de Janeiro ~ 360km
        d = haversine_distance(-23.5505, -46.6333, -22.9068, -43.1729)
        assert 300 < d < 420

    def test_estimate_travel_time(self):
        from models import estimate_travel_time
        # 10km at 30km/h = 20 minutes
        minutes = estimate_travel_time(10.0, speed_kmh=30)
        assert minutes == 20

    def test_estimate_travel_time_zero(self):
        from models import estimate_travel_time
        minutes = estimate_travel_time(0.0)
        assert minutes == 0


# --- ServiceArea ---

class TestServiceArea:
    def test_create_service_area(self):
        from models import ServiceArea
        area = ServiceArea.create(
            user_id=1, radius_km=15.0,
            base_lat=-23.5505, base_lng=-46.6333,
            travel_fee=5.00, fee_per_km=2.50,
        )
        assert area.radius_km == 15.0
        assert area.travel_fee == 5.00
        assert area.active is True

    def test_service_area_missing_radius(self):
        from models import ServiceArea
        with pytest.raises(ValidationError):
            ServiceArea.create(user_id=1, radius_km=0,
                               base_lat=-23.0, base_lng=-46.0)

    def test_is_within_coverage(self):
        from models import ServiceArea
        area = ServiceArea.create(
            user_id=1, radius_km=15.0,
            base_lat=-23.5505, base_lng=-46.6333,
        )
        assert area.is_within_coverage(-23.55, -46.63) is True

    def test_is_outside_coverage(self):
        from models import ServiceArea
        area = ServiceArea.create(
            user_id=1, radius_km=5.0,
            base_lat=-23.5505, base_lng=-46.6333,
        )
        # Rio de Janeiro is far from Sao Paulo
        assert area.is_within_coverage(-22.9068, -43.1729) is False

    def test_calculate_travel_fee(self):
        from models import ServiceArea
        area = ServiceArea.create(
            user_id=1, radius_km=20.0,
            base_lat=-23.5505, base_lng=-46.6333,
            travel_fee=5.00, fee_per_km=2.50,
        )
        fee = area.calculate_travel_fee(-23.56, -46.64)
        # base fee + per_km * distance
        assert fee >= 5.00

    def test_deactivate(self):
        from models import ServiceArea
        area = ServiceArea.create(
            user_id=1, radius_km=10.0,
            base_lat=-23.0, base_lng=-46.0,
        )
        area.deactivate()
        assert area.active is False


# --- Quote ---

class TestQuote:
    def test_create_quote(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[
                {'name': 'Consulta', 'price': 200.0, 'quantity': 1},
                {'name': 'Limpeza', 'price': 150.0, 'quantity': 1},
            ],
        )
        assert quote.status == QuoteStatus.DRAFT.value
        assert quote.total == 350.0

    def test_quote_with_discount(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Service', 'price': 100.0, 'quantity': 2}],
            discount=10.0,
        )
        assert quote.total == 190.0

    def test_quote_empty_items(self):
        from models import Quote
        with pytest.raises(ValidationError):
            Quote.create(user_id=1, client_id=2, items=[])

    def test_quote_send(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
        )
        quote.send()
        assert quote.status == QuoteStatus.SENT.value

    def test_quote_approve(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
        )
        quote.send()
        quote.approve()
        assert quote.status == QuoteStatus.APPROVED.value

    def test_quote_reject(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
        )
        quote.send()
        quote.reject(comment='Too expensive')
        assert quote.status == QuoteStatus.REJECTED.value

    def test_quote_convert(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
        )
        quote.send()
        quote.approve()
        quote.convert()
        assert quote.status == QuoteStatus.CONVERTED.value

    def test_quote_convert_without_approve(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
        )
        with pytest.raises(QuoteError):
            quote.convert()

    def test_quote_expire(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
        )
        quote.send()
        quote.expire()
        assert quote.status == QuoteStatus.EXPIRED.value

    def test_quote_with_validity(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
            valid_until=date.today() + timedelta(days=30),
        )
        assert quote.valid_until is not None

    def test_quote_add_negotiation_comment(self):
        from models import Quote
        quote = Quote.create(
            user_id=1, client_id=2,
            items=[{'name': 'Test', 'price': 50.0, 'quantity': 1}],
        )
        quote.add_comment('Can you lower the price?')
        assert len(quote.get_comments()) == 1


# --- Contract ---

class TestContract:
    def test_create_contract(self):
        from models import Contract
        contract = Contract.create(
            user_id=1, client_id=2,
            title='Service Agreement',
            body='This contract covers...',
            template_id=1,
        )
        assert contract.status == ContractStatus.DRAFT.value
        assert contract.version == 1

    def test_contract_missing_title(self):
        from models import Contract
        with pytest.raises(ValidationError):
            Contract.create(user_id=1, client_id=2, title='', body='Body')

    def test_contract_send(self):
        from models import Contract
        contract = Contract.create(
            user_id=1, client_id=2,
            title='Agreement', body='Body',
        )
        contract.send()
        assert contract.status == ContractStatus.SENT.value

    def test_contract_sign(self):
        from models import Contract
        contract = Contract.create(
            user_id=1, client_id=2,
            title='Agreement', body='Body',
        )
        contract.send()
        contract.sign(ip='192.168.1.1', user_agent='Mozilla/5.0')
        assert contract.status == ContractStatus.SIGNED.value
        assert contract.signed_ip == '192.168.1.1'

    def test_contract_sign_without_send(self):
        from models import Contract
        contract = Contract.create(
            user_id=1, client_id=2,
            title='Agreement', body='Body',
        )
        with pytest.raises(DocumentError):
            contract.sign(ip='192.168.1.1', user_agent='Mozilla/5.0')

    def test_contract_activate(self):
        from models import Contract
        contract = Contract.create(
            user_id=1, client_id=2,
            title='Agreement', body='Body',
        )
        contract.send()
        contract.sign(ip='1.2.3.4', user_agent='Test')
        contract.activate()
        assert contract.status == ContractStatus.ACTIVE.value

    def test_contract_terminate(self):
        from models import Contract
        contract = Contract.create(
            user_id=1, client_id=2,
            title='Agreement', body='Body',
        )
        contract.send()
        contract.sign(ip='1.2.3.4', user_agent='Test')
        contract.activate()
        contract.terminate()
        assert contract.status == ContractStatus.TERMINATED.value

    def test_contract_new_version(self):
        from models import Contract
        contract = Contract.create(
            user_id=1, client_id=2,
            title='Agreement', body='Body v1',
        )
        contract.send()
        v2 = contract.new_version(body='Body v2')
        assert v2.version == 2
        assert v2.body == 'Body v2'


# --- CheckInOut ---

class TestCheckInOut:
    def test_check_in(self):
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=1, user_id=1,
            check_type=CheckType.PROVIDER.value,
        )
        record.check_in()
        assert record.status == CheckStatus.CHECKED_IN.value
        assert record.checked_in_at is not None

    def test_check_out(self):
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=1, user_id=1,
            check_type=CheckType.PROVIDER.value,
        )
        record.check_in()
        record.check_out()
        assert record.status == CheckStatus.CHECKED_OUT.value
        assert record.checked_out_at is not None

    def test_check_out_without_check_in(self):
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=1, user_id=1,
            check_type=CheckType.PROVIDER.value,
        )
        with pytest.raises(HomeCareError):
            record.check_out()

    def test_no_show(self):
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=1, user_id=1,
            check_type=CheckType.CLIENT.value,
        )
        record.mark_no_show()
        assert record.status == CheckStatus.NO_SHOW.value

    def test_check_in_with_location(self):
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=1, user_id=1,
            check_type=CheckType.PROVIDER.value,
            lat=-23.5505, lng=-46.6333,
            consent_given=True,
        )
        record.check_in()
        assert record.lat == -23.5505
        assert record.consent_given is True

    def test_check_in_location_without_consent(self):
        from models import CheckInOut
        with pytest.raises(ValidationError):
            CheckInOut.create(
                appointment_id=1, user_id=1,
                check_type=CheckType.PROVIDER.value,
                lat=-23.5505, lng=-46.6333,
                consent_given=False,
            )

    def test_add_attachment(self):
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=1, user_id=1,
            check_type=CheckType.PROVIDER.value,
        )
        record.check_in()
        record.add_attachment('https://storage.example.com/proof.jpg')
        assert len(record.get_attachments()) == 1

    def test_add_observation(self):
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=1, user_id=1,
            check_type=CheckType.PROVIDER.value,
        )
        record.check_in()
        record.add_observation('Client was on time')
        assert record.observations == 'Client was on time'


# --- Workflow ---

class TestWorkflow:
    def test_create_workflow(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Post-appointment survey',
            trigger=WorkflowTriggerType.APPOINTMENT_COMPLETED.value,
        )
        assert wf.status == WorkflowStatus.DRAFT.value
        assert wf.trigger == WorkflowTriggerType.APPOINTMENT_COMPLETED.value

    def test_workflow_missing_name(self):
        from models import Workflow
        with pytest.raises(ValidationError):
            Workflow.create(user_id=1, name='', trigger='manual')

    def test_workflow_add_action(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Test WF',
            trigger=WorkflowTriggerType.MANUAL.value,
        )
        wf.add_action(WorkflowActionType.SEND_SURVEY.value, {'template': 'nps'})
        assert len(wf.get_actions()) == 1

    def test_workflow_add_condition(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Test WF',
            trigger=WorkflowTriggerType.APPOINTMENT_COMPLETED.value,
        )
        wf.add_condition(WorkflowConditionType.RATING_GTE.value, {'value': 4})
        assert len(wf.get_conditions()) == 1

    def test_workflow_activate(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Test WF',
            trigger=WorkflowTriggerType.MANUAL.value,
        )
        wf.activate()
        assert wf.status == WorkflowStatus.ACTIVE.value

    def test_workflow_pause(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Test WF',
            trigger=WorkflowTriggerType.MANUAL.value,
        )
        wf.activate()
        wf.pause()
        assert wf.status == WorkflowStatus.PAUSED.value

    def test_workflow_validate_no_actions(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Empty WF',
            trigger=WorkflowTriggerType.MANUAL.value,
        )
        with pytest.raises(WorkflowError):
            wf.validate()

    def test_workflow_validate_with_actions(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Valid WF',
            trigger=WorkflowTriggerType.MANUAL.value,
        )
        wf.add_action(WorkflowActionType.SEND_NOTIFICATION.value, {'title': 'Hi'})
        wf.validate()  # should not raise

    def test_workflow_loop_protection(self):
        from models import Workflow
        wf = Workflow.create(
            user_id=1, name='Loop WF',
            trigger=WorkflowTriggerType.MANUAL.value,
        )
        wf.add_action(WorkflowActionType.SEND_NOTIFICATION.value, {})
        wf.activate()
        # Simulate many executions to test loop protection
        for i in range(10):
            wf.record_execution()
        assert wf.execution_count == 10
        # Should be blocked after max_executions
        assert wf.can_execute(max_per_hour=5) is False


class TestWorkflowExecution:
    def test_create_execution(self):
        from models import WorkflowExecution
        exec_ = WorkflowExecution.create(
            workflow_id=1, trigger_data={'appointment_id': 1},
        )
        assert exec_.status == WorkflowExecutionStatus.PENDING.value

    def test_execution_start(self):
        from models import WorkflowExecution
        exec_ = WorkflowExecution.create(
            workflow_id=1, trigger_data={},
        )
        exec_.start()
        assert exec_.status == WorkflowExecutionStatus.RUNNING.value

    def test_execution_complete(self):
        from models import WorkflowExecution
        exec_ = WorkflowExecution.create(
            workflow_id=1, trigger_data={},
        )
        exec_.start()
        exec_.complete(result={'sent': True})
        assert exec_.status == WorkflowExecutionStatus.COMPLETED.value
        assert exec_.result is not None

    def test_execution_fail(self):
        from models import WorkflowExecution
        exec_ = WorkflowExecution.create(
            workflow_id=1, trigger_data={},
        )
        exec_.start()
        exec_.fail(error='Something went wrong')
        assert exec_.status == WorkflowExecutionStatus.FAILED.value

    def test_execution_skip(self):
        from models import WorkflowExecution
        exec_ = WorkflowExecution.create(
            workflow_id=1, trigger_data={},
        )
        exec_.skip(reason='Condition not met')
        assert exec_.status == WorkflowExecutionStatus.SKIPPED.value

    def test_execution_is_idempotent(self):
        from models import WorkflowExecution
        exec_ = WorkflowExecution.create(
            workflow_id=1, trigger_data={},
            idempotency_key='abc123',
        )
        assert exec_.idempotency_key == 'abc123'
