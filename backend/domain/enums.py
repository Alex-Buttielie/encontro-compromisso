"""Domain enums with behavior (state machines and labels).

These are part of the ubiquitous language of the domain. They encapsulate
valid transitions and human-friendly labels instead of scattering that
knowledge across services and the UI.
"""
from enum import Enum

from domain.exceptions import ValidationError


class UserRole(str, Enum):
    """Role of a user in the platform."""

    PROVIDER = 'provider'
    CLIENT = 'client'
    COLLABORATOR = 'collaborator'
    ADMIN = 'admin'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Role inválido: {value}')

    @property
    def label(self):
        return {
            'provider': 'Prestador',
            'client': 'Cliente',
            'collaborator': 'Colaborador',
            'admin': 'Administrador',
        }[self.value]


class WorkOrderStatus(str, Enum):
    """Lifecycle of a work order placed by a client."""

    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de pedido inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'accepted': 'Aceito',
            'rejected': 'Recusado',
            'completed': 'Concluído',
            'cancelled': 'Cancelado',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (WorkOrderStatus.COMPLETED, WorkOrderStatus.REJECTED, WorkOrderStatus.CANCELLED)

    def can_transition_to(self, target):
        target = target if isinstance(target, WorkOrderStatus) else WorkOrderStatus.from_value(target)
        return target in _WORK_ORDER_TRANSITIONS[self]


class AppointmentStatus(str, Enum):
    """Lifecycle of an appointment as an explicit state machine."""

    SCHEDULED = 'scheduled'
    CONFIRMED = 'confirmed'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de agendamento inválido: {value}')

    @property
    def label(self):
        return {
            'scheduled': 'Agendado',
            'confirmed': 'Confirmado',
            'completed': 'Concluído',
            'cancelled': 'Cancelado',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED)

    def can_transition_to(self, target):
        target = target if isinstance(target, AppointmentStatus) else AppointmentStatus.from_value(target)
        return target in _APPOINTMENT_TRANSITIONS[self]


class TransactionType(str, Enum):
    """Whether money comes in or goes out."""

    INCOME = 'income'
    EXPENSE = 'expense'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError('Tipo deve ser income ou expense')

    @property
    def label(self):
        return {'income': 'Receita', 'expense': 'Despesa'}[self.value]


class TransactionStatus(str, Enum):
    """Payment lifecycle of a transaction."""

    PENDING = 'pending'
    PAID = 'paid'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError('Status deve ser pending ou paid')

    @property
    def label(self):
        return {'pending': 'Pendente', 'paid': 'Pago'}[self.value]


# Allowed transitions for the appointment state machine.
# Defined at module level to keep the Enum body free of data members.
_APPOINTMENT_TRANSITIONS = {
    AppointmentStatus.SCHEDULED: {
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.COMPLETED,
    },
    AppointmentStatus.CONFIRMED: {
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
    },
    AppointmentStatus.COMPLETED: set(),
    AppointmentStatus.CANCELLED: set(),
}

_WORK_ORDER_TRANSITIONS = {
    WorkOrderStatus.PENDING: {
        WorkOrderStatus.ACCEPTED,
        WorkOrderStatus.REJECTED,
        WorkOrderStatus.CANCELLED,
    },
    WorkOrderStatus.ACCEPTED: {
        WorkOrderStatus.COMPLETED,
        WorkOrderStatus.CANCELLED,
    },
    WorkOrderStatus.REJECTED: set(),
    WorkOrderStatus.COMPLETED: set(),
    WorkOrderStatus.CANCELLED: set(),
}


# ---------------------------------------------------------------------------
# Phase 2 — Payments, Wallet, Packages, Gift Cards, Loyalty
# ---------------------------------------------------------------------------

class PaymentStatus(str, Enum):
    """Lifecycle of a payment through the gateway."""

    PENDING = 'pending'
    AUTHORIZED = 'authorized'
    PROCESSING = 'processing'
    PAID = 'paid'
    FAILED = 'failed'
    CANCELLED = 'cancelled'
    PARTIALLY_REFUNDED = 'partially_refunded'
    FULLY_REFUNDED = 'fully_refunded'
    DISPUTED = 'disputed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de pagamento inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'authorized': 'Autorizado',
            'processing': 'Processando',
            'paid': 'Pago',
            'failed': 'Falhou',
            'cancelled': 'Cancelado',
            'partially_refunded': 'Estornado parcialmente',
            'fully_refunded': 'Estornado integralmente',
            'disputed': 'Em disputa',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (
            PaymentStatus.FAILED,
            PaymentStatus.CANCELLED,
            PaymentStatus.FULLY_REFUNDED,
        )

    @property
    def is_settled(self):
        """Money has been captured (provider can receive)."""
        return self in (PaymentStatus.PAID, PaymentStatus.PARTIALLY_REFUNDED)

    def can_transition_to(self, target):
        target = target if isinstance(target, PaymentStatus) else PaymentStatus.from_value(target)
        return target in _PAYMENT_TRANSITIONS[self]


class PaymentMethod(str, Enum):
    """Payment methods supported by the gateway."""

    PIX = 'pix'
    CREDIT_CARD = 'credit_card'
    DEBIT_CARD = 'debit_card'
    QR_CODE = 'qr_code'
    WALLET = 'wallet'
    GIFT_CARD = 'gift_card'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Método de pagamento inválido: {value}')

    @property
    def label(self):
        return {
            'pix': 'Pix',
            'credit_card': 'Cartão de crédito',
            'debit_card': 'Cartão de débito',
            'qr_code': 'QR Code',
            'wallet': 'Carteira',
            'gift_card': 'Gift Card',
        }[self.value]


class LedgerEntryType(str, Enum):
    """Types of immutable ledger entries in the digital wallet."""

    CREDIT = 'credit'
    DEBIT = 'debit'
    CASHBACK = 'cashback'
    PROMOTIONAL = 'promotional'
    WITHDRAWAL = 'withdrawal'
    TRANSFER_IN = 'transfer_in'
    TRANSFER_OUT = 'transfer_out'
    GIFT_CARD_REDEMPTION = 'gift_card_redemption'
    PACKAGE_PURCHASE = 'package_purchase'
    REFUND = 'refund'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de lançamento inválido: {value}')

    @property
    def label(self):
        return {
            'credit': 'Crédito',
            'debit': 'Débito',
            'cashback': 'Cashback',
            'promotional': 'Crédito promocional',
            'withdrawal': 'Saque',
            'transfer_in': 'Transferência recebida',
            'transfer_out': 'Transferência enviada',
            'gift_card_redemption': 'Resgate de gift card',
            'package_purchase': 'Compra de pacote',
            'refund': 'Reembolso',
        }[self.value]

    @property
    def is_credit(self):
        """Increases wallet balance."""
        return self in (
            LedgerEntryType.CREDIT,
            LedgerEntryType.CASHBACK,
            LedgerEntryType.PROMOTIONAL,
            LedgerEntryType.TRANSFER_IN,
            LedgerEntryType.GIFT_CARD_REDEMPTION,
            LedgerEntryType.REFUND,
        )

    @property
    def is_debit(self):
        """Decreases wallet balance."""
        return self in (
            LedgerEntryType.DEBIT,
            LedgerEntryType.WITHDRAWAL,
            LedgerEntryType.TRANSFER_OUT,
            LedgerEntryType.PACKAGE_PURCHASE,
        )


class PackageStatus(str, Enum):
    """Lifecycle of a session package."""

    ACTIVE = 'active'
    EXPIRED = 'expired'
    EXHAUSTED = 'exhausted'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de pacote inválido: {value}')

    @property
    def label(self):
        return {
            'active': 'Ativo',
            'expired': 'Expirado',
            'exhausted': 'Esgotado',
            'cancelled': 'Cancelado',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (PackageStatus.EXPIRED, PackageStatus.EXHAUSTED, PackageStatus.CANCELLED)


class GiftCardStatus(str, Enum):
    """Lifecycle of a gift card."""

    ACTIVE = 'active'
    REDEEMED = 'redeemed'
    EXPIRED = 'expired'
    BLOCKED = 'blocked'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de gift card inválido: {value}')

    @property
    def label(self):
        return {
            'active': 'Ativo',
            'redeemed': 'Resgatado',
            'expired': 'Expirado',
            'blocked': 'Bloqueado',
            'cancelled': 'Cancelado',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (GiftCardStatus.REDEEMED, GiftCardStatus.EXPIRED, GiftCardStatus.CANCELLED)


class LoyaltyTransactionType(str, Enum):
    """Types of loyalty transactions."""

    POINTS_EARNED = 'points_earned'
    POINTS_SPENT = 'points_spent'
    XP_EARNED = 'xp_earned'
    CASHBACK_EARNED = 'cashback_earned'
    MISSION_COMPLETED = 'mission_completed'
    MEDAL_EARNED = 'medal_earned'
    LEVEL_UP = 'level_up'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de transação de fidelidade inválido: {value}')

    @property
    def label(self):
        return {
            'points_earned': 'Pontos ganhos',
            'points_spent': 'Pontos gastos',
            'xp_earned': 'XP ganho',
            'cashback_earned': 'Cashback ganho',
            'mission_completed': 'Missão concluída',
            'medal_earned': 'Medalha conquistada',
            'level_up': 'Subiu de nível',
        }[self.value]


# Payment state machine transitions
_PAYMENT_TRANSITIONS = {
    PaymentStatus.PENDING: {
        PaymentStatus.AUTHORIZED,
        PaymentStatus.PROCESSING,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
    },
    PaymentStatus.AUTHORIZED: {
        PaymentStatus.PROCESSING,
        PaymentStatus.PAID,
        PaymentStatus.CANCELLED,
        PaymentStatus.FAILED,
    },
    PaymentStatus.PROCESSING: {
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
    },
    PaymentStatus.PAID: {
        PaymentStatus.PARTIALLY_REFUNDED,
        PaymentStatus.FULLY_REFUNDED,
        PaymentStatus.DISPUTED,
    },
    PaymentStatus.PARTIALLY_REFUNDED: {
        PaymentStatus.FULLY_REFUNDED,
        PaymentStatus.DISPUTED,
    },
    PaymentStatus.FULLY_REFUNDED: set(),
    PaymentStatus.FAILED: set(),
    PaymentStatus.CANCELLED: set(),
    PaymentStatus.DISPUTED: {
        PaymentStatus.PAID,
        PaymentStatus.FULLY_REFUNDED,
    },
}


# ---------------------------------------------------------------------------
# Phase 3 — CRM, ERP, Inventory, Marketing, Analytics
# ---------------------------------------------------------------------------

class ClientSegment(str, Enum):
    """Client segmentation categories for CRM."""

    NEW = 'new'
    ACTIVE = 'active'
    VIP = 'vip'
    INACTIVE = 'inactive'
    LOST = 'lost'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Segmento de cliente inválido: {value}')

    @property
    def label(self):
        return {
            'new': 'Novo',
            'active': 'Ativo',
            'vip': 'VIP',
            'inactive': 'Inativo',
            'lost': 'Perdido',
        }[self.value]


class StockMovementType(str, Enum):
    """Types of stock movements."""

    ENTRY = 'entry'
    EXIT = 'exit'
    CONSUMPTION = 'consumption'
    ADJUSTMENT = 'adjustment'
    RETURN = 'return'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de movimentação inválido: {value}')

    @property
    def label(self):
        return {
            'entry': 'Entrada',
            'exit': 'Saída',
            'consumption': 'Consumo',
            'adjustment': 'Ajuste',
            'return': 'Devolução',
        }[self.value]

    @property
    def is_inbound(self):
        return self in (StockMovementType.ENTRY, StockMovementType.RETURN)

    @property
    def is_outbound(self):
        return self in (StockMovementType.EXIT, StockMovementType.CONSUMPTION)


class CampaignStatus(str, Enum):
    """Lifecycle of a marketing campaign."""

    DRAFT = 'draft'
    SCHEDULED = 'scheduled'
    RUNNING = 'running'
    PAUSED = 'paused'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de campanha inválido: {value}')

    @property
    def label(self):
        return {
            'draft': 'Rascunho',
            'scheduled': 'Agendada',
            'running': 'Em execução',
            'paused': 'Pausada',
            'completed': 'Concluída',
            'cancelled': 'Cancelada',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (CampaignStatus.COMPLETED, CampaignStatus.CANCELLED)


class CampaignChannel(str, Enum):
    """Marketing campaign delivery channels."""

    EMAIL = 'email'
    SMS = 'sms'
    PUSH = 'push'
    WHATSAPP = 'whatsapp'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Canal de campanha inválido: {value}')

    @property
    def label(self):
        return {
            'email': 'E-mail',
            'sms': 'SMS',
            'push': 'Push',
            'whatsapp': 'WhatsApp',
        }[self.value]


class CouponType(str, Enum):
    """Types of discount coupons."""

    PERCENTAGE = 'percentage'
    FIXED = 'fixed'
    FREE_SESSION = 'free_session'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de cupom inválido: {value}')

    @property
    def label(self):
        return {
            'percentage': 'Percentual',
            'fixed': 'Valor fixo',
            'free_session': 'Sessão grátis',
        }[self.value]


class FinancialEntryType(str, Enum):
    """Types of financial entries for cash flow."""

    REVENUE = 'revenue'
    EXPENSE = 'expense'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError('Tipo deve ser revenue ou expense')

    @property
    def label(self):
        return {'revenue': 'Receita', 'expense': 'Despesa'}[self.value]


class AccountStatus(str, Enum):
    """Status of accounts payable/receivable."""

    PENDING = 'pending'
    PAID = 'paid'
    OVERDUE = 'overdue'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de conta inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'paid': 'Pago',
            'overdue': 'Vencido',
            'cancelled': 'Cancelado',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (AccountStatus.PAID, AccountStatus.CANCELLED)


class PeriodStatus(str, Enum):
    """Status of a financial closing period."""

    OPEN = 'open'
    CLOSED = 'closed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de período inválido: {value}')

    @property
    def label(self):
        return {'open': 'Aberto', 'closed': 'Fechado'}[self.value]


class SatisfactionStatus(str, Enum):
    """Post-sale satisfaction survey status."""

    PENDING = 'pending'
    RESPONDED = 'responded'
    SKIPPED = 'skipped'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de pesquisa inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'responded': 'Respondida',
            'skipped': 'Ignorada',
        }[self.value]


# ---------------------------------------------------------------------------
# Phase 4 — Teams, Commissions, Multi-unit
# ---------------------------------------------------------------------------

class EmployeeStatus(str, Enum):
    """Lifecycle of an employee/collaborator."""

    INVITED = 'invited'
    ACTIVE = 'active'
    SUSPENDED = 'suspended'
    TERMINATED = 'terminated'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de colaborador inválido: {value}')

    @property
    def label(self):
        return {
            'invited': 'Convidado',
            'active': 'Ativo',
            'suspended': 'Suspenso',
            'terminated': 'Demitido',
        }[self.value]

    @property
    def is_terminal(self):
        return self == EmployeeStatus.TERMINATED

    @property
    def can_access_system(self):
        return self in (EmployeeStatus.ACTIVE,)


class EmployeeRole(str, Enum):
    """Role of an employee within a provider's team."""

    DENTIST = 'dentist'
    ASSISTANT = 'assistant'
    RECEPTIONIST = 'receptionist'
    MANAGER = 'manager'
    FINANCE = 'finance'
    OTHER = 'other'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Cargo de colaborador inválido: {value}')

    @property
    def label(self):
        return {
            'dentist': 'Dentista',
            'assistant': 'Assistente',
            'receptionist': 'Recepcionista',
            'manager': 'Gerente',
            'finance': 'Financeiro',
            'other': 'Outro',
        }[self.value]


class PermissionLevel(str, Enum):
    """Permission levels for access control."""

    FULL = 'full'
    SCHEDULE = 'schedule'
    FINANCE_READ = 'finance_read'
    FINANCE_WRITE = 'finance_write'
    INVENTORY = 'inventory'
    REPORTS = 'reports'
    NONE = 'none'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Nível de permissão inválido: {value}')

    @property
    def label(self):
        return {
            'full': 'Acesso total',
            'schedule': 'Agenda',
            'finance_read': 'Financeiro (leitura)',
            'finance_write': 'Financeiro (escrita)',
            'inventory': 'Estoque',
            'reports': 'Relatórios',
            'none': 'Sem acesso',
        }[self.value]


class CommissionType(str, Enum):
    """Types of commission rules."""

    PERCENTAGE = 'percentage'
    FIXED = 'fixed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de comissão inválido: {value}')

    @property
    def label(self):
        return {'percentage': 'Percentual', 'fixed': 'Valor fixo'}[self.value]


class CommissionStatus(str, Enum):
    """Status of a commission payment."""

    PENDING = 'pending'
    PAID = 'paid'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de comissão inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'paid': 'Pago',
            'cancelled': 'Cancelado',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (CommissionStatus.PAID, CommissionStatus.CANCELLED)


class TransferStatus(str, Enum):
    """Status of a stock transfer between branches."""

    REQUESTED = 'requested'
    APPROVED = 'approved'
    IN_TRANSIT = 'in_transit'
    COMPLETED = 'completed'
    REJECTED = 'rejected'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de transferência inválido: {value}')

    @property
    def label(self):
        return {
            'requested': 'Solicitada',
            'approved': 'Aprovada',
            'in_transit': 'Em trânsito',
            'completed': 'Concluída',
            'rejected': 'Rejeitada',
            'cancelled': 'Cancelada',
        }[self.value]

    @property
    def is_terminal(self):
        return self in (TransferStatus.COMPLETED, TransferStatus.REJECTED,
                        TransferStatus.CANCELLED)


# Valid state transitions for transfers
TRANSFER_TRANSITIONS = {
    TransferStatus.REQUESTED: {TransferStatus.APPROVED, TransferStatus.REJECTED,
                               TransferStatus.CANCELLED},
    TransferStatus.APPROVED: {TransferStatus.IN_TRANSIT, TransferStatus.CANCELLED},
    TransferStatus.IN_TRANSIT: {TransferStatus.COMPLETED, TransferStatus.CANCELLED},
    TransferStatus.COMPLETED: set(),
    TransferStatus.REJECTED: set(),
    TransferStatus.CANCELLED: set(),
}


class BranchType(str, Enum):
    """Type of a branch/unit."""

    HEADQUARTERS = 'headquarters'
    BRANCH = 'branch'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de unidade inválido: {value}')

    @property
    def label(self):
        return {
            'headquarters': 'Matriz',
            'branch': 'Filial',
        }[self.value]


# ---------------------------------------------------------------------------
# Phase 5 — Social Network, Chat, Notifications
# ---------------------------------------------------------------------------

class PostType(str, Enum):
    """Type of social feed post."""

    PHOTO = 'photo'
    VIDEO = 'video'
    REEL = 'reel'
    TEXT = 'text'
    SPONSORED = 'sponsored'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de publicação inválido: {value}')

    @property
    def label(self):
        return {
            'photo': 'Foto',
            'video': 'Vídeo',
            'reel': 'Reels',
            'text': 'Texto',
            'sponsored': 'Patrocinado',
        }[self.value]


class PostStatus(str, Enum):
    """Lifecycle of a post."""

    DRAFT = 'draft'
    PUBLISHED = 'published'
    UNDER_REVIEW = 'under_review'
    REMOVED = 'removed'
    ARCHIVED = 'archived'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de publicação inválido: {value}')

    @property
    def label(self):
        return {
            'draft': 'Rascunho',
            'published': 'Publicado',
            'under_review': 'Em revisão',
            'removed': 'Removido',
            'archived': 'Arquivado',
        }[self.value]

    @property
    def is_visible(self):
        return self == PostStatus.PUBLISHED


class PostAction(str, Enum):
    """Action button attached to a post."""

    NONE = 'none'
    SCHEDULE = 'schedule'
    BUY = 'buy'
    SUBSCRIBE = 'subscribe'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Ação de publicação inválida: {value}')

    @property
    def label(self):
        return {
            'none': 'Nenhuma',
            'schedule': 'Agendar',
            'buy': 'Comprar',
            'subscribe': 'Assinar plano',
        }[self.value]


class ModerationStatus(str, Enum):
    """Moderation workflow status."""

    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    REMOVED = 'removed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de moderação inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'approved': 'Aprovado',
            'rejected': 'Rejeitado',
            'removed': 'Removido',
        }[self.value]


class ReportReason(str, Enum):
    """Reasons for reporting content."""

    SPAM = 'spam'
    HARASSMENT = 'harassment'
    INAPPROPRIATE = 'inappropriate'
    VIOLENCE = 'violence'
    MISINFORMATION = 'misinformation'
    COPYRIGHT = 'copyright'
    OTHER = 'other'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Motivo de denúncia inválido: {value}')

    @property
    def label(self):
        return {
            'spam': 'Spam',
            'harassment': 'Assédio',
            'inappropriate': 'Conteúdo inapropriado',
            'violence': 'Violência',
            'misinformation': 'Desinformação',
            'copyright': 'Violação de direitos autorais',
            'other': 'Outro',
        }[self.value]


class ReportStatus(str, Enum):
    """Status of a content report."""

    OPEN = 'open'
    REVIEWING = 'reviewing'
    RESOLVED = 'resolved'
    DISMISSED = 'dismissed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de denúncia inválido: {value}')

    @property
    def label(self):
        return {
            'open': 'Aberta',
            'reviewing': 'Em análise',
            'resolved': 'Resolvida',
            'dismissed': 'Arquivada',
        }[self.value]


class StoryStatus(str, Enum):
    """Lifecycle of a story."""

    ACTIVE = 'active'
    EXPIRED = 'expired'
    REMOVED = 'removed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de story inválido: {value}')

    @property
    def label(self):
        return {
            'active': 'Ativo',
            'expired': 'Expirado',
            'removed': 'Removido',
        }[self.value]


class ChatType(str, Enum):
    """Type of chat conversation."""

    CLIENT_PROVIDER = 'client_provider'
    TEAM = 'team'
    SUPPORT = 'support'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de chat inválido: {value}')

    @property
    def label(self):
        return {
            'client_provider': 'Cliente ↔ Profissional',
            'team': 'Equipe',
            'support': 'Suporte',
        }[self.value]


class MessageType(str, Enum):
    """Type of chat message."""

    TEXT = 'text'
    PHOTO = 'photo'
    VIDEO = 'video'
    AUDIO = 'audio'
    DOCUMENT = 'document'
    LOCATION = 'location'
    AUTO = 'auto'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de mensagem inválido: {value}')

    @property
    def label(self):
        return {
            'text': 'Texto',
            'photo': 'Foto',
            'video': 'Vídeo',
            'audio': 'Áudio',
            'document': 'Documento',
            'location': 'Localização',
            'auto': 'Automática',
        }[self.value]


class MessageStatus(str, Enum):
    """Delivery status of a chat message."""

    SENT = 'sent'
    DELIVERED = 'delivered'
    READ = 'read'
    FAILED = 'failed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de mensagem inválido: {value}')

    @property
    def label(self):
        return {
            'sent': 'Enviada',
            'delivered': 'Entregue',
            'read': 'Lida',
            'failed': 'Falhou',
        }[self.value]


# Valid message status transitions
MESSAGE_STATUS_TRANSITIONS = {
    MessageStatus.SENT: {MessageStatus.DELIVERED, MessageStatus.FAILED},
    MessageStatus.DELIVERED: {MessageStatus.READ},
    MessageStatus.READ: set(),
    MessageStatus.FAILED: set(),
}


class NotificationChannel(str, Enum):
    """Notification delivery channels."""

    PUSH = 'push'
    SMS = 'sms'
    EMAIL = 'email'
    WHATSAPP = 'whatsapp'
    IN_APP = 'in_app'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Canal de notificação inválido: {value}')

    @property
    def label(self):
        return {
            'push': 'Push',
            'sms': 'SMS',
            'email': 'E-mail',
            'whatsapp': 'WhatsApp',
            'in_app': 'No app',
        }[self.value]


class NotificationType(str, Enum):
    """Types of notifications."""

    APPOINTMENT_REMINDER = 'appointment_reminder'
    APPOINTMENT_CONFIRMATION = 'appointment_confirmation'
    APPOINTMENT_CANCELLATION = 'appointment_cancellation'
    PROMOTION = 'promotion'
    FINANCIAL_ALERT = 'financial_alert'
    SECURITY_ALERT = 'security_alert'
    CHAT_MESSAGE = 'chat_message'
    SOCIAL_INTERACTION = 'social_interaction'
    SYSTEM = 'system'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de notificação inválido: {value}')

    @property
    def label(self):
        return {
            'appointment_reminder': 'Lembrete de agendamento',
            'appointment_confirmation': 'Confirmação de agendamento',
            'appointment_cancellation': 'Cancelamento de agendamento',
            'promotion': 'Promoção',
            'financial_alert': 'Alerta financeiro',
            'security_alert': 'Alerta de segurança',
            'chat_message': 'Mensagem de chat',
            'social_interaction': 'Interação social',
            'system': 'Sistema',
        }[self.value]


class NotificationPriority(str, Enum):
    """Priority of a notification."""

    LOW = 'low'
    NORMAL = 'normal'
    HIGH = 'high'
    URGENT = 'urgent'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Prioridade de notificação inválida: {value}')

    @property
    def label(self):
        return {
            'low': 'Baixa',
            'normal': 'Normal',
            'high': 'Alta',
            'urgent': 'Urgente',
        }[self.value]


# ---------------------------------------------------------------------------
# Phase 6 — Home Care, Logistics, Documents, Workflow Builder
# ---------------------------------------------------------------------------

class QuoteStatus(str, Enum):
    """Lifecycle of a quote (orcamento)."""

    DRAFT = 'draft'
    SENT = 'sent'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    EXPIRED = 'expired'
    CONVERTED = 'converted'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de orçamento inválido: {value}')

    @property
    def label(self):
        return {
            'draft': 'Rascunho',
            'sent': 'Enviado',
            'approved': 'Aprovado',
            'rejected': 'Rejeitado',
            'expired': 'Expirado',
            'converted': 'Convertido',
            'cancelled': 'Cancelado',
        }[self.value]


QUOTE_TRANSITIONS = {
    QuoteStatus.DRAFT: {QuoteStatus.SENT, QuoteStatus.CANCELLED},
    QuoteStatus.SENT: {QuoteStatus.APPROVED, QuoteStatus.REJECTED,
                       QuoteStatus.EXPIRED, QuoteStatus.CANCELLED},
    QuoteStatus.APPROVED: {QuoteStatus.CONVERTED, QuoteStatus.CANCELLED},
    QuoteStatus.REJECTED: set(),
    QuoteStatus.EXPIRED: set(),
    QuoteStatus.CONVERTED: set(),
    QuoteStatus.CANCELLED: set(),
}


class ContractStatus(str, Enum):
    """Lifecycle of a contract."""

    DRAFT = 'draft'
    SENT = 'sent'
    SIGNED = 'signed'
    ACTIVE = 'active'
    EXPIRED = 'expired'
    TERMINATED = 'terminated'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de contrato inválido: {value}')

    @property
    def label(self):
        return {
            'draft': 'Rascunho',
            'sent': 'Enviado',
            'signed': 'Assinado',
            'active': 'Ativo',
            'expired': 'Expirado',
            'terminated': 'Rescindido',
            'cancelled': 'Cancelado',
        }[self.value]


CONTRACT_TRANSITIONS = {
    ContractStatus.DRAFT: {ContractStatus.SENT, ContractStatus.CANCELLED},
    ContractStatus.SENT: {ContractStatus.SIGNED, ContractStatus.CANCELLED},
    ContractStatus.SIGNED: {ContractStatus.ACTIVE, ContractStatus.CANCELLED},
    ContractStatus.ACTIVE: {ContractStatus.EXPIRED, ContractStatus.TERMINATED},
    ContractStatus.EXPIRED: set(),
    ContractStatus.TERMINATED: set(),
    ContractStatus.CANCELLED: set(),
}


class SignatureStatus(str, Enum):
    """Status of an electronic signature."""

    PENDING = 'pending'
    SIGNED = 'signed'
    REJECTED = 'rejected'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de assinatura inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'signed': 'Assinada',
            'rejected': 'Rejeitada',
        }[self.value]


class CheckType(str, Enum):
    """Type of check-in/check-out."""

    CLIENT = 'client'
    PROVIDER = 'provider'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de check inválido: {value}')

    @property
    def label(self):
        return {
            'client': 'Cliente',
            'provider': 'Prestador',
        }[self.value]


class CheckStatus(str, Enum):
    """Status of a check-in/check-out record."""

    CHECKED_IN = 'checked_in'
    CHECKED_OUT = 'checked_out'
    NO_SHOW = 'no_show'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de check inválido: {value}')

    @property
    def label(self):
        return {
            'checked_in': 'Check-in realizado',
            'checked_out': 'Check-out realizado',
            'no_show': 'Não compareceu',
            'cancelled': 'Cancelado',
        }[self.value]


class RouteStatus(str, Enum):
    """Status of a route for home care visits."""

    PLANNED = 'planned'
    OPTIMIZED = 'optimized'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    CANCELLED = 'cancelled'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de rota inválido: {value}')

    @property
    def label(self):
        return {
            'planned': 'Planejada',
            'optimized': 'Otimizada',
            'in_progress': 'Em andamento',
            'completed': 'Concluída',
            'cancelled': 'Cancelada',
        }[self.value]


class WorkflowTriggerType(str, Enum):
    """Types of workflow triggers."""

    APPOINTMENT_CREATED = 'appointment_created'
    APPOINTMENT_COMPLETED = 'appointment_completed'
    APPOINTMENT_CANCELLED = 'appointment_cancelled'
    QUOTE_APPROVED = 'quote_approved'
    CONTRACT_SIGNED = 'contract_signed'
    CLIENT_REGISTERED = 'client_registered'
    PAYMENT_RECEIVED = 'payment_received'
    CHECK_OUT_COMPLETED = 'check_out_completed'
    MANUAL = 'manual'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Gatilho de workflow inválido: {value}')

    @property
    def label(self):
        return {
            'appointment_created': 'Agendamento criado',
            'appointment_completed': 'Atendimento concluído',
            'appointment_cancelled': 'Agendamento cancelado',
            'quote_approved': 'Orçamento aprovado',
            'contract_signed': 'Contrato assinado',
            'client_registered': 'Cliente cadastrado',
            'payment_received': 'Pagamento recebido',
            'check_out_completed': 'Check-out concluído',
            'manual': 'Manual',
        }[self.value]


class WorkflowActionType(str, Enum):
    """Types of workflow actions."""

    SEND_NOTIFICATION = 'send_notification'
    SEND_EMAIL = 'send_email'
    SEND_SMS = 'send_sms'
    SEND_SURVEY = 'send_survey'
    REQUEST_REVIEW = 'request_review'
    CREATE_APPOINTMENT = 'create_appointment'
    CREATE_TASK = 'create_task'
    UPDATE_CLIENT_TAG = 'update_client_tag'
    GENERATE_DOCUMENT = 'generate_document'
    WEBHOOK = 'webhook'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Ação de workflow inválida: {value}')

    @property
    def label(self):
        return {
            'send_notification': 'Enviar notificação',
            'send_email': 'Enviar e-mail',
            'send_sms': 'Enviar SMS',
            'send_survey': 'Enviar pesquisa',
            'request_review': 'Solicitar avaliação',
            'create_appointment': 'Criar agendamento',
            'create_task': 'Criar tarefa',
            'update_client_tag': 'Atualizar tag do cliente',
            'generate_document': 'Gerar documento',
            'webhook': 'Webhook',
        }[self.value]


class WorkflowConditionType(str, Enum):
    """Types of workflow conditions."""

    RATING_GTE = 'rating_gte'
    RATING_LTE = 'rating_lte'
    CLIENT_TAG_IS = 'client_tag_is'
    SERVICE_IS = 'service_is'
    BRANCH_IS = 'branch_is'
    AMOUNT_GTE = 'amount_gte'
    AMOUNT_LTE = 'amount_lte'
    DAY_OF_WEEK = 'day_of_week'
    TIME_RANGE = 'time_range'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Condição de workflow inválida: {value}')

    @property
    def label(self):
        return {
            'rating_gte': 'Nota maior ou igual a',
            'rating_lte': 'Nota menor ou igual a',
            'client_tag_is': 'Tag do cliente é',
            'service_is': 'Serviço é',
            'branch_is': 'Unidade é',
            'amount_gte': 'Valor maior ou igual a',
            'amount_lte': 'Valor menor ou igual a',
            'day_of_week': 'Dia da semana',
            'time_range': 'Faixa de horário',
        }[self.value]


class WorkflowStatus(str, Enum):
    """Status of a workflow definition."""

    DRAFT = 'draft'
    ACTIVE = 'active'
    PAUSED = 'paused'
    ARCHIVED = 'archived'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de workflow inválido: {value}')

    @property
    def label(self):
        return {
            'draft': 'Rascunho',
            'active': 'Ativo',
            'paused': 'Pausado',
            'archived': 'Arquivado',
        }[self.value]


class WorkflowExecutionStatus(str, Enum):
    """Status of a single workflow execution."""

    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'
    SKIPPED = 'skipped'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de execução inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'running': 'Executando',
            'completed': 'Concluída',
            'failed': 'Falhou',
            'skipped': 'Ignorada',
        }[self.value]


# ---------------------------------------------------------------------------
# Phase 7 — Subscriptions, Referrals, AI Multi-Agent
# ---------------------------------------------------------------------------

class SubscriptionStatus(str, Enum):
    """Lifecycle of a subscription."""

    ACTIVE = 'active'
    PAST_DUE = 'past_due'
    SUSPENDED = 'suspended'
    CANCELLED = 'cancelled'
    EXPIRED = 'expired'
    TRIALING = 'trialing'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de assinatura inválido: {value}')

    @property
    def label(self):
        return {
            'active': 'Ativa',
            'past_due': 'Pagamento pendente',
            'suspended': 'Suspensa',
            'cancelled': 'Cancelada',
            'expired': 'Expirada',
            'trialing': 'Período de teste',
        }[self.value]


SUBSCRIPTION_TRANSITIONS = {
    SubscriptionStatus.TRIALING: {SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED},
    SubscriptionStatus.ACTIVE: {SubscriptionStatus.PAST_DUE, SubscriptionStatus.SUSPENDED,
                                SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED},
    SubscriptionStatus.PAST_DUE: {SubscriptionStatus.ACTIVE, SubscriptionStatus.SUSPENDED,
                                  SubscriptionStatus.CANCELLED},
    SubscriptionStatus.SUSPENDED: {SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED},
    SubscriptionStatus.CANCELLED: set(),
    SubscriptionStatus.EXPIRED: set(),
}


class BillingStatus(str, Enum):
    """Status of a billing attempt."""

    PENDING = 'pending'
    PAID = 'paid'
    FAILED = 'failed'
    RETRYING = 'retrying'
    REFUNDED = 'refunded'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de cobrança inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'paid': 'Pago',
            'failed': 'Falhou',
            'retrying': 'Retentando',
            'refunded': 'Reembolsado',
        }[self.value]


class ReferralStatus(str, Enum):
    """Lifecycle of a referral."""

    PENDING = 'pending'
    REGISTERED = 'registered'
    CONVERTED = 'converted'
    EXPIRED = 'expired'
    REWARDED = 'rewarded'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de indicação inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'registered': 'Cadastrado',
            'converted': 'Convertido',
            'expired': 'Expirado',
            'rewarded': 'Recompensado',
        }[self.value]


REFERRAL_TRANSITIONS = {
    ReferralStatus.PENDING: {ReferralStatus.REGISTERED, ReferralStatus.EXPIRED},
    ReferralStatus.REGISTERED: {ReferralStatus.CONVERTED, ReferralStatus.EXPIRED},
    ReferralStatus.CONVERTED: {ReferralStatus.REWARDED},
    ReferralStatus.REWARDED: set(),
    ReferralStatus.EXPIRED: set(),
}


class AgentType(str, Enum):
    """Types of AI agents."""

    EXECUTIVE = 'executive'
    FINANCIAL = 'financial'
    CRM = 'crm'
    MARKETING = 'marketing'
    CONTENT = 'content'
    SOCIAL = 'social'
    SCHEDULING = 'scheduling'
    COMMERCIAL = 'commercial'
    ANALYTICS = 'analytics'
    LOGISTICS = 'logistics'
    INVENTORY = 'inventory'
    REPUTATION = 'reputation'
    GROWTH = 'growth'
    SECURITY = 'security'
    SUPPORT = 'support'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de agente inválido: {value}')

    @property
    def label(self):
        return {
            'executive': 'Agente Executivo',
            'financial': 'Agente Financeiro',
            'crm': 'Agente CRM',
            'marketing': 'Agente de Marketing',
            'content': 'Agente de Conteúdo',
            'social': 'Agente Social',
            'scheduling': 'Agente de Agenda',
            'commercial': 'Agente Comercial',
            'analytics': 'Agente de Analytics',
            'logistics': 'Agente de Logística',
            'inventory': 'Agente de Estoque',
            'reputation': 'Agente de Reputação',
            'growth': 'Agente de Crescimento',
            'security': 'Agente de Segurança',
            'support': 'Agente de Suporte',
        }[self.value]

    @property
    def requires_human_approval(self):
        """Agents whose actions may have financial impact."""
        return self in {
            AgentType.FINANCIAL, AgentType.MARKETING,
            AgentType.COMMERCIAL, AgentType.SECURITY,
        }


class AgentStatus(str, Enum):
    """Status of an AI agent for a user."""

    ENABLED = 'enabled'
    DISABLED = 'disabled'
    PAUSED = 'paused'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de agente inválido: {value}')

    @property
    def label(self):
        return {
            'enabled': 'Ativo',
            'disabled': 'Desativado',
            'paused': 'Pausado',
        }[self.value]


class AgentActionStatus(str, Enum):
    """Status of an AI agent action."""

    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    EXECUTED = 'executed'
    FAILED = 'failed'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de ação de agente inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'approved': 'Aprovada',
            'rejected': 'Rejeitada',
            'executed': 'Executada',
            'failed': 'Falhou',
        }[self.value]


# ---------------------------------------------------------------------------
# Phase 8 — Administration, Public API, Observability, LGPD
# ---------------------------------------------------------------------------

class AdminRole(str, Enum):
    """Admin roles for platform administration."""

    SUPER_ADMIN = 'super_admin'
    ADMIN = 'admin'
    MODERATOR = 'moderator'
    SUPPORT = 'support'
    READ_ONLY = 'read_only'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Papel administrativo inválido: {value}')

    @property
    def label(self):
        return {
            'super_admin': 'Super Administrador',
            'admin': 'Administrador',
            'moderator': 'Moderador',
            'support': 'Suporte',
            'read_only': 'Somente Leitura',
        }[self.value]

    @property
    def permissions(self):
        return {
            'super_admin': {'*'},
            'admin': {
                'users.manage', 'profiles.moderate', 'plans.manage',
                'payments.manage', 'commissions.manage', 'settings.manage',
                'audit.view', 'accounts.block', 'accounts.unblock',
                'reports.view', 'feature_flags.manage',
            },
            'moderator': {
                'profiles.moderate', 'posts.moderate', 'comments.moderate',
                'reviews.moderate', 'audit.view',
            },
            'support': {
                'users.view', 'accounts.block', 'accounts.unblock',
                'audit.view',
            },
            'read_only': {
                'users.view', 'audit.view', 'reports.view',
            },
        }[self.value]

    def can(self, permission):
        return '*' in self.permissions or permission in self.permissions


class AuditActionType(str, Enum):
    """Types of auditable actions."""

    USER_BLOCKED = 'user_blocked'
    USER_UNBLOCKED = 'user_unblocked'
    PROVIDER_APPROVED = 'provider_approved'
    PROVIDER_REJECTED = 'provider_rejected'
    POST_MODERATED = 'post_moderated'
    COMMENT_MODERATED = 'comment_moderated'
    REVIEW_MODERATED = 'review_moderated'
    PLAN_CREATED = 'plan_created'
    PLAN_UPDATED = 'plan_updated'
    SUBSCRIPTION_MANAGED = 'subscription_managed'
    COMMISSION_UPDATED = 'commission_updated'
    SETTINGS_UPDATED = 'settings_updated'
    FEATURE_FLAG_TOGGLED = 'feature_flag_toggled'
    DATA_EXPORTED = 'data_exported'
    DATA_DELETED = 'data_deleted'
    API_KEY_CREATED = 'api_key_created'
    API_KEY_REVOKED = 'api_key_revoked'
    WEBHOOK_CONFIGURED = 'webhook_configured'
    LOGIN = 'login'
    LOGOUT = 'logout'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de ação de auditoria inválido: {value}')

    @property
    def label(self):
        return {
            'user_blocked': 'Usuário bloqueado',
            'user_unblocked': 'Usuário desbloqueado',
            'provider_approved': 'Prestador aprovado',
            'provider_rejected': 'Prestador rejeitado',
            'post_moderated': 'Publicação moderada',
            'comment_moderated': 'Comentário moderado',
            'review_moderated': 'Avaliação moderada',
            'plan_created': 'Plano criado',
            'plan_updated': 'Plano atualizado',
            'subscription_managed': 'Assinatura gerenciada',
            'commission_updated': 'Comissão atualizada',
            'settings_updated': 'Configurações atualizadas',
            'feature_flag_toggled': 'Feature flag alterada',
            'data_exported': 'Dados exportados',
            'data_deleted': 'Dados excluídos',
            'api_key_created': 'Chave de API criada',
            'api_key_revoked': 'Chave de API revogada',
            'webhook_configured': 'Webhook configurado',
            'login': 'Login',
            'logout': 'Logout',
        }[self.value]


class ApiKeyStatus(str, Enum):
    """Status of an API key."""

    ACTIVE = 'active'
    REVOKED = 'revoked'
    EXPIRED = 'expired'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de chave de API inválido: {value}')

    @property
    def label(self):
        return {
            'active': 'Ativa',
            'revoked': 'Revogada',
            'expired': 'Expirada',
        }[self.value]


class WebhookStatus(str, Enum):
    """Status of a webhook endpoint."""

    ACTIVE = 'active'
    DISABLED = 'disabled'
    FAILING = 'failing'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de webhook inválido: {value}')

    @property
    def label(self):
        return {
            'active': 'Ativo',
            'disabled': 'Desativado',
            'failing': 'Falhando',
        }[self.value]


class DataRequestType(str, Enum):
    """LGPD data request types."""

    EXPORT = 'export'
    CORRECTION = 'correction'
    DELETION = 'deletion'
    PORTABILITY = 'portability'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Tipo de solicitação de dados inválido: {value}')

    @property
    def label(self):
        return {
            'export': 'Exportação de dados',
            'correction': 'Correção de dados',
            'deletion': 'Exclusão de dados',
            'portability': 'Portabilidade de dados',
        }[self.value]


class DataRequestStatus(str, Enum):
    """Status of a LGPD data request."""

    PENDING = 'pending'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    REJECTED = 'rejected'

    @classmethod
    def from_value(cls, value):
        try:
            return cls(value)
        except ValueError:
            raise ValidationError(f'Status de solicitação de dados inválido: {value}')

    @property
    def label(self):
        return {
            'pending': 'Pendente',
            'processing': 'Processando',
            'completed': 'Concluída',
            'rejected': 'Rejeitada',
        }[self.value]


DATA_REQUEST_TRANSITIONS = {
    DataRequestStatus.PENDING: {DataRequestStatus.PROCESSING, DataRequestStatus.REJECTED},
    DataRequestStatus.PROCESSING: {DataRequestStatus.COMPLETED, DataRequestStatus.REJECTED},
    DataRequestStatus.COMPLETED: set(),
    DataRequestStatus.REJECTED: set(),
}
