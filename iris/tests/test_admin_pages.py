"""
Essential tests for admin pages functionality.
"""
import json
import pytest
from iris.models import User, db


class TestAdminPages:
    """Test core admin page functionality."""

    @pytest.fixture(autouse=True)
    def setup_users(self, app):
        """Create test users."""
        with app.app_context():
            User.query.delete()
            db.session.commit()
            
            # Regular user
            regular_user = User(id=1, name="regular_user", admin=False)
            regular_user.set_password("password123")
            db.session.add(regular_user)
            
            # Admin user
            admin_user = User(id=2, name="admin_user", admin=True)
            admin_user.set_password("admin123")
            db.session.add(admin_user)
            
            db.session.commit()

    def login_user(self, client, username, password):
        """Helper to login a user."""
        return client.post('/user/login',
            data=json.dumps({'username': username, 'password': password}),
            content_type='application/json'
        )

    def test_admin_page_loads_react_spa_for_admin_users(self, client):
        """Test that admin users get React SPA."""
        login_response = self.login_user(client, 'admin_user', 'admin123')
        assert login_response.status_code == 200
        
        response = client.get('/admin/')
        assert response.status_code == 200
        assert b'react-admin-app' in response.data
        assert b'adminApp.js' in response.data

    def test_admin_page_blocks_regular_users(self, client):
        """Test that regular users are blocked from admin pages."""
        login_response = self.login_user(client, 'regular_user', 'password123')
        assert login_response.status_code == 200
        
        response = client.get('/admin/')
        assert response.status_code == 200
        assert b'Only <b>admin</b> users can see this page' in response.data

    def test_admin_page_shows_login_for_unauthenticated_users(self, client):
        """Test that unauthenticated users see login dialog."""
        response = client.get('/admin/')
        assert response.status_code == 200
        assert b'window.onload = dialogue_login' in response.data

    def test_admin_api_users_returns_data(self, client):
        """Test that /admin/api/users returns user data for authenticated users."""
        login_response = self.login_user(client, 'admin_user', 'admin123')
        assert login_response.status_code == 200
        
        response = client.get('/admin/api/users')
        assert response.status_code == 200
        
        data = json.loads(response.data)
        assert 'users' in data
        assert len(data['users']) >= 2
        assert 'password_hash' not in data['users'][0]

    def test_admin_api_requires_authentication(self, client):
        """Test that admin API endpoints require authentication."""
        response = client.get('/admin/api/users')
        assert response.status_code in [302, 401, 403]

    def test_admin_legacy_fragments_return_html(self, client):
        """Test that legacy fragment endpoints return HTML."""
        login_response = self.login_user(client, 'admin_user', 'admin123')
        assert login_response.status_code == 200
        
        # Test actions fragment
        response = client.get('/admin/fragments/actions/segmentation')
        assert response.status_code == 200
        assert b'<' in response.data  # Contains HTML tags
        
        # Test images fragment  
        response = client.get('/admin/fragments/images')
        assert response.status_code == 200
        assert b'<' in response.data  # Contains HTML tags