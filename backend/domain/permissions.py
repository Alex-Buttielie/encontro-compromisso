from enum import Enum


class Permission(str, Enum):
    CREATE_APPOINTMENT = 'appointment:create'
    MANAGE_OWN_APPOINTMENTS = 'appointment:manage_own'
    MANAGE_APPOINTMENTS = 'appointment:manage'
    MANAGE_SERVICES = 'service:manage'
    MANAGE_CLIENTS = 'client:manage'
    MANAGE_FINANCE = 'finance:manage'
    MANAGE_USERS = 'user:manage'
    MANAGE_TENANT = 'tenant:manage'


ROLE_PERMISSIONS = {
    'client': frozenset({
        Permission.CREATE_APPOINTMENT,
    }),
    'provider': frozenset({
        Permission.MANAGE_APPOINTMENTS,
        Permission.MANAGE_SERVICES,
        Permission.MANAGE_CLIENTS,
        Permission.MANAGE_FINANCE,
        Permission.MANAGE_TENANT,
    }),
    'collaborator': frozenset({
        Permission.MANAGE_OWN_APPOINTMENTS,
    }),
    'admin': frozenset(Permission),
}


def can_access(role, permission):
    try:
        normalized_permission = permission if isinstance(permission, Permission) else Permission(permission)
    except ValueError:
        return False

    return normalized_permission in ROLE_PERMISSIONS.get(role, frozenset())
