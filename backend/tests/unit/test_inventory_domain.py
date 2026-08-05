"""TDD unit tests for Inventory domain models (Phase 3)."""
from datetime import datetime, date

import pytest

from domain.enums import StockMovementType
from domain.exceptions import InventoryError, ValidationError


class TestSupplier:
    def test_create_supplier(self):
        from models import Supplier
        supplier = Supplier.create(
            user_id=1, name='Dental Supply Ltda',
            cnpj='12.345.678/0001-90',
            email='contato@dentalsupply.com',
            phone='(11) 1234-5678',
        )
        assert supplier.name == 'Dental Supply Ltda'
        assert supplier.email == 'contato@dentalsupply.com'

    def test_create_supplier_missing_name(self):
        from models import Supplier
        with pytest.raises(ValidationError):
            Supplier.create(user_id=1, name='', email='test@test.com')


class TestProduct:
    def test_create_product(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Luva Descartável',
            sku='LUV-001', category='EPI',
            unit='unidade', min_stock=50,
            unit_price=0.50,
        )
        assert product.name == 'Luva Descartável'
        assert product.current_stock == 0
        assert product.min_stock == 50

    def test_create_product_missing_name(self):
        from models import Product
        with pytest.raises(ValidationError):
            Product.create(user_id=1, name='', sku='LUV-001')

    def test_product_below_minimum(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=50, unit_price=1.0)
        product.current_stock = 10
        assert product.is_below_minimum() is True

    def test_product_above_minimum(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=50, unit_price=1.0)
        product.current_stock = 100
        assert product.is_below_minimum() is False

    def test_product_at_minimum(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=50, unit_price=1.0)
        product.current_stock = 50
        assert product.is_below_minimum() is False

    def test_product_stock_value(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=10, unit_price=2.50)
        product.current_stock = 100
        assert product.stock_value == 250.00


class TestStockMovement:
    def test_create_entry_movement(self):
        from models import StockMovement
        movement = StockMovement.create(
            user_id=1, product_id=1,
            type=StockMovementType.ENTRY.value,
            quantity=100, reason='Compra inicial',
        )
        assert movement.type == StockMovementType.ENTRY.value
        assert movement.quantity == 100

    def test_create_exit_movement(self):
        from models import StockMovement
        movement = StockMovement.create(
            user_id=1, product_id=1,
            type=StockMovementType.EXIT.value,
            quantity=20, reason='Uso manual',
        )
        assert movement.type == StockMovementType.EXIT.value

    def test_create_consumption_movement(self):
        from models import StockMovement
        with pytest.raises(ValidationError):
            StockMovement.create(
                user_id=1, product_id=1,
                type=StockMovementType.CONSUMPTION.value,
                quantity=0, reason='Test')

    def test_zero_quantity_rejected(self):
        from models import StockMovement
        with pytest.raises(ValidationError):
            StockMovement.create(
                user_id=1, product_id=1,
                type=StockMovementType.ENTRY.value,
                quantity=0, reason='Test')

    def test_negative_quantity_rejected(self):
        from models import StockMovement
        with pytest.raises(ValidationError):
            StockMovement.create(
                user_id=1, product_id=1,
                type=StockMovementType.ENTRY.value,
                quantity=-10, reason='Test')


class TestProductStockOperations:
    def test_add_stock(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=10, unit_price=1.0)
        product.add_stock(50)
        assert product.current_stock == 50

    def test_consume_stock(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=10, unit_price=1.0)
        product.add_stock(100)
        product.consume_stock(30)
        assert product.current_stock == 70

    def test_consume_insufficient_stock(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=10, unit_price=1.0)
        product.add_stock(10)
        with pytest.raises(InventoryError):
            product.consume_stock(50)

    def test_consume_creates_movement(self):
        from models import Product
        product = Product.create(
            user_id=1, name='Test', sku='T-001',
            min_stock=10, unit_price=1.0)
        product.add_stock(100)
        movement = product.consume_stock(20, reason='Serviço XYZ')
        assert movement is not None
        assert movement.type == StockMovementType.CONSUMPTION.value
        assert movement.quantity == 20
