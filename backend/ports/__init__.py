"""Port interfaces for the hexagonal architecture.

These are abstract base classes (ABCs) that define the contracts
between the domain/application layer and the infrastructure layer.

Services depend on these ports, NOT on concrete repository implementations.
Infrastructure adapters (e.g. FirestoreRepository) implement these ports.

This allows swapping the entire persistence layer (Firestore → PostgreSQL,
MongoDB, etc.) by simply creating new adapters that implement the same ports.
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Tuple, Any


class RepositoryPort(ABC):
    """Generic repository port — the base contract for all repositories."""

    @abstractmethod
    def add(self, entity) -> Any:
        """Persist a new entity. Returns the entity with generated ID."""
        ...

    @abstractmethod
    def get_by_id(self, entity_id, user_id=None) -> Optional[Any]:
        """Retrieve an entity by ID, optionally scoped by user."""
        ...

    @abstractmethod
    def get_all(self, user_id=None) -> List[Any]:
        """Retrieve all entities, optionally scoped by user."""
        ...

    @abstractmethod
    def get_paginated(self, user_id=None, page=1, limit=20) -> Tuple[List[Any], int, int]:
        """Retrieve paginated entities. Returns (items, total, pages)."""
        ...

    @abstractmethod
    def save(self, entity) -> Any:
        """Persist an entity that was mutated through its domain behavior."""
        ...

    @abstractmethod
    def delete(self, entity) -> None:
        """Delete an entity."""
        ...


class UserRepositoryPort(RepositoryPort):
    """Port for User-specific queries."""

    @abstractmethod
    def find_by_email(self, email) -> Optional[Any]:
        ...

    @abstractmethod
    def find_by_link(self, link) -> Optional[Any]:
        ...


class ClientRepositoryPort(RepositoryPort):
    """Port for Client-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...

    @abstractmethod
    def search_by_name(self, user_id, search_term) -> List[Any]:
        ...


class AppointmentRepositoryPort(RepositoryPort):
    """Port for Appointment-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...

    @abstractmethod
    def find_by_date(self, user_id, appointment_date) -> List[Any]:
        ...

    @abstractmethod
    def find_today(self, user_id) -> List[Any]:
        ...

    @abstractmethod
    def find_upcoming(self, user_id) -> List[Any]:
        ...


class TransactionRepositoryPort(RepositoryPort):
    """Port for Transaction-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...

    @abstractmethod
    def find_by_month(self, user_id, year, month) -> List[Any]:
        ...


class ServiceRepositoryPort(RepositoryPort):
    """Port for Service-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...


class WorkRepositoryPort(RepositoryPort):
    """Port for Work-specific queries."""

    @abstractmethod
    def get_by_provider(self, provider_id) -> List[Any]:
        ...

    @abstractmethod
    def get_active_works(self) -> List[Any]:
        ...

    @abstractmethod
    def search(self, term) -> List[Any]:
        ...


class WorkOrderRepositoryPort(RepositoryPort):
    """Port for WorkOrder-specific queries."""

    @abstractmethod
    def get_by_provider(self, provider_id) -> List[Any]:
        ...

    @abstractmethod
    def get_by_client(self, client_user_id) -> List[Any]:
        ...


class WalletRepositoryPort(RepositoryPort):
    """Port for Wallet-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> Optional[Any]:
        ...

    @abstractmethod
    def get_or_create(self, user_id) -> Any:
        ...


class PaymentRepositoryPort(RepositoryPort):
    """Port for Payment-specific queries."""

    @abstractmethod
    def find_by_idempotency_key(self, key) -> Optional[Any]:
        ...

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...

    @abstractmethod
    def find_by_gateway_transaction_id(self, gateway_tx_id) -> Optional[Any]:
        ...


class PackageRepositoryPort(RepositoryPort):
    """Port for Package-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...

    @abstractmethod
    def find_by_client_id(self, client_id) -> List[Any]:
        ...

    @abstractmethod
    def find_active_by_client_id(self, client_id) -> List[Any]:
        ...


class GiftCardRepositoryPort(RepositoryPort):
    """Port for GiftCard-specific queries."""

    @abstractmethod
    def find_by_code(self, code) -> Optional[Any]:
        ...

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...


class LoyaltyRepositoryPort(RepositoryPort):
    """Port for LoyaltyAccount-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> Optional[Any]:
        ...

    @abstractmethod
    def get_or_create(self, user_id, provider_id) -> Any:
        ...


class TeamRepositoryPort(RepositoryPort):
    """Port for Employee-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...


class BranchRepositoryPort(RepositoryPort):
    """Port for Branch-specific queries."""

    @abstractmethod
    def find_by_user_id(self, user_id) -> List[Any]:
        ...


class CommissionRepositoryPort(RepositoryPort):
    """Port for Commission-specific queries."""

    pass


class CRMRepositoryPort(RepositoryPort):
    """Port for CRM-specific queries."""

    pass


class ERPRepositoryPort(RepositoryPort):
    """Port for ERP-specific queries."""

    pass


class InventoryRepositoryPort(RepositoryPort):
    """Port for Inventory-specific queries."""

    pass


class MarketingRepositoryPort(RepositoryPort):
    """Port for Marketing-specific queries."""

    pass


class SocialRepositoryPort(RepositoryPort):
    """Port for Social-specific queries."""

    pass


class ChatRepositoryPort(RepositoryPort):
    """Port for Chat-specific queries."""

    pass


class Phase6RepositoryPort(RepositoryPort):
    """Port for Phase 6 entities (HomeCare, Workflow, Quote, Contract, CheckInOut)."""

    pass


class Phase7RepositoryPort(RepositoryPort):
    """Port for Phase 7 entities (Subscription, Billing, Referral, Agent)."""

    pass


class Phase8RepositoryPort(RepositoryPort):
    """Port for Phase 8 entities (AuditLog, ApiKey, Webhook, DataRequest, FeatureFlag)."""

    pass
