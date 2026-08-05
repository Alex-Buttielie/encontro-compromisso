"""Referral service — codes, links, conversions, rewards, ranking."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.phase7_repository import ReferralRepository


class ReferralService:
    def __init__(self, ref_repo=None):
        self.ref_repo = ref_repo or ReferralRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_referral(self, data):
        from models import Referral
        try:
            ref = Referral.create(
                referrer_id=data['userId'],
                referred_email=data.get('referredEmail'),
                reward_amount=data.get('rewardAmount', 0.0),
                referrer_email=data.get('referrerEmail'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.ref_repo.add(ref)
        return {'success': True, 'referral': ref.to_dict()}

    def get_referrals(self, user_id):
        refs = self.ref_repo.find_by_referrer(user_id)
        return [r.to_dict() for r in refs]

    def get_referral(self, ref_id):
        ref = self.ref_repo.get_by_id(ref_id)
        if not ref:
            return None
        return ref.to_dict()

    def get_by_code(self, code):
        ref = self.ref_repo.find_by_code(code)
        if not ref:
            return None
        return ref.to_dict()

    def register_referral(self, code, referred_user_id):
        ref = self.ref_repo.find_by_code(code)
        if not ref:
            return {'success': False, 'errors': ['Código de indicação não encontrado']}
        try:
            ref.register(referred_user_id=referred_user_id)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.ref_repo.save(ref)
        return {'success': True, 'referral': ref.to_dict()}

    def convert_referral(self, code):
        ref = self.ref_repo.find_by_code(code)
        if not ref:
            return {'success': False, 'errors': ['Código de indicação não encontrado']}
        try:
            ref.convert()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.ref_repo.save(ref)
        return {'success': True, 'referral': ref.to_dict()}

    def reward_referral(self, ref_id):
        ref = self.ref_repo.get_by_id(ref_id)
        if not ref:
            return {'success': False, 'errors': ['Indicação não encontrada']}
        try:
            ref.reward()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.ref_repo.save(ref)
        return {'success': True, 'referral': ref.to_dict()}

    def expire_referral(self, ref_id):
        ref = self.ref_repo.get_by_id(ref_id)
        if not ref:
            return {'success': False, 'errors': ['Indicação não encontrada']}
        try:
            ref.expire()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.ref_repo.save(ref)
        return {'success': True, 'referral': ref.to_dict()}

    def get_ranking(self, limit=10):
        results = self.ref_repo.find_ranking(limit=limit)
        ranking = []
        for row in results:
            ranking.append({
                'referrerId': row[0],
                'totalReferrals': row[1],
                'conversions': row[2] or 0,
            })
        return ranking

    def get_stats(self, user_id):
        converted = self.ref_repo.find_converted_count(user_id)
        rewarded = self.ref_repo.find_rewarded_count(user_id)
        total = len(self.ref_repo.find_by_referrer(user_id))
        return {
            'total': total,
            'converted': converted,
            'rewarded': rewarded,
        }
