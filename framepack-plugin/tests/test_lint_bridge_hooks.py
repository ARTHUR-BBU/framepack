"""Tests for hooks integration with warning_classifier (lint --json bridge).

TDD RED phase:
- pre_tool_call: when Agent runs `npx hyperframes lint` without --json,
  inject a reminder to use --json and redirect to .framepack/lint-output.json
- post_tool_call: when Agent runs terminal with hyperframes lint,
  after completion, classify the lint-output.json and inject a summary
"""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import MagicMock

import pytest


# ── pre_tool_call: lint --json reminder ──────────────────────────────────

class TestPreToolCallLintJsonReminder:
    """When Agent runs `npx hyperframes lint` without --json, remind them."""

    def test_warns_when_lint_without_json_flag(self):
        ctx = MagicMock()
        from hooks.on_pre_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            # Create frame.md so we don't get the frame.md warning
            Path(tmpdir, "frame.md").write_text("# frame", encoding="utf-8")
            hook_fn(
                tool_name="terminal",
                args={"command": "npx hyperframes lint", "workdir": tmpdir},
            )
            messages = [call.args[0] for call in ctx.inject_message.call_args_list]
            # Must check for the SPECIFIC lint bridge reminder, not guardrails hydration
            bridge_reminders = [m for m in messages if "Framepack Lint Bridge 提示" in m]
            assert len(bridge_reminders) >= 1, (
                f"Expected lint bridge reminder, got messages: {[m[:80] for m in messages]}"
            )

    def test_no_json_reminder_when_lint_with_json_flag(self):
        ctx = MagicMock()
        from hooks.on_pre_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            Path(tmpdir, "frame.md").write_text("# frame", encoding="utf-8")
            hook_fn(
                tool_name="terminal",
                args={
                    "command": "npx hyperframes lint --json > .framepack/lint-output.json",
                    "workdir": tmpdir,
                },
            )
            messages = [call.args[0] for call in ctx.inject_message.call_args_list]
            # Must check for the SPECIFIC lint bridge reminder, not guardrails hydration
            bridge_reminders = [m for m in messages if "Framepack Lint Bridge 提示" in m]
            assert len(bridge_reminders) == 0, (
                f"Should not remind when --json already used, got: {bridge_reminders}"
            )

    def test_no_json_reminder_for_non_lint_commands(self):
        ctx = MagicMock()
        from hooks.on_pre_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            Path(tmpdir, "frame.md").write_text("# frame", encoding="utf-8")
            hook_fn(
                tool_name="terminal",
                args={"command": "npx hyperframes render", "workdir": tmpdir},
            )
            messages = [call.args[0] for call in ctx.inject_message.call_args_list]
            bridge_reminders = [m for m in messages if "Framepack Lint Bridge 提示" in m]
            assert len(bridge_reminders) == 0


# ── post_tool_call: lint-output.json detection + classification ──────────

class TestPostToolCallLintCacheBridge:
    """When Agent runs terminal with hyperframes lint, after completion,
    detect .framepack/lint-output.json and classify it."""

    def test_classifies_lint_output_after_lint_command(self):
        """After `npx hyperframes lint --json > .framepack/lint-output.json`,
        the hook should classify findings and inject a summary."""
        ctx = MagicMock()
        from hooks.on_post_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            # Pre-create lint-output.json (simulating Agent's redirect)
            framepack_dir = Path(tmpdir, ".framepack")
            framepack_dir.mkdir()
            lint_output = {
                "ok": True,
                "errorCount": 0,
                "warningCount": 2,
                "infoCount": 0,
                "findings": [
                    {"code": "gsap_studio_edit_blocked", "severity": "warning",
                     "message": "blocked"},
                    {"code": "overlapping_gsap_tweens", "severity": "warning",
                     "message": "overlap"},
                ],
                "_meta": {"version": "0.6.99"},
            }
            (framepack_dir / "lint-output.json").write_text(
                json.dumps(lint_output), encoding="utf-8"
            )

            hook_fn(
                tool_name="terminal",
                args={
                    "command": "npx hyperframes lint --json > .framepack/lint-output.json",
                    "workdir": tmpdir,
                },
                result="",
            )

            # Verify cache file was created
            cache_path = framepack_dir / "hyperframes-findings.json"
            assert cache_path.exists(), "hyperframes-findings.json cache should be created"

            # Verify summary was injected
            messages = [call.args[0] for call in ctx.inject_message.call_args_list]
            lint_summaries = [m for m in messages if "upstream" in m.lower() or "quality" in m.lower()]
            assert len(lint_summaries) >= 1, (
                f"Expected lint summary injection, got: {[m[:80] for m in messages]}"
            )

    def test_no_action_when_no_lint_output_file(self):
        """If Agent ran lint but no lint-output.json exists, do nothing."""
        ctx = MagicMock()
        from hooks.on_post_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            hook_fn(
                tool_name="terminal",
                args={"command": "npx hyperframes lint", "workdir": tmpdir},
                result="",
            )
            cache_path = Path(tmpdir, ".framepack", "hyperframes-findings.json")
            assert not cache_path.exists()

    def test_no_action_for_non_lint_terminal_commands(self):
        """render/preview/inspect should not trigger lint classification."""
        ctx = MagicMock()
        from hooks.on_post_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            # Even if lint-output.json exists, non-lint commands shouldn't trigger
            framepack_dir = Path(tmpdir, ".framepack")
            framepack_dir.mkdir()
            (framepack_dir / "lint-output.json").write_text(
                json.dumps({"ok": True, "findings": []}), encoding="utf-8"
            )

            hook_fn(
                tool_name="terminal",
                args={"command": "npx hyperframes render", "workdir": tmpdir},
                result="",
            )
            cache_path = framepack_dir / "hyperframes-findings.json"
            assert not cache_path.exists()

    def test_summary_distinguishes_upstream_and_quality(self):
        """The injected summary should clearly separate upstream_limit from quality_issue."""
        ctx = MagicMock()
        from hooks.on_post_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            framepack_dir = Path(tmpdir, ".framepack")
            framepack_dir.mkdir()
            lint_output = {
                "ok": True,
                "warningCount": 2,
                "findings": [
                    {"code": "gsap_studio_edit_blocked", "severity": "warning",
                     "message": "blocked"},
                    {"code": "overlapping_gsap_tweens", "severity": "warning",
                     "message": "overlap"},
                ],
                "_meta": {"version": "0.6.99"},
            }
            (framepack_dir / "lint-output.json").write_text(
                json.dumps(lint_output), encoding="utf-8"
            )

            hook_fn(
                tool_name="terminal",
                args={
                    "command": "npx hyperframes lint --json > .framepack/lint-output.json",
                    "workdir": tmpdir,
                },
                result="",
            )

            messages = [call.args[0] for call in ctx.inject_message.call_args_list]
            summary = [m for m in messages if "上游" in m and "质量" in m]
            assert len(summary) >= 1, (
                f"Expected summary mentioning both 上游 and 质量, got: {[m[:80] for m in messages]}"
            )

    def test_handles_empty_findings_gracefully(self):
        """lint --json with 0 findings should still produce a clean cache."""
        ctx = MagicMock()
        from hooks.on_post_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            framepack_dir = Path(tmpdir, ".framepack")
            framepack_dir.mkdir()
            lint_output = {
                "ok": True,
                "warningCount": 0,
                "findings": [],
                "_meta": {"version": "0.6.99"},
            }
            (framepack_dir / "lint-output.json").write_text(
                json.dumps(lint_output), encoding="utf-8"
            )

            hook_fn(
                tool_name="terminal",
                args={
                    "command": "npx hyperframes lint --json > .framepack/lint-output.json",
                    "workdir": tmpdir,
                },
                result="",
            )

            cache_path = framepack_dir / "hyperframes-findings.json"
            assert cache_path.exists()
            cache = json.loads(cache_path.read_text(encoding="utf-8"))
            assert cache["classified"] == []

    def test_works_with_cd_prefix(self):
        """`cd project && npx hyperframes lint --json > .framepack/lint-output.json`
        should correctly resolve the project directory."""
        ctx = MagicMock()
        from hooks.on_post_tool_call import register
        register(ctx)
        hook_fn = ctx.register_hook.call_args[0][1]

        with tempfile.TemporaryDirectory() as tmpdir:
            base = Path(tmpdir)
            project = base / "case-project"
            framepack_dir = project / ".framepack"
            framepack_dir.mkdir(parents=True)
            lint_output = {
                "ok": True,
                "warningCount": 1,
                "findings": [
                    {"code": "gsap_studio_edit_blocked", "severity": "warning",
                     "message": "blocked"},
                ],
                "_meta": {"version": "0.6.99"},
            }
            (framepack_dir / "lint-output.json").write_text(
                json.dumps(lint_output), encoding="utf-8"
            )

            hook_fn(
                tool_name="terminal",
                args={
                    "command": "cd case-project && npx hyperframes lint --json > .framepack/lint-output.json",
                    "workdir": str(base),
                },
                result="",
            )

            cache_path = framepack_dir / "hyperframes-findings.json"
            assert cache_path.exists(), "Cache should be created in the cd target project"
