"""
JSON API endpoints for segmentation interface.

Provides REST API endpoints that return JSON data for the React frontend.
"""
import flask
import json
from iris.user import requires_auth
from iris.project import project

api_bp = flask.Blueprint(
    'segmentation_api', __name__,
    url_prefix='/segmentation/api'
)


@api_bp.route('/user-config', methods=['GET'])
@requires_auth
def get_user_config():
    """Get current user configuration as JSON."""
    user_id = flask.session['user_id']
    config = project.get_user_config(user_id)
    all_bands = project.get_image_bands(project.image_ids[0])

    # If no specific bands set for model, use all bands:
    if config['segmentation']['ai_model']['bands'] is None:
        config['segmentation']['ai_model']['bands'] = all_bands

    return flask.jsonify({
        'config': config,
        'all_bands': all_bands
    })


@api_bp.route('/user-config', methods=['POST'])
@requires_auth
def save_user_config():
    """Save user configuration."""
    user_id = flask.session['user_id']
    user_config = json.loads(flask.request.data)
    
    project.save_user_config(user_id, user_config)
    
    return flask.jsonify({'message': 'Saved user config successfully!'})