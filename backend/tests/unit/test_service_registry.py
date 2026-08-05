"""Tests for the Service Registry pattern."""
import pytest
from services.registry import get_service, reset_registry


class FakeService:
    """Test service with no dependencies."""
    instance_count = 0

    def __init__(self):
        FakeService.instance_count += 1
        self.id = FakeService.instance_count


class FakeServiceWithDeps:
    """Test service that accepts constructor args."""
    def __init__(self, repo=None, logger=None):
        self.repo = repo
        self.logger = logger


@pytest.fixture(autouse=True)
def clean_registry():
    """Reset registry before and after each test."""
    reset_registry()
    FakeService.instance_count = 0
    yield
    reset_registry()
    FakeService.instance_count = 0


class TestServiceRegistry:
    def test_get_service_returns_singleton(self):
        s1 = get_service(FakeService)
        s2 = get_service(FakeService)
        assert s1 is s2
        assert FakeService.instance_count == 1

    def test_get_service_lazy_initialization(self):
        assert FakeService.instance_count == 0
        get_service(FakeService)
        assert FakeService.instance_count == 1

    def test_get_service_with_dependencies(self):
        fake_repo = object()
        s = get_service(FakeServiceWithDeps, repo=fake_repo)
        assert s.repo is fake_repo

    def test_reset_registry_clears_instances(self):
        s1 = get_service(FakeService)
        reset_registry()
        s2 = get_service(FakeService)
        assert s1 is not s2
        assert FakeService.instance_count == 2

    def test_different_services_cached_separately(self):
        s1 = get_service(FakeService)
        s2 = get_service(FakeServiceWithDeps)
        assert s1 is not s2
        assert isinstance(s1, FakeService)
        assert isinstance(s2, FakeServiceWithDeps)
