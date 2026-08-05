"""TDD unit tests for the Loyalty domain entities (Phase 2)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import LoyaltyTransactionType
from domain.exceptions import LoyaltyError, ValidationError


class TestLoyaltyAccountCreation:
    def test_create_loyalty_account(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        assert account.user_id == 1
        assert account.points == 0
        assert account.xp == 0
        assert account.level == 1

    def test_loyalty_account_starts_at_level_1(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        assert account.level == 1


class TestPointsAndXP:
    def test_earn_points(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        account.earn_points(50, 'service_completion')
        assert account.points == 50

    def test_earn_xp(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        account.earn_xp(100, 'service_completion')
        assert account.xp == 100

    def test_spend_points(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        account.earn_points(100, 'initial')
        account.spend_points(30, 'reward_redemption')
        assert account.points == 70

    def test_spend_points_insufficient(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        account.earn_points(20, 'initial')
        with pytest.raises(LoyaltyError):
            account.spend_points(50, 'reward')

    def test_earn_points_creates_transaction(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        tx = account.earn_points(50, 'service_completion')
        assert tx is not None
        assert tx.type == LoyaltyTransactionType.POINTS_EARNED.value
        assert tx.amount == 50


class TestLevels:
    def test_level_up_when_xp_threshold_reached(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        # Level 1 → 2 at 100 XP
        account.earn_xp(100, 'service_completion')
        assert account.level == 2

    def test_multiple_level_ups(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        # Level 1→2 at 100, Level 2→3 at 300
        account.earn_xp(300, 'big_completion')
        assert account.level == 3

    def test_level_thresholds(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        assert account.xp_for_next_level() == 100
        account.earn_xp(100, 'test')
        assert account.xp_for_next_level() == 300


class TestCashbackCalculation:
    def test_cashback_percentage(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        cashback = account.calculate_cashback(100.00, rate=0.10)
        assert cashback == 10.00

    def test_cashback_zero_rate(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        cashback = account.calculate_cashback(100.00, rate=0.0)
        assert cashback == 0.0

    def test_cashback_capped(self):
        from models import LoyaltyAccount
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        cashback = account.calculate_cashback(1000.00, rate=0.10, cap=50.00)
        assert cashback == 50.00


class TestMissions:
    def test_create_mission(self):
        from models import Mission
        mission = Mission.create(
            provider_id=1,
            title='Complete 5 agendamentos',
            description='Agende 5 sessões este mês',
            xp_reward=50,
            points_reward=100,
            target_count=5,
        )
        assert mission.title == 'Complete 5 agendamentos'
        assert mission.xp_reward == 50
        assert mission.points_reward == 100
        assert mission.target_count == 5

    def test_mission_missing_title(self):
        from models import Mission
        with pytest.raises(ValidationError):
            Mission.create(
                provider_id=1, title='', description='Test',
                xp_reward=50, points_reward=100, target_count=5)

    def test_mission_zero_target_rejected(self):
        from models import Mission
        with pytest.raises(ValidationError):
            Mission.create(
                provider_id=1, title='Test', description='Test',
                xp_reward=50, points_reward=100, target_count=0)


class TestMedals:
    def test_create_medal(self):
        from models import Medal
        medal = Medal.create(
            provider_id=1,
            title='Primeiro agendamento',
            description='Complete seu primeiro agendamento',
            icon='🏆',
        )
        assert medal.title == 'Primeiro agendamento'
        assert medal.icon == '🏆'

    def test_medal_missing_title(self):
        from models import Medal
        with pytest.raises(ValidationError):
            Medal.create(
                provider_id=1, title='', description='Test', icon='🏆')

    def test_award_medal_to_account(self):
        from models import LoyaltyAccount, Medal
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        medal = Medal.create(
            provider_id=1, title='Primeiro agendamento',
            description='Test', icon='🏆')
        account.award_medal(medal)
        assert len(account.earned_medals) == 1

    def test_award_duplicate_medal_ignored(self):
        from models import LoyaltyAccount, Medal
        account = LoyaltyAccount.create(user_id=1, provider_id=1)
        medal = Medal.create(
            provider_id=1, title='Primeiro agendamento',
            description='Test', icon='🏆')
        account.award_medal(medal)
        account.award_medal(medal)
        assert len(account.earned_medals) == 1
