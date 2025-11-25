"""
Tests for configuration API endpoints
"""

import pytest

from iris.models import User, db


@pytest.fixture
def logged_in_admin(app, client):
    """Create admin user and login via session"""
    with app.app_context():
        user = User(name='admin_test', admin=True)
        user.set_password('admin123')
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    # Login via Flask session
    with client.session_transaction() as sess:
        sess['user_id'] = user_id

    return client


def test_get_project_config_requires_auth(client):
    """Test that getting project config requires authentication"""
    response = client.get('/api/config/project')
    assert response.status_code == 401


def test_get_project_config_requires_admin(app, client):
    """Test that getting project config requires admin privileges"""
    with app.app_context():
        # Create non-admin user
        user = User(name='regular_user', admin=False)
        user.set_password('password')
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    # Login as regular user via session
    with client.session_transaction() as sess:
        sess['user_id'] = user_id

    # Try to get config
    response = client.get('/api/config/project')
    assert response.status_code == 403
    assert 'Admin privileges required' in response.json['error']


def test_get_project_config_success(logged_in_admin):
    """Test successful retrieval of project configuration"""
    response = logged_in_admin.get('/api/config/project')

    assert response.status_code == 200
    data = response.json
    assert 'config' in data
    assert 'config_file' in data

    config = data['config']
    assert 'name' in config
    assert 'images' in config
    assert 'classes' in config
    assert 'views' in config
    assert 'segmentation' in config


def test_validate_project_config_success(logged_in_admin):
    """Test configuration validation endpoint with valid config"""
    # Get current config
    response = logged_in_admin.get('/api/config/project')
    config = response.json['config']

    # Validate it
    response = logged_in_admin.post('/api/config/project/validate',
        json=config,
        content_type='application/json'
    )

    assert response.status_code == 200
    data = response.json
    assert 'valid' in data
    assert 'errors' in data
    assert 'warnings' in data


def test_validate_detects_missing_required_fields(logged_in_admin):
    """Test that validation detects missing required fields"""
    invalid_config = {
        'name': 'test',
        'images': {'path': 'test', 'shape': [512, 512]}
        # Missing classes, views, segmentation
    }

    response = logged_in_admin.post('/api/config/project/validate',
        json=invalid_config,
        content_type='application/json'
    )

    assert response.status_code == 200
    data = response.json
    assert data['valid'] is False
    assert len(data['errors']) > 0


def test_validate_detects_invalid_colour_arrays(logged_in_admin):
    """Test that validation detects invalid colour arrays"""
    config = {
        'name': 'test',
        'images': {'path': 'test/{id}.tif', 'shape': [512, 512]},
        'classes': [
            {'name': 'Test', 'colour': [255, 255]}  # Invalid: only 2 values
        ],
        'views': {'RGB': {'type': 'image', 'data': ['$B1', '$B2', '$B3']}},
        'view_groups': {},
        'segmentation': {'path': '', 'ai_model': False}
    }

    response = logged_in_admin.post('/api/config/project/validate',
        json=config,
        content_type='application/json'
    )

    assert response.status_code == 200
    data = response.json
    assert data['valid'] is False
    assert any('colour' in err.lower() for err in data['errors'])
