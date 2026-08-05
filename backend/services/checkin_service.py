"""Check-in/check-out service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.phase6_repository import CheckInOutRepository


class CheckInOutService:
    def __init__(self, check_repo=None):
        self.check_repo = check_repo or CheckInOutRepository()
        self.logger = get_logger(self.__class__.__name__)

    def check_in(self, data):
        from models import CheckInOut
        try:
            record = CheckInOut.create(
                appointment_id=data['appointmentId'],
                user_id=data['userId'],
                check_type=data.get('checkType', 'provider'),
                lat=data.get('lat'),
                lng=data.get('lng'),
                consent_given=data.get('consentGiven', False),
            )
            record.check_in()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.check_repo.add(record)
        return {'success': True, 'check': record.to_dict()}

    def check_out(self, appointment_id, user_id, observations='', attachments=None):
        records = self.check_repo.find_by_appointment(appointment_id)
        record = None
        for r in records:
            if r.user_id == user_id and r.status == 'checked_in':
                record = r
                break
        if not record:
            return {'success': False, 'errors': ['Check-in não encontrado']}
        try:
            record.check_out()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        if observations:
            record.add_observation(observations)
        if attachments:
            for url in attachments:
                record.add_attachment(url)
        self.check_repo.save(record)
        return {'success': True, 'check': record.to_dict()}

    def mark_no_show(self, appointment_id):
        records = self.check_repo.find_by_appointment(appointment_id)
        for r in records:
            if r.status == 'checked_in':
                return {'success': False, 'errors': ['Já foi feito check-in']}
        # Create a no-show record if none exists
        from models import CheckInOut
        record = CheckInOut.create(
            appointment_id=appointment_id,
            user_id=0,  # system
            check_type='client',
        )
        record.mark_no_show()
        self.check_repo.add(record)
        return {'success': True, 'check': record.to_dict()}

    def get_by_appointment(self, appointment_id):
        records = self.check_repo.find_by_appointment(appointment_id)
        return [r.to_dict() for r in records]
