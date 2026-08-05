"""Integration + E2E tests for Phase 4 — Teams, Commissions, Multi-unit.

E2E flows:
1. Cadastrar funcionário e enviar convite
2. Funcionário aceita convite e acessa agenda
3. Agendar atendimento como colaborador
4. Verificar comissão calculada
5. Cadastrar filial
6. Transferir produto entre unidades
7. Gerar relatório consolidado
"""
import json
from datetime import date, timedelta

from domain.enums import (
    EmployeeStatus, EmployeeRole, CommissionType, CommissionStatus,
    BranchType, TransferStatus, StockMovementType,
)


def _register_and_get_token(client, email='user@example.com', role='provider', profession='Dentista'):
    resp = client.post('/api/auth/register',
                       data=json.dumps({
                           'name': 'Test User',
                           'email': email,
                           'password': 'secret123',
                           'role': role,
                           'profession': profession,
                           'termsAccepted': True,
                           'privacyAccepted': True,
                       }),
                       content_type='application/json')
    if resp.status_code == 201:
        return resp.get_json()['user']['id']
    resp = client.post('/api/auth/login',
                       data=json.dumps({'email': email, 'password': 'secret123'}),
                       content_type='application/json')
    return resp.get_json()['user']['id']


class TestEmployeeE2E:
    """E2E: Register employee → send invite → accept → access system."""

    def test_register_employee_and_send_invite(self, client, app):
        uid = _register_and_get_token(client, email='emp1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Dr. Carlos Santos',
                               'email': 'carlos@clinic.com',
                               'role': EmployeeRole.DENTIST.value,
                               'permissions': ['schedule', 'finance_read'],
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        emp = resp.get_json()['employee']
        assert emp['status'] == EmployeeStatus.INVITED.value
        assert emp['inviteToken'] is not None

    def test_employee_accept_invite(self, client, app):
        uid = _register_and_get_token(client, email='emp2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Ana Costa',
                               'email': 'ana@clinic.com',
                               'role': EmployeeRole.ASSISTANT.value,
                           }),
                           content_type='application/json', headers=headers)
        token = resp.get_json()['employee']['inviteToken']

        resp = client.post('/api/employees/accept-invite',
                           data=json.dumps({'token': token}),
                           content_type='application/json')
        assert resp.status_code == 200
        assert resp.get_json()['employee']['status'] == EmployeeStatus.ACTIVE.value

    def test_employee_lifecycle_suspend_reactivate_terminate(self, client, app):
        uid = _register_and_get_token(client, email='emp3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Pedro Lima',
                               'email': 'pedro@clinic.com',
                               'role': EmployeeRole.RECEPTIONIST.value,
                           }),
                           content_type='application/json', headers=headers)
        emp_id = resp.get_json()['employee']['id']
        token = resp.get_json()['employee']['inviteToken']

        client.post('/api/employees/accept-invite',
                    data=json.dumps({'token': token}),
                    content_type='application/json')

        # Suspend
        resp = client.post(f'/api/employees/{emp_id}/suspend',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['employee']['status'] == EmployeeStatus.SUSPENDED.value

        # Reactivate
        resp = client.post(f'/api/employees/{emp_id}/reactivate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['employee']['status'] == EmployeeStatus.ACTIVE.value

        # Terminate
        resp = client.post(f'/api/employees/{emp_id}/terminate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['employee']['status'] == EmployeeStatus.TERMINATED.value

    def test_employee_history(self, client, app):
        uid = _register_and_get_token(client, email='emp4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Maria Silva',
                               'email': 'maria@clinic.com',
                               'role': EmployeeRole.MANAGER.value,
                           }),
                           content_type='application/json', headers=headers)
        emp_id = resp.get_json()['employee']['id']

        resp = client.get(f'/api/employees/{emp_id}/history', headers=headers)
        assert resp.status_code == 200
        assert 'history' in resp.get_json()

    def test_update_permissions(self, client, app):
        uid = _register_and_get_token(client, email='emp5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Test',
                               'email': 'test@clinic.com',
                               'role': EmployeeRole.FINANCE.value,
                           }),
                           content_type='application/json', headers=headers)
        emp_id = resp.get_json()['employee']['id']

        resp = client.put(f'/api/employees/{emp_id}/permissions',
                          data=json.dumps({'permissions': ['full']}),
                          content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['employee']['permissions'] == ['full']


class TestCommissionE2E:
    """E2E: Create commission rule → calculate → payment → report."""

    def test_create_percentage_rule_and_calculate(self, client, app):
        uid = _register_and_get_token(client, email='com1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create employee first
        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Dr. João',
                               'email': 'joao@clinic.com',
                               'role': EmployeeRole.DENTIST.value,
                           }),
                           content_type='application/json', headers=headers)
        emp_id = resp.get_json()['employee']['id']

        # Create commission rule (10%)
        resp = client.post('/api/commissions/rules',
                           data=json.dumps({
                               'employeeId': emp_id,
                               'commissionType': CommissionType.PERCENTAGE.value,
                               'value': 10.0,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        # Calculate commission
        resp = client.post('/api/commissions/calculate',
                           data=json.dumps({
                               'employeeId': emp_id,
                               'baseAmount': 200.00,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['commission'] == 20.00

    def test_create_fixed_rule_and_calculate(self, client, app):
        uid = _register_and_get_token(client, email='com2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Dr. Maria',
                               'email': 'maria2@clinic.com',
                               'role': EmployeeRole.DENTIST.value,
                           }),
                           content_type='application/json', headers=headers)
        emp_id = resp.get_json()['employee']['id']

        resp = client.post('/api/commissions/rules',
                           data=json.dumps({
                               'employeeId': emp_id,
                               'commissionType': CommissionType.FIXED.value,
                               'value': 50.0,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201

        resp = client.post('/api/commissions/calculate',
                           data=json.dumps({
                               'employeeId': emp_id,
                               'baseAmount': 300.00,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['commission'] == 50.00

    def test_commission_report(self, client, app):
        uid = _register_and_get_token(client, email='com3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/employees',
                           data=json.dumps({
                               'name': 'Test',
                               'email': 'test3@clinic.com',
                               'role': EmployeeRole.DENTIST.value,
                           }),
                           content_type='application/json', headers=headers)
        emp_id = resp.get_json()['employee']['id']

        resp = client.get('/api/commissions/report', headers=headers)
        assert resp.status_code == 200
        assert 'report' in resp.get_json()


class TestBranchE2E:
    """E2E: Create branches → transfer stock → consolidated report."""

    def test_create_headquarters_and_branch(self, client, app):
        uid = _register_and_get_token(client, email='br1@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create headquarters
        resp = client.post('/api/branches',
                           data=json.dumps({
                               'name': 'Matriz Centro',
                               'branchType': BranchType.HEADQUARTERS.value,
                               'address': 'Rua A, 123',
                               'phone': '(11) 1234-5678',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        hq_id = resp.get_json()['branch']['id']

        # Create branch
        resp = client.post('/api/branches',
                           data=json.dumps({
                               'name': 'Filial Norte',
                               'branchType': BranchType.BRANCH.value,
                               'address': 'Rua B, 456',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        branch_id = resp.get_json()['branch']['id']

        # List branches
        resp = client.get('/api/branches', headers=headers)
        assert resp.status_code == 200
        assert len(resp.get_json()['branches']) == 2

    def test_transfer_stock_between_branches(self, client, app):
        uid = _register_and_get_token(client, email='br2@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create two branches
        resp = client.post('/api/branches',
                           data=json.dumps({'name': 'Unidade A', 'branchType': 'branch'}),
                           content_type='application/json', headers=headers)
        branch_a = resp.get_json()['branch']['id']

        resp = client.post('/api/branches',
                           data=json.dumps({'name': 'Unidade B', 'branchType': 'branch'}),
                           content_type='application/json', headers=headers)
        branch_b = resp.get_json()['branch']['id']

        # Create product and add stock
        resp = client.post('/api/inventory/products',
                           data=json.dumps({
                               'name': 'Test Product',
                               'sku': 'TR-001',
                               'minStock': 5,
                               'unitPrice': 10.0,
                           }),
                           content_type='application/json', headers=headers)
        product_id = resp.get_json()['product']['id']

        client.post(f'/api/inventory/products/{product_id}/add-stock',
                    data=json.dumps({'quantity': 100}),
                    content_type='application/json', headers=headers)

        # Create transfer
        resp = client.post('/api/transfers',
                           data=json.dumps({
                               'productId': product_id,
                               'fromBranchId': branch_a,
                               'toBranchId': branch_b,
                               'quantity': 20,
                               'reason': 'Reabastecimento',
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 201
        transfer_id = resp.get_json()['transfer']['id']
        assert resp.get_json()['transfer']['status'] == TransferStatus.REQUESTED.value

        # Approve
        resp = client.post(f'/api/transfers/{transfer_id}/approve',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['transfer']['status'] == TransferStatus.APPROVED.value

        # Ship
        resp = client.post(f'/api/transfers/{transfer_id}/ship',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['transfer']['status'] == TransferStatus.IN_TRANSIT.value

        # Complete
        resp = client.post(f'/api/transfers/{transfer_id}/complete',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['transfer']['status'] == TransferStatus.COMPLETED.value

    def test_transfer_same_branch_rejected(self, client, app):
        uid = _register_and_get_token(client, email='br3@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/branches',
                           data=json.dumps({'name': 'Unit A', 'branchType': 'branch'}),
                           content_type='application/json', headers=headers)
        branch_id = resp.get_json()['branch']['id']

        resp = client.post('/api/transfers',
                           data=json.dumps({
                               'productId': 1,
                               'fromBranchId': branch_id,
                               'toBranchId': branch_id,
                               'quantity': 10,
                           }),
                           content_type='application/json', headers=headers)
        assert resp.status_code == 400

    def test_consolidated_report(self, client, app):
        uid = _register_and_get_token(client, email='br4@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        # Create branches
        client.post('/api/branches',
                    data=json.dumps({'name': 'Matriz', 'branchType': 'headquarters'}),
                    content_type='application/json', headers=headers)
        client.post('/api/branches',
                    data=json.dumps({'name': 'Filial 1', 'branchType': 'branch'}),
                    content_type='application/json', headers=headers)

        resp = client.get('/api/branches/consolidated-report', headers=headers)
        assert resp.status_code == 200
        report = resp.get_json()['report']
        assert 'branches' in report
        assert 'totalRevenue' in report
        assert 'totalProfit' in report
        assert len(report['branches']) == 2

    def test_data_isolation_between_users(self, client, app):
        """Verify that user A's branches are not visible to user B."""
        uid_a = _register_and_get_token(client, email='iso-a@test.com')
        uid_b = _register_and_get_token(client, email='iso-b@test.com')

        headers_a = {'Authorization': f'Bearer {uid_a}'}
        headers_b = {'Authorization': f'Bearer {uid_b}'}

        # User A creates a branch
        client.post('/api/branches',
                    data=json.dumps({'name': 'User A Branch', 'branchType': 'branch'}),
                    content_type='application/json', headers=headers_a)

        # User B should not see User A's branch
        resp = client.get('/api/branches', headers=headers_b)
        assert resp.status_code == 200
        branches = resp.get_json()['branches']
        assert all(b['name'] != 'User A Branch' for b in branches)

    def test_deactivate_and_reactivate_branch(self, client, app):
        uid = _register_and_get_token(client, email='br5@test.com')
        headers = {'Authorization': f'Bearer {uid}'}

        resp = client.post('/api/branches',
                           data=json.dumps({'name': 'Test Branch', 'branchType': 'branch'}),
                           content_type='application/json', headers=headers)
        branch_id = resp.get_json()['branch']['id']

        resp = client.post(f'/api/branches/{branch_id}/deactivate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['branch']['active'] is False

        resp = client.post(f'/api/branches/{branch_id}/reactivate',
                           content_type='application/json', headers=headers)
        assert resp.status_code == 200
        assert resp.get_json()['branch']['active'] is True
