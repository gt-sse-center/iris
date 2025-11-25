"""
IRIS API Module

This module provides REST API endpoints for the IRIS application,
enabling React frontend communication through JSON responses.
"""

import flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from iris.api.routes.config import config_bp

__all__ = ['create_api_blueprint', 'init_api_extensions', 'register_api_error_handlers']

def create_api_blueprint():
    """Create and configure the main API blueprint"""
    api_bp = flask.Blueprint('api', __name__, url_prefix='/api')
    
    # Health check endpoint
    @api_bp.route('/health')
    def health_check():
        """Health check endpoint for monitoring and load balancers"""
        try:
            # Basic health checks
            from iris.extensions import db
            
            # Check database connection
            db.session.execute('SELECT 1')
            
            # Check if React build exists (in production)
            import os
            react_build_exists = True
            if flask.current_app.config.get('SERVE_REACT_FRONTEND'):
                build_dir = flask.current_app.config.get('REACT_BUILD_DIR')
                if build_dir:
                    react_build_exists = os.path.exists(os.path.join(build_dir, 'index.html'))
            
            return flask.jsonify({
                'status': 'healthy',
                'timestamp': flask.g.get('request_start_time', 0),
                'version': '1.0.0',
                'database': 'connected',
                'frontend': 'available' if react_build_exists else 'not_built',
                'environment': flask.current_app.config.get('FLASK_ENV', 'unknown')
            }), 200
            
        except Exception as e:
            flask.current_app.logger.error(f"Health check failed: {e}")
            return flask.jsonify({
                'status': 'unhealthy',
                'error': str(e),
                'timestamp': flask.g.get('request_start_time', 0)
            }), 503
    
    # Register sub-blueprints
    api_bp.register_blueprint(config_bp, url_prefix='/config')
    
    return api_bp

def init_api_extensions(app):
    """Initialize API-specific Flask extensions"""
    # Configure JWT
    from datetime import timedelta
    app.config['JWT_SECRET_KEY'] = app.config.get('SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)  # 24 hour expiry
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return flask.jsonify({
            'error': 'Invalid token',
            'message': error_string
        }), 422
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        return flask.jsonify({
            'error': 'Missing authorization',
            'message': error_string
        }), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return flask.jsonify({
            'error': 'Token expired',
            'message': 'The token has expired'
        }), 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return flask.jsonify({
            'error': 'Token revoked',
            'message': 'The token has been revoked'
        }), 401
    
    # Configure CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173"],  # React dev servers
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    return jwt

# API error handlers
def register_api_error_handlers(app):
    """Register API-specific error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return flask.jsonify({
            'error': 'Bad Request',
            'message': str(error.description) if hasattr(error, 'description') else str(error),
            'status': 400
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return flask.jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required',
            'status': 401
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return flask.jsonify({
            'error': 'Forbidden',
            'message': 'Insufficient permissions',
            'status': 403
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return flask.jsonify({
            'error': 'Not Found',
            'message': 'Resource not found',
            'status': 404
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return flask.jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'status': 500
        }), 500