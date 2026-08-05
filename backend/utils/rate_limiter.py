"""Persistent rate limiter using Firestore as fallback when Redis is unavailable.

In production, use Redis for distributed rate limiting. This implementation
provides a persistent store that survives server restarts and works across
multiple workers sharing the same database.
"""
import time
from logger import get_logger
from database import get_db

logger = get_logger(__name__)


class RateLimiter:
    """Persistent rate limiter backed by Firestore."""

    def __init__(self, max_requests=100, window=60):
        self.max_requests = max_requests
        self.window = window

    def check(self, key):
        """Check if key is within rate limit. Returns True if allowed, False if blocked."""
        now = time.time()
        cutoff = now - self.window

        db = get_db()
        col = db.collection('rate_limits')

        # Query entries in the current window for this key
        docs = col.where('key', '==', key).stream()
        recent_docs = []
        for doc in docs:
            data = doc.to_dict()
            if data.get('timestamp', 0) >= cutoff:
                recent_docs.append(doc)

        if len(recent_docs) >= self.max_requests:
            logger.warning('Rate limit exceeded: key=%s count=%s max=%s', key, len(recent_docs), self.max_requests)
            return False

        # Register new request
        col.add({'key': key, 'timestamp': now})
        return True
