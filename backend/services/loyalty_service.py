"""Loyalty application service (thin orchestration over the domain)."""
from logger import get_logger
from models import LoyaltyAccount, Mission, Medal
from domain.exceptions import DomainError
from repositories.loyalty_repository import (
    LoyaltyRepository, MissionRepository, MedalRepository,
)
from repositories.wallet_repository import WalletRepository
from domain.enums import LedgerEntryType


class LoyaltyService:
    """Coordinates loyalty operations: points, XP, levels, medals, missions."""

    def __init__(self, loyalty_repository=None, mission_repository=None,
                 medal_repository=None, wallet_repository=None):
        self.loyalty_repository = loyalty_repository or LoyaltyRepository()
        self.mission_repository = mission_repository or MissionRepository()
        self.medal_repository = medal_repository or MedalRepository()
        self.wallet_repository = wallet_repository or WalletRepository()
        self.logger = get_logger(self.__class__.__name__)

    def get_account(self, user_id, provider_id=None):
        """Get or create a loyalty account for the user."""
        account = self.loyalty_repository.get_or_create(user_id, provider_id or user_id)
        return account.to_dict()

    def earn_points(self, user_id, amount, reason, provider_id=None):
        """Award points to a user's loyalty account."""
        account = self.loyalty_repository.get_or_create(user_id, provider_id or user_id)
        try:
            account.earn_points(amount, reason)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.loyalty_repository.save(account)
        self.logger.info('Points earned: user_id=%s amount=%s', user_id, amount)
        return {'success': True, 'account': account.to_dict()}

    def spend_points(self, user_id, amount, reason, provider_id=None):
        """Spend points from a user's loyalty account."""
        account = self.loyalty_repository.get_or_create(user_id, provider_id or user_id)
        try:
            account.spend_points(amount, reason)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.loyalty_repository.save(account)
        self.logger.info('Points spent: user_id=%s amount=%s', user_id, amount)
        return {'success': True, 'account': account.to_dict()}

    def earn_xp(self, user_id, amount, reason, provider_id=None):
        """Award XP to a user's loyalty account (may trigger level-up)."""
        account = self.loyalty_repository.get_or_create(user_id, provider_id or user_id)
        try:
            account.earn_xp(amount, reason)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.loyalty_repository.save(account)
        self.logger.info('XP earned: user_id=%s amount=%s level=%s', user_id, amount, account.level)
        return {'success': True, 'account': account.to_dict()}

    def award_cashback(self, user_id, payment_amount, rate=0.05, cap=None, provider_id=None):
        """Calculate and credit cashback to both loyalty and wallet."""
        account = self.loyalty_repository.get_or_create(user_id, provider_id or user_id)
        cashback = account.calculate_cashback(payment_amount, rate, cap)

        if cashback > 0:
            # Credit to wallet
            wallet = self.wallet_repository.get_or_create(user_id)
            wallet.credit(cashback, LedgerEntryType.CASHBACK, 'Cashback automático',
                          reference_type='cashback')
            self.wallet_repository.save(wallet)

            # Record in loyalty
            from models import LoyaltyTransactionType
            account._record_transaction(
                LoyaltyTransactionType.CASHBACK_EARNED, int(cashback * 100),
                f'Cashback: R$ {cashback:.2f}',
            )
            self.loyalty_repository.save(account)

        self.logger.info('Cashback awarded: user_id=%s amount=%s', user_id, cashback)
        return {'success': True, 'cashback': cashback, 'account': account.to_dict()}

    def award_medal(self, user_id, medal_id, provider_id=None):
        """Award a medal to a user's loyalty account."""
        account = self.loyalty_repository.get_or_create(user_id, provider_id or user_id)
        medal = self.medal_repository.get_by_id(medal_id)
        if not medal:
            return {'success': False, 'errors': ['Medalha não encontrada']}

        account.award_medal(medal)
        self.loyalty_repository.save(account)
        self.logger.info('Medal awarded: user_id=%s medal_id=%s', user_id, medal_id)
        return {'success': True, 'account': account.to_dict()}

    def get_ranking(self, provider_id):
        """Get loyalty ranking for a provider's clients (by XP)."""
        from database import get_db
        docs = get_db().collection('loyalty_accounts').where('provider_id', '==', provider_id).stream()
        accounts = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            accounts.append(data)
        accounts.sort(key=lambda x: x.get('xp', 0), reverse=True)
        ranking = []
        for i, acc in enumerate(accounts, 1):
            ranking.append({
                'position': i,
                'userId': acc.get('user_id'),
                'xp': acc.get('xp', 0),
                'level': acc.get('level', 0),
                'points': acc.get('points', 0),
            })
        return ranking

    # --- Missions ---
    def create_mission(self, data):
        """Create a loyalty mission."""
        try:
            mission = Mission.create(
                provider_id=data['userId'],
                title=data.get('title'),
                description=data.get('description', ''),
                xp_reward=data.get('xpReward', 0),
                points_reward=data.get('pointsReward', 0),
                target_count=data.get('targetCount'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.mission_repository.add(mission)
        self.logger.info('Mission created: id=%s', mission.id)
        return {'success': True, 'mission': mission.to_dict()}

    def get_missions(self, provider_id):
        """Get all missions for a provider."""
        missions = self.mission_repository.find_by_provider_id(provider_id)
        return [m.to_dict() for m in missions]

    # --- Medals ---
    def create_medal(self, data):
        """Create a loyalty medal."""
        try:
            medal = Medal.create(
                provider_id=data['userId'],
                title=data.get('title'),
                description=data.get('description', ''),
                icon=data.get('icon', '🏅'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}

        self.medal_repository.add(medal)
        self.logger.info('Medal created: id=%s', medal.id)
        return {'success': True, 'medal': medal.to_dict()}

    def get_medals(self, provider_id):
        """Get all medals for a provider."""
        medals = self.medal_repository.find_by_provider_id(provider_id)
        return [m.to_dict() for m in medals]
