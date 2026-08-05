"""Pytest fixtures for integration tests with Firestore."""
import pytest
import os
from app import create_app


def _clear_emulator():
    """Clear all Firestore emulator data."""
    if not os.environ.get('FIRESTORE_EMULATOR_HOST'):
        return
    from firebase_config import init_firebase
    db = init_firebase()
    for col in db.collections():
        for doc in col.stream():
            col.document(doc.id).delete()


@pytest.fixture
def app():
    """Create a Flask app for each test, with clean emulator data."""
    _clear_emulator()
    app = create_app(config_overrides={
        'TESTING': True,
        'DEBUG': False,
    })
    yield app
    _clear_emulator()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def auth_header():
    """Default Authorization header for a registered user (user_id=1)."""
    return {'Authorization': 'Bearer 1'}
