"""Unit tests for Phase 4 services: EmployeeService, CommissionService, InventoryService."""
import pytest

from domain.enums import EmployeeRole, EmployeeStatus, CommissionType


class TestEmployeeService:
    def test_create_employee(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            result = svc.create_employee({
                'userId': 1, 'name': 'João Silva',
                'email': 'joao@test.com', 'role': EmployeeRole.DENTIST.value,
            })
            assert result['success'] is True
            assert result['employee']['name'] == 'João Silva'
            assert result['employee']['role'] == EmployeeRole.DENTIST.value
            assert result['employee']['status'] == EmployeeStatus.INVITED.value

    def test_create_employee_invalid_role(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            result = svc.create_employee({
                'userId': 1, 'name': 'João',
                'email': 'joao@test.com', 'role': 'invalid_role',
            })
            assert result['success'] is False

    def test_create_employee_missing_name(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            result = svc.create_employee({
                'userId': 1, 'email': 'joao@test.com',
                'role': EmployeeRole.ASSISTANT.value,
            })
            assert result['success'] is False

    def test_create_employee_missing_email(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            result = svc.create_employee({
                'userId': 1, 'name': 'João',
                'role': EmployeeRole.ASSISTANT.value,
            })
            assert result['success'] is False

    def test_get_employees(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            svc.create_employee({
                'userId': 1, 'name': 'A', 'email': 'a@t.com',
                'role': EmployeeRole.DENTIST.value,
            })
            emps = svc.get_employees(1)
            assert len(emps) >= 1

    def test_accept_invite(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            create = svc.create_employee({
                'userId': 1, 'name': 'B', 'email': 'b@t.com',
                'role': EmployeeRole.MANAGER.value,
            })
            token = create['employee']['inviteToken']
            result = svc.accept_invite(token)
            assert result['success'] is True
            assert result['employee']['status'] == EmployeeStatus.ACTIVE.value

    def test_accept_invite_invalid_token(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            result = svc.accept_invite('invalid_token')
            assert result['success'] is False

    def test_suspend_employee(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            create = svc.create_employee({
                'userId': 1, 'name': 'C', 'email': 'c@t.com',
                'role': EmployeeRole.RECEPTIONIST.value,
            })
            eid = create['employee']['id']
            token = create['employee']['inviteToken']
            svc.accept_invite(token)
            result = svc.suspend_employee(eid)
            assert result['success'] is True
            assert result['employee']['status'] == EmployeeStatus.SUSPENDED.value

    def test_terminate_employee(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            create = svc.create_employee({
                'userId': 1, 'name': 'D', 'email': 'd@t.com',
                'role': EmployeeRole.FINANCE.value,
            })
            eid = create['employee']['id']
            token = create['employee']['inviteToken']
            svc.accept_invite(token)
            result = svc.terminate_employee(eid)
            assert result['success'] is True
            assert result['employee']['status'] == EmployeeStatus.TERMINATED.value

    def test_reactivate_employee(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            create = svc.create_employee({
                'userId': 1, 'name': 'E', 'email': 'e@t.com',
                'role': EmployeeRole.ASSISTANT.value,
            })
            eid = create['employee']['id']
            token = create['employee']['inviteToken']
            svc.accept_invite(token)
            svc.suspend_employee(eid)
            result = svc.reactivate_employee(eid)
            assert result['success'] is True
            assert result['employee']['status'] == EmployeeStatus.ACTIVE.value

    def test_terminate_already_terminated(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            create = svc.create_employee({
                'userId': 1, 'name': 'F', 'email': 'f@t.com',
                'role': EmployeeRole.OTHER.value,
            })
            eid = create['employee']['id']
            token = create['employee']['inviteToken']
            svc.accept_invite(token)
            svc.terminate_employee(eid)
            result = svc.terminate_employee(eid)
            assert result['success'] is False

    def test_update_permissions(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            create = svc.create_employee({
                'userId': 1, 'name': 'G', 'email': 'g@t.com',
                'role': EmployeeRole.MANAGER.value,
            })
            eid = create['employee']['id']
            result = svc.update_permissions(eid, ['read', 'write'])
            assert result['success'] is True

    def test_suspend_not_found(self, client, app):
        from services.employee_service import EmployeeService
        with app.app_context():
            svc = EmployeeService()
            result = svc.suspend_employee(9999)
            assert result['success'] is False


class TestCommissionService:
    def test_create_percentage_rule(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.create_rule({
                'userId': 1, 'employeeId': 1,
                'commissionType': CommissionType.PERCENTAGE.value,
                'value': 10,
            })
            assert result['success'] is True
            assert result['rule']['commissionType'] == CommissionType.PERCENTAGE.value

    def test_create_fixed_rule(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.create_rule({
                'userId': 1, 'employeeId': 1,
                'commissionType': CommissionType.FIXED.value,
                'value': 50.0,
            })
            assert result['success'] is True
            assert result['rule']['commissionType'] == CommissionType.FIXED.value

    def test_create_rule_invalid_type(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.create_rule({
                'userId': 1, 'employeeId': 1,
                'commissionType': 'invalid',
                'value': 10,
            })
            assert result['success'] is False

    def test_create_rule_missing_value(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.create_rule({
                'userId': 1, 'employeeId': 1,
                'commissionType': CommissionType.PERCENTAGE.value,
            })
            assert result['success'] is False

    def test_calculate_commission_percentage(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            svc.create_rule({
                'userId': 1, 'employeeId': 1,
                'commissionType': CommissionType.PERCENTAGE.value,
                'value': 10,
            })
            result = svc.calculate_commission(1, 1, 1000)
            assert result['success'] is True
            assert result['commission'] == 100.0

    def test_calculate_commission_fixed(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            svc.create_rule({
                'userId': 1, 'employeeId': 2,
                'commissionType': CommissionType.FIXED.value,
                'value': 50,
            })
            result = svc.calculate_commission(1, 2, 1000)
            assert result['success'] is True
            assert result['commission'] == 50.0

    def test_calculate_commission_no_rule(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.calculate_commission(1, 999, 1000)
            assert result['success'] is True
            assert result['commission'] == 0.0
            assert result['rule'] is None

    def test_create_payment(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.create_payment(
                user_id=1, employee_id=1, amount=100, base_amount=1000,
            )
            assert result['success'] is True
            assert result['payment']['amount'] == 100
            assert result['payment']['status'] == 'pending'

    def test_mark_paid(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            create = svc.create_payment(
                user_id=1, employee_id=1, amount=100, base_amount=1000,
            )
            pid = create['payment']['id']
            result = svc.mark_paid(pid)
            assert result['success'] is True
            assert result['payment']['status'] == 'paid'

    def test_cancel_payment(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            create = svc.create_payment(
                user_id=1, employee_id=1, amount=100, base_amount=1000,
            )
            pid = create['payment']['id']
            result = svc.cancel_payment(pid)
            assert result['success'] is True
            assert result['payment']['status'] == 'cancelled'

    def test_get_payments(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            svc.create_payment(user_id=1, employee_id=1, amount=50, base_amount=500)
            svc.create_payment(user_id=1, employee_id=1, amount=30, base_amount=300)
            payments = svc.get_payments(1)
            assert len(payments) >= 2

    def test_get_commission_report(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            svc.create_payment(user_id=1, employee_id=1, amount=50, base_amount=500)
            create2 = svc.create_payment(user_id=1, employee_id=1, amount=30, base_amount=300)
            svc.mark_paid(create2['payment']['id'])
            report = svc.get_commission_report(1)
            assert len(report) >= 1
            assert report[0]['count'] >= 2

    def test_process_appointment_commission(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            svc.create_rule({
                'userId': 1, 'employeeId': 1,
                'commissionType': CommissionType.PERCENTAGE.value,
                'value': 10,
            })
            result = svc.process_appointment_commission(
                user_id=1, employee_id=1, service_id=1,
                base_amount=500, appointment_id=1,
            )
            assert result['success'] is True
            assert result['commission'] == 50.0
            assert result['payment'] is not None

    def test_process_appointment_commission_no_rule(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.process_appointment_commission(
                user_id=1, employee_id=999, service_id=1,
                base_amount=500, appointment_id=1,
            )
            assert result['success'] is True
            assert result['commission'] == 0.0
            assert result['payment'] is None

    def test_mark_paid_not_found(self, client, app):
        from services.commission_service import CommissionService
        with app.app_context():
            svc = CommissionService()
            result = svc.mark_paid(9999)
            assert result['success'] is False


class TestInventoryService:
    def test_create_product(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            result = svc.create_product({
                'userId': 1, 'name': 'Produto A',
                'sku': 'SKU001', 'unitPrice': 10.50, 'minStock': 5,
            })
            assert result['success'] is True
            assert result['product']['name'] == 'Produto A'
            assert result['product']['currentStock'] == 0

    def test_create_product_missing_name(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            result = svc.create_product({
                'userId': 1, 'sku': 'SKU002',
            })
            assert result['success'] is False

    def test_create_supplier(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            result = svc.create_supplier({
                'userId': 1, 'name': 'Fornecedor A',
                'email': 'forn@test.com', 'phone': '11999999999',
            })
            assert result['success'] is True
            assert result['supplier']['name'] == 'Fornecedor A'

    def test_create_supplier_missing_name(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            result = svc.create_supplier({'userId': 1})
            assert result['success'] is False

    def test_add_stock(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            create = svc.create_product({
                'userId': 1, 'name': 'P', 'sku': 'S1',
                'unitPrice': 5, 'minStock': 2,
            })
            pid = create['product']['id']
            result = svc.add_stock(pid, 20)
            assert result['success'] is True
            assert result['product']['currentStock'] == 20

    def test_consume_stock(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            create = svc.create_product({
                'userId': 1, 'name': 'P2', 'sku': 'S2',
                'unitPrice': 5, 'minStock': 2,
            })
            pid = create['product']['id']
            svc.add_stock(pid, 20)
            result = svc.consume_stock(pid, 5)
            assert result['success'] is True
            assert result['product']['currentStock'] == 15

    def test_consume_stock_insufficient(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            create = svc.create_product({
                'userId': 1, 'name': 'P3', 'sku': 'S3',
                'unitPrice': 5, 'minStock': 2,
            })
            pid = create['product']['id']
            svc.add_stock(pid, 3)
            result = svc.consume_stock(pid, 10)
            assert result['success'] is False

    def test_get_low_stock_alerts(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            create = svc.create_product({
                'userId': 1, 'name': 'Low', 'sku': 'LOW1',
                'unitPrice': 5, 'minStock': 10,
            })
            pid = create['product']['id']
            svc.add_stock(pid, 2)
            alerts = svc.get_low_stock_alerts(1)
            assert len(alerts) >= 1
            assert alerts[0]['name'] == 'Low'

    def test_get_products(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            svc.create_product({
                'userId': 1, 'name': 'X', 'sku': 'X1',
                'unitPrice': 1, 'minStock': 0,
            })
            products = svc.get_products(1)
            assert len(products) >= 1

    def test_add_stock_not_found(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            result = svc.add_stock(9999, 10)
            assert result['success'] is False

    def test_get_movements(self, client, app):
        from services.inventory_service import InventoryService
        with app.app_context():
            svc = InventoryService()
            create = svc.create_product({
                'userId': 1, 'name': 'Mov', 'sku': 'MOV1',
                'unitPrice': 1, 'minStock': 0,
            })
            pid = create['product']['id']
            svc.add_stock(pid, 10)
            svc.consume_stock(pid, 3)
            product = svc.product_repo.get_by_id(pid)
            assert len(product.movements) >= 2
