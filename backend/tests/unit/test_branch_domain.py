"""TDD unit tests for Branch and StockTransfer domain models (Phase 4)."""
from datetime import date, datetime

import pytest

from domain.enums import BranchType, TransferStatus, StockMovementType
from domain.exceptions import BranchError, TransferError, ValidationError


class TestBranch:
    def test_create_headquarters(self):
        from models import Branch
        branch = Branch.create(
            user_id=1, name='Matriz Centro',
            branch_type=BranchType.HEADQUARTERS.value,
            address='Rua A, 123',
            phone='(11) 1234-5678',
        )
        assert branch.branch_type == BranchType.HEADQUARTERS.value
        assert branch.active is True

    def test_create_branch(self):
        from models import Branch
        branch = Branch.create(
            user_id=1, name='Filial Norte',
            branch_type=BranchType.BRANCH.value,
            address='Rua B, 456',
        )
        assert branch.branch_type == BranchType.BRANCH.value

    def test_create_branch_missing_name(self):
        from models import Branch
        with pytest.raises(ValidationError):
            Branch.create(user_id=1, name='', branch_type=BranchType.BRANCH.value)

    def test_deactivate_branch(self):
        from models import Branch
        branch = Branch.create(user_id=1, name='Filial', branch_type=BranchType.BRANCH.value)
        branch.deactivate()
        assert branch.active is False

    def test_reactivate_branch(self):
        from models import Branch
        branch = Branch.create(user_id=1, name='Filial', branch_type=BranchType.BRANCH.value)
        branch.deactivate()
        branch.reactivate()
        assert branch.active is True


class TestStockTransfer:
    def test_create_transfer(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        assert transfer.status == TransferStatus.REQUESTED.value
        assert transfer.quantity == 50

    def test_create_transfer_same_branch_rejected(self):
        from models import StockTransfer
        with pytest.raises(TransferError):
            StockTransfer.create(
                user_id=1, product_id=1,
                from_branch_id=1, to_branch_id=1,
                quantity=50,
            )

    def test_create_transfer_zero_quantity(self):
        from models import StockTransfer
        with pytest.raises(ValidationError):
            StockTransfer.create(
                user_id=1, product_id=1,
                from_branch_id=1, to_branch_id=2,
                quantity=0,
            )

    def test_approve_transfer(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        transfer.approve()
        assert transfer.status == TransferStatus.APPROVED.value

    def test_reject_transfer(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        transfer.reject()
        assert transfer.status == TransferStatus.REJECTED.value

    def test_ship_transfer(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        transfer.approve()
        transfer.ship()
        assert transfer.status == TransferStatus.IN_TRANSIT.value

    def test_complete_transfer(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        transfer.approve()
        transfer.ship()
        transfer.complete()
        assert transfer.status == TransferStatus.COMPLETED.value

    def test_cancel_requested_transfer(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        transfer.cancel()
        assert transfer.status == TransferStatus.CANCELLED.value

    def test_complete_without_ship_rejected(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        transfer.approve()
        with pytest.raises(TransferError):
            transfer.complete()

    def test_approve_already_completed(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        transfer.approve()
        transfer.ship()
        transfer.complete()
        with pytest.raises(TransferError):
            transfer.approve()

    def test_ship_without_approve(self):
        from models import StockTransfer
        transfer = StockTransfer.create(
            user_id=1, product_id=1,
            from_branch_id=1, to_branch_id=2,
            quantity=50,
        )
        with pytest.raises(TransferError):
            transfer.ship()
