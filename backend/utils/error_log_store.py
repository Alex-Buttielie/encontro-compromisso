"""Structured error log store for development.

Captures errors with full context (request, traceback, user) into a
JSONL file so developers can inspect and share them for fixing.
Only active when FLASK_DEBUG=True.
"""
import json
import os
import traceback
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

_lock = Lock()
_log_dir = Path(__file__).parent.parent / 'logs'
_log_file = _log_dir / 'error_log.jsonl'


def _is_dev():
    return os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 'yes')


def log_error(exc, request=None, status_code=500, extra=None):
    """Persist a structured error entry to the JSONL log file.

    Args:
        exc: The exception instance.
        request: Flask request object (optional, for context).
        status_code: HTTP status code returned to client.
        extra: Dict with additional context (e.g. service name).
    """
    if not _is_dev():
        return

    _log_dir.mkdir(exist_ok=True)

    entry = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'status_code': status_code,
        'error_type': type(exc).__name__,
        'error_message': str(exc),
        'traceback': ''.join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
    }

    if request is not None:
        entry['request'] = {
            'method': getattr(request, 'method', None),
            'path': getattr(request, 'path', None),
            'url': getattr(request, 'url', None),
            'ip': getattr(request, 'remote_addr', None),
            'headers': {
                k: v for k, v in getattr(request, 'headers', {}).items()
                if k.lower() in ('authorization', 'content-type', 'user-agent')
            },
            'body': None,
        }
        try:
            body = request.get_json(silent=True)
            if body:
                entry['request']['body'] = body
        except Exception:
            pass
        try:
            from adapters.api.helpers import get_current_user_id
            entry['request']['user_id'] = get_current_user_id()
        except Exception:
            entry['request']['user_id'] = None

    if extra:
        entry['extra'] = extra

    with _lock:
        with open(_log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry, ensure_ascii=False, default=str) + '\n')


def get_errors(limit=50, offset=0, error_type=None):
    """Read error entries from the JSONL log file.

    Returns a list of error dicts, most recent first.
    """
    if not _log_file.exists():
        return [], 0

    entries = []
    with _lock:
        with open(_log_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                    if error_type and entry.get('error_type') != error_type:
                        continue
                    entries.append(entry)
                except json.JSONDecodeError:
                    continue

    entries.reverse()
    total = len(entries)
    paged = entries[offset:offset + limit]
    return paged, total


def clear_errors():
    """Remove all stored error entries."""
    with _lock:
        if _log_file.exists():
            _log_file.unlink()
