"""Seed Firestore with test data for manual testing."""
from app import create_app
from logger import get_logger
from models import User, Client, Service, Appointment, Transaction, Work
from repositories.user_repository import UserRepository
from repositories.client_repository import ClientRepository
from repositories.service_repository import ServiceRepository
from repositories.appointment_repository import AppointmentRepository
from repositories.transaction_repository import TransactionRepository
from repositories.work_repository import WorkRepository
from werkzeug.security import generate_password_hash
from datetime import date, timedelta
import random
import json


logger = get_logger('seed')


def seed_database():
    """Create test user and sample data."""
    logger.info('Starting Firestore seeding')
    app = create_app()

    user_repo = UserRepository()
    client_repo = ClientRepository()
    service_repo = ServiceRepository()
    appointment_repo = AppointmentRepository()
    transaction_repo = TransactionRepository()
    work_repo = WorkRepository()

    # Check if test user exists
    existing = user_repo.find_by_email('teste@profissional-os.com')
    if existing:
        logger.info('Test user already exists. Skipping seed.')
        return

    # Create test provider user
    user = User.create(
        name='Profissional Teste',
        email='teste@profissional-os.com',
        password_hash=generate_password_hash('Teste123'),
        role='provider',
        profession='Desenvolvedor',
        phone='(11) 99999-9999',
        address='São Paulo, SP',
        bio='Profissional de teste para demonstração',
        link='profissional-teste',
        terms_accepted=True,
        privacy_accepted=True,
    )
    user_repo.add(user)
    logger.info('Test provider created: id=%s email=%s', user.id, user.email)

    # Create test client user
    client_user = User.create(
        name='Cliente Teste',
        email='cliente@profissional-os.com',
        password_hash=generate_password_hash('Cliente123'),
        role='client',
        profession='',
        phone='(11) 97777-7777',
        address='São Paulo, SP',
        bio='',
        link='',
        terms_accepted=True,
        privacy_accepted=True,
    )
    user_repo.add(client_user)
    logger.info('Test client created: id=%s email=%s', client_user.id, client_user.email)

    # Create clients
    clients_data = [
        {'name': 'João Silva', 'email': 'joao@email.com', 'phone': '(11) 98888-1111', 'address': 'Rua A, 123', 'notes': 'Cliente antigo'},
        {'name': 'Maria Santos', 'email': 'maria@email.com', 'phone': '(11) 98888-2222', 'address': 'Rua B, 456', 'notes': 'Prefere manhã'},
        {'name': 'Pedro Costa', 'email': 'pedro@email.com', 'phone': '(11) 98888-3333', 'address': 'Rua C, 789', 'notes': ''},
        {'name': 'Ana Oliveira', 'email': 'ana@email.com', 'phone': '(11) 98888-4444', 'address': 'Rua D, 101', 'notes': 'Indicação'},
        {'name': 'Carlos Souza', 'email': 'carlos@email.com', 'phone': '(11) 98888-5555', 'address': 'Rua E, 202', 'notes': ''}
    ]
    clients = []
    for data in clients_data:
        client = Client(user_id=user.id, **data)
        client_repo.add(client)
        clients.append(client)
    logger.info('Created %s clients for user_id=%s', len(clients), user.id)

    # Create services
    services_data = [
        {'name': 'Consultoria', 'description': 'Consultoria técnica', 'price': 200.00, 'duration': 60, 'home_attendance': False},
        {'name': 'Mentoria', 'description': 'Mentoria individual', 'price': 150.00, 'duration': 45, 'home_attendance': True},
        {'name': 'Revisão de Código', 'description': 'Code review detalhada', 'price': 120.00, 'duration': 30, 'home_attendance': False},
        {'name': 'Workshop', 'description': 'Workshop em equipe', 'price': 500.00, 'duration': 120, 'home_attendance': True},
        {'name': 'Suporte Técnico', 'description': 'Suporte remoto', 'price': 90.00, 'duration': 30, 'home_attendance': False}
    ]
    services = []
    for data in services_data:
        service = Service(user_id=user.id, **data)
        service_repo.add(service)
        services.append(service)
    logger.info('Created %s services for user_id=%s', len(services), user.id)

    # Create appointments
    today = date.today()
    statuses = ['scheduled', 'confirmed', 'completed']
    for i in range(8):
        appointment_date = today + timedelta(days=random.randint(-2, 14))
        appointment = Appointment(
            user_id=user.id,
            client_id=random.choice(clients).id,
            service_id=random.choice(services).id,
            date=appointment_date.isoformat(),
            time=f'{random.randint(8, 17):02d}:00',
            home_attendance=random.choice([True, False]),
            status=random.choice(statuses),
            notes='Agendamento de teste'
        )
        appointment_repo.add(appointment)
    logger.info('Created 8 appointments for user_id=%s', user.id)

    # Create transactions
    transactions_data = [
        {'type': 'income', 'description': 'Consultoria - João Silva', 'amount': 200.00, 'date': (today - timedelta(days=2)).isoformat(), 'category': 'service', 'status': 'paid'},
        {'type': 'income', 'description': 'Mentoria - Maria Santos', 'amount': 150.00, 'date': (today - timedelta(days=5)).isoformat(), 'category': 'service', 'status': 'paid'},
        {'type': 'expense', 'description': 'Licença de Software', 'amount': 99.00, 'date': (today - timedelta(days=3)).isoformat(), 'category': 'other', 'status': 'paid'},
        {'type': 'expense', 'description': 'Internet', 'amount': 120.00, 'date': (today - timedelta(days=4)).isoformat(), 'category': 'other', 'status': 'paid'},
        {'type': 'income', 'description': 'Code Review - Pedro Costa', 'amount': 120.00, 'date': today.isoformat(), 'category': 'service', 'status': 'pending'},
    ]
    for data in transactions_data:
        transaction = Transaction(user_id=user.id, **data)
        transaction_repo.add(transaction)
    logger.info('Created %s transactions for user_id=%s', len(transactions_data), user.id)

    # Create works
    works_data = [
        {
            'title': 'Desenvolvimento de Site Institucional',
            'description': 'Site institucional responsivo com até 5 páginas',
            'price': 1500.00,
            'category': 'Desenvolvimento',
            'custom_fields': [
                {'name': 'empresa', 'label': 'Nome da empresa', 'type': 'text', 'required': True, 'options': []},
                {'name': 'ramo', 'label': 'Ramo de atuação', 'type': 'text', 'required': True, 'options': []},
                {'name': 'paginas', 'label': 'Quantas páginas precisa?', 'type': 'number', 'required': True, 'options': []},
                {'name': 'referencias', 'label': 'Sites de referência', 'type': 'textarea', 'required': False, 'options': []},
            ]
        },
        {
            'title': 'Consultoria em Arquitetura de Software',
            'description': 'Análise e recomendações para sua arquitetura',
            'price': 400.00,
            'category': 'Consultoria',
            'custom_fields': [
                {'name': 'projeto', 'label': 'Descreva o projeto', 'type': 'textarea', 'required': True, 'options': []},
                {'name': 'tecnologias', 'label': 'Tecnologias atuais', 'type': 'text', 'required': False, 'options': []},
                {'name': 'encontro', 'label': 'Preferência de encontro', 'type': 'select', 'required': True, 'options': ['Presencial', 'Online', 'Híbrido']},
            ]
        },
        {
            'title': 'Design de Logo',
            'description': 'Criação de identidade visual com logo e manual da marca',
            'price': 800.00,
            'category': 'Design',
            'custom_fields': [
                {'name': 'marca', 'label': 'Nome da marca', 'type': 'text', 'required': True, 'options': []},
                {'name': 'estilo', 'label': 'Estilo desejado', 'type': 'select', 'required': True, 'options': ['Moderno', 'Clássico', 'Minimalista', 'Divertido']},
                {'name': 'cores', 'label': 'Cores de preferência', 'type': 'text', 'required': False, 'options': []},
                {'name': 'referencias', 'label': 'Referências visuais', 'type': 'textarea', 'required': False, 'options': []},
            ]
        },
    ]
    for data in works_data:
        work = Work(
            provider_id=user.id,
            title=data['title'],
            description=data['description'],
            price=data['price'],
            category=data['category'],
            custom_fields_json=json.dumps(data['custom_fields']),
            active=True,
        )
        work_repo.add(work)
    logger.info('Created %s works for provider_id=%s', len(works_data), user.id)

    logger.info('Firestore seeded successfully for user_id=%s', user.id)
    print('\n[Seed] Firestore seeded successfully!')
    print('Credentials:')
    print('  Email: teste@profissional-os.com')
    print('  Password: Teste123')
    print('  Role: Prestador')
    print('')
    print('Client credentials:')
    print('  Email: cliente@profissional-os.com')
    print('  Password: Cliente123')
    print('  Role: Cliente')


if __name__ == '__main__':
    seed_database()
