"""TDD unit tests for Social Network domain models (Phase 5)."""
from datetime import datetime, timedelta

import pytest

from domain.enums import (
    PostType, PostStatus, PostAction, ModerationStatus,
    ReportReason, ReportStatus, StoryStatus,
)
from domain.exceptions import SocialError, ValidationError


# --- Content validation constants ---
MAX_CAPTION_LENGTH = 2000
MAX_VIDEO_DURATION_SECONDS = 90
MAX_MEDIA_SIZE_MB = 50


class TestPost:
    def test_create_photo_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Check out this smile!',
            media_url='https://storage.example.com/photo1.jpg',
            action=PostAction.SCHEDULE.value,
        )
        assert post.status == PostStatus.PUBLISHED.value
        assert post.post_type == PostType.PHOTO.value
        assert post.action == PostAction.SCHEDULE.value
        assert post.likes_count == 0
        assert post.comments_count == 0

    def test_create_video_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.VIDEO.value,
            caption='Tutorial',
            media_url='https://storage.example.com/video1.mp4',
        )
        assert post.post_type == PostType.VIDEO.value

    def test_create_reel_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.REEL.value,
            caption='Quick tip',
            media_url='https://storage.example.com/reel1.mp4',
        )
        assert post.post_type == PostType.REEL.value

    def test_create_sponsored_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.SPONSORED.value,
            caption='Promoção especial',
            media_url='https://storage.example.com/promo.jpg',
            action=PostAction.BUY.value,
            is_sponsored=True,
        )
        assert post.is_sponsored is True
        assert post.status == PostStatus.UNDER_REVIEW.value

    def test_create_post_missing_media(self):
        from models import Post
        with pytest.raises(ValidationError):
            Post.create(
                user_id=1, post_type=PostType.PHOTO.value,
                caption='No media',
            )

    def test_create_text_post_no_media_ok(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.TEXT.value,
            caption='Just text',
        )
        assert post.post_type == PostType.TEXT.value

    def test_caption_too_long(self):
        from models import Post
        with pytest.raises(ValidationError):
            Post.create(
                user_id=1, post_type=PostType.TEXT.value,
                caption='x' * (MAX_CAPTION_LENGTH + 1),
            )

    def test_like_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        post.like()
        assert post.likes_count == 1
        post.like()
        assert post.likes_count == 2

    def test_unlike_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        post.like()
        post.unlike()
        assert post.likes_count == 0

    def test_add_comment(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        post.add_comment()
        assert post.comments_count == 1

    def test_share_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        post.share()
        assert post.shares_count == 1

    def test_save_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        post.save()
        assert post.saves_count == 1

    def test_archive_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        post.archive()
        assert post.status == PostStatus.ARCHIVED.value

    def test_remove_post(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        post.remove()
        assert post.status == PostStatus.REMOVED.value

    def test_is_visible(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.PHOTO.value,
            caption='Test', media_url='url',
        )
        assert post.is_visible() is True
        post.remove()
        assert post.is_visible() is False

    def test_media_validation_antivirus(self):
        from models import Post
        with pytest.raises(ValidationError):
            Post.create(
                user_id=1, post_type=PostType.PHOTO.value,
                caption='Test',
                media_url='https://storage.example.com/eicar.exe',
            )


class TestComment:
    def test_create_comment(self):
        from models import Comment
        comment = Comment.create(
            post_id=1, user_id=2,
            content='Great post!',
        )
        assert comment.content == 'Great post!'

    def test_comment_empty_rejected(self):
        from models import Comment
        with pytest.raises(ValidationError):
            Comment.create(post_id=1, user_id=2, content='')

    def test_comment_too_long(self):
        from models import Comment
        with pytest.raises(ValidationError):
            Comment.create(post_id=1, user_id=2, content='x' * 501)


class TestStory:
    def test_create_story(self):
        from models import Story
        story = Story.create(
            user_id=1, media_url='https://storage.example.com/story1.jpg',
        )
        assert story.status == StoryStatus.ACTIVE.value
        assert story.expires_at is not None

    def test_story_missing_media(self):
        from models import Story
        with pytest.raises(ValidationError):
            Story.create(user_id=1, media_url='')

    def test_story_expired(self):
        from models import Story
        story = Story.create(
            user_id=1, media_url='url',
        )
        story.expires_at = datetime.utcnow() - timedelta(hours=1)
        assert story.is_expired() is True

    def test_story_not_expired(self):
        from models import Story
        story = Story.create(
            user_id=1, media_url='url',
        )
        assert story.is_expired() is False

    def test_remove_story(self):
        from models import Story
        story = Story.create(user_id=1, media_url='url')
        story.remove()
        assert story.status == StoryStatus.REMOVED.value


class TestFollow:
    def test_create_follow(self):
        from models import Follow
        follow = Follow.create(follower_id=1, following_id=2)
        assert follow.follower_id == 1
        assert follow.following_id == 2

    def test_follow_self_rejected(self):
        from models import Follow
        with pytest.raises(ValidationError):
            Follow.create(follower_id=1, following_id=1)

    def test_unfollow(self):
        from models import Follow
        follow = Follow.create(follower_id=1, following_id=2)
        follow.unfollow()
        assert follow.active is False


class TestReport:
    def test_create_report(self):
        from models import Report
        report = Report.create(
            post_id=1, reported_by=2,
            reason=ReportReason.SPAM.value,
            description='This is spam content',
        )
        assert report.status == ReportStatus.OPEN.value
        assert report.reason == ReportReason.SPAM.value

    def test_report_missing_reason(self):
        from models import Report
        with pytest.raises(ValidationError):
            Report.create(
                post_id=1, reported_by=2,
                reason='invalid_reason',
                description='Test',
            )

    def test_report_start_review(self):
        from models import Report
        report = Report.create(
            post_id=1, reported_by=2,
            reason=ReportReason.HARASSMENT.value,
            description='Harassment',
        )
        report.start_review()
        assert report.status == ReportStatus.REVIEWING.value

    def test_report_resolve(self):
        from models import Report
        report = Report.create(
            post_id=1, reported_by=2,
            reason=ReportReason.INAPPROPRIATE.value,
            description='Bad content',
        )
        report.start_review()
        report.resolve()
        assert report.status == ReportStatus.RESOLVED.value

    def test_report_dismiss(self):
        from models import Report
        with pytest.raises(ValidationError):
            Report.create(
                post_id=1, reported_by=2,
                reason='',
                description='Test',
            )

    def test_resolve_without_review(self):
        from models import Report
        report = Report.create(
            post_id=1, reported_by=2,
            reason=ReportReason.SPAM.value,
            description='Test',
        )
        with pytest.raises(SocialError):
            report.resolve()


class TestModeration:
    def test_moderate_approve(self):
        from models import Post, ModerationLog
        post = Post.create(
            user_id=1, post_type=PostType.SPONSORED.value,
            caption='Sponsored', media_url='url',
            is_sponsored=True,
        )
        log = ModerationLog.create(
            post_id=post.id, moderator_id=3,
            action=ModerationStatus.APPROVED.value,
            notes='Content approved',
        )
        post.moderate(ModerationStatus.APPROVED.value)
        assert post.status == PostStatus.PUBLISHED.value

    def test_moderate_reject(self):
        from models import Post
        post = Post.create(
            user_id=1, post_type=PostType.SPONSORED.value,
            caption='Bad', media_url='url',
            is_sponsored=True,
        )
        post.moderate(ModerationStatus.REJECTED.value)
        assert post.status == PostStatus.REMOVED.value

    def test_moderation_log_missing_action(self):
        from models import ModerationLog
        with pytest.raises(ValidationError):
            ModerationLog.create(
                post_id=1, moderator_id=1,
                action='', notes='Test',
            )
