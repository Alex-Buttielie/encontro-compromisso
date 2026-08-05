"""Domain exceptions.

These represent violations of business rules (invariants) and are raised
by the rich domain entities. The application/service layer catches them and
translates them into API responses, keeping the domain pure.
"""


class DomainError(Exception):
    """Base class for all domain rule violations."""

    def __init__(self, message, errors=None):
        super().__init__(message)
        self.message = message
        # `errors` is a list so it maps directly to the API contract
        self.errors = errors if errors is not None else [message]


class ValidationError(DomainError):
    """Raised when input data violates an entity invariant."""


class InvalidStateTransition(DomainError):
    """Raised when an entity is asked to move to an invalid state."""


class BusinessRuleViolation(DomainError):
    """Raised when an operation breaks a higher-level business rule."""


class InvalidTokenError(DomainError):
    """Raised when a security token (e-mail confirmation, password reset) is invalid or expired."""


class PaymentError(DomainError):
    """Raised when a payment operation violates business rules."""


class WalletError(DomainError):
    """Raised when a wallet operation violates business rules (insufficient balance, etc)."""


class PackageError(DomainError):
    """Raised when a package operation violates business rules (expired, exhausted, etc)."""


class GiftCardError(DomainError):
    """Raised when a gift card operation violates business rules (invalid code, already redeemed, etc)."""


class IdempotencyError(DomainError):
    """Raised when an idempotent operation is replayed with conflicting payload."""


class LoyaltyError(DomainError):
    """Raised when a loyalty operation violates business rules."""


class CRMError(DomainError):
    """Raised when a CRM operation violates business rules."""


class ERPError(DomainError):
    """Raised when an ERP/financial operation violates business rules."""


class InventoryError(DomainError):
    """Raised when an inventory operation violates business rules (insufficient stock, etc)."""


class MarketingError(DomainError):
    """Raised when a marketing operation violates business rules."""


class AnalyticsError(DomainError):
    """Raised when an analytics operation violates business rules."""


class EmployeeError(DomainError):
    """Raised when an employee/team operation violates business rules."""


class CommissionError(DomainError):
    """Raised when a commission calculation or payment violates business rules."""


class BranchError(DomainError):
    """Raised when a multi-unit/branch operation violates business rules."""


class TransferError(DomainError):
    """Raised when a stock transfer between branches violates business rules."""


class SocialError(DomainError):
    """Raised when a social network operation violates business rules."""


class ChatError(DomainError):
    """Raised when a chat operation violates business rules."""


class NotificationError(DomainError):
    """Raised when a notification operation violates business rules."""


class HomeCareError(DomainError):
    """Raised when a home care / logistics operation violates business rules."""


class DocumentError(DomainError):
    """Raised when a document or contract operation violates business rules."""


class QuoteError(DomainError):
    """Raised when a quote (orcamento) operation violates business rules."""


class WorkflowError(DomainError):
    """Raised when a workflow builder operation violates business rules."""


class SubscriptionError(DomainError):
    """Raised when a subscription operation violates business rules."""


class ReferralError(DomainError):
    """Raised when a referral operation violates business rules."""


class AIAgentError(DomainError):
    """Raised when an AI agent operation violates business rules."""


class AdminError(DomainError):
    """Raised when an administrative operation violates business rules."""


class ApiError(DomainError):
    """Raised when a public API operation violates business rules."""


class LgpdError(DomainError):
    """Raised when an LGPD data request violates business rules."""
