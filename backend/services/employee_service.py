"""Team/Employee application service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.team_repository import EmployeeRepository, EmployeeHistoryRepository
from services.email_sender import get_email_sender


class EmployeeService:
    def __init__(self, employee_repo=None, history_repo=None, email_sender=None):
        self.employee_repo = employee_repo or EmployeeRepository()
        self.history_repo = history_repo or EmployeeHistoryRepository()
        self.email_sender = email_sender or get_email_sender()
        self.logger = get_logger(self.__class__.__name__)

    def create_employee(self, data):
        from models import Employee
        try:
            emp = Employee.create(
                user_id=data['userId'],
                name=data.get('name'),
                email=data.get('email'),
                role=data.get('role'),
                branch_id=data.get('branchId'),
                permissions=data.get('permissions', []),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.employee_repo.add(emp)
        # Send invite email
        self.email_sender.send(
            to=emp.email,
            subject='Convite para equipe - Profissional OS',
            body=f'Olá {emp.name}, você foi convidado para a equipe. '
                 f'Token: {emp.invite_token}',
        )
        return {'success': True, 'employee': emp.to_dict()}

    def get_employees(self, user_id):
        employees = self.employee_repo.find_by_user_id(user_id)
        return [e.to_dict() for e in employees]

    def get_employee(self, employee_id):
        emp = self.employee_repo.get_by_id(employee_id)
        if not emp:
            return None
        return emp.to_dict()

    def accept_invite(self, token):
        emp = self.employee_repo.find_by_invite_token(token)
        if not emp:
            return {'success': False, 'errors': ['Token de convite inválido']}
        try:
            emp.accept_invite()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.employee_repo.save(emp)
        self._add_history(emp.id, 'invite_accepted', 'Convite aceito', None)
        return {'success': True, 'employee': emp.to_dict()}

    def suspend_employee(self, employee_id, changed_by=None):
        emp = self.employee_repo.get_by_id(employee_id)
        if not emp:
            return {'success': False, 'errors': ['Colaborador não encontrado']}
        try:
            emp.suspend()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.employee_repo.save(emp)
        self._add_history(emp.id, 'suspended', 'Colaborador suspenso', changed_by)
        return {'success': True, 'employee': emp.to_dict()}

    def terminate_employee(self, employee_id, changed_by=None):
        emp = self.employee_repo.get_by_id(employee_id)
        if not emp:
            return {'success': False, 'errors': ['Colaborador não encontrado']}
        try:
            emp.terminate()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.employee_repo.save(emp)
        self._add_history(emp.id, 'terminated', 'Colaborador demitido', changed_by)
        return {'success': True, 'employee': emp.to_dict()}

    def reactivate_employee(self, employee_id, changed_by=None):
        emp = self.employee_repo.get_by_id(employee_id)
        if not emp:
            return {'success': False, 'errors': ['Colaborador não encontrado']}
        try:
            emp.reactivate()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.employee_repo.save(emp)
        self._add_history(emp.id, 'reactivated', 'Colaborador reativado', changed_by)
        return {'success': True, 'employee': emp.to_dict()}

    def update_permissions(self, employee_id, permissions, changed_by=None):
        emp = self.employee_repo.get_by_id(employee_id)
        if not emp:
            return {'success': False, 'errors': ['Colaborador não encontrado']}
        import json
        emp.permissions_json = json.dumps(permissions or [])
        self.employee_repo.save(emp)
        self._add_history(emp.id, 'permissions_updated',
                         f'Permissões atualizadas: {permissions}', changed_by)
        return {'success': True, 'employee': emp.to_dict()}

    def get_history(self, employee_id):
        history = self.history_repo.find_by_employee_id(employee_id)
        return [h.to_dict() for h in history]

    def get_productivity(self, user_id, employee_id, start_date=None, end_date=None):
        """Calculate employee productivity metrics."""
        from domain.enums import AppointmentStatus
        from database import get_db
        from datetime import date as dt_date
        if not start_date:
            start_date = dt_date.today().replace(day=1)
        if not end_date:
            end_date = dt_date.today()
        start_str = start_date.isoformat() if hasattr(start_date, 'isoformat') else str(start_date)
        end_str = end_date.isoformat() if hasattr(end_date, 'isoformat') else str(end_date)
        docs = get_db().collection('appointment').where('user_id', '==', user_id).where('employee_id', '==', employee_id).stream()
        appointments = []
        for doc in docs:
            data = doc.to_dict()
            doc_date = data.get('date', '')
            if isinstance(doc_date, str) and start_str <= doc_date <= end_str:
                appointments.append(data)
        completed = [a for a in appointments
                     if a.get('status') == AppointmentStatus.CONFIRMED.value]
        cancelled = [a for a in appointments
                     if a.get('status') == AppointmentStatus.CANCELLED.value]
        return {
            'totalAppointments': len(appointments),
            'completed': len(completed),
            'cancelled': len(cancelled),
            'cancellationRate': round(len(cancelled) / len(appointments) * 100, 2)
                               if appointments else 0.0,
        }

    def _add_history(self, employee_id, action, description, changed_by):
        from models import EmployeeHistory
        entry = EmployeeHistory.create(employee_id, action, description, changed_by)
        self.history_repo.add(entry)
