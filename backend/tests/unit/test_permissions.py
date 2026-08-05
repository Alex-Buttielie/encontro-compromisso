import pytest

from domain.permissions import Permission, can_access


@pytest.mark.parametrize(
    ('role', 'permission'),
    [
        ('provider', Permission.MANAGE_SERVICES),
        ('provider', Permission.MANAGE_APPOINTMENTS),
        ('client', Permission.CREATE_APPOINTMENT),
        ('collaborator', Permission.MANAGE_OWN_APPOINTMENTS),
        ('admin', Permission.MANAGE_USERS),
    ],
)
def test_role_can_access_authorized_permission(role, permission):
    assert can_access(role, permission) is True


def test_client_cannot_manage_services():
    assert can_access('client', Permission.MANAGE_SERVICES) is False


def test_collaborator_cannot_manage_users():
    assert can_access('collaborator', Permission.MANAGE_USERS) is False


def test_unknown_role_is_denied():
    assert can_access('unknown', Permission.CREATE_APPOINTMENT) is False


def test_unknown_permission_is_denied():
    assert can_access('provider', 'permission_that_does_not_exist') is False
