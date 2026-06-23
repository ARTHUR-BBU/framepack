"""Regression tests for Framepack loading surfaces.

These tests cover the two user-visible startup failures that hurt the
Framepack workflow on Windows:

* the deployed plugin must import/register without relying on the caller's
  PYTHONPATH containing the plugin root; and
* the unqualified ``framepack`` skill must exist as an active standalone skill
  because runbooks and startup preloads commonly request that short name.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from unittest.mock import Mock

import pytest

PLUGIN_ROOT = Path(__file__).resolve().parent.parent
DEPLOY_ROOT = Path("F:/Hermes_windows/plugins/framepack")
ACTIVE_FRAMEPACK_SKILL = Path("F:/Hermes_windows/skills/software-development/framepack/SKILL.md")


def test_source_plugin_register_imports_without_pythonpath_plugin_root(monkeypatch):
    """Hermes imports plugins by file path; hooks must still find core modules."""
    monkeypatch.setattr(sys, "path", [p for p in sys.path if Path(p or ".").resolve() != PLUGIN_ROOT.resolve()])

    spec = importlib.util.spec_from_file_location(
        "framepack_loading_regression", PLUGIN_ROOT / "__init__.py"
    )
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)

    ctx = Mock()
    ctx.register_skill = Mock()
    ctx.register_hook = Mock()
    ctx.on_tool_call = Mock()
    ctx.on_post_tool_call = Mock()
    module.register(ctx)

    registered = {call.kwargs["name"] for call in ctx.register_skill.call_args_list}
    assert "framepack" in registered
    assert "framepack-director" in registered


@pytest.mark.skipif(not DEPLOY_ROOT.exists(), reason="local Framepack deployment directory is not present")
def test_deployed_bare_framepack_skill_alias_is_present_and_synced():
    """The bare /framepack preload must resolve, not only framepack:framepack."""
    deployed_main = DEPLOY_ROOT / "skills" / "framepack" / "SKILL.md"
    assert ACTIVE_FRAMEPACK_SKILL.is_file()
    assert ACTIVE_FRAMEPACK_SKILL.read_text(encoding="utf-8") == deployed_main.read_text(encoding="utf-8")
