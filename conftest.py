import pytest

@pytest.fixture
def app():
    from iris import app as iris_app
    # push application context for tests that require it
    ctx = iris_app.app_context()
    ctx.push()
    try:
        yield iris_app
    finally:
        ctx.pop()


@pytest.fixture
def client(app):
    return app.test_client()


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
