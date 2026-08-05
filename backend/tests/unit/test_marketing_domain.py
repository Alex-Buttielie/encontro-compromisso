"""TDD unit tests for Marketing domain models (Phase 3)."""
from datetime import datetime, date, timedelta

import pytest

from domain.enums import CampaignStatus, CampaignChannel, CouponType
from domain.exceptions import MarketingError, ValidationError


class TestCampaign:
    def test_create_campaign(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Black Friday 2026',
            channel=CampaignChannel.EMAIL.value,
            subject='Promoção de Black Friday!',
            body='Aproveite 30% de desconto em todas as sessões!',
            segment='inactive',
        )
        assert campaign.status == CampaignStatus.DRAFT.value
        assert campaign.channel == CampaignChannel.EMAIL.value

    def test_create_campaign_missing_name(self):
        from models import Campaign
        with pytest.raises(ValidationError):
            Campaign.create(
                user_id=1, name='', channel=CampaignChannel.EMAIL.value,
                subject='Test', body='Test', segment='all')

    def test_schedule_campaign(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.SMS.value,
            subject='Test', body='Test', segment='all')
        campaign.schedule(date.today() + timedelta(days=7))
        assert campaign.status == CampaignStatus.SCHEDULED.value
        assert campaign.scheduled_at is not None

    def test_start_campaign(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.EMAIL.value,
            subject='Test', body='Test', segment='all')
        campaign.schedule(date.today())
        campaign.start()
        assert campaign.status == CampaignStatus.RUNNING.value

    def test_complete_campaign(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.EMAIL.value,
            subject='Test', body='Test', segment='all')
        campaign.schedule(date.today())
        campaign.start()
        campaign.complete()
        assert campaign.status == CampaignStatus.COMPLETED.value

    def test_cancel_campaign(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.EMAIL.value,
            subject='Test', body='Test', segment='all')
        campaign.cancel()
        assert campaign.status == CampaignStatus.CANCELLED.value

    def test_pause_and_resume(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.EMAIL.value,
            subject='Test', body='Test', segment='all')
        campaign.schedule(date.today())
        campaign.start()
        campaign.pause()
        assert campaign.status == CampaignStatus.PAUSED.value
        campaign.resume()
        assert campaign.status == CampaignStatus.RUNNING.value

    def test_record_send(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.EMAIL.value,
            subject='Test', body='Test', segment='all')
        campaign.record_send(50)
        assert campaign.total_sent == 50
        assert campaign.conversion_rate == 0.0

    def test_record_conversion(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.EMAIL.value,
            subject='Test', body='Test', segment='all')
        campaign.record_send(100)
        campaign.record_conversion(10)
        assert campaign.total_conversions == 10
        assert campaign.conversion_rate == 10.0

    def test_start_draft_without_schedule(self):
        from models import Campaign
        campaign = Campaign.create(
            user_id=1, name='Promo', channel=CampaignChannel.EMAIL.value,
            subject='Test', body='Test', segment='all')
        with pytest.raises(MarketingError):
            campaign.start()


class TestCoupon:
    def test_create_percentage_coupon(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='PROMO20',
            coupon_type=CouponType.PERCENTAGE.value,
            value=20.0, valid_until=date.today() + timedelta(days=30),
        )
        assert coupon.code == 'PROMO20'
        assert coupon.coupon_type == CouponType.PERCENTAGE.value

    def test_create_fixed_coupon(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='DESC10',
            coupon_type=CouponType.FIXED.value,
            value=10.0, valid_until=date.today() + timedelta(days=30),
        )
        assert coupon.coupon_type == CouponType.FIXED.value

    def test_create_coupon_missing_code(self):
        from models import Coupon
        with pytest.raises(ValidationError):
            Coupon.create(
                user_id=1, code='',
                coupon_type=CouponType.PERCENTAGE.value,
                value=20.0, valid_until=date.today() + timedelta(days=30))

    def test_coupon_is_valid(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='PROMO20',
            coupon_type=CouponType.PERCENTAGE.value,
            value=20.0, valid_until=date.today() + timedelta(days=30),
            max_uses=100,
        )
        assert coupon.is_valid() is True

    def test_coupon_expired(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='PROMO20',
            coupon_type=CouponType.PERCENTAGE.value,
            value=20.0, valid_until=date.today() - timedelta(days=1),
            max_uses=100,
        )
        assert coupon.is_valid() is False

    def test_coupon_max_uses_reached(self):
        from models import Coupon
        with pytest.raises(ValidationError):
            Coupon.create(
                user_id=1, code='PROMO20',
                coupon_type=CouponType.PERCENTAGE.value,
                value=20.0, valid_until=date.today() + timedelta(days=30),
                max_uses=0)

    def test_coupon_use_increments_counter(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='PROMO20',
            coupon_type=CouponType.PERCENTAGE.value,
            value=20.0, valid_until=date.today() + timedelta(days=30),
            max_uses=100,
        )
        coupon.use()
        assert coupon.uses_count == 1

    def test_coupon_max_uses_exhausted(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='PROMO20',
            coupon_type=CouponType.PERCENTAGE.value,
            value=20.0, valid_until=date.today() + timedelta(days=30),
            max_uses=1,
        )
        coupon.use()
        assert coupon.is_valid() is False

    def test_calculate_discount_percentage(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='PROMO20',
            coupon_type=CouponType.PERCENTAGE.value,
            value=20.0, valid_until=date.today() + timedelta(days=30),
            max_uses=100,
        )
        discount = coupon.calculate_discount(100.00)
        assert discount == 20.00

    def test_calculate_discount_fixed(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='DESC10',
            coupon_type=CouponType.FIXED.value,
            value=10.0, valid_until=date.today() + timedelta(days=30),
            max_uses=100,
        )
        discount = coupon.calculate_discount(100.00)
        assert discount == 10.00

    def test_calculate_discount_fixed_exceeds_amount(self):
        from models import Coupon
        coupon = Coupon.create(
            user_id=1, code='DESC50',
            coupon_type=CouponType.FIXED.value,
            value=50.0, valid_until=date.today() + timedelta(days=30),
            max_uses=100,
        )
        discount = coupon.calculate_discount(30.00)
        assert discount == 30.00
