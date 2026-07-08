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


REAL_NUMBER_COUNT_HTML = """<html><body><script src="parts/references/number-count-up.js"></script>
<script>numberCountUp({target:'#metric', duration:1.2});</script></body></html>"""


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


def test_weapon_violations_emit_hard_stop_intervention_events(tmp_path):
    """Weapon business findings become reusable Intervention hard stops."""
    from core.weapon_enforcement import check_weapon_implementation, intervention_events_for_weapon_violations

    _make_project_with_plan(
        tmp_path,
        "<html><body><script>gsap.to('.num',{duration:1,opacity:1})</script></body></html>",
    )
    violations = check_weapon_implementation(tmp_path)

    events = intervention_events_for_weapon_violations(violations)

    assert len(events) == 1
    event = events[0]
    assert event.department == "weapon"
    assert event.code == "weapon_not_called"
    assert event.severity == "hard_stop"
    assert event.required_action == "load_weapon"
    assert event.artifact == "index.html"
    assert "numberCountUp" in event.acceptance


def test_check_weapon_implementation_passes_when_weapon_called(tmp_path):
    """HTML with loaded weapon script and concrete params → zero violations."""
    from core.weapon_enforcement import check_weapon_implementation

    _make_project_with_plan(tmp_path, REAL_NUMBER_COUNT_HTML)

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

    injected = ctx.inject_message.call_args.args[0]
    assert "hard_stop" in injected
    assert "load_weapon" in injected
    assert "weapon_not_called" in injected


def test_post_write_gate_passes_when_weapons_called_and_writes_receipt(tmp_path):
    """post_tool_call on index.html with real weapon usage → no error + fresh receipt."""
    from core.weapon_enforcement import is_weapon_enforcement_receipt_current
    from hooks.on_post_tool_call import _enforce_weapon_implementation_gate

    _make_project_with_plan(tmp_path, REAL_NUMBER_COUNT_HTML)

    ctx = Mock()
    _enforce_weapon_implementation_gate(ctx, str(tmp_path / "index.html"))

    ok, reason = is_weapon_enforcement_receipt_current(tmp_path)
    assert ok, reason


def test_post_write_gate_ignores_non_html_files(tmp_path):
    """post_tool_call on non-index.html files → no gate."""
    from hooks.on_post_tool_call import _enforce_weapon_implementation_gate

    (tmp_path / "style.css").write_text("body {}", encoding="utf-8")
    ctx = Mock()
    _enforce_weapon_implementation_gate(ctx, str(tmp_path / "style.css"))
    ctx.inject_message.assert_not_called()


def test_weapon_enforcement_receipt_goes_stale_when_index_changes(tmp_path):
    from core.weapon_enforcement import is_weapon_enforcement_receipt_current
    from hooks.on_post_tool_call import _enforce_weapon_implementation_gate

    _make_project_with_plan(tmp_path, REAL_NUMBER_COUNT_HTML)
    _enforce_weapon_implementation_gate(Mock(), str(tmp_path / "index.html"))
    ok, reason = is_weapon_enforcement_receipt_current(tmp_path)
    assert ok, reason

    (tmp_path / "index.html").write_text("<html><script>numberCountUp({});</script></html>", encoding="utf-8")

    ok, reason = is_weapon_enforcement_receipt_current(tmp_path)
    assert not ok
    assert "sha" in reason.lower() or "stale" in reason.lower()


def test_pre_render_gate_blocks_stale_weapon_receipt(tmp_path):
    from hooks.on_pre_tool_call import _enforce_weapon_receipt_before_render
    from hooks.on_post_tool_call import _enforce_weapon_implementation_gate

    _make_project_with_plan(tmp_path, REAL_NUMBER_COUNT_HTML)
    _enforce_weapon_implementation_gate(Mock(), str(tmp_path / "index.html"))
    (tmp_path / "index.html").write_text("<html><script>numberCountUp({});</script></html>", encoding="utf-8")

    ctx = Mock()
    with pytest.raises(RuntimeError, match="weapon enforcement receipt"):
        _enforce_weapon_receipt_before_render(ctx, str(tmp_path))
