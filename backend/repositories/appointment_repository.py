"""Appointment repository — Firestore adapter implementing AppointmentRepositoryPort."""
from datetime import date, timedelta
from logger import get_logger
from models import Appointment
from repositories.base import BaseRepository
from ports import AppointmentRepositoryPort


class AppointmentRepository(BaseRepository, AppointmentRepositoryPort):
    """Repository for appointment data access."""

    def __init__(self):
        super().__init__(Appointment)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        """Find all appointments for a user."""
        docs = self._collection().where('user_id', '==', user_id).stream()
        appointments = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_user_id: user_id=%s count=%s', user_id, len(appointments))
        return appointments

    def find_by_date(self, user_id, appointment_date):
        """Find appointments by date."""
        date_str = appointment_date.isoformat() if hasattr(appointment_date, 'isoformat') else str(appointment_date)
        docs = self._collection().where('user_id', '==', user_id).where('date', '==', date_str).stream()
        appointments = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_by_date: user_id=%s date=%s count=%s', user_id, appointment_date, len(appointments))
        return appointments

    def find_today(self, user_id):
        """Find today's appointments."""
        today = date.today().isoformat()
        docs = self._collection().where('user_id', '==', user_id).where('date', '==', today).stream()
        appointments = [self._deserialize(doc) for doc in docs]
        self.logger.debug('find_today: user_id=%s today=%s count=%s', user_id, today, len(appointments))
        return appointments

    def find_upcoming(self, user_id):
        """Find upcoming appointments from today."""
        today = date.today().isoformat()
        docs = self._collection().where('user_id', '==', user_id).stream()
        appointments = []
        for doc in docs:
            data = doc.to_dict()
            doc_date = data.get('date', '')
            if isinstance(doc_date, str) and doc_date >= today:
                appointments.append(self._deserialize(doc))
        self.logger.debug('find_upcoming: user_id=%s today=%s count=%s', user_id, today, len(appointments))
        return appointments
