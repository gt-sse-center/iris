import subprocess
import sys

from iris import parse_cmd_line


def test_parse_known_args_ignores_extra_tokens(monkeypatch):
    # Simulate argv with extra pytest-like tokens before a '--' separator
    argv = ["--verbose", "--k", "something", "--", "demo"]
    # parse_cmd_line should only consider tokens after '--'
    args = parse_cmd_line(argv)
    assert args["mode"] == "demo"


def test_parse_known_args_with_unknowns(monkeypatch):
    # simulate passing an unknown token along with proper args
    argv = ["label", "demo/cloud-segmentation.json", "--unknown-flag"]
    args = parse_cmd_line(argv)
    assert args["mode"] == "label"
    assert args["project"].endswith("cloud-segmentation.json")


def test_help_prints_usage_and_exits_zero():
    # Run a small script that imports parse_cmd_line and calls it with --help
    script = (
        "from iris import parse_cmd_line;" "import sys;" "sys.argv=['iris','--help'];" "parse_cmd_line(sys.argv[1:])"
    )

    proc = subprocess.run([sys.executable, "-c", script], capture_output=True, text=True)

    # argparse prints usage/help and exits with SystemExit(0)
    out = (proc.stdout or "") + (proc.stderr or "")
    assert proc.returncode == 0, f"Help exited with non-zero: {proc.returncode}\nOUT:\n{out}"
    assert "usage" in out.lower(), f"Help output did not contain 'usage':\n{out}"
