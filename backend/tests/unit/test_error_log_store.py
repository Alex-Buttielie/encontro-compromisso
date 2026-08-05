"""Tests for the development error log store."""
import json
import os
import pytest
from utils.error_log_store import log_error, get_errors, clear_errors


class FakeRequest:
    """Minimal request stub for testing log_error without Flask context."""

    def __init__(self, method='POST', path='/api/test', url='http://localhost/api/test',
                 remote_addr='127.0.0.1', headers=None, json_body=None):
        self.method = method
        self.path = path
        self.url = url
        self.remote_addr = remote_addr
        self.headers = headers or {'Content-Type': 'application/json'}
        self._json_body = json_body

    def get_json(self, silent=False):
        return self._json_body


@pytest.fixture(autouse=True)
def setup_dev_env(monkeypatch):
    """Ensure FLASK_DEBUG is True so logging is active."""
    monkeypatch.setenv('FLASK_DEBUG', 'True')
    clear_errors()
    yield
    clear_errors()


class TestErrorLogStore:
    """Unit tests for error_log_store."""

    def test_log_error_writes_entry(self):
        exc = ValueError('Something went wrong')
        req = FakeRequest(json_body={'key': 'value'})

        log_error(exc, req, status_code=500)

        errors, total = get_errors()
        assert total == 1
        assert errors[0]['error_type'] == 'ValueError'
        assert errors[0]['error_message'] == 'Something went wrong'
        assert errors[0]['status_code'] == 500
        assert errors[0]['request']['method'] == 'POST'
        assert errors[0]['request']['path'] == '/api/test'
        assert errors[0]['request']['body'] == {'key': 'value'}
        assert 'traceback' in errors[0]

    def test_log_error_without_request(self):
        exc = RuntimeError('No request context')

        log_error(exc, status_code=500)

        errors, total = get_errors()
        assert total == 1
        assert errors[0]['error_type'] == 'RuntimeError'
        assert 'request' not in errors[0]

    def test_get_errors_pagination(self):
        for i in range(10):
            log_error(ValueError(f'Error {i}'))

        errors, total = get_errors(limit=3, offset=0)
        assert total == 10
        assert len(errors) == 3
        # Most recent first
        assert errors[0]['error_message'] == 'Error 9'

        errors_page2, _ = get_errors(limit=3, offset=3)
        assert errors_page2[0]['error_message'] == 'Error 6'

    def test_get_errors_filter_by_type(self):
        log_error(ValueError('A'))
        log_error(TypeError('B'))
        log_error(ValueError('C'))

        errors, total = get_errors(error_type='ValueError')
        assert total == 2
        assert all(e['error_type'] == 'ValueError' for e in errors)

    def test_clear_errors(self):
        log_error(ValueError('Test'))
        errors, total = get_errors()
        assert total == 1

        clear_errors()
        errors, total = get_errors()
        assert total == 0

    def test_log_error_skipped_in_production(self, monkeypatch):
        monkeypatch.setenv('FLASK_DEBUG', 'False')
        log_error(ValueError('Should not log'))
        errors, total = get_errors()
        assert total == 0

    def test_traceback_captured(self):
        try:
            raise KeyError('missing_key')
        except KeyError as e:
            log_error(e)

        errors, _ = get_errors()
        assert 'KeyError' in errors[0]['traceback']
        assert 'missing_key' in errors[0]['traceback']
