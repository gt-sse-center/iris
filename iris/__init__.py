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
    # ensure default admin exists and then start the server
    # If user asked for help via the CLI, delegate to argparse to print help
    # and exit. This covers the case where the console script is bound to
    # `run_app` directly (so import-time guards may not run first).
    if any(a in ("-h", "--help") for a in sys.argv[1:]):
        parse_cmd_line(sys.argv[1:])

    create_default_admin(app)
    if args.get('production'):
        import gevent.pywsgi
        app_server = gevent.pywsgi.WSGIServer((project['host'], project['port']), app)
        print('IRIS is being served in production mode at http://{}:{}'.format(project['host'], project['port']))
        app_server.serve_forever()
    else:
        app.run(debug=project.debug, host=project['host'], port=project['port'])


def _cli_should_parse(argv):
    # Parse if the first token is a known mode, or if user requests help
    if not argv:
        return False
    if argv[0] in ("demo", "label"):
        return True
    # if help is requested anywhere on the command line, parse so argparse
    # can show the help message
    if any(a in ("-h", "--help") for a in argv):
        return True
    return False

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

# Decide whether to parse CLI args. If help is requested or the first token
# looks like an IRIS mode ('demo'/'label'), let argparse handle args. This
# allows `iris --help` to show argparse help while still avoiding accidental
# parsing of pytest flags.
if _cli_should_parse(sys.argv[1:]):
    # Pass the CLI tokens through so argparse sees '-h'/'--help' when present.
    args = parse_cmd_line(sys.argv[1:])
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
