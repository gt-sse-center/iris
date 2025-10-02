import argparse
import json
from getpass import getpass
from os.path import basename, dirname, exists, isabs, join
import os
import sys
import webbrowser

import flask
import numpy as np
import yaml

from iris.extensions import db, compress
from iris.project import project

def get_demo_file(example=None):
    demo_file = join(
        os.getcwd(), "demo", "cloud-segmentation.json"
    )

    return demo_file

def parse_cmd_line(argv=None):
    """Parse application arguments.

    If argv is None, this reads from sys.argv; if a '--' separator is present
    the parser will only consider tokens after '--' (convention for separating
    tool args from app args).
    """
    # Only consider tokens after `--` if present
    tokens = [] if argv is None else argv
    if '--' in tokens:
        tokens = tokens[tokens.index('--') + 1:]
    argv = tokens

    # Parse the application-specific tokens
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "mode", type=str,
        choices=["demo", "label"],
        help="Specify the mode you want to start iris, can be either *label* or *demo*."
    )
    parser.add_argument(
        "project", type=str, nargs='?',
        help="Path to the project configurations file (yaml or json)."
    )
    parser.add_argument(
        "-d", "--debug", action="store_true",
        help="start the app in debug mode"
    )
    parser.add_argument(
        "-p","--production", action="store_true",
        help="Use production WSGI server")

    # parse_known_args returns (known_args, unknown_args). Unknown args are
    # ignored so that external test runners (pytest) flags won't break parsing.
    args, unknown = parser.parse_known_args(argv)
    if unknown:
        # optional: surface ignored tokens for debugging
        print(f"[iris] Ignoring unknown CLI tokens: {unknown}")

    if args.mode == "demo":
        args.project = get_demo_file()
    elif args.mode == "label":
        if not args.project:
            raise Exception("Label mode require a project file!")
    else:
        raise Exception(f"Unknown mode '{args.mode}'!")

    return vars(args)

def run_app():
    create_default_admin(app)
    if args['production']:
        import gevent.pywsgi
        app_server = gevent.pywsgi.WSGIServer((project['host'], project['port']), app)
        print('IRIS is being served in production mode at http://{}:{}'.format(project['host'], project['port']))
        app_server.serve_forever()
    else:
        app.run(debug=project.debug, host=project['host'], port=project['port'])

def create_app(project_file, args):
    project.load_from(project_file)
    project.debug = args['debug']


    # Create the flask app:
    app = flask.Flask(__name__)

    app.config.from_pyfile('config.py')
    app.config['SQLALCHEMY_DATABASE_URI'] = \
        'sqlite:///' + join(project['path'], 'iris.db')

    # Register the extensions:
    db.init_app(app)
    compress.init_app(app)

    return app

def create_default_admin(app):
    # Add a default admin account:
    with app.app_context():
        admin = User.query.filter_by(name='admin').first()
    if admin is not None:
        return

    print('Welcome to IRIS! No admin user was detected so please enter a new admin password.')
    password_again = None
    password_valid = False
    while not password_valid:
        password = getpass('New admin password: ')
        if password=='' or ' ' in password:
            print('Password cannot be blank, and must not contain a space.')
        else:
            password_valid = True

    while password != password_again:
        password_again = getpass('Retype admin password: ')

    admin = User(
        name='admin',
        admin=True,
    )
    admin.set_password(password)
    with app.app_context():
        db.session.add(admin)
        db.session.commit()

def register_extensions(app):
    
    from iris.main import main_app
    app.register_blueprint(main_app)
    from iris.segmentation import segmentation_app
    app.register_blueprint(segmentation_app, url_prefix="/segmentation")
    from iris.admin import admin_app
    app.register_blueprint(admin_app, url_prefix="/admin")
    from iris.help import help_app
    app.register_blueprint(help_app, url_prefix="/help")
    from iris.user import user_app
    app.register_blueprint(user_app, url_prefix="/user")

# Only parse sys.argv for the application if the first CLI token looks like
# an IRIS mode (the CLI expects `demo` or `label`). This prevents test
# runners (pytest) or other tools that pass unrelated args from confusing
# the app when the module is imported during test runs.
if len(sys.argv) > 1 and sys.argv[1] in ("demo", "label"):
    args = parse_cmd_line()
else:
    # Default args used when importing the module in non-CLI contexts
    # (tests, imports). Keep keys that other functions expect.
    args = {
        'debug': False,
        'production': False,
    }
    args['project'] = get_demo_file()

app = create_app(args['project'], args)
from iris.models import User, Action

with app.app_context():
    db.create_all()
    db.session.commit()

register_extensions(app)


if __name__ == '__main__':
    run_app()
