"""Post-write weapon enforcement gate tests.

When index.html is written/patched and a weapon-load-plan exists that selects
framepack builtin weapons, but the HTML does not call those weapon functions,
the post-write gate MUST raise a hard block — not just inject an advisory.
"""
from pathlib import Path
from unittest.mock import Mock
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def _make_project_with_plan(tmp_path: Path, html: str) -> Path:
    """Create a project with expanded-prompt + weapon-load-plan + index.html."""
    from core.weapon_matcher import match_weapons_for_prompt
    from core.weapon_load_plan import write_weapon_load_plan

    # expanded-prompt that triggers number-count-up weapon match
    prompt = "## Scene 3\nThe KPI number 120+ should count up with snap.\n"
    plan = match_weapons_for_prompt(prompt, tmp_path)
    write_weapon_load_plan(tmp_path, plan)

    (tmp_path / "index.html").write_text(html, encoding="utf-8")
    return tmp_path


def test_check_weapon_implementation_finds_missing_weapon(tmp_path):
    """HTML with bare GSAP but no weapon function → returns violations."""
    from core.weapon_enforcement import check_weapon_implementation

    _make_project_with_plan(
        tmp_path,
        "<html><body><div></div><script>gsap.to('.num',{duration:1,opacity:1})</script></body></html>",
    )

    violations = check_weapon_implementation(tmp_path)

    assert len(violations) > 0
    v = violations[0]
    assert v.weapon_id == "number-count-up"
    assert "numberCountUp" in v.message or v.function_name == "numberCountUp"


def test_check_weapon_implementation_passes_when_weapon_called(tmp_path):
    """HTML with correct weapon function call → zero violations."""
    from core.weapon_enforcement import check_weapon_implementation

    _make_project_with_plan(
        tmp_path,
        "<html><body><script>numberCountUp({target:120});</script></body></html>",
    )

    violations = check_weapon_implementation(tmp_path)

    assert violations == []


def test_check_weapon_implementation_noop_without_plan(tmp_path):
    """No weapon-load-plan → no violations (gate does not apply)."""
    from core.weapon_enforcement import check_weapon_implementation

    (tmp_path / "index.html").write_text("<html></html>", encoding="utf-8")

    violations = check_weapon_implementation(tmp_path)

    assert violations == []


def test_post_write_gate_blocks_when_weapons_missing(tmp_path):
    """post_tool_call on write_file(index.html) with missing weapons → RuntimeError."""
    from hooks.on_post_tool_call import _enforce_weapon_implementation_gate

    _make_project_with_plan(
        tmp_path,
        "<html><body><script>gsap.from('.title', {opacity:0})</script></body></html>",
    )

    ctx = Mock()
    with pytest.raises(RuntimeError, match="weapon implementation"):
        _enforce_weapon_implementation_gate(ctx, str(tmp_path / "index.html"))


def test_post_write_gate_passes_when_weapons_called(tmp_path):
    """post_tool_call on write_file(index.html) with correct weapon calls → no error."""
    from hooks.on_post_tool_call import _enforce_weapon_implementation_gate

    _make_project_with_plan(
        tmp_path,
        "<html><body><script>numberCountUp({target:120});</script></body></html>",
    )

    ctx = Mock()
    # Should not raise
    _enforce_weapon_implementation_gate(ctx, str(tmp_path / "index.html"))


def test_post_write_gate_ignores_non_html_files(tmp_path):
    """post_tool_call on non-index.html files → no gate."""
    from hooks.on_post_tool_call import _enforce_weapon_implementation_gate

    (tmp_path / "style.css").write_text("body {}", encoding="utf-8")
    ctx = Mock()
    _enforce_weapon_implementation_gate(ctx, str(tmp_path / "style.css"))
    ctx.inject_message.assert_not_called()
