"""CRM application service."""
from datetime import datetime
from logger import get_logger
from domain.exceptions import DomainError
from repositories.crm_repository import ClientProfileRepository, SatisfactionSurveyRepository


class CRMService:
    def __init__(self, profile_repository=None, survey_repository=None):
        self.profile_repository = profile_repository or ClientProfileRepository()
        self.survey_repository = survey_repository or SatisfactionSurveyRepository()
        self.logger = get_logger(self.__class__.__name__)

    def get_profile(self, user_id, client_id):
        profile = self.profile_repository.get_or_create(user_id, client_id)
        return profile.to_dict()

    def get_profiles_by_user(self, user_id):
        profiles = self.profile_repository.find_by_user_id(user_id)
        return [p.to_dict() for p in profiles]

    def get_by_segment(self, user_id, segment):
        profiles = self.profile_repository.find_by_segment(user_id, segment)
        return [p.to_dict() for p in profiles]

    def get_birthdays_today(self, user_id):
        profiles = self.profile_repository.find_birthdays_today(user_id)
        return [p.to_dict() for p in profiles]

    def record_visit(self, user_id, client_id, amount):
        profile = self.profile_repository.get_or_create(user_id, client_id)
        try:
            profile.record_visit(amount)
            profile.update_segment()
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.profile_repository.save(profile)
        return {'success': True, 'profile': profile.to_dict()}

    def update_preferences(self, user_id, client_id, preferences):
        profile = self.profile_repository.get_or_create(user_id, client_id)
        profile.preferences = preferences
        self.profile_repository.save(profile)
        return {'success': True, 'profile': profile.to_dict()}

    def create_survey(self, user_id, client_id, appointment_id):
        survey = self.survey_repository.find_by_appointment_id(appointment_id)
        if survey:
            return {'success': True, 'survey': survey.to_dict(), 'replay': True}
        from models import SatisfactionSurvey
        survey = SatisfactionSurvey.create(user_id, client_id, appointment_id)
        self.survey_repository.add(survey)
        return {'success': True, 'survey': survey.to_dict()}

    def respond_survey(self, survey_id, rating, comment=''):
        survey = self.survey_repository.get_by_id(survey_id)
        if not survey:
            return {'success': False, 'errors': ['Pesquisa não encontrada']}
        try:
            survey.respond(rating, comment)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.survey_repository.save(survey)
        return {'success': True, 'survey': survey.to_dict()}

    def get_inactive_clients(self, user_id):
        return self.get_by_segment(user_id, 'inactive')

    def get_vip_clients(self, user_id):
        return self.get_by_segment(user_id, 'vip')
