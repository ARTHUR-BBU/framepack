import json
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def _hook():
    ctx = MagicMock()
    from hooks.on_pre_tool_call import register
    register(ctx)
    return ctx, ctx.register_hook.call_args[0][1]


def test_preview_injects_pre_render_advisory():
    ctx, hook_fn = _hook()
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, "frame.md").write_text("# frame", encoding="utf-8")
        Path(tmpdir, "index.html").write_text("<div data-composition-id='x'></div>", encoding="utf-8")
        hook_fn(tool_name="terminal", args={"command": "npx hyperframes preview", "workdir": tmpdir})

    messages = [call.args[0] for call in ctx.inject_message.call_args_list]
    audit_messages = [m for m in messages if "Framepack Pre-render Taste Audit" in m]
    assert audit_messages
    assert "advisory" in audit_messages[-1]
    assert "render anyway" in audit_messages[-1]
    assert "BLOCK" not in audit_messages[-1].upper()


def test_render_injects_pre_render_advisory():
    ctx, hook_fn = _hook()
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, "frame.md").write_text("# frame", encoding="utf-8")
        Path(tmpdir, "index.html").write_text("<div data-composition-id='x'></div>", encoding="utf-8")
        hook_fn(tool_name="terminal", args={"command": "npx hyperframes render", "workdir": tmpdir})

    messages = [call.args[0] for call in ctx.inject_message.call_args_list]
    assert any("Framepack Pre-render Taste Audit" in m for m in messages)


def test_lint_does_not_inject_pre_render_advisory():
    ctx, hook_fn = _hook()
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, "frame.md").write_text("# frame", encoding="utf-8")
        Path(tmpdir, "index.html").write_text("<div data-composition-id='x'></div>", encoding="utf-8")
        hook_fn(tool_name="terminal", args={"command": "npx hyperframes lint", "workdir": tmpdir})

    messages = [call.args[0] for call in ctx.inject_message.call_args_list]
    assert not any("Framepack Pre-render Taste Audit" in m for m in messages)


def _write_text_dominance_project(tmpdir: str) -> None:
    Path(tmpdir, "frame.md").write_text(
        """
taste_read:
  register: product_launch
  audience: buyers
  visual_family: product-led commercial
  anti_references: [animated PPT]
""",
        encoding="utf-8",
    )
    Path(tmpdir, "index.html").write_text("<div data-composition-id='x'></div>", encoding="utf-8")
    hyper = Path(tmpdir, ".hyperframes")
    hyper.mkdir()
    hyper.joinpath("expanded-prompt.md").write_text(
        """
# Storyboard
Text: Transform your workflow with next generation intelligent automation for every team.
Text: More productivity, more clarity, more growth, more speed.
Text: Join thousands of teams today with a platform built for modern operations.
Product: none.
""",
        encoding="utf-8",
    )


def test_render_injects_taste_control_for_open_p1_taste_debt():
    ctx, hook_fn = _hook()
    with tempfile.TemporaryDirectory() as tmpdir:
        _write_text_dominance_project(tmpdir)
        hook_fn(tool_name="terminal", args={"command": "npx hyperframes render", "workdir": tmpdir})

    messages = [call.args[0] for call in ctx.inject_message.call_args_list]
    taste_messages = [m for m in messages if "Framepack Taste Control" in m]
    assert taste_messages
    assert "text_dominance" in taste_messages[-1]
    # Phase 6: message should be grouped by action, not flat list
    assert "Revise now:" in taste_messages[-1]
    assert "revise / proof / waiver" not in taste_messages[-1]


def test_render_does_not_inject_taste_control_when_matching_waiver_exists():
    ctx, hook_fn = _hook()
    with tempfile.TemporaryDirectory() as tmpdir:
        _write_text_dominance_project(tmpdir)
        fp = Path(tmpdir, ".framepack")
        fp.mkdir()
        fp.joinpath("taste-waivers.json").write_text(
            json.dumps(
                {
                    "waivers": [
                        {
                            "code": "text_dominance",
                            "reason": "Typography-led teaser approved by user for this proof cut.",
                            "approved_by": "user",
                        },
                        {
                            "code": "opening_visual_absence",
                            "reason": "Opening is intentionally typography-led for this proof cut.",
                            "approved_by": "user",
                        }
                    ]
                }
            ),
            encoding="utf-8",
        )
        hook_fn(tool_name="terminal", args={"command": "npx hyperframes render", "workdir": tmpdir})

    messages = [call.args[0] for call in ctx.inject_message.call_args_list]
    assert not any("Framepack Taste Control" in m for m in messages)


def test_lint_does_not_inject_taste_control():
    ctx, hook_fn = _hook()
    with tempfile.TemporaryDirectory() as tmpdir:
        _write_text_dominance_project(tmpdir)
        hook_fn(tool_name="terminal", args={"command": "npx hyperframes lint", "workdir": tmpdir})

    messages = [call.args[0] for call in ctx.inject_message.call_args_list]
    assert not any("Framepack Taste Control" in m for m in messages)
