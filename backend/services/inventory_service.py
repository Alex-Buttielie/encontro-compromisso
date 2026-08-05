"""Inventory application service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.inventory_repository import (
    ProductRepository, SupplierRepository, StockMovementRepository,
)


class InventoryService:
    def __init__(self, product_repo=None, supplier_repo=None, movement_repo=None):
        self.product_repo = product_repo or ProductRepository()
        self.supplier_repo = supplier_repo or SupplierRepository()
        self.movement_repo = movement_repo or StockMovementRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_supplier(self, data):
        from models import Supplier
        try:
            supplier = Supplier.create(
                user_id=data['userId'],
                name=data.get('name'),
                cnpj=data.get('cnpj'),
                email=data.get('email'),
                phone=data.get('phone'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.supplier_repo.add(supplier)
        return {'success': True, 'supplier': supplier.to_dict()}

    def get_suppliers(self, user_id):
        suppliers = self.supplier_repo.find_by_user_id(user_id)
        return [s.to_dict() for s in suppliers]

    def create_product(self, data):
        from models import Product
        try:
            product = Product.create(
                user_id=data['userId'],
                name=data.get('name'),
                sku=data.get('sku'),
                category=data.get('category', ''),
                unit=data.get('unit', 'unidade'),
                min_stock=data.get('minStock', 0),
                unit_price=data.get('unitPrice', 0.0),
                supplier_id=data.get('supplierId'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.product_repo.add(product)
        return {'success': True, 'product': product.to_dict()}

    def get_products(self, user_id):
        products = self.product_repo.find_by_user_id(user_id)
        return [p.to_dict() for p in products]

    def get_low_stock_alerts(self, user_id):
        products = self.product_repo.find_below_minimum(user_id)
        return [p.to_dict() for p in products]

    def add_stock(self, product_id, quantity, reason='Entrada de estoque'):
        product = self.product_repo.get_by_id(product_id)
        if not product:
            return {'success': False, 'errors': ['Produto não encontrado']}
        try:
            movement = product.add_stock(quantity, reason)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.product_repo.save(product)
        return {'success': True, 'product': product.to_dict(), 'movement': movement.to_dict()}

    def consume_stock(self, product_id, quantity, reason='Consumo por serviço', appointment_id=None):
        product = self.product_repo.get_by_id(product_id)
        if not product:
            return {'success': False, 'errors': ['Produto não encontrado']}
        try:
            movement = product.consume_stock(quantity, reason)
            if appointment_id:
                movement.appointment_id = appointment_id
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.product_repo.save(product)
        return {'success': True, 'product': product.to_dict(), 'movement': movement.to_dict()}

    def get_movements(self, product_id):
        movements = self.movement_repo.find_by_product_id(product_id)
        return [m.to_dict() for m in movements]

    def get_all_movements(self, user_id):
        movements = self.movement_repo.find_by_user_id(user_id)
        return [m.to_dict() for m in movements]
