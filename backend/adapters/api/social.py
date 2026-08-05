"""Flask Blueprint for social routes."""
from flask import Blueprint, request, jsonify
from logger import get_logger
from adapters.api.helpers import get_current_user_id, require_auth, paginate_list
from services.social_service import SocialService

social_bp = Blueprint('social', __name__)

social_service = SocialService()
logger = get_logger("routes.social")

@social_bp.route('/social/feed', methods=['GET'])
def social_feed():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.get_feed(user_id)
    return jsonify({'success': True, 'posts': result}), 200

@social_bp.route('/social/posts', methods=['POST'])
def create_post():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    data['userId'] = user_id
    result = social_service.create_post(data)
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@social_bp.route('/social/posts/<int:post_id>', methods=['GET', 'DELETE'])
def get_post(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'GET':
        item = social_service.get_post(post_id)
        if item:
            return jsonify({'success': True, 'post': item}), 200
        return jsonify({'success': False, 'errors': ['Não encontrado']}), 404

    result = social_service.delete_post(post_id, user_id) if hasattr(social_service, 'delete_post') else {'success': False, 'errors': ['Not implemented']}
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@social_bp.route('/social/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.like_post(post_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@social_bp.route('/social/posts/<int:post_id>/unlike', methods=['POST'])
def unlike_post(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.unlike_post(post_id, user_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@social_bp.route('/social/posts/<int:post_id>/share', methods=['POST'])
def share_post(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.share_post(post_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@social_bp.route('/social/posts/<int:post_id>/save', methods=['POST'])
def save_post(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.save_post(post_id)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@social_bp.route('/social/posts/<int:post_id>/comments', methods=['GET', 'POST'])
def post_comments(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['postId'] = post_id
        data['userId'] = user_id
        result = social_service.add_comment(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = social_service.get_comments(post_id)
    return jsonify({'success': True, 'comments': result}), 200

@social_bp.route('/social/stories', methods=['POST'])
def create_story():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    data['userId'] = user_id
    result = social_service.create_story(data)
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@social_bp.route('/social/stories', methods=['GET'])
def get_stories():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.get_stories(user_id)
    return jsonify({'success': True, 'stories': result}), 200

@social_bp.route('/social/follow', methods=['POST'])
def follow_user():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = social_service.follow_user(user_id, data.get('followingId'))
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@social_bp.route('/social/unfollow', methods=['POST'])
def unfollow_user():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    result = social_service.unfollow_user(user_id, data.get('followingId'))
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@social_bp.route('/social/followers', methods=['GET'])
def get_followers():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.get_followers(user_id)
    return jsonify({'success': True, 'followers': result}), 200

@social_bp.route('/social/following', methods=['GET'])
def get_following():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.get_following(user_id)
    return jsonify({'success': True, 'following': result}), 200

@social_bp.route('/social/reports', methods=['GET', 'POST'])
def reports():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        data['userId'] = user_id
        result = social_service.report_post(data)
        if result['success']:
            return jsonify(result), 201
        return jsonify(result), 400

    result = social_service.get_reports(user_id)
    return jsonify({'success': True, 'reports': result}), 200

@social_bp.route('/social/posts/<int:post_id>/report', methods=['POST'])
def report_post(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    data['postId'] = post_id
    data['userId'] = user_id
    result = social_service.report_post(data)
    if result['success']:
        return jsonify(result), 201
    return jsonify(result), 400

@social_bp.route('/social/moderate', methods=['POST'])
def moderate_post():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    data = request.get_json(silent=True) or {}
    data['moderatorId'] = user_id
    result = social_service.moderate_post(data)
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 400

@social_bp.route('/social/posts/<int:post_id>/moderation-logs', methods=['GET'])
def moderation_logs(post_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'errors': ['Não autorizado']}), 401

    result = social_service.get_moderation_logs(post_id)
    return jsonify({'success': True, 'logs': result}), 200
