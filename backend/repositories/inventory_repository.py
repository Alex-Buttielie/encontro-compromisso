"""Inventory repository — Firestore adapter implementing InventoryRepositoryPort."""
from logger import get_logger
from models import Product, Supplier, StockMovement
from repositories.base import BaseRepository
from ports import InventoryRepositoryPort


class ProductRepository(BaseRepository, InventoryRepositoryPort):
    def __init__(self):
        super().__init__(Product)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_sku(self, user_id, sku):
        docs = self._collection().where('user_id', '==', user_id).where('sku', '==', sku).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_below_minimum(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('active', '==', True).stream()
        results = []
        for doc in docs:
            product = self._deserialize(doc)
            if product and hasattr(product, 'is_below_minimum') and product.is_below_minimum():
                results.append(product)
        return results


class SupplierRepository(BaseRepository):
    def __init__(self):
        super().__init__(Supplier)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]


class StockMovementRepository(BaseRepository):
    def __init__(self):
        super().__init__(StockMovement)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_product_id(self, product_id):
        docs = self._collection().where('product_id', '==', product_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]
