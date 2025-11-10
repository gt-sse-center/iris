import pytest
import tempfile
import os
from iris.models import db

@pytest.fixture(scope='session')
def app():
    from iris import app as iris_app
    
    # Create a temporary database for testing
    test_db_fd, test_db_path = tempfile.mkstemp(suffix='.db')
    
    # Configure app for testing
    iris_app.config['TESTING'] = True
    iris_app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{test_db_path}'
    
    # push application context for tests that require it
    ctx = iris_app.app_context()
    ctx.push()
    
    try:
        # Create all tables in the test database
        db.create_all()
        yield iris_app
    finally:
        # Clean up
        db.drop_all()
        ctx.pop()
        os.close(test_db_fd)
        os.unlink(test_db_path)


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def clean_db(app):
    """Clean database before each test to ensure isolation."""
    with app.app_context():
        # Clear all data before each test
        db.session.remove()
        db.drop_all()
        db.create_all()
        yield
        # Clean up after test
        db.session.remove()


@pytest.fixture
def logged_in_user(app, client):
    """Create a logged-in user for testing authenticated endpoints."""
    from iris.models import User, db
    import json
    
    with app.app_context():
        # Create a test user
        user = User(id=1, name="test_user", admin=False)
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        
        # Login the user
        login_response = client.post('/user/login',
            data=json.dumps({'username': 'test_user', 'password': 'password123'}),
            content_type='application/json'
        )
        assert login_response.status_code == 200
        
        return user


@pytest.fixture
def project_snapshot():
    """Snapshot and restore the global `project` singleton from iris.project.

    Yields a dict containing the saved state. Tests may modify `project` and
    the fixture will restore the original values after the test completes.
    """
    from copy import deepcopy
    from iris.project import project

    # Keys we care about and want to snapshot/restore
    keys = [
        'image_ids', 'image_order', 'file', 'random_state',
        'config', 'debug'
    ]

    saved = {}
    for k in keys:
        saved[k] = deepcopy(getattr(project, k, None))

    try:
        yield saved
    finally:
        # restore
        for k, v in saved.items():
            setattr(project, k, deepcopy(v))
