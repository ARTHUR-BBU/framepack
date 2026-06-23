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
