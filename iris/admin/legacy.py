"""
Legacy HTML fragment endpoints for admin interface.

These endpoints return HTML fragments during the React migration phase.
They will be removed once React components are built for all views.
"""
from collections import defaultdict
from datetime import timedelta

import flask
from iris.user import requires_auth
from iris.models import Action
from iris.project import project

legacy_bp = flask.Blueprint(
    'admin_legacy', __name__,
    url_prefix='/admin/fragments'
)


@legacy_bp.route('/actions/<type>', methods=['GET'])
@requires_auth
def actions(type):
    """Return HTML fragment for actions view (legacy during migration)."""
    order_by = flask.request.args.get('order_by', 'user_id')
    ascending = flask.request.args.get('ascending', 'true')
    ascending = True if ascending == 'true' else False

    actions = Action.query.filter_by(type=type)
    if ascending:
        actions = actions.order_by(getattr(Action, order_by)).all()
    else:
        actions = actions.order_by(getattr(Action, order_by).desc()).all()

    actions_json = [
        {**action.to_json(), 'username': action.user.name}
        for action in actions
    ]
    image_stats = {
        "processed": len(set(action.image_id for action in actions)),
        "total": len(project.image_ids)
    }

    # Return HTML fragment for legacy compatibility
    html = flask.render_template(
        'admin/actions.html', action_type=type, actions=actions_json,
        image_stats=image_stats, order_by=order_by, ascending=ascending
    )
    return html


@legacy_bp.route('/images', methods=['GET'])
@requires_auth
def images():
    """Return HTML fragment for images view (legacy during migration)."""
    order_by = flask.request.args.get('order_by', 'user_id')
    ascending = flask.request.args.get('ascending', 'true')
    ascending = True if ascending == 'true' else False

    # TODO: make this more performant by using less database calls
    images = defaultdict(dict)
    actions = Action.query.all()
    default_stats = {
        'score': 0,
        'count': 0,
        'difficulty': 0,
        'time_spent': timedelta(),
    }
    for image_id in project.image_ids:
        for action in actions:
            if action.image_id != image_id:
                continue

            if action.type not in images[image_id]:
                images[image_id][action.type] = default_stats.copy()

            images[image_id][action.type]['count'] += 1
            images[image_id][action.type]['score'] += action.score
            images[image_id][action.type]['difficulty'] += action.difficulty
            images[image_id][action.type]['time_spent'] += action.time_spent

        # Calculate the average values:
        for stats in images[image_id].values():
            stats['score'] /= stats['count']
            stats['difficulty'] /= stats['count']
            stats['time_spent'] /= stats['count']
            stats['time_spent'] = stats['time_spent'].total_seconds() / 3600.

    # Return HTML fragment for legacy compatibility
    html = flask.render_template(
        'admin/images.html', images=images, order_by=order_by, ascending=ascending
    )
    return html