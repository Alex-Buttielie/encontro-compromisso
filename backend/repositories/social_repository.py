"""Social network repository — Firestore adapter implementing SocialRepositoryPort."""
from logger import get_logger
from models import Post, Comment, Story, Follow, Report, ModerationLog
from repositories.base import BaseRepository
from ports import SocialRepositoryPort


class PostRepository(BaseRepository, SocialRepositoryPort):
    def __init__(self):
        super().__init__(Post)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_user_id(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_visible(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'published').stream()
        return [self._deserialize(doc) for doc in docs]

    def find_sponsored(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('is_sponsored', '==', True).where('status', '==', 'published').stream()
        return [self._deserialize(doc) for doc in docs]

    def find_under_review(self, user_id):
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'under_review').stream()
        return [self._deserialize(doc) for doc in docs]


class CommentRepository(BaseRepository):
    def __init__(self):
        super().__init__(Comment)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_post(self, post_id):
        docs = self._collection().where('post_id', '==', post_id).stream()
        return [self._deserialize(doc) for doc in docs]


class StoryRepository(BaseRepository):
    def __init__(self):
        super().__init__(Story)
        self.logger = get_logger(self.__class__.__name__)

    def find_active_by_user(self, user_id):
        from datetime import datetime
        now = datetime.utcnow().isoformat()
        docs = self._collection().where('user_id', '==', user_id).where('status', '==', 'active').stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            expires = data.get('expires_at')
            if expires:
                expires_str = expires.isoformat() if hasattr(expires, 'isoformat') else str(expires)
                if expires_str > now:
                    results.append(self._deserialize(doc))
        return results


class FollowRepository(BaseRepository):
    def __init__(self):
        super().__init__(Follow)
        self.logger = get_logger(self.__class__.__name__)

    def find_followers(self, user_id):
        docs = self._collection().where('following_id', '==', user_id).where('active', '==', True).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_following(self, user_id):
        docs = self._collection().where('follower_id', '==', user_id).where('active', '==', True).stream()
        return [self._deserialize(doc) for doc in docs]

    def find_existing(self, follower_id, following_id):
        docs = self._collection().where('follower_id', '==', follower_id).where('following_id', '==', following_id).limit(1).stream()
        for doc in docs:
            return self._deserialize(doc)
        return None


class ReportRepository(BaseRepository):
    def __init__(self):
        super().__init__(Report)
        self.logger = get_logger(self.__class__.__name__)

    def find_open(self, user_id=None):
        if user_id:
            docs = self._collection().where('status', '==', 'open').where('reported_by', '==', user_id).stream()
        else:
            docs = self._collection().where('status', '==', 'open').stream()
        return [self._deserialize(doc) for doc in docs]

    def find_by_post(self, post_id):
        docs = self._collection().where('post_id', '==', post_id).stream()
        return [self._deserialize(doc) for doc in docs]


class ModerationLogRepository(BaseRepository):
    def __init__(self):
        super().__init__(ModerationLog)
        self.logger = get_logger(self.__class__.__name__)

    def find_by_post(self, post_id):
        docs = self._collection().where('post_id', '==', post_id).stream()
        return [self._deserialize(doc) for doc in docs]
