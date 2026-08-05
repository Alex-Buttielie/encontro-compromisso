# api package
from .auth import auth_bp
from .clients import clients_bp
from .services import services_bp
from .appointments import appointments_bp
from .transactions import transactions_bp
from .works import works_bp
from .payments import payments_bp
from .wallet import wallet_bp
from .packages import packages_bp
from .giftcards import giftcards_bp
from .loyalty import loyalty_bp
from .crm import crm_bp
from .erp import erp_bp
from .inventory import inventory_bp
from .marketing import marketing_bp
from .analytics import analytics_bp
from .employees import employees_bp
from .commissions import commissions_bp
from .branches import branches_bp
from .social import social_bp
from .chat import chat_bp
from .notifications import notifications_bp
from .homecare import homecare_bp
from .contracts import contracts_bp as documents_bp
from .quotes import quotes_bp
from .checkin import checkin_bp
from .workflows import workflows_bp
from .subscriptions import subscriptions_bp
from .referrals import referrals_bp
from .agents import agents_bp as ai_agents_bp
from .admin import admin_bp
from .public_api import public_api_bp
from .lgpd import lgpd_bp
from .cep import cep_bp

__all__ = [
    'auth_bp', 'clients_bp', 'services_bp', 'appointments_bp',
    'transactions_bp', 'works_bp', 'payments_bp', 'wallet_bp',
    'packages_bp', 'giftcards_bp', 'loyalty_bp', 'crm_bp',
    'erp_bp', 'inventory_bp', 'marketing_bp', 'analytics_bp',
    'employees_bp', 'commissions_bp', 'branches_bp', 'social_bp',
    'chat_bp', 'notifications_bp', 'homecare_bp', 'documents_bp',
    'quotes_bp', 'checkin_bp', 'workflows_bp', 'subscriptions_bp',
    'referrals_bp', 'ai_agents_bp', 'admin_bp', 'public_api_bp',
    'lgpd_bp', 'cep_bp',
]
