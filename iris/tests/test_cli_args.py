import sys

from iris import parse_cmd_line


def test_parse_known_args_ignores_extra_tokens(monkeypatch):
    # Simulate argv with extra pytest-like tokens before a '--' separator
    argv = ['--verbose', '--k', 'something', '--', 'demo']
    # parse_cmd_line should only consider tokens after '--'
    args = parse_cmd_line(argv)
    assert args['mode'] == 'demo'


def test_parse_known_args_with_unknowns(monkeypatch):
    # simulate passing an unknown token along with proper args
    argv = ['label', 'demo/cloud-segmentation.json', '--unknown-flag']
    args = parse_cmd_line(argv)
    assert args['mode'] == 'label'
    assert args['project'].endswith('cloud-segmentation.json')
