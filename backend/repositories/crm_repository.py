"""CRM repository — Firestore adapter implementing CRMRepositoryPort."""
from logger import get_logger
from models import ClientProfile, SatisfactionSurvey
from repositories.base import BaseRepository
from ports import CRMRepositoryPort


class ClientProfileRepository(BaseRepository, CRMRepositoryPort):
    def __init__(self):
        super().__init__(ClientProfile)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_client_id(self, client_id):
        docs = self._collection().where('client_id', '==', client_id).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_segment(self, user_id, segment):
        docs = self._collection().where('user_id', '==', user_id).where('segment', '==', segment).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_birthdays_today(self, user_id):
        from datetime import datetime
        today = datetime.utcnow().date()
        docs = self._collection().where('user_id', '==', user_id).stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            birthday = data.get('birthday')
            if birthday:
                if hasattr(birthday, 'month'):
                    if birthday.month == today.month and birthday.day == today.day:
                        results.append(self._deserialize(doc))
                elif isinstance(birthday, str):
                    parts = birthday.split('-')
                    if len(parts) >= 3 and int(parts[1]) == today.month and int(parts[2]) == today.day:
                        results.append(self._deserialize(doc))
        return results

    def get_or_create(self, user_id, client_id):
        profile = self.find_by_client_id(client_id)
        if not profile:
            profile = ClientProfile.create(user_id=user_id, client_id=client_id)
            self.add(profile)
        return profile


class SatisfactionSurveyRepository(BaseRepository):
    def __init__(self):
        super().__init__(SatisfactionSurvey)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_appointment_id(self, appointment_id):
        docs = self._collection().where('appointment_id', '==', appointment_id).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]
