"""Appointment application service (thin orchestration over the aggregate)."""
from logger import get_logger
from models import Appointment
from domain.exceptions import DomainError
from repositories.appointment_repository import AppointmentRepository


class AppointmentService:
    """Coordinates persistence and the Appointment aggregate lifecycle."""

    def __init__(self, appointment_repository=None):
        self.appointment_repository = appointment_repository or AppointmentRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_appointment(self, data):
        """Create a new appointment. Invariants live in Appointment.create."""
        try:
            appointment = Appointment.create(
                user_id=data['userId'],
                client_id=data.get('clientId'),
                service_id=data.get('serviceId'),
                date=data.get('date'),
                time=data.get('time'),
                home_attendance=data.get('homeAttendance', False),
                notes=data.get('notes', ''),
                status=data.get('status'),
            )
        except DomainError as e:
            self.logger.warning('Appointment validation failed: user_id=%s errors=%s', data.get('userId'), e.errors)
            return {'success': False, 'errors': e.errors}

        self.appointment_repository.add(appointment)
        self.logger.info('Appointment created: user_id=%s appointment_id=%s date=%s time=%s',
                         appointment.user_id, appointment.id, appointment.date, appointment.time)
        return {'success': True, 'appointment': appointment.to_dict()}

    def get_appointments_by_user_id(self, user_id):
        """Get all appointments for a user."""
        appointments = self.appointment_repository.find_by_user_id(user_id)
        self.logger.debug('Listed appointments: user_id=%s count=%s', user_id, len(appointments))
        return [a.to_dict() for a in appointments]

    def get_appointments_by_date(self, user_id, date):
        """Get appointments by date."""
        appointments = self.appointment_repository.find_by_date(user_id, date)
        self.logger.debug('Listed appointments by date: user_id=%s date=%s count=%s', user_id, date, len(appointments))
        return [a.to_dict() for a in appointments]

    def get_today_appointments(self, user_id):
        """Get today's appointments."""
        appointments = self.appointment_repository.find_today(user_id)
        self.logger.debug('Today appointments: user_id=%s count=%s', user_id, len(appointments))
        return [a.to_dict() for a in appointments]

    def get_upcoming_appointments(self, user_id):
        """Get upcoming appointments."""
        appointments = self.appointment_repository.find_upcoming(user_id)
        self.logger.debug('Upcoming appointments: user_id=%s count=%s', user_id, len(appointments))
        return [a.to_dict() for a in appointments]

    def get_appointment_by_id(self, appointment_id, user_id):
        """Get appointment by ID."""
        appointment = self.appointment_repository.get_by_id(appointment_id, user_id)
        if not appointment:
            self.logger.warning('Appointment not found: user_id=%s appointment_id=%s', user_id, appointment_id)
            return None
        return appointment.to_dict()

    def update_appointment(self, appointment_id, user_id, data):
        """Update an appointment via its domain behavior.

        Status changes are NOT done here via raw assignment; use the explicit
        lifecycle actions (confirm/complete/cancel) which protect invariants.
        """
        appointment = self.appointment_repository.get_by_id(appointment_id, user_id)
        if not appointment:
            self.logger.warning('Update appointment failed: not found user_id=%s appointment_id=%s', user_id, appointment_id)
            return {'success': False, 'errors': ['Agendamento não encontrado']}

        try:
            if 'clientId' in data or 'serviceId' in data:
                appointment.change_participants(
                    client_id=data.get('clientId'),
                    service_id=data.get('serviceId'),
                )
            if 'date' in data or 'time' in data:
                appointment.reschedule(date=data.get('date'), time=data.get('time'))
            if 'homeAttendance' in data:
                appointment.set_home_attendance(data['homeAttendance'])
            if 'notes' in data:
                appointment.annotate(data['notes'])
            # Status handled through explicit transitions when provided
            if 'status' in data and data['status'] and data['status'] != appointment.status:
                self._apply_transition(appointment, data['status'])
        except DomainError as e:
            self.logger.warning('Update appointment failed: user_id=%s appointment_id=%s errors=%s', user_id, appointment_id, e.errors)
            return {'success': False, 'errors': e.errors}

        self.appointment_repository.save(appointment)
        self.logger.info('Appointment updated: user_id=%s appointment_id=%s', user_id, appointment_id)
        return {'success': True, 'appointment': appointment.to_dict()}

    # --- Explicit lifecycle actions (rich domain) ---
    def confirm_appointment(self, appointment_id, user_id):
        return self._run_action(appointment_id, user_id, lambda a: a.confirm(), 'confirmed')

    def complete_appointment(self, appointment_id, user_id):
        return self._run_action(appointment_id, user_id, lambda a: a.complete(), 'completed')

    def cancel_appointment(self, appointment_id, user_id):
        return self._run_action(appointment_id, user_id, lambda a: a.cancel(), 'cancelled')

    def _apply_transition(self, appointment, target_status):
        actions = {
            'confirmed': appointment.confirm,
            'completed': appointment.complete,
            'cancelled': appointment.cancel,
        }
        action = actions.get(target_status)
        if action is None:
            from domain.exceptions import ValidationError
            raise ValidationError(f'Transição de status inválida: {target_status}')
        action()

    def _run_action(self, appointment_id, user_id, action, action_name):
        appointment = self.appointment_repository.get_by_id(appointment_id, user_id)
        if not appointment:
            self.logger.warning('Appointment action %s failed: not found user_id=%s appointment_id=%s',
                                 action_name, user_id, appointment_id)
            return {'success': False, 'errors': ['Agendamento não encontrado']}
        try:
            action(appointment)
        except DomainError as e:
            self.logger.warning('Appointment action %s rejected: user_id=%s appointment_id=%s errors=%s',
                                 action_name, user_id, appointment_id, e.errors)
            return {'success': False, 'errors': e.errors}
        self.appointment_repository.save(appointment)
        self.logger.info('Appointment %s: user_id=%s appointment_id=%s', action_name, user_id, appointment_id)
        return {'success': True, 'appointment': appointment.to_dict()}

    def delete_appointment(self, appointment_id, user_id):
        """Delete an appointment."""
        appointment = self.appointment_repository.get_by_id(appointment_id, user_id)
        if not appointment:
            self.logger.warning('Delete appointment failed: not found user_id=%s appointment_id=%s', user_id, appointment_id)
            return {'success': False, 'errors': ['Agendamento não encontrado']}

        self.appointment_repository.delete(appointment)
        self.logger.info('Appointment deleted: user_id=%s appointment_id=%s', user_id, appointment_id)
        return {'success': True}
