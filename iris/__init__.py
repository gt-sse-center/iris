import argparse
import json
import os
import shutil
import sys
import webbrowser
from getpass import getpass
from os.path import basename, dirname, exists, isabs, join
from pathlib import Path
from typing import Union

import flask
import numpy as np
import yaml

__version__ = "1.0.0"

from iris.extensions import compress, db
from iris.project import project


def get_demo_file(example=None):
    demo_file = join(
        os.getcwd(), "demo", "cloud-segmentation.json"
    )

    return demo_file

def find_config_file(folder_path: Union[str, Path]) -> Union[Path, None]:
    """Find a suitable config file in the given folder.

    Args:
        folder_path: Path to the folder to search in

    Returns:
        Absolute path to config file as Path object, or None if not found.
        Prefers 'cloud-segmentation.json', falls back to any .json file.
    """
    folder = Path(folder_path)

    # First try cloud-segmentation.json
    cloud_seg_path = folder / "cloud-segmentation.json"
    if cloud_seg_path.exists():
        return cloud_seg_path.resolve()

    # If not found, look for any .json file that might be a config
    json_files = list(folder.glob("*.json"))
    if json_files:
        return json_files[0].resolve()

    return None

def handle_launch_command(folder_name: str) -> Path:
    """Handle the launch command - create project if needed and launch it.

    Args:
        folder_name: Name of the project folder to launch or create

    Returns:
        Absolute path to the config file as Path object

    Raises:
        ValueError: If folder_name is empty or None
        FileNotFoundError: If demo folder is missing when creating new project
        RuntimeError: If no suitable config file found or project creation fails
    """
    if not folder_name:
        raise ValueError("Launch command requires a folder name!")

    folder_path = Path.cwd() / folder_name

    if folder_path.exists():
        # Folder exists, find config file
        config_file = find_config_file(folder_path)
        if not config_file:
            raise RuntimeError(
            f"No suitable config file found in '{folder_name}'. "
            "Expected 'cloud-segmentation.json' or another .json config file."
        )
        print(f"Launching existing project '{folder_name}' with config: {config_file.name}")
        return config_file
    else:
        # Folder doesn't exist, create it from demo
        demo_path = Path.cwd() / "demo"
        if not demo_path.exists():
            raise FileNotFoundError("Demo folder not found! Cannot create new project.")

        print(f"Creating new project '{folder_name}' from demo...")
        shutil.copytree(demo_path, folder_path)

        config_file = folder_path / "cloud-segmentation.json"
        if not config_file.exists():
            raise RuntimeError("Failed to create project: cloud-segmentation.json not found in copied demo.")

        print(f"Project '{folder_name}' created successfully!")
        return config_file.resolve()

def handle_rm_command(folder_name: str) -> None:
    """Handle the rm command - remove project folder with confirmation.

    Args:
        folder_name: Name of the project folder to remove

    Raises:
        ValueError: If folder_name is empty, None, or is 'demo'

    Note:
        This function calls sys.exit(0) after completion for CLI usage.
        It prompts for user confirmation before deletion.
    """
    if not folder_name:
        raise ValueError("Remove command requires a folder name!")

    if folder_name == "demo":
        raise ValueError("Cannot remove the demo folder!")

    folder_path = Path.cwd() / folder_name

    if not folder_path.exists():
        print(f"Folder '{folder_name}' does not exist.")
        sys.exit(0)

    # Ask for confirmation
    response = input(
        f"Are you sure you want to delete the project folder '{folder_name}'? "
        "This cannot be undone. (y/N): "
    )
    if response.lower() in ['y', 'yes']:
        shutil.rmtree(folder_path)
        print(f"Project folder '{folder_name}' has been deleted.")
    else:
        print("Deletion cancelled.")

    # Exit after rm command
    sys.exit(0)

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
        choices=["demo", "label", "launch", "rm"],
        help="Specify the mode you want to start iris, can be either *label*, *demo*, *launch*, or *rm*."
    )
    parser.add_argument(
        "project", type=str, nargs='?',
        help="Path to the project configurations file (yaml or json) or folder name for launch/rm commands."
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
    elif args.mode == "launch":
        args.project = str(handle_launch_command(args.project))
    elif args.mode == "rm":
        handle_rm_command(args.project)
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
    if argv[0] in ("demo", "label", "launch", "rm"):
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
    from iris.segmentation import register_segmentation_blueprints
    register_segmentation_blueprints(app)
    from iris.admin import register_admin_blueprints
    register_admin_blueprints(app)
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
from iris.models import Action, User

with app.app_context():
    db.create_all()
    db.session.commit()

register_extensions(app)


if __name__ == '__main__':
    run_app()
