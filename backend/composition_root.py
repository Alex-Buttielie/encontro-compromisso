"""Composition Root — wires adapters to ports for the hexagonal architecture.

This is the ONLY place that knows about concrete implementations.
Services and route handlers depend on ports (abstract interfaces).
At startup, this module injects the Firestore adapters.

To switch to a different database (e.g. PostgreSQL), create new adapter
implementations and wire them here. No service or domain code changes.

Usage in app factory:
    from composition_root import wire_adapters
    wire_adapters(app)

Usage in route handlers (via ServiceRegistry):
    from services.registry import get_service
    client_service = get_service(ClientService)
"""
from logger import get_logger

_logger = get_logger('CompositionRoot')

_wired = False


def wire_adapters(app=None):
    """Wire Firestore adapters to port interfaces.

    Called once at application startup. Imports all concrete repository
    adapters and makes them available for dependency injection.

    This function is idempotent — safe to call multiple times.
    """
    global _wired
    if _wired:
        return

    # Import concrete adapters to ensure they're registered
    # The repositories self-register via BaseRepository inheritance.
    # Services use ServiceRegistry which instantiates repos lazily.

    from repositories.user_repository import UserRepository
    from repositories.client_repository import ClientRepository
    from repositories.appointment_repository import AppointmentRepository
    from repositories.transaction_repository import TransactionRepository
    from repositories.service_repository import ServiceRepository
    from repositories.work_repository import WorkRepository, WorkOrderRepository
    from repositories.wallet_repository import WalletRepository
    from repositories.payment_repository import PaymentRepository
    from repositories.package_repository import PackageRepository
    from repositories.giftcard_repository import GiftCardRepository
    from repositories.loyalty_repository import LoyaltyRepository
    from repositories.team_repository import EmployeeRepository
    from repositories.branch_repository import BranchRepository
    from repositories.commission_repository import CommissionRuleRepository, CommissionPaymentRepository
    from repositories.crm_repository import ClientProfileRepository, SatisfactionSurveyRepository
    from repositories.erp_repository import (
        CashFlowRepository, CostCenterRepository,
        AccountPayableRepository, AccountReceivableRepository,
        FinancialPeriodRepository,
    )
    from repositories.inventory_repository import ProductRepository, SupplierRepository, StockMovementRepository
    from repositories.marketing_repository import CampaignRepository, CouponRepository
    from repositories.social_repository import (
        PostRepository, CommentRepository, StoryRepository,
        FollowRepository, ReportRepository, ModerationLogRepository,
    )
    from repositories.chat_repository import (
        ChatRepository, MessageRepository,
        NotificationPreferenceRepository, NotificationRepository,
    )
    from repositories.phase6_repository import (
        ServiceAreaRepository, QuoteRepository, ContractRepository,
        CheckInOutRepository, WorkflowRepository, WorkflowExecutionRepository,
    )
    from repositories.phase7_repository import (
        SubscriptionRepository, BillingRepository, ReferralRepository,
        AgentConfigRepository, AgentExecutionRepository,
    )
    from repositories.phase8_repository import (
        AuditLogRepository, ApiKeyRepository, WebhookRepository,
        DataRequestRepository, FeatureFlagRepository,
    )

    _logger.info('Firestore adapters wired to ports')
    _wired = True


def reset_wiring():
    """Reset wiring state — useful for testing."""
    global _wired
    _wired = False
