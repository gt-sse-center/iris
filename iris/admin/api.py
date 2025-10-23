"""
JSON API endpoints for admin interface.

Provides REST API endpoints that return JSON data for the React frontend.
"""
import flask
from iris.user import requires_auth
from iris.models import User

api_bp = flask.Blueprint(
    'admin_api', __name__,
    url_prefix='/admin/api'
)


@api_bp.route('/users', methods=['GET'])
@requires_auth
def users():
    """Get list of users as JSON."""
    order_by = flask.request.args.get('order_by', 'id')
    ascending = flask.request.args.get('ascending', 'true')
    ascending = True if ascending == 'true' else False

    users = User.query
    if ascending:
        users = users.order_by(getattr(User, order_by)).all()
    else:
        users = users.order_by(getattr(User, order_by).desc()).all()

    users_json = [user.to_json() for user in users]
    
    return flask.jsonify({'users': users_json})