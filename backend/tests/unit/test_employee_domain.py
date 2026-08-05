"""TDD unit tests for Employee domain models (Phase 4)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import EmployeeStatus, EmployeeRole, PermissionLevel
from domain.exceptions import EmployeeError, ValidationError


class TestEmployee:
    def test_create_employee(self):
        from models import Employee
        emp = Employee.create(
            user_id=1, name='Dr. João Silva',
            email='joao@clinic.com',
            role=EmployeeRole.DENTIST.value,
            branch_id=None,
        )
        assert emp.status == EmployeeStatus.INVITED.value
        assert emp.role == EmployeeRole.DENTIST.value
        assert emp.invite_token is not None

    def test_create_employee_missing_name(self):
        from models import Employee
        with pytest.raises(ValidationError):
            Employee.create(user_id=1, name='', email='test@test.com',
                            role=EmployeeRole.ASSISTANT.value)

    def test_create_employee_missing_email(self):
        from models import Employee
        with pytest.raises(ValidationError):
            Employee.create(user_id=1, name='Test', email='',
                            role=EmployeeRole.ASSISTANT.value)

    def test_employee_invite_token_unique(self):
        from models import Employee
        emp1 = Employee.create(user_id=1, name='A', email='a@test.com',
                               role=EmployeeRole.DENTIST.value)
        emp2 = Employee.create(user_id=1, name='B', email='b@test.com',
                               role=EmployeeRole.DENTIST.value)
        assert emp1.invite_token != emp2.invite_token

    def test_employee_accept_invite(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        emp.accept_invite()
        assert emp.status == EmployeeStatus.ACTIVE.value
        assert emp.accepted_at is not None

    def test_employee_suspend(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        emp.accept_invite()
        emp.suspend()
        assert emp.status == EmployeeStatus.SUSPENDED.value

    def test_employee_terminate(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        emp.accept_invite()
        emp.terminate()
        assert emp.status == EmployeeStatus.TERMINATED.value

    def test_employee_reactivate(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        emp.accept_invite()
        emp.suspend()
        emp.reactivate()
        assert emp.status == EmployeeStatus.ACTIVE.value

    def test_terminate_already_terminated(self):
        from models import Employee
        with pytest.raises(ValidationError):
            Employee.create(user_id=1, name='', email='t@t.com',
                            role=EmployeeRole.OTHER.value)

    def test_terminated_cannot_be_suspended(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        emp.accept_invite()
        emp.terminate()
        with pytest.raises(EmployeeError):
            emp.suspend()

    def test_invited_cannot_access_system(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        assert emp.can_access_system() is False

    def test_active_can_access_system(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        emp.accept_invite()
        assert emp.can_access_system() is True

    def test_employee_has_permission(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.MANAGER.value,
                              permissions=['full'])
        emp.accept_invite()
        assert emp.has_permission('full') is True
        assert emp.has_permission('schedule') is False

    def test_employee_without_permissions(self):
        from models import Employee
        emp = Employee.create(user_id=1, name='Test', email='test@test.com',
                              role=EmployeeRole.ASSISTANT.value)
        emp.accept_invite()
        assert emp.has_permission('full') is False


class TestEmployeeHistory:
    def test_create_history_entry(self):
        from models import EmployeeHistory
        history = EmployeeHistory.create(
            employee_id=1, action='status_change',
            description='Status alterado de ativo para suspenso',
            changed_by=2,
        )
        assert history.action == 'status_change'
        assert history.description == 'Status alterado de ativo para suspenso'

    def test_history_missing_action(self):
        from models import EmployeeHistory
        with pytest.raises(ValidationError):
            EmployeeHistory.create(employee_id=1, action='',
                                  description='Test', changed_by=2)
