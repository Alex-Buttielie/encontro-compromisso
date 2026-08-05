"""Unit tests for Phase 7 services: SubscriptionService, ReferralService."""
import pytest

from domain.enums import SubscriptionStatus, ReferralStatus


class TestSubscriptionService:
    def test_create_subscription(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            result = svc.create_subscription({
                'userId': 1, 'planName': 'Plano Basic',
                'amount': 29.90, 'interval': 'monthly',
            })
            assert result['success'] is True
            assert result['subscription']['planName'] == 'Plano Basic'
            assert result['subscription']['status'] == SubscriptionStatus.ACTIVE.value

    def test_create_subscription_missing_plan(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            result = svc.create_subscription({
                'userId': 1, 'amount': 29.90,
            })
            assert result['success'] is False

    def test_create_subscription_missing_amount(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            result = svc.create_subscription({
                'userId': 1, 'planName': 'Plano',
            })
            assert result['success'] is False

    def test_suspend_subscription(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 50, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            result = svc.suspend(sid)
            assert result['success'] is True
            assert result['subscription']['status'] == SubscriptionStatus.SUSPENDED.value

    def test_cancel_subscription(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 50, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            result = svc.cancel(sid)
            assert result['success'] is True
            assert result['subscription']['status'] == SubscriptionStatus.CANCELLED.value

    def test_reactivate_subscription(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 50, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            svc.suspend(sid)
            result = svc.reactivate(sid)
            assert result['success'] is True
            assert result['subscription']['status'] == SubscriptionStatus.ACTIVE.value

    def test_process_billing(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 100, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            result = svc.process_billing(sid)
            assert result['success'] is True
            assert result['billing']['status'] == 'paid'

    def test_process_billing_inactive(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 100, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            svc.cancel(sid)
            result = svc.process_billing(sid)
            assert result['success'] is False

    def test_fail_billing(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 100, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            result = svc.fail_billing(sid)
            assert result['success'] is True
            assert result['billing']['status'] == 'failed'
            assert result['subscription']['status'] == SubscriptionStatus.PAST_DUE.value

    def test_retry_billing(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 100, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            fail_result = svc.fail_billing(sid)
            bid = fail_result['billing']['id']
            result = svc.retry_billing(bid)
            assert result['success'] is True
            assert result['billing']['status'] == 'paid'

    def test_get_billing_history(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            create = svc.create_subscription({
                'userId': 1, 'planName': 'Plan', 'amount': 100, 'interval': 'monthly',
            })
            sid = create['subscription']['id']
            svc.process_billing(sid)
            history = svc.get_billing_history(sid)
            assert len(history) >= 1

    def test_get_subscriptions(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            svc.create_subscription({
                'userId': 1, 'planName': 'P1', 'amount': 10, 'interval': 'monthly',
            })
            subs = svc.get_subscriptions(1)
            assert len(subs) >= 1

    def test_suspend_not_found(self, client, app):
        from services.subscription_service import SubscriptionService
        with app.app_context():
            svc = SubscriptionService()
            result = svc.suspend(9999)
            assert result['success'] is False


class TestReferralService:
    def test_create_referral(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            result = svc.create_referral({
                'userId': 1, 'referredEmail': 'friend@test.com',
            })
            assert result['success'] is True
            assert result['referral']['status'] == ReferralStatus.PENDING.value
            assert 'code' in result['referral']

    def test_create_referral_missing_email(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            result = svc.create_referral({'userId': 1})
            assert result['success'] is False

    def test_get_referrals(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            svc.create_referral({'userId': 1, 'referredEmail': 'a@test.com'})
            svc.create_referral({'userId': 1, 'referredEmail': 'b@test.com'})
            refs = svc.get_referrals(1)
            assert len(refs) >= 2

    def test_get_by_code(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            create = svc.create_referral({'userId': 1, 'referredEmail': 'c@test.com'})
            code = create['referral']['code']
            ref = svc.get_by_code(code)
            assert ref is not None
            assert ref['code'] == code

    def test_get_by_code_not_found(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            ref = svc.get_by_code('INVALID')
            assert ref is None

    def test_register_referral(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            create = svc.create_referral({'userId': 1, 'referredEmail': 'd@test.com'})
            code = create['referral']['code']
            result = svc.register_referral(code, referred_user_id=2)
            assert result['success'] is True
            assert result['referral']['status'] == ReferralStatus.REGISTERED.value

    def test_register_referral_invalid_code(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            result = svc.register_referral('INVALID', referred_user_id=2)
            assert result['success'] is False

    def test_convert_referral(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            create = svc.create_referral({'userId': 1, 'referredEmail': 'e@test.com'})
            code = create['referral']['code']
            svc.register_referral(code, referred_user_id=2)
            result = svc.convert_referral(code)
            assert result['success'] is True
            assert result['referral']['status'] == ReferralStatus.CONVERTED.value

    def test_reward_referral(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            create = svc.create_referral({
                'userId': 1, 'referredEmail': 'f@test.com',
                'rewardAmount': 50.0,
            })
            rid = create['referral']['id']
            code = create['referral']['code']
            svc.register_referral(code, referred_user_id=2)
            svc.convert_referral(code)
            result = svc.reward_referral(rid)
            assert result['success'] is True
            assert result['referral']['status'] == ReferralStatus.REWARDED.value

    def test_expire_referral(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            create = svc.create_referral({'userId': 1, 'referredEmail': 'g@test.com'})
            rid = create['referral']['id']
            result = svc.expire_referral(rid)
            assert result['success'] is True
            assert result['referral']['status'] == ReferralStatus.EXPIRED.value

    def test_get_stats(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            svc.create_referral({'userId': 1, 'referredEmail': 'h@test.com'})
            stats = svc.get_stats(1)
            assert stats['total'] >= 1
            assert 'converted' in stats
            assert 'rewarded' in stats

    def test_reward_not_found(self, client, app):
        from services.referral_service import ReferralService
        with app.app_context():
            svc = ReferralService()
            result = svc.reward_referral(9999)
            assert result['success'] is False
