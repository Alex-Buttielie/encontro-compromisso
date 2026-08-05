"""TDD unit tests for PackageService, GiftCardService, LoyaltyService (Phase 2)."""
import pytest

from domain.enums import PackageStatus, GiftCardStatus


class TestPackageService:
    def test_create_package(self, client, app):
        from services.package_service import PackageService
        with app.app_context():
            svc = PackageService()
            result = svc.create_package({
                'userId': 1, 'clientId': 1, 'name': 'Pacote 10',
                'totalSessions': 10, 'price': 800, 'validityDays': 90,
                'sessionPrice': 100,
            })
            assert result['success'] is True
            assert result['package']['remainingSessions'] == 10

    def test_use_session(self, client, app):
        from services.package_service import PackageService
        with app.app_context():
            svc = PackageService()
            create = svc.create_package({
                'userId': 1, 'clientId': 1, 'name': 'Pacote 5',
                'totalSessions': 5, 'price': 400, 'validityDays': 30,
            })
            pkg_id = create['package']['id']
            result = svc.use_session(pkg_id, 1)
            assert result['success'] is True
            assert result['package']['remainingSessions'] == 4

    def test_use_session_exhausted(self, client, app):
        from services.package_service import PackageService
        with app.app_context():
            svc = PackageService()
            create = svc.create_package({
                'userId': 1, 'clientId': 1, 'name': 'Pacote 1',
                'totalSessions': 1, 'price': 100, 'validityDays': 30,
            })
            pkg_id = create['package']['id']
            svc.use_session(pkg_id, 1)
            result = svc.use_session(pkg_id, 1)
            assert result['success'] is False

    def test_cancel_package(self, client, app):
        from services.package_service import PackageService
        with app.app_context():
            svc = PackageService()
            create = svc.create_package({
                'userId': 1, 'clientId': 1, 'name': 'Pacote',
                'totalSessions': 5, 'price': 400, 'validityDays': 30,
            })
            pkg_id = create['package']['id']
            result = svc.cancel_package(pkg_id, 1)
            assert result['success'] is True
            assert result['package']['status'] == PackageStatus.CANCELLED.value


class TestGiftCardService:
    def test_create_gift_card(self, client, app):
        from services.giftcard_service import GiftCardService
        with app.app_context():
            svc = GiftCardService()
            result = svc.create_gift_card({
                'userId': 1, 'amount': 100, 'purchaserId': 1,
                'recipientEmail': 'gift@example.com',
            })
            assert result['success'] is True
            assert result['giftCard']['code'] is not None
            assert result['giftCard']['status'] == GiftCardStatus.ACTIVE.value

    def test_redeem_gift_card(self, client, app):
        from services.giftcard_service import GiftCardService
        with app.app_context():
            svc = GiftCardService()
            create = svc.create_gift_card({
                'userId': 1, 'amount': 50, 'purchaserId': 1,
                'recipientEmail': 'gift@example.com',
            })
            code = create['giftCard']['code']
            result = svc.redeem_gift_card(code, 'redeemer@example.com')
            assert result['success'] is True
            assert result['giftCard']['status'] == GiftCardStatus.REDEEMED.value

    def test_redeem_already_redeemed(self, client, app):
        from services.giftcard_service import GiftCardService
        with app.app_context():
            svc = GiftCardService()
            create = svc.create_gift_card({
                'userId': 1, 'amount': 50, 'purchaserId': 1,
                'recipientEmail': 'gift@example.com',
            })
            code = create['giftCard']['code']
            svc.redeem_gift_card(code, 'a@example.com')
            result = svc.redeem_gift_card(code, 'b@example.com')
            assert result['success'] is False

    def test_redeem_invalid_code(self, client, app):
        from services.giftcard_service import GiftCardService
        with app.app_context():
            svc = GiftCardService()
            result = svc.redeem_gift_card('INVALID', 'a@example.com')
            assert result['success'] is False

    def test_block_gift_card(self, client, app):
        from services.giftcard_service import GiftCardService
        with app.app_context():
            svc = GiftCardService()
            create = svc.create_gift_card({
                'userId': 1, 'amount': 50, 'purchaserId': 1,
                'recipientEmail': 'gift@example.com',
            })
            code = create['giftCard']['code']
            result = svc.block_gift_card(code, 1)
            assert result['success'] is True
            assert result['giftCard']['status'] == GiftCardStatus.BLOCKED.value


class TestLoyaltyService:
    def test_get_account_creates(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            result = svc.get_account(1, provider_id=1)
            assert result['userId'] == 1
            assert result['points'] == 0
            assert result['level'] == 1

    def test_earn_points(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            result = svc.earn_points(1, 50, 'service_completion', provider_id=1)
            assert result['success'] is True
            assert result['account']['points'] == 50

    def test_spend_points(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            svc.earn_points(1, 100, 'initial', provider_id=1)
            result = svc.spend_points(1, 30, 'reward', provider_id=1)
            assert result['success'] is True
            assert result['account']['points'] == 70

    def test_spend_points_insufficient(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            svc.earn_points(1, 20, 'initial', provider_id=1)
            result = svc.spend_points(1, 50, 'reward', provider_id=1)
            assert result['success'] is False

    def test_earn_xp_level_up(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            result = svc.earn_xp(1, 100, 'big_completion', provider_id=1)
            assert result['success'] is True
            assert result['account']['level'] == 2

    def test_cashback_calculation(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            result = svc.award_cashback(1, 100.00, rate=0.10, provider_id=1)
            assert result['success'] is True
            assert result['cashback'] == 10.00

    def test_cashback_capped(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            result = svc.award_cashback(1, 1000.00, rate=0.10, cap=50.00, provider_id=1)
            assert result['cashback'] == 50.00

    def test_create_mission(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            result = svc.create_mission({
                'userId': 1, 'title': '5 agendamentos',
                'description': 'Agende 5 sessões', 'xpReward': 50,
                'pointsReward': 100, 'targetCount': 5,
            })
            assert result['success'] is True
            assert result['mission']['title'] == '5 agendamentos'

    def test_create_medal(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            result = svc.create_medal({
                'userId': 1, 'title': 'Primeiro agendamento',
                'description': 'Test', 'icon': '🏆',
            })
            assert result['success'] is True
            assert result['medal']['icon'] == '🏆'

    def test_ranking(self, client, app):
        from services.loyalty_service import LoyaltyService
        with app.app_context():
            svc = LoyaltyService()
            svc.earn_xp(1, 300, 'test', provider_id=1)
            svc.earn_xp(2, 100, 'test', provider_id=1)
            ranking = svc.get_ranking(1)
            assert len(ranking) == 2
            assert ranking[0]['userId'] == 1
            assert ranking[0]['position'] == 1
