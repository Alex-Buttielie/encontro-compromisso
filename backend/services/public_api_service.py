"""Public API service — API keys, webhooks, rate limiting, sanitization."""
import re
import time
from logger import get_logger
from domain.exceptions import DomainError, ApiError, ValidationError
from repositories.phase8_repository import ApiKeyRepository, WebhookRepository
from utils.rate_limiter import RateLimiter


# Persistent rate limiter (SQLite fallback when Redis unavailable)
_rate_limiter = RateLimiter(max_requests=100, window=60)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 100  # per window


def check_rate_limit(api_key_id):
    """Check if API key has exceeded rate limit (persisted in database)."""
    return _rate_limiter.check(str(api_key_id))


# Input sanitization
_SENSITIVE_PATTERNS = [
    re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
    re.compile(r'<iframe[^>]*>.*?</iframe>', re.IGNORECASE | re.DOTALL),
    re.compile(r'javascript:', re.IGNORECASE),
    re.compile(r'on\w+\s*=', re.IGNORECASE),
]


def sanitize_input(value):
    """Sanitize input to prevent XSS and injection."""
    if value is None:
        return None
    if isinstance(value, str):
        sanitized = value
        for pattern in _SENSITIVE_PATTERNS:
            sanitized = pattern.sub('', sanitized)
        return sanitized.strip()
    if isinstance(value, dict):
        return {k: sanitize_input(v) for k, v in value.items()}
    if isinstance(value, list):
        return [sanitize_input(v) for v in value]
    return value


class PublicApiService:
    def __init__(self, key_repo=None, webhook_repo=None):
        self.key_repo = key_repo or ApiKeyRepository()
        self.webhook_repo = webhook_repo or WebhookRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_api_key(self, user_id, name, scopes=None):
        from models import ApiKey
        try:
            key = ApiKey.create(user_id=user_id, name=name, scopes=scopes)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.key_repo.add(key)
        return {'success': True, 'apiKey': key.to_dict(include_key=True)}

    def revoke_api_key(self, user_id, key_id):
        key = self.key_repo.get_by_id(key_id)
        if not key or key.user_id != user_id:
            return {'success': False, 'errors': ['Chave não encontrada']}
        key.revoke()
        self.key_repo.save(key)
        return {'success': True, 'apiKey': key.to_dict()}

    def get_api_keys(self, user_id):
        keys = self.key_repo.find_by_user_id(user_id)
        return [k.to_dict() for k in keys]

    def authenticate(self, raw_key):
        """Authenticate an API key and return the key object if valid."""
        key = self.key_repo.find_by_key(raw_key)
        if not key or not key.is_valid():
            return None
        key.record_usage()
        self.key_repo.save(key)
        return key

    def check_scope(self, api_key, required_scope):
        if not api_key.has_scope(required_scope):
            raise ApiError(f'Escopo insuficiente: {required_scope} necessário')

    def check_rate_limit(self, api_key_id):
        return check_rate_limit(api_key_id)

    # Webhooks
    def create_webhook(self, user_id, url, events=None):
        from models import Webhook
        try:
            wh = Webhook.create(user_id=user_id, url=url, events=events)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.webhook_repo.add(wh)
        return {'success': True, 'webhook': wh.to_dict()}

    def get_webhooks(self, user_id):
        webhooks = self.webhook_repo.find_by_user_id(user_id)
        return [w.to_dict() for w in webhooks]

    def disable_webhook(self, user_id, webhook_id):
        wh = self.webhook_repo.get_by_id(webhook_id)
        if not wh or wh.user_id != user_id:
            return {'success': False, 'errors': ['Webhook não encontrado']}
        wh.disable()
        self.webhook_repo.save(wh)
        return {'success': True, 'webhook': wh.to_dict()}

    def deliver_webhook(self, webhook_id, event, payload):
        """Deliver a webhook event via HTTP with retry and exponential backoff."""
        import requests
        from datetime import datetime

        wh = self.webhook_repo.get_by_id(webhook_id)
        if not wh or not wh.matches_event(event):
            return {'success': False, 'errors': ['Webhook não encontrado ou não inscrito']}

        body = {
            'event': event,
            'payload': payload,
            'timestamp': datetime.utcnow().isoformat(),
        }
        headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
        }
        if wh.secret:
            import hashlib
            import hmac
            body_bytes = __import__('json').dumps(body).encode()
            signature = hmac.new(wh.secret.encode(), body_bytes, hashlib.sha256).hexdigest()
            headers['X-Webhook-Signature'] = signature

        max_retries = 3
        delays = [1, 2, 4]

        for attempt in range(max_retries):
            try:
                response = requests.post(
                    wh.url,
                    json=body,
                    timeout=10,
                    headers=headers,
                )
                success = 200 <= response.status_code < 300
                wh.record_delivery(status_code=response.status_code, success=success)
                self.webhook_repo.save(wh)
                return {'success': success, 'statusCode': response.status_code}
            except requests.RequestException as e:
                if attempt < max_retries - 1:
                    self.logger.info(
                        'Webhook retry %s/%s: id=%s error=%s',
                        attempt + 1, max_retries, webhook_id, str(e),
                    )
                    time.sleep(delays[attempt])
                else:
                    wh.record_delivery(status_code=0, success=False)
                    self.webhook_repo.save(wh)
                    self.logger.warning('Webhook delivery failed after %s attempts: id=%s error=%s', max_retries, webhook_id, str(e))
                    return {'success': False, 'errors': [str(e)]}

    def trigger_webhooks(self, user_id, event, payload):
        """Trigger all webhooks for a user that match the event."""
        webhooks = self.webhook_repo.find_by_user_id(user_id)
        results = []
        for wh in webhooks:
            if wh.matches_event(event) and wh.status == 'active':
                result = self.deliver_webhook(wh.id, event, payload)
                results.append({'webhookId': wh.id, 'result': result['success']})
        return results
