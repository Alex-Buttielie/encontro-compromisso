"""Social network application service."""
from logger import get_logger
from domain.exceptions import DomainError
from repositories.social_repository import (
    PostRepository, CommentRepository, StoryRepository,
    FollowRepository, ReportRepository, ModerationLogRepository,
)


class SocialService:
    def __init__(self, post_repo=None, comment_repo=None, story_repo=None,
                 follow_repo=None, report_repo=None, mod_repo=None):
        self.post_repo = post_repo or PostRepository()
        self.comment_repo = comment_repo or CommentRepository()
        self.story_repo = story_repo or StoryRepository()
        self.follow_repo = follow_repo or FollowRepository()
        self.report_repo = report_repo or ReportRepository()
        self.mod_repo = mod_repo or ModerationLogRepository()
        self.logger = get_logger(self.__class__.__name__)

    def create_post(self, data):
        from models import Post
        try:
            post = Post.create(
                user_id=data['userId'],
                post_type=data.get('postType'),
                caption=data.get('caption', ''),
                media_url=data.get('mediaUrl'),
                action=data.get('action', 'none'),
                is_sponsored=data.get('isSponsored', False),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.post_repo.add(post)
        return {'success': True, 'post': post.to_dict()}

    def get_feed(self, user_id):
        posts = self.post_repo.find_visible(user_id)
        return [p.to_dict() for p in posts]

    def get_post(self, post_id):
        post = self.post_repo.get_by_id(post_id)
        if not post:
            return None
        return post.to_dict()

    def like_post(self, post_id, user_id):
        post = self.post_repo.get_by_id(post_id)
        if not post:
            return {'success': False, 'errors': ['Publicação não encontrada']}
        post.like()
        self.post_repo.save(post)
        return {'success': True, 'post': post.to_dict()}

    def unlike_post(self, post_id, user_id):
        post = self.post_repo.get_by_id(post_id)
        if not post:
            return {'success': False, 'errors': ['Publicação não encontrada']}
        post.unlike()
        self.post_repo.save(post)
        return {'success': True, 'post': post.to_dict()}

    def share_post(self, post_id):
        post = self.post_repo.get_by_id(post_id)
        if not post:
            return {'success': False, 'errors': ['Publicação não encontrada']}
        post.share()
        self.post_repo.save(post)
        return {'success': True, 'post': post.to_dict()}

    def save_post(self, post_id):
        post = self.post_repo.get_by_id(post_id)
        if not post:
            return {'success': False, 'errors': ['Publicação não encontrada']}
        post.save()
        self.post_repo.save(post)
        return {'success': True, 'post': post.to_dict()}

    def add_comment(self, data):
        from models import Comment
        try:
            comment = Comment.create(
                post_id=data['postId'],
                user_id=data['userId'],
                content=data.get('content'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.comment_repo.add(comment)
        post = self.post_repo.get_by_id(data['postId'])
        if post:
            post.add_comment()
            self.post_repo.save(post)
        return {'success': True, 'comment': comment.to_dict()}

    def get_comments(self, post_id):
        comments = self.comment_repo.find_by_post(post_id)
        return [c.to_dict() for c in comments]

    def create_story(self, data):
        from models import Story
        try:
            story = Story.create(
                user_id=data['userId'],
                media_url=data.get('mediaUrl'),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.story_repo.add(story)
        return {'success': True, 'story': story.to_dict()}

    def get_stories(self, user_id):
        stories = self.story_repo.find_active_by_user(user_id)
        return [s.to_dict() for s in stories]

    def follow_user(self, follower_id, following_id):
        from models import Follow
        existing = self.follow_repo.find_existing(follower_id, following_id)
        if existing and existing.active:
            return {'success': False, 'errors': ['Já está seguindo']}
        try:
            follow = Follow.create(follower_id, following_id)
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.follow_repo.add(follow)
        return {'success': True, 'follow': follow.to_dict()}

    def unfollow_user(self, follower_id, following_id):
        follow = self.follow_repo.find_existing(follower_id, following_id)
        if not follow or not follow.active:
            return {'success': False, 'errors': ['Não está seguindo']}
        follow.unfollow()
        self.follow_repo.save(follow)
        return {'success': True}

    def get_followers(self, user_id):
        follows = self.follow_repo.find_followers(user_id)
        return [f.to_dict() for f in follows]

    def get_following(self, user_id):
        follows = self.follow_repo.find_following(user_id)
        return [f.to_dict() for f in follows]

    def report_post(self, data):
        from models import Report
        try:
            report = Report.create(
                post_id=data['postId'],
                reported_by=data['userId'],
                reason=data.get('reason'),
                description=data.get('description', ''),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.report_repo.add(report)
        return {'success': True, 'report': report.to_dict()}

    def get_reports(self, user_id=None):
        reports = self.report_repo.find_open(user_id)
        return [r.to_dict() for r in reports]

    def moderate_post(self, data):
        from models import ModerationLog
        post = self.post_repo.get_by_id(data['postId'])
        if not post:
            return {'success': False, 'errors': ['Publicação não encontrada']}
        action = data.get('action')
        try:
            post.moderate(action)
            log = ModerationLog.create(
                post_id=post.id, moderator_id=data['moderatorId'],
                action=action, notes=data.get('notes', ''),
            )
        except DomainError as e:
            return {'success': False, 'errors': e.errors}
        self.post_repo.save(post)
        self.mod_repo.add(log)
        return {'success': True, 'post': post.to_dict()}

    def get_moderation_logs(self, post_id):
        logs = self.mod_repo.find_by_post(post_id)
        return [l.to_dict() for l in logs]
