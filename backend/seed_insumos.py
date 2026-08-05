"""Seed Firestore with the unified shopping list for XV Compromisso Trin.

Creates Product entries in the inventory for all shopping list items,
organized by category with estimated costs where available.

Run with Firestore emulator:
  python seed_insumos.py
"""
import os
import sys

# Use Firestore emulator
os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'

import config  # noqa: F401 - triggers load_dotenv()
os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'

from app import create_app
from logger import get_logger
from models import Product
from repositories.user_repository import UserRepository
from repositories.inventory_repository import ProductRepository
from services.inventory_service import InventoryService

logger = get_logger('seed_insumos')

# Unified shopping list - XV Compromisso Trin
# (name, category, unit, quantity, total_estimated_cost)
# cost = None means value to be determined later
INSUMOS = [
    # ALIMENTOS – CARNES E FRIOS
    ('Filé de frango', 'Carnes e Frios', 'kg', 70, 1750.00),
    ('Coxa e sobrecoxa', 'Carnes e Frios', 'kg', 90, 1170.00),
    ('Patinho (bife)', 'Carnes e Frios', 'kg', 50, 2250.00),
    ('Calabresa', 'Carnes e Frios', 'pacote', 2, 180.00),
    ('Bacon', 'Carnes e Frios', 'manta', 1, 280.00),
    ('Salsicha', 'Carnes e Frios', 'kg', 12, 180.00),
    ('Presunto', 'Carnes e Frios', 'barra', 3, 900.00),
    ('Muçarela', 'Carnes e Frios', 'barra', 3, 1200.00),

    # ALIMENTOS – PADARIA E LATICÍNIOS
    ('Pão de sal', 'Padaria e Laticínios', 'un', 600, 360.00),
    ('Leite', 'Padaria e Laticínios', 'caixa', 4, 720.00),
    ('Creme de leite', 'Padaria e Laticínios', 'L', 13, 130.00),
    ('Ovos', 'Padaria e Laticínios', 'caixa', 1, 780.00),
    ('Fermento Royal', 'Padaria e Laticínios', 'lata', 2, 70.00),
    ('Biscoito/Pão de queijo congelado', 'Padaria e Laticínios', 'un', 1, 350.00),

    # ALIMENTOS – MERCEARIA
    ('Arroz', 'Mercearia', 'kg', 70, 490.00),
    ('Feijão', 'Mercearia', 'kg', 16, 160.00),
    ('Macarrão penne', 'Mercearia', 'kg', 3, 27.00),
    ('Macarrão fusilli', 'Mercearia', 'kg', 2, 18.00),
    ('Espaguete', 'Mercearia', 'kg', 8, 64.00),
    ('Massa para lasanha', 'Mercearia', 'kg', 8, 160.00),
    ('Farinha de trigo', 'Mercearia', 'fardo', 1, 180.00),
    ('Extrato de tomate (Elefante)', 'Mercearia', 'kg', 15, 240.00),
    ('Milho', 'Mercearia', 'kg', 4, 40.00),
    ('Café', 'Mercearia', 'kg', 10, 480.00),
    ('Mostarda', 'Mercearia', 'L', 3, 45.00),
    ('Azeitona', 'Mercearia', 'baldinho', 1, 90.00),
    ('Orégano', 'Mercearia', 'g', 300, 18.00),
    ('Achocolatado', 'Mercearia', 'kg', 3, 75.00),
    ('Chocolate granulado', 'Mercearia', 'kg', 1, 30.00),

    # ALIMENTOS – HORTIFRUTI
    ('Batata para fritar', 'Hortifruti', 'kg', 30, 210.00),
    ('Batata inglesa', 'Hortifruti', 'saco', 1, 250.00),
    ('Batata-doce', 'Hortifruti', 'kg', 4, 24.00),
    ('Cenoura', 'Hortifruti', 'kg', 8, 48.00),
    ('Abóbora', 'Hortifruti', 'kg', 4, 24.00),
    ('Alface', 'Hortifruti', 'pé', 9, 45.00),
    ('Repolho', 'Hortifruti', 'cabeça', 16, 112.00),
    ('Cheiro-verde', 'Hortifruti', 'maço', 10, 40.00),
    ('Pimenta-de-cheiro', 'Hortifruti', 'kg', 4, 60.00),
    ('Limão', 'Hortifruti', 'kg', 5, 35.00),
    ('Abacaxi', 'Hortifruti', 'un', 5, 50.00),
    ('Manga', 'Hortifruti', 'kg', 5, 35.00),

    # COZINHA E DESCARTÁVEIS
    ('Papel-alumínio', 'Cozinha e Descartáveis', 'rolo', 6, 180.00),
    ('Filme PVC', 'Cozinha e Descartáveis', 'rolo', 1, 35.00),
    ('Batata palha', 'Cozinha e Descartáveis', 'kg', 12, 300.00),

    # IDENTIFICAÇÃO E PAPELARIA
    ('Etiquetas de mala', 'Identificação e Papelaria', 'un', 2, None),
    ('Etiqueta para rosa', 'Identificação e Papelaria', 'un', 1, None),
    ('Etiqueta para travesseiro', 'Identificação e Papelaria', 'un', 1, None),
    ('Etiquetas para garrafinhas das MPs', 'Identificação e Papelaria', 'un', 90, None),
    ('Crachás da música tema', 'Identificação e Papelaria', 'un', 90, None),
    ('Crachás de operários', 'Identificação e Papelaria', 'un', 1, None),
    ('Xamex branco', 'Identificação e Papelaria', 'un', 1, None),
    ('Xamex colorido', 'Identificação e Papelaria', 'un', 1, None),
    ('Papel kraft', 'Identificação e Papelaria', 'un', 1, None),
    ('Folha de assinatura da Congregação', 'Identificação e Papelaria', 'un', 1, None),
    ('Marca-lugares sala de reunião', 'Identificação e Papelaria', 'un', 90, None),
    ('Adesivos para sacolas de cartas', 'Identificação e Papelaria', 'un', 90, None),

    # KITS E EMBALAGENS
    ('Sacos de cartinhas', 'Kits e Embalagens', 'un', 90, None),
    ('Sacolas de camisetas', 'Kits e Embalagens', 'un', 90, None),
    ('Sacos plásticos kit KH/quarto/sala', 'Kits e Embalagens', 'un', 90, None),
    ('Sacos para recolher itens pessoais RH', 'Kits e Embalagens', 'un', 90, None),
    ('Lembrancinhas dos construtores', 'Kits e Embalagens', 'un', 1, None),

    # DECORAÇÃO
    ('Cestos', 'Decoração', 'un', 1, None),
    ('Cesta', 'Decoração', 'un', 1, None),
    ('Rosas vermelhas', 'Decoração', 'un', 95, None),
    ('Rosas brancas', 'Decoração', 'un', 30, None),
    ('Nuvens', 'Decoração', 'un', 1, None),
    ('Estrelas cadentes (capela)', 'Decoração', 'un', 1, None),
    ('Estrelinhas', 'Decoração', 'un', 1, None),
    ('Estrelinhas para nuvens', 'Decoração', 'un', 1, None),
    ('Piscas-piscas', 'Decoração', 'un', 1, None),
    ('Balões vermelhos e brancos', 'Decoração', 'un', 1, None),
    ('TNT para piquenique', 'Decoração', 'un', 1, None),
    ('Materiais para decoração do refeitório', 'Decoração', 'un', 1, None),
    ('Lírios com nomes das MPs', 'Decoração', 'un', 90, None),
    ('Vasos para corredores dos alojamentos', 'Decoração', 'un', 1, None),
    ('Vasos para a capela', 'Decoração', 'un', 1, None),
    ('Imagem de Nossa Senhora de Lourdes', 'Decoração', 'un', 1, None),
    ('Fitinhas', 'Decoração', 'un', 95, None),

    # CAPELA E ENCENAÇÕES
    ('Lamparina', 'Capela e Encenações', 'un', 1, None),
    ('Sangue falso', 'Capela e Encenações', 'un', 1, None),
    ('Coroa de espinhos', 'Capela e Encenações', 'un', 1, None),
    ('Pano branco/retalho', 'Capela e Encenações', 'un', 1, None),
    ('Velas para adoração', 'Capela e Encenações', 'un', 1, None),
    ('Máquina de fumaça', 'Capela e Encenações', 'un', 1, None),

    # ESTRUTURA E EQUIPAMENTOS
    ('Strobo de luz (Sávio)', 'Estrutura e Equipamentos', 'un', 1, None),
    ('Canos', 'Estrutura e Equipamentos', 'un', 1, None),
    ('Cola quente', 'Estrutura e Equipamentos', 'un', 1, None),
    ('Pistola de cola quente', 'Estrutura e Equipamentos', 'un', 1, None),
    ('Pilhas', 'Estrutura e Equipamentos', 'un', 1, None),
    ('Rádios', 'Estrutura e Equipamentos', 'un', 4, None),
    ('Rodos pequenos', 'Estrutura e Equipamentos', 'un', 3, None),
    ('Rodos grandes', 'Estrutura e Equipamentos', 'un', 4, None),
    ('Caminhão para frete', 'Estrutura e Equipamentos', 'serviço', 1, None),

    # EVENTOS
    ('Foguetes (Bota-fora, Chegada no Canteiro e Missa de Encerramento)', 'Eventos', 'un', 1, None),

    # MATERIAIS GERAIS
    ('Bíblias', 'Materiais Gerais', 'un', 90, None),
    ('Cordão do Espírito Santo', 'Materiais Gerais', 'un', 80, None),
    ('Camisas das MPs', 'Materiais Gerais', 'un', 90, None),
    ('Aviso aos fornecedores', 'Materiais Gerais', 'un', 1, None),
]


def seed_insumos():
    app = create_app()
    user_repo = UserRepository()
    product_repo = ProductRepository()
    inventory_service = InventoryService()

    # Find the first provider user
    all_users = user_repo.get_all()
    provider = None
    for u in all_users:
        if hasattr(u, 'role') and u.role == 'provider':
            provider = u
            break

    if not provider:
        logger.info('No provider user found. Creating one...')
        from models import User
        from werkzeug.security import generate_password_hash
        provider = User.create(
            name='Coordenador Compromisso Trin',
            email='coordenador@compromisso.jumire.org',
            password_hash=generate_password_hash('Trin2026'),
            role='provider',
            profession='Coordenador de Encontro',
            phone='(62) 99999-9999',
            address='Goiânia, GO',
            bio='Coordenador do XV Encontro de Compromisso Trin',
            link='compromisso-trin',
            terms_accepted=True,
            privacy_accepted=True,
        )
        user_repo.add(provider)
        logger.info('Created provider: id=%s email=%s', provider.id, provider.email)

    logger.info('Using provider: id=%s email=%s name=%s', provider.id, provider.email, provider.name)
    print(f'Using provider: {provider.name} ({provider.email})')

    # Check if products already exist for this user
    existing = product_repo.find_by_user_id(provider.id)
    existing_names = {p.name for p in existing}
    if existing_names:
        logger.info('Found %d existing products. Checking for duplicates.', len(existing))

    created = 0
    skipped = 0
    for name, category, unit, quantity, total_cost in INSUMOS:
        if name in existing_names:
            logger.info('SKIP (already exists): %s', name)
            skipped += 1
            continue

        if total_cost is not None and quantity and quantity > 0:
            unit_price = round(total_cost / quantity, 2)
        elif total_cost is not None:
            unit_price = total_cost
        else:
            unit_price = 0.0

        result = inventory_service.create_product({
            'userId': provider.id,
            'name': name,
            'category': category,
            'unit': unit,
            'minStock': 0,
            'unitPrice': unit_price,
        })

        if result.get('success'):
            created += 1
            cost_str = f'R$ {total_cost:.2f}' if total_cost is not None else 'R$ ___'
            logger.info('Created: %s [%s] (%s %s @ R$ %.2f/%s) -> total est. %s',
                        name, category, quantity, unit, unit_price, unit, cost_str)
        else:
            logger.error('FAILED: %s -> %s', name, result.get('errors'))

    print(f'\n[Seed Insumos] Done! Created: {created}, Skipped: {skipped}')
    total_estimado = sum(item[4] for item in INSUMOS if item[4] is not None)
    print(f'Total estimado (itens com valor): R$ {total_estimado:.2f}')
    print(f'Total de itens: {len(INSUMOS)}')


if __name__ == '__main__':
    seed_insumos()
