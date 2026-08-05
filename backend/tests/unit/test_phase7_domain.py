"""TDD unit tests for Phase 7 — Subscriptions, Referrals, AI Agents domain models."""
from datetime import date, datetime, timedelta

import pytest

from domain.enums import (
    SubscriptionStatus, BillingStatus, ReferralStatus,
    AgentType, AgentStatus, AgentActionStatus,
    SUBSCRIPTION_TRANSITIONS, REFERRAL_TRANSITIONS,
)
from domain.exceptions import (
    SubscriptionError, ReferralError, AIAgentError, ValidationError,
)


# --- Subscription ---

class TestSubscription:
    def test_create_subscription(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro Monthly',
            amount=49.90, interval='monthly',
        )
        assert sub.status == SubscriptionStatus.ACTIVE.value
        assert sub.amount == 49.90
        assert sub.auto_renew is True

    def test_create_trial_subscription(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro Monthly',
            amount=49.90, interval='monthly',
            trial_days=14,
        )
        assert sub.status == SubscriptionStatus.TRIALING.value
        assert sub.trial_ends_at is not None

    def test_subscription_missing_plan(self):
        from models import Subscription
        with pytest.raises(ValidationError):
            Subscription.create(user_id=1, plan_name='', amount=49.90, interval='monthly')

    def test_subscription_missing_amount(self):
        from models import Subscription
        with pytest.raises(ValidationError):
            Subscription.create(user_id=1, plan_name='Pro', amount=0, interval='monthly')

    def test_subscription_suspend(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        sub.suspend()
        assert sub.status == SubscriptionStatus.SUSPENDED.value

    def test_subscription_cancel(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        sub.cancel()
        assert sub.status == SubscriptionStatus.CANCELLED.value
        assert sub.cancelled_at is not None
        assert sub.auto_renew is False

    def test_subscription_reactivate(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        sub.suspend()
        sub.reactivate()
        assert sub.status == SubscriptionStatus.ACTIVE.value

    def test_subscription_mark_past_due(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        sub.mark_past_due()
        assert sub.status == SubscriptionStatus.PAST_DUE.value

    def test_subscription_expire(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        sub.expire()
        assert sub.status == SubscriptionStatus.EXPIRED.value

    def test_subscription_cancelled_cannot_reactivate(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        sub.cancel()
        with pytest.raises(SubscriptionError):
            sub.reactivate()

    def test_subscription_renew(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        old_next = sub.next_billing_at
        sub.renew()
        assert sub.current_period_start is not None
        assert sub.next_billing_at > old_next

    def test_subscription_is_active(self):
        from models import Subscription
        sub = Subscription.create(
            user_id=1, plan_name='Pro', amount=49.90, interval='monthly')
        assert sub.is_active() is True
        sub.suspend()
        assert sub.is_active() is False


class TestBilling:
    def test_create_billing(self):
        from models import Billing
        billing = Billing.create(
            subscription_id=1, amount=49.90,
        )
        assert billing.status == BillingStatus.PENDING.value
        assert billing.amount == 49.90

    def test_billing_mark_paid(self):
        from models import Billing
        billing = Billing.create(subscription_id=1, amount=49.90)
        billing.mark_paid()
        assert billing.status == BillingStatus.PAID.value
        assert billing.paid_at is not None

    def test_billing_mark_failed(self):
        from models import Billing
        billing = Billing.create(subscription_id=1, amount=49.90)
        billing.mark_failed()
        assert billing.status == BillingStatus.FAILED.value

    def test_billing_retry(self):
        from models import Billing
        billing = Billing.create(subscription_id=1, amount=49.90)
        billing.mark_failed()
        billing.retry()
        assert billing.status == BillingStatus.RETRYING.value
        assert billing.retry_count == 1

    def test_billing_max_retries(self):
        from models import Billing
        billing = Billing.create(subscription_id=1, amount=49.90, max_retries=3)
        billing.mark_failed()
        billing.retry()
        billing.mark_failed()
        billing.retry()
        billing.mark_failed()
        billing.retry()
        billing.mark_failed()
        with pytest.raises(SubscriptionError):
            billing.retry()

    def test_billing_refund(self):
        from models import Billing
        billing = Billing.create(subscription_id=1, amount=49.90)
        billing.mark_paid()
        billing.refund()
        assert billing.status == BillingStatus.REFUNDED.value


# --- Referral ---

class TestReferral:
    def test_create_referral(self):
        from models import Referral
        ref = Referral.create(
            referrer_id=1, referred_email='friend@example.com',
        )
        assert ref.status == ReferralStatus.PENDING.value
        assert ref.code is not None
        assert len(ref.code) > 0

    def test_referral_missing_email(self):
        from models import Referral
        with pytest.raises(ValidationError):
            Referral.create(referrer_id=1, referred_email='')

    def test_referral_register(self):
        from models import Referral
        ref = Referral.create(
            referrer_id=1, referred_email='friend@example.com')
        ref.register(referred_user_id=2)
        assert ref.status == ReferralStatus.REGISTERED.value
        assert ref.referred_user_id == 2

    def test_referral_convert(self):
        from models import Referral
        ref = Referral.create(
            referrer_id=1, referred_email='friend@example.com')
        ref.register(referred_user_id=2)
        ref.convert()
        assert ref.status == ReferralStatus.CONVERTED.value

    def test_referral_convert_without_register(self):
        from models import Referral
        ref = Referral.create(
            referrer_id=1, referred_email='friend@example.com')
        with pytest.raises(ReferralError):
            ref.convert()

    def test_referral_reward(self):
        from models import Referral
        ref = Referral.create(
            referrer_id=1, referred_email='friend@example.com',
            reward_amount=50.0)
        ref.register(referred_user_id=2)
        ref.convert()
        ref.reward()
        assert ref.status == ReferralStatus.REWARDED.value
        assert ref.rewarded_at is not None

    def test_referral_expire(self):
        from models import Referral
        ref = Referral.create(
            referrer_id=1, referred_email='friend@example.com')
        ref.expire()
        assert ref.status == ReferralStatus.EXPIRED.value

    def test_referral_generate_link(self):
        from models import Referral
        ref = Referral.create(
            referrer_id=1, referred_email='friend@example.com')
        link = ref.get_link(base_url='https://profissional-os.com')
        assert 'friend@example.com' not in link
        assert ref.code in link

    def test_referral_cannot_self_refer(self):
        from models import Referral
        with pytest.raises(ValidationError):
            Referral.create(referrer_id=1, referred_email='user1@example.com',
                            referrer_email='user1@example.com')


# --- AI Agent ---

class TestAgentConfig:
    def test_create_agent_config(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
        )
        assert config.status == AgentStatus.DISABLED.value
        assert config.agent_type == AgentType.FINANCIAL.value

    def test_agent_enable(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value)
        config.enable()
        assert config.status == AgentStatus.ENABLED.value

    def test_agent_disable(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value)
        config.enable()
        config.disable()
        assert config.status == AgentStatus.DISABLED.value

    def test_agent_pause(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value)
        config.enable()
        config.pause()
        assert config.status == AgentStatus.PAUSED.value

    def test_agent_cost_limit(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            monthly_cost_limit=50.0)
        assert config.monthly_cost_limit == 50.0

    def test_agent_check_cost_limit(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            monthly_cost_limit=10.0)
        config.current_month_cost = 8.0
        assert config.can_spend(3.0) is False
        assert config.can_spend(1.0) is True

    def test_agent_usage_limit(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            monthly_usage_limit=100)
        config.current_month_usage = 95
        assert config.can_use(10) is False
        assert config.can_use(5) is True

    def test_agent_record_usage(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            monthly_cost_limit=100.0, monthly_usage_limit=1000)
        config.record_usage(cost=2.5, tokens=500)
        assert config.current_month_cost == 2.5
        assert config.current_month_usage == 500

    def test_agent_requires_approval(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value)
        assert config.requires_human_approval() is True

    def test_agent_does_not_require_approval(self):
        from models import AgentConfig
        config = AgentConfig.create(
            user_id=1, agent_type=AgentType.CONTENT.value)
        assert config.requires_human_approval() is False


class TestAgentExecution:
    def test_create_execution(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            prompt='Analyze cash flow for last month',
        )
        assert exec_.status == 'pending'
        assert exec_.agent_type == AgentType.FINANCIAL.value
        assert exec_.prompt == 'Analyze cash flow for last month'

    def test_execution_set_response(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            prompt='Test prompt')
        exec_.set_response(response='Here is the analysis...', tokens_used=500, cost=0.05)
        assert exec_.response == 'Here is the analysis...'
        assert exec_.tokens_used == 500
        assert exec_.cost == 0.05
        assert exec_.status == 'completed'

    def test_execution_mark_failed(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            prompt='Test')
        exec_.mark_failed(error='API timeout')
        assert exec_.status == 'failed'
        assert exec_.error == 'API timeout'

    def test_execution_set_action_pending_approval(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            prompt='Suggest pricing')
        exec_.set_response(response='I suggest R$ 200', tokens_used=100, cost=0.01)
        action = exec_.set_action(action_type='pricing_suggestion',
                                   payload={'price': 200.0},
                                   requires_approval=True)
        assert action['status'] == AgentActionStatus.PENDING.value
        assert exec_.has_pending_action() is True

    def test_execution_approve_action(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            prompt='Suggest pricing')
        exec_.set_response(response='I suggest R$ 200', tokens_used=100, cost=0.01)
        exec_.set_action(action_type='pricing_suggestion',
                         payload={'price': 200.0}, requires_approval=True)
        exec_.approve_action()
        assert exec_.get_action()['status'] == AgentActionStatus.APPROVED.value

    def test_execution_reject_action(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            prompt='Suggest pricing')
        exec_.set_response(response='I suggest R$ 200', tokens_used=100, cost=0.01)
        exec_.set_action(action_type='pricing_suggestion',
                         payload={'price': 200.0}, requires_approval=True)
        exec_.reject_action()
        assert exec_.get_action()['status'] == AgentActionStatus.REJECTED.value

    def test_execution_action_without_approval(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.CONTENT.value,
            prompt='Generate caption')
        exec_.set_response(response='Check this out!', tokens_used=50, cost=0.005)
        action = exec_.set_action(action_type='generate_content',
                                   payload={'caption': 'Check this out!'},
                                   requires_approval=False)
        assert action['status'] == AgentActionStatus.EXECUTED.value

    def test_execution_is_ai_generated(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.CONTENT.value,
            prompt='Generate caption')
        assert exec_.is_ai_generated is True

    def test_execution_audit_trail(self):
        from models import AgentExecution
        exec_ = AgentExecution.create(
            user_id=1, agent_type=AgentType.FINANCIAL.value,
            prompt='Analyze cash flow')
        exec_.set_response(response='Analysis complete', tokens_used=200, cost=0.02)
        exec_.set_action(action_type='report', payload={'data': 'test'},
                         requires_approval=True)
        exec_.approve_action()
        audit = exec_.to_dict()
        assert audit['prompt'] == 'Analyze cash flow'
        assert audit['response'] == 'Analysis complete'
        assert audit['action']['status'] == AgentActionStatus.APPROVED.value
        assert audit['aiGenerated'] is True
