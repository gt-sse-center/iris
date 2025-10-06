import os
import sys

import pytest

from iris import project


@pytest.mark.parametrize("expr", ["max(B1)", "mean($B1) + 1"])
def test_check_band_expression_allows(expr):
    project._check_band_expression(expr)  # should not raise


@pytest.mark.parametrize(
    "bad", ["lambda x: x", "__import__('os')", "eval('1')", "a; b", "except: pass"]
)
def test_check_band_expression_forbids(bad):
    with pytest.raises(Exception):
        project._check_band_expression(bad)


def test_make_absolute_varieties(tmp_path, monkeypatch):
    # simulate a project.file location
    fake_cfg = tmp_path / "cfg.json"
    fake_cfg.write_text("{}")
    monkeypatch.setattr(project, "file", str(fake_cfg))
    # relative path
    rel = "images/img.tif"
    abs_expected = os.path.normpath(os.path.join(os.path.dirname(str(fake_cfg)), rel))
    assert project.make_absolute(rel) == abs_expected
    # nested structures
    assert project.make_absolute({"a": rel}) == {"a": abs_expected}

    # Use an absolute path that's valid on the current platform
    #   in particular, Win w/py313+ needs "//already/abs" while others "/already/abs"
    already_abs = os.path.abspath(os.path.join(os.sep, "already", "abs"))
    
    assert project.make_absolute([rel, already_abs]) == [abs_expected, already_abs]


def test_set_image_seed_reproducible(project_snapshot):
    project.image_ids = ["1", "2", "3", "4", "5"]
    project.set_image_seed(123)
    first = list(project.image_order)
    # reset and repeat
    project.set_image_seed(123)
    second = list(project.image_order)
    assert first == second
    project.set_image_seed(124)
    assert list(project.image_order) != first


@pytest.mark.parametrize(
    "fake_img,ans",
    [
        (
            {"file1": {"B1": 1, "B2": 2}, "file2": {"R": 1}},
            ["$file1.B1", "$file1.B2", "$file2.R"],
        ),
        ({"c3": 1}, ["c3"]),
        ({"file1": {"B1": 1, "B2": 2}, "C3": 3}, ["$file1.B1", "$file1.B2", "C3"]),
    ],
)
def test_get_image_bands_monkeypatched(monkeypatch, fake_img, ans):
    monkeypatch.setattr(project, "get_image", lambda image_id: fake_img)
    bands = project.get_image_bands("any")
    print(bands)
    assert bands == ans
