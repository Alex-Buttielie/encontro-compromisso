"""Marketing application service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.marketing_repository import CampaignRepository, CouponRepository
from repositories.crm_repository import ClientProfileRepository
from services.email_sender import get_email_sender


class MarketingService:
    def __init__(self, campaign_repo=None, coupon_repo=None,
                 profile_repo=None, email_sender=None):
        self.campaign_repo = campaign_repo or CampaignRepository()
        self.coupon_repo = coupon_repo or CouponRepository()
        self.profile_repo = profile_repo or ClientProfileRepository()
        self.email_sender = email_sender or get_email_sender()
        self.logger = get_logger(self.__class__.__name__)

    def create_campaign(self, data):
        from models import Campaign
        try:
            campaign = Campaign.create(
                user_id=data['userId'],
                name=data.get('name'),
                channel=data.get('channel'),
                subject=data.get('subject', ''),
                body=data.get('body', ''),
                segment=data.get('segment', 'all'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.campaign_repo.add(campaign)
        return {'success': True, 'campaign': campaign.to_dict()}

    def get_campaigns(self, user_id):
        campaigns = self.campaign_repo.find_by_user_id(user_id)
        return [c.to_dict() for c in campaigns]

    def schedule_campaign(self, campaign_id, scheduled_date):
        campaign = self.campaign_repo.get_by_id(campaign_id)
        if not campaign:
            return {'success': False, 'errors': ['Campanha não encontrada']}
        try:
            campaign.schedule(scheduled_date)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.campaign_repo.save(campaign)
        return {'success': True, 'campaign': campaign.to_dict()}

    def start_campaign(self, campaign_id):
        campaign = self.campaign_repo.get_by_id(campaign_id)
        if not campaign:
            return {'success': False, 'errors': ['Campanha não encontrada']}
        try:
            campaign.start()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.campaign_repo.save(campaign)
        return {'success': True, 'campaign': campaign.to_dict()}

    def send_campaign(self, campaign_id):
        """Send campaign to segmented clients via mock adapter."""
        campaign = self.campaign_repo.get_by_id(campaign_id)
        if not campaign:
            return {'success': False, 'errors': ['Campanha não encontrada']}
        if campaign.status != 'running':
            return {'success': False, 'errors': ['Campanha deve estar em execução']}

        # Get target clients by segment
        segment = campaign.segment
        if segment == 'all':
            profiles = self.profile_repo.find_by_user_id(campaign.user_id)
        else:
            profiles = self.profile_repo.find_by_segment(campaign.user_id, segment)

        sent_count = 0
        for profile in profiles:
            from repositories.client_repository import ClientRepository
            client = ClientRepository().get_by_id(profile.client_id)
            if client and client.email:
                self.email_sender.send(
                    to=client.email,
                    subject=campaign.subject,
                    body=campaign.body,
                )
                sent_count += 1

        campaign.record_send(sent_count)
        self.campaign_repo.save(campaign)
        self.logger.info('Campaign sent: id=%s sent=%s', campaign_id, sent_count)
        return {'success': True, 'campaign': campaign.to_dict(), 'sentCount': sent_count}

    def complete_campaign(self, campaign_id):
        campaign = self.campaign_repo.get_by_id(campaign_id)
        if not campaign:
            return {'success': False, 'errors': ['Campanha não encontrada']}
        try:
            campaign.complete()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.campaign_repo.save(campaign)
        return {'success': True, 'campaign': campaign.to_dict()}

    def cancel_campaign(self, campaign_id):
        campaign = self.campaign_repo.get_by_id(campaign_id)
        if not campaign:
            return {'success': False, 'errors': ['Campanha não encontrada']}
        try:
            campaign.cancel()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.campaign_repo.save(campaign)
        return {'success': True, 'campaign': campaign.to_dict()}

    def create_coupon(self, data):
        from models import Coupon
        from datetime import date as dt_date
        try:
            raw_until = data.get('validUntil')
            valid_until = dt_date.fromisoformat(raw_until) if isinstance(raw_until, str) else raw_until
            coupon = Coupon.create(
                user_id=data['userId'],
                code=data.get('code'),
                coupon_type=data.get('couponType'),
                value=data.get('value'),
                valid_until=valid_until,
                max_uses=data.get('maxUses', 1),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.coupon_repo.add(coupon)
        return {'success': True, 'coupon': coupon.to_dict()}

    def get_coupons(self, user_id):
        coupons = self.coupon_repo.find_by_user_id(user_id)
        return [c.to_dict() for c in coupons]

    def validate_coupon(self, code, amount):
        coupon = self.coupon_repo.find_by_code(code)
        if not coupon:
            return {'success': False, 'errors': ['Cupom não encontrado']}
        if not coupon.is_valid():
            return {'success': False, 'errors': ['Cupom expirado ou esgotado']}
        discount = coupon.calculate_discount(amount)
        return {'success': True, 'discount': discount, 'coupon': coupon.to_dict()}

    def get_conversion_report(self, user_id):
        campaigns = self.campaign_repo.find_by_user_id(user_id)
        return [{
            'id': c.id,
            'name': c.name,
            'totalSent': c.total_sent,
            'totalConversions': c.total_conversions,
            'conversionRate': c.conversion_rate,
            'status': c.status,
        } for c in campaigns]
