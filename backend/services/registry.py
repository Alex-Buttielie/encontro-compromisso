"""Service Registry pattern.

Centralizes service instantiation so route handlers don't each
create their own service instances. Services are lazily initialized
on first access and cached as singletons within the registry.

Usage in route handlers:
    from services.registry import get_service
    client_service = get_service(ClientService)
    result = client_service.create_client(data)
"""
from logger import get_logger

_registry = {}
_logger = get_logger('ServiceRegistry')


def get_service(service_cls, *args, **kwargs):
    """Get or create a singleton service instance by class.

    If the service class has not been instantiated yet, it will be
    created with the provided args/kwargs and cached. Subsequent
    calls return the cached instance, ignoring additional args.

    Args:
        service_cls: The service class to instantiate.
        *args, **kwargs: Constructor arguments (used only on first call).

    Returns:
        The singleton instance of the service.
    """
    if service_cls not in _registry:
        _registry[service_cls] = service_cls(*args, **kwargs)
        _logger.debug('Service registered: %s', service_cls.__name__)
    return _registry[service_cls]


def reset_registry():
    """Clear all cached service instances.

    Useful for testing to ensure a clean state between tests.
    """
    _registry.clear()
    _logger.debug('Service registry cleared')
