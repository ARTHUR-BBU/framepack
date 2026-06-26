"""Tests for context hydrator — workbench-wide AGENTS.md/CLAUDE.md sync."""

from __future__ import annotations

from pathlib import Path

from core.context_hydrator import (
    ContextFileStatus,
    ContextSyncReport,
    check_context_sync,
    hydrate_context,
    ensure_workbench_root_agents,
    find_workbench_root,
    collect_context_files,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _make_plugin_dir(tmp_path: Path) -> Path:
    """Create a fake plugin directory with guardrails.md + plugin.yaml."""
    plugin = tmp_path / "_plugin"
    plugin.mkdir()
    (plugin / "plugin.yaml").write_text(
        'name: framepack\nversion: "0.16.0"\n', encoding="utf-8"
    )
    (plugin / "guardrails.md").write_text(
        "# Guardrails\n\n- rule one\n- rule two\n", encoding="utf-8"
    )
    return plugin


def _make_workbench(tmp_path: Path) -> Path:
    """Create a fake workbench root."""
    wb = tmp_path / "workbench"
    wb.mkdir()
    # WORKBENCH.md content doesn't match any stale Framepack patterns
    (wb / "WORKBENCH.md").write_text("# Test Workbench\n\nNothing stale here.\n", encoding="utf-8")
    (wb / "cases").mkdir()
    return wb


# ---------------------------------------------------------------------------
# find_workbench_root
# ---------------------------------------------------------------------------

class TestFindWorkbenchRoot:
    def test_finds_by_workbench_md(self, tmp_path):
        wb = _make_workbench(tmp_path)
        case = wb / "cases" / "my-case"
        case.mkdir()
        result = find_workbench_root(case)
        assert result == wb.resolve()

    def test_finds_from_root_itself(self, tmp_path):
        wb = _make_workbench(tmp_path)
        result = find_workbench_root(wb)
        assert result == wb.resolve()

    def test_finds_by_agents_plus_cases(self, tmp_path):
        wb = tmp_path / "wb2"
        wb.mkdir()
        (wb / "AGENTS.md").write_text("# agents\n", encoding="utf-8")
        (wb / "cases").mkdir()
        result = find_workbench_root(wb)
        assert result == wb.resolve()

    def test_none_if_not_workbench(self, tmp_path):
        bare = tmp_path / "bare"
        bare.mkdir()
        result = find_workbench_root(bare)
        assert result is None


# ---------------------------------------------------------------------------
# collect_context_files
# ---------------------------------------------------------------------------

class TestCollectContextFiles:
    def test_collects_root_agents(self, tmp_path):
        wb = _make_workbench(tmp_path)
        (wb / "AGENTS.md").write_text("# agents\n", encoding="utf-8")
        files = collect_context_files(wb)
        names = [f.name for f in files]
        assert "AGENTS.md" in names

    def test_collects_case_agents(self, tmp_path):
        wb = _make_workbench(tmp_path)
        case = wb / "cases" / "video-01"
        case.mkdir()
        (case / "AGENTS.md").write_text("# case\n", encoding="utf-8")
        files = collect_context_files(wb)
        case_files = [f for f in files if "video-01" in str(f)]
        assert len(case_files) >= 1

    def test_includes_claude_md(self, tmp_path):
        wb = _make_workbench(tmp_path)
        (wb / "CLAUDE.md").write_text("# claude\n", encoding="utf-8")
        files = collect_context_files(wb)
        names = [f.name for f in files]
        assert "CLAUDE.md" in names


# ---------------------------------------------------------------------------
# check_context_sync — stale detection
# ---------------------------------------------------------------------------

class TestCheckContextSync:
    def test_stale_agents_detected(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        # Stale AGENTS.md — old version, no managed block
        (wb / "AGENTS.md").write_text(
            "# Framepack Agent Guide\n<!-- version: 0.11.0 -->\n",
            encoding="utf-8",
        )
        report = check_context_sync(wb, plugin)
        assert not report.project_context_current
        assert len(report.stale_files) > 0
        assert any("0.11.0" in s for s in report.stale_files)

    def test_current_managed_block_not_stale(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        # Build a current managed block
        from hooks.guardrails import build_guardrails_payload, build_managed_block
        payload = build_guardrails_payload(plugin)
        (wb / "AGENTS.md").write_text(
            "# My rules\n\n" + payload.block + "\n", encoding="utf-8"
        )
        report = check_context_sync(wb, plugin)
        assert report.project_context_current
        assert len(report.stale_files) == 0

    def test_missing_file_not_stale(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        # No AGENTS.md at all
        report = check_context_sync(wb, plugin)
        # Missing files shouldn't cause stale; they just don't exist
        assert report.project_context_current

    def test_case_level_stale(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        case = wb / "cases" / "video-x"
        case.mkdir()
        (case / "AGENTS.md").write_text(
            "# Case\n<!-- version: 0.14.0 -->\n", encoding="utf-8"
        )
        report = check_context_sync(wb, plugin)
        assert not report.project_context_current
        assert any("video-x" in s for s in report.stale_files)

    def test_records_detected_version(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        (wb / "AGENTS.md").write_text(
            "# Framepack\n<!-- version: 0.12.0 -->\n", encoding="utf-8"
        )
        report = check_context_sync(wb, plugin)
        agents_status = [f for f in report.files if f.path.endswith("AGENTS.md") and "workbench" in f.path][0]
        assert agents_status.detected_version == "0.12.0"


# ---------------------------------------------------------------------------
# hydrate_context — writes
# ---------------------------------------------------------------------------

class TestHydrateContext:
    def test_ensure_workbench_root_agents_creates_missing_root_agents_from_case(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        root_agents = wb / "AGENTS.md"
        root_agents.unlink(missing_ok=True)
        case = wb / "cases" / "video-01"
        case.mkdir()

        result = ensure_workbench_root_agents(case, plugin)

        assert result is not None
        assert result.changed is True
        assert result.action == "created"
        content = root_agents.read_text(encoding="utf-8")
        assert "FRAMEPACK MANAGED BLOCK" in content
        assert "0.16.0" in content

    def test_ensure_workbench_root_agents_noops_when_current(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        from hooks.guardrails import build_guardrails_payload
        payload = build_guardrails_payload(plugin)
        root_agents = wb / "AGENTS.md"
        root_agents.write_text("# User rules\n\n" + payload.block, encoding="utf-8")
        before = root_agents.read_text(encoding="utf-8")

        result = ensure_workbench_root_agents(wb, plugin)

        assert result is not None
        assert result.changed is False
        assert root_agents.read_text(encoding="utf-8") == before

    def test_ensure_workbench_root_agents_updates_stale_block_preserving_user_content(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        stale_plugin = tmp_path / "_stale_plugin"
        stale_plugin.mkdir()
        (stale_plugin / "plugin.yaml").write_text(
            'name: framepack\nversion: "0.14.0"\n', encoding="utf-8"
        )
        (stale_plugin / "guardrails.md").write_text("# Old Guardrails\n", encoding="utf-8")
        from hooks.guardrails import build_guardrails_payload
        stale_payload = build_guardrails_payload(stale_plugin)
        root_agents = wb / "AGENTS.md"
        root_agents.write_text(
            "# User rules before\n\n"
            "Keep this paragraph.\n\n"
            f"{stale_payload.block}"
            "\n# User rules after\n\n"
            "Keep this footer.\n",
            encoding="utf-8",
        )

        result = ensure_workbench_root_agents(wb, plugin)
        content = root_agents.read_text(encoding="utf-8")

        assert result is not None
        assert result.changed is True
        assert result.action == "updated"
        assert "version=0.16.0" in content
        assert "version=0.14.0" not in content
        assert "# User rules before" in content
        assert "Keep this paragraph." in content
        assert "# User rules after" in content
        assert "Keep this footer." in content

    def test_appends_managed_block_to_stale(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        (wb / "AGENTS.md").write_text(
            "# Old rules\n<!-- version: 0.11.0 -->\n", encoding="utf-8"
        )
        report = hydrate_context(wb, plugin)
        # After hydration, managed block should be present
        agents = (wb / "AGENTS.md").read_text(encoding="utf-8")
        assert "FRAMEPACK MANAGED BLOCK" in agents
        assert "0.16.0" in agents
        # Original content preserved
        assert "# Old rules" in agents

    def test_writes_context_sync_md(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        (wb / "AGENTS.md").write_text("# rules\n", encoding="utf-8")
        hydrate_context(wb, plugin)
        sync_md = wb / ".framepack" / "context-sync.md"
        assert sync_md.is_file()
        content = sync_md.read_text(encoding="utf-8")
        assert "version: 0.16.0" in content

    def test_context_sync_current_after_hydrate(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        # User content that doesn't match stale Framepack patterns
        (wb / "AGENTS.md").write_text(
            "# My Workbench Rules\n\nJust my rules.\n", encoding="utf-8"
        )
        report = hydrate_context(wb, plugin)
        assert report.project_context_current

    def test_preserves_user_content(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        original = "# My Custom Rules\n\nThis is my project.\n\nDon't touch this.\n"
        (wb / "AGENTS.md").write_text(original, encoding="utf-8")
        hydrate_context(wb, plugin)
        content = (wb / "AGENTS.md").read_text(encoding="utf-8")
        assert "# My Custom Rules" in content
        assert "Don't touch this." in content
        assert "FRAMEPACK MANAGED BLOCK" in content


# ---------------------------------------------------------------------------
# Stale body detection (managed block present but old body remains)
# ---------------------------------------------------------------------------

class TestStaleBodyDetection:
    """Tests for detecting old Framepack guide body above managed block."""

    def test_stale_body_detected_with_current_block(self, tmp_path):
        """AGENTS.md has current managed block BUT body still says 0.11.0."""
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        from hooks.guardrails import build_guardrails_payload
        payload = build_guardrails_payload(plugin)

        old_body = (
            "# Framepack Agent Guide\n\n"
            "<!-- version: 0.11.0 — sync with plugin.yaml and README -->\n\n"
            "Framepack is a Prompt Factory for HyperFrames.\n\n"
            "## Product Spine\n\n用户模糊意图 → Framepack 创意引擎\n\n"
        )
        (wb / "AGENTS.md").write_text(
            old_body + "\n" + payload.block, encoding="utf-8"
        )
        report = check_context_sync(wb, plugin)
        assert not report.project_context_current
        agents_status = [f for f in report.files if f.path.endswith("AGENTS.md")][0]
        assert agents_status.action_needed == "replace_stale_body"

    def test_stale_body_strips_old_guide(self, tmp_path):
        """Hydrate should strip old Framepack guide body."""
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        from hooks.guardrails import build_guardrails_payload
        payload = build_guardrails_payload(plugin)

        old_body = (
            "# Framepack Agent Guide\n\n"
            "<!-- version: 0.11.0 — sync with plugin.yaml and README -->\n\n"
            "Framepack is a Prompt Factory for HyperFrames.\n\n"
            "## Product Spine\n\n用户模糊意图 → Framepack 创意引擎\n\n"
        )
        # User content BEFORE the old guide
        user_content = "# My Test Workbench\n\nThis is my test bench.\n"
        (wb / "AGENTS.md").write_text(
            user_content + "\n" + old_body + "\n" + payload.block,
            encoding="utf-8",
        )

        hydrate_context(wb, plugin)
        content = (wb / "AGENTS.md").read_text(encoding="utf-8")

        # Old guide content should be gone
        assert "Prompt Factory" not in content
        assert "0.11.0" not in content
        assert "创意引擎" not in content
        assert "Framepack Agent Guide" not in content
        # User content should survive
        assert "My Test Workbench" in content
        assert "This is my test bench" in content
        # Managed block should survive
        assert "FRAMEPACK MANAGED BLOCK" in content
        assert "0.16.0" in content


# ---------------------------------------------------------------------------
# WORKBENCH.md scanning
# ---------------------------------------------------------------------------

class TestWorkbenchMdScanning:
    """Tests for WORKBENCH.md being included in context scan."""

    def test_workbench_md_in_file_list(self, tmp_path):
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        (wb / "WORKBENCH.md").write_text("# Workbench\n", encoding="utf-8")
        report = check_context_sync(wb, plugin)
        wb_files = [f for f in report.files if "WORKBENCH.md" in f.path]
        assert len(wb_files) >= 1

    def test_workbench_md_no_managed_block_flagged(self, tmp_path):
        """WORKBENCH.md without managed block should be flagged for append."""
        plugin = _make_plugin_dir(tmp_path)
        wb = _make_workbench(tmp_path)
        (wb / "WORKBENCH.md").write_text("# My Workbench\n", encoding="utf-8")
        # Also add AGENTS.md so it's a valid workbench
        (wb / "AGENTS.md").write_text("# agents\n", encoding="utf-8")
        report = check_context_sync(wb, plugin)
        wb_status = [f for f in report.files if "WORKBENCH.md" in f.path and f.exists][0]
        # Should need a managed block appended
        assert wb_status.action_needed in ("append_block", "none")
