"""TDD unit tests for the GiftCard domain entity (Phase 2)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import GiftCardStatus
from domain.exceptions import GiftCardError, ValidationError


class TestGiftCardCreation:
    def test_create_gift_card_valid(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1,
            amount=100.00,
            purchaser_id=1,
            recipient_email='presente@example.com',
        )
        assert gc.status == GiftCardStatus.ACTIVE.value
        assert gc.amount == 100.00
        assert gc.code is not None
        assert len(gc.code) >= 8

    def test_create_gift_card_zero_amount_rejected(self):
        from models import GiftCard
        with pytest.raises(ValidationError):
            GiftCard.create(
                user_id=1, amount=0, purchaser_id=1,
                recipient_email='presente@example.com')

    def test_create_gift_card_negative_amount_rejected(self):
        from models import GiftCard
        with pytest.raises(ValidationError):
            GiftCard.create(
                user_id=1, amount=-50, purchaser_id=1,
                recipient_email='presente@example.com')

    def test_create_gift_card_missing_recipient(self):
        from models import GiftCard
        with pytest.raises(ValidationError):
            GiftCard.create(
                user_id=1, amount=100, purchaser_id=1,
                recipient_email='')

    def test_gift_card_has_expiry(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com', validity_days=365)
        assert gc.expires_at is not None

    def test_gift_card_code_is_unique(self):
        from models import GiftCard
        gc1 = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='a@example.com')
        gc2 = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='b@example.com')
        assert gc1.code != gc2.code


class TestGiftCardRedemption:
    def test_redeem_active_gift_card(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com')
        gc.redeem('redeemer@example.com')
        assert gc.status == GiftCardStatus.REDEEMED.value
        assert gc.redeemed_by == 'redeemer@example.com'
        assert gc.redeemed_at is not None

    def test_redeem_already_redeemed_rejected(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com')
        gc.redeem('a@example.com')
        with pytest.raises(GiftCardError):
            gc.redeem('b@example.com')

    def test_redeem_blocked_gift_card_rejected(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com')
        gc.block()
        with pytest.raises(GiftCardError):
            gc.redeem('a@example.com')

    def test_redeem_expired_gift_card_rejected(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com', validity_days=30)
        gc.expires_at = datetime.utcnow() - timedelta(days=1)
        gc.check_expiry()
        with pytest.raises(GiftCardError):
            gc.redeem('a@example.com')


class TestGiftCardFraudPrevention:
    def test_block_gift_card(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com')
        gc.block()
        assert gc.status == GiftCardStatus.BLOCKED.value

    def test_block_already_redeemed_rejected(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com')
        gc.redeem('a@example.com')
        with pytest.raises(GiftCardError):
            gc.block()

    def test_redeem_blocked_rejected(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com')
        gc.block()
        with pytest.raises(GiftCardError):
            gc.redeem('a@example.com')


class TestGiftCardExpiry:
    def test_check_expiry_marks_expired(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com', validity_days=30)
        gc.expires_at = datetime.utcnow() - timedelta(days=1)
        gc.check_expiry()
        assert gc.status == GiftCardStatus.EXPIRED.value

    def test_check_expiry_active_stays_active(self):
        from models import GiftCard
        gc = GiftCard.create(
            user_id=1, amount=100, purchaser_id=1,
            recipient_email='presente@example.com', validity_days=365)
        gc.check_expiry()
        assert gc.status == GiftCardStatus.ACTIVE.value
