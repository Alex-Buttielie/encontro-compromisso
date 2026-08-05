"""Subscription service — recurring billing, retries, lifecycle."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.phase7_repository import SubscriptionRepository, BillingRepository


class SubscriptionService:
    def __init__(self, sub_repo=None, billing_repo=None):
        self.sub_repo = sub_repo or SubscriptionRepository()
        self.billing_repo = billing_repo or BillingRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_subscription(self, data):
        from models import Subscription
        try:
            sub = Subscription.create(
                user_id=data['userId'],
                plan_name=data.get('planName'),
                amount=data.get('amount'),
                interval=data.get('interval', 'monthly'),
                trial_days=data.get('trialDays'),
                auto_renew=data.get('autoRenew', True),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.sub_repo.add(sub)
        return {'success': True, 'subscription': sub.to_dict()}

    def get_subscriptions(self, user_id):
        subs = self.sub_repo.find_by_user_id(user_id)
        return [s.to_dict() for s in subs]

    def get_subscription(self, sub_id):
        sub = self.sub_repo.get_by_id(sub_id)
        if not sub:
            return None
        return sub.to_dict()

    def suspend(self, sub_id):
        sub = self.sub_repo.get_by_id(sub_id)
        if not sub:
            return {'success': False, 'errors': ['Assinatura não encontrada']}
        try:
            sub.suspend()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.sub_repo.save(sub)
        return {'success': True, 'subscription': sub.to_dict()}

    def cancel(self, sub_id):
        sub = self.sub_repo.get_by_id(sub_id)
        if not sub:
            return {'success': False, 'errors': ['Assinatura não encontrada']}
        try:
            sub.cancel()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.sub_repo.save(sub)
        return {'success': True, 'subscription': sub.to_dict()}

    def reactivate(self, sub_id):
        sub = self.sub_repo.get_by_id(sub_id)
        if not sub:
            return {'success': False, 'errors': ['Assinatura não encontrada']}
        try:
            sub.reactivate()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.sub_repo.save(sub)
        return {'success': True, 'subscription': sub.to_dict()}

    def process_billing(self, sub_id):
        """Process a billing cycle for a subscription (sandbox)."""
        sub = self.sub_repo.get_by_id(sub_id)
        if not sub:
            return {'success': False, 'errors': ['Assinatura não encontrada']}
        if not sub.is_active():
            return {'success': False, 'errors': ['Assinatura não está ativa']}

        from models import Billing
        billing = Billing.create(subscription_id=sub.id, amount=sub.amount)
        self.billing_repo.add(billing)

        # Sandbox: simulate successful payment
        billing.mark_paid()
        self.billing_repo.save(billing)

        sub.renew()
        self.sub_repo.save(sub)

        return {'success': True, 'billing': billing.to_dict(),
                'subscription': sub.to_dict()}

    def fail_billing(self, sub_id):
        """Simulate a failed billing with retry logic."""
        sub = self.sub_repo.get_by_id(sub_id)
        if not sub:
            return {'success': False, 'errors': ['Assinatura não encontrada']}

        from models import Billing
        billing = Billing.create(subscription_id=sub.id, amount=sub.amount)
        self.billing_repo.add(billing)

        billing.mark_failed()
        self.billing_repo.save(billing)

        sub.mark_past_due()
        self.sub_repo.save(sub)

        return {'success': True, 'billing': billing.to_dict(),
                'subscription': sub.to_dict()}

    def retry_billing(self, billing_id):
        """Retry a failed billing."""
        billing = self.billing_repo.get_by_id(billing_id)
        if not billing:
            return {'success': False, 'errors': ['Cobrança não encontrada']}
        try:
            billing.retry()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        # Sandbox: simulate successful retry
        billing.mark_paid()
        self.billing_repo.save(billing)

        sub = self.sub_repo.get_by_id(billing.subscription_id)
        if sub and sub.status == 'past_due':
            sub.reactivate()
            self.sub_repo.save(sub)

        return {'success': True, 'billing': billing.to_dict()}

    def get_billing_history(self, sub_id):
        billings = self.billing_repo.find_by_subscription(sub_id)
        return [b.to_dict() for b in billings]
