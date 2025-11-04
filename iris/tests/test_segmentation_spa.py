"""
Tests for segmentation SPA functionality.
"""
import pytest
from iris import create_app
from iris.project import project


def test_segmentation_spa_blueprint_registration():
    """Test that segmentation SPA blueprint is properly registered."""
    # Create a minimal Flask app to test blueprint registration
    import flask
    from iris.segmentation import register_segmentation_blueprints
    
    app = flask.Flask(__name__)
    register_segmentation_blueprints(app)
    
    # Check that both old and new segmentation routes exist
    routes = [rule.rule for rule in app.url_map.iter_rules()]
    
    # Should have both the original segmentation routes and the new SPA route
    assert '/segmentation/' in routes
    assert '/segmentation/next_image' in routes
    assert '/segmentation/previous_image' in routes
    
    # Check endpoints
    endpoints = [rule.endpoint for rule in app.url_map.iter_rules()]
    # Original index route should be removed, only SPA route should exist
    assert 'segmentation.index' not in endpoints
    assert 'segmentation_spa.segmentation_spa' in endpoints


def test_segmentation_spa_import():
    """Test that SPA module can be imported without errors."""
    from iris.segmentation.spa import spa_bp
    assert spa_bp is not None
    assert spa_bp.name == 'segmentation_spa'
    assert spa_bp.url_prefix == '/segmentation'