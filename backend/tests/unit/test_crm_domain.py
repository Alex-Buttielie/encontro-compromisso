"""TDD unit tests for CRM domain models (Phase 3)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import ClientSegment, SatisfactionStatus
from domain.exceptions import CRMError, ValidationError


class TestClientProfile:
    def test_create_client_profile(self):
        from models import ClientProfile
        profile = ClientProfile.create(
            user_id=1, client_id=1,
            preferences='Prefere atendimento pela manhã',
        )
        assert profile.segment == ClientSegment.NEW.value
        assert profile.preferences == 'Prefere atendimento pela manhã'

    def test_client_profile_starts_with_zero_stats(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        assert profile.total_visits == 0
        assert profile.total_spent == 0.0
        assert profile.average_ticket == 0.0

    def test_record_visit_updates_stats(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        profile.record_visit(100.00)
        assert profile.total_visits == 1
        assert profile.total_spent == 100.00
        assert profile.average_ticket == 100.00

    def test_record_multiple_visits_average_ticket(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        profile.record_visit(100.00)
        profile.record_visit(200.00)
        assert profile.total_visits == 2
        assert profile.total_spent == 300.00
        assert profile.average_ticket == 150.00

    def test_segment_upgrades_to_vip(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        for _ in range(10):
            profile.record_visit(100.00)
        profile.update_segment()
        assert profile.segment == ClientSegment.VIP.value

    def test_segment_becomes_inactive(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        profile.last_visit_at = datetime.utcnow() - timedelta(days=90)
        profile.update_segment()
        assert profile.segment == ClientSegment.INACTIVE.value

    def test_segment_becomes_lost(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        profile.last_visit_at = datetime.utcnow() - timedelta(days=180)
        profile.update_segment()
        assert profile.segment == ClientSegment.LOST.value

    def test_is_birthday(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        profile.birthday = datetime.utcnow().date()
        assert profile.is_birthday_today() is True

    def test_is_not_birthday(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        profile.birthday = datetime.utcnow().date() - timedelta(days=1)
        assert profile.is_birthday_today() is False

    def test_visit_frequency(self):
        from models import ClientProfile
        profile = ClientProfile.create(user_id=1, client_id=1)
        profile.record_visit(100.00)
        profile.record_visit(200.00)
        assert profile.visit_frequency == 2


class TestSatisfactionSurvey:
    def test_create_survey(self):
        from models import SatisfactionSurvey
        survey = SatisfactionSurvey.create(
            user_id=1, client_id=1, appointment_id=1,
        )
        assert survey.status == SatisfactionStatus.PENDING.value

    def test_respond_survey(self):
        from models import SatisfactionSurvey
        survey = SatisfactionSurvey.create(
            user_id=1, client_id=1, appointment_id=1,
        )
        survey.respond(rating=5, comment='Excelente atendimento')
        assert survey.status == SatisfactionStatus.RESPONDED.value
        assert survey.rating == 5
        assert survey.comment == 'Excelente atendimento'

    def test_skip_survey(self):
        from models import SatisfactionSurvey
        survey = SatisfactionSurvey.create(
            user_id=1, client_id=1, appointment_id=1,
        )
        survey.skip()
        assert survey.status == SatisfactionStatus.SKIPPED.value

    def test_respond_already_responded_rejected(self):
        from models import SatisfactionSurvey
        survey = SatisfactionSurvey.create(
            user_id=1, client_id=1, appointment_id=1,
        )
        survey.respond(rating=5, comment='Great')
        with pytest.raises(CRMError):
            survey.respond(rating=3, comment='Changed')

    def test_invalid_rating(self):
        from models import SatisfactionSurvey
        survey = SatisfactionSurvey.create(
            user_id=1, client_id=1, appointment_id=1,
        )
        with pytest.raises(ValidationError):
            survey.respond(rating=6, comment='Test')

    def test_rating_below_minimum(self):
        from models import SatisfactionSurvey
        survey = SatisfactionSurvey.create(
            user_id=1, client_id=1, appointment_id=1,
        )
        with pytest.raises(ValidationError):
            survey.respond(rating=0, comment='Test')
