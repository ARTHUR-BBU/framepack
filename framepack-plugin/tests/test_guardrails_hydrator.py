from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class FakeCtx:
    def __init__(self):
        self.messages = []

    def inject_message(self, message: str, role: str = "user"):
        self.messages.append((role, message))


def make_plugin(tmp_path: Path, version: str = "0.10.0", guardrails: str = "# Framepack Guardrails\n\n最新铁律") -> Path:
    plugin_dir = tmp_path / "plugin"
    plugin_dir.mkdir()
    (plugin_dir / "plugin.yaml").write_text(f'name: framepack\nversion: "{version}"\n', encoding="utf-8")
    (plugin_dir / "guardrails.md").write_text(guardrails, encoding="utf-8")
    return plugin_dir


def test_sync_creates_agents_md_with_managed_block(tmp_path):
    from hooks.guardrails import sync_project_agents

    plugin_dir = make_plugin(tmp_path)
    project_dir = tmp_path / "project"
    project_dir.mkdir()

    result = sync_project_agents(project_dir, plugin_dir)

    agents = project_dir / "AGENTS.md"
    assert result.changed is True
    assert result.action == "created"
    assert agents.exists()
    content = agents.read_text(encoding="utf-8")
    assert "FRAMEPACK MANAGED BLOCK START" in content
    assert "version=0.10.0" in content
    assert "# Framepack Guardrails" in content
    assert "最新铁律" in content


def test_sync_appends_block_and_preserves_existing_agents_md(tmp_path):
    from hooks.guardrails import sync_project_agents

    plugin_dir = make_plugin(tmp_path)
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    (project_dir / "AGENTS.md").write_text("# User Rules\n\n不要覆盖我\n", encoding="utf-8")

    result = sync_project_agents(project_dir, plugin_dir)

    content = (project_dir / "AGENTS.md").read_text(encoding="utf-8")
    assert result.changed is True
    assert result.action == "inserted"
    assert content.startswith("# User Rules\n\n不要覆盖我")
    assert "FRAMEPACK MANAGED BLOCK START" in content
    assert content.count("FRAMEPACK MANAGED BLOCK START") == 1


def test_sync_replaces_only_existing_framepack_block(tmp_path):
    from hooks.guardrails import sync_project_agents

    plugin_dir = make_plugin(tmp_path, guardrails="# Framepack Guardrails\n\n新规矩")
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    old = """# User Rules

保留我

<!-- FRAMEPACK MANAGED BLOCK START version=0.9.1 hash=sha256:old source=plugin -->
## Framepack Guardrails

旧规矩
<!-- FRAMEPACK MANAGED BLOCK END -->

# Tail
也保留我
"""
    (project_dir / "AGENTS.md").write_text(old, encoding="utf-8")

    result = sync_project_agents(project_dir, plugin_dir)

    content = (project_dir / "AGENTS.md").read_text(encoding="utf-8")
    assert result.changed is True
    assert result.action == "updated"
    assert "保留我" in content
    assert "也保留我" in content
    assert "新规矩" in content
    assert "旧规矩" not in content
    assert content.count("FRAMEPACK MANAGED BLOCK START") == 1


def test_sync_replaces_legacy_framepack_block_without_version_hash(tmp_path):
    from hooks.guardrails import sync_project_agents

    plugin_dir = make_plugin(tmp_path, guardrails="# Framepack Guardrails\n\n新 Hydrator 规矩")
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    legacy = """# User Rules

保留我

<!-- FRAMEPACK MANAGED BLOCK START -->
## Framepack Agent Workflow

旧 legacy block
<!-- FRAMEPACK MANAGED BLOCK END -->
"""
    (project_dir / "AGENTS.md").write_text(legacy, encoding="utf-8")

    result = sync_project_agents(project_dir, plugin_dir)

    content = (project_dir / "AGENTS.md").read_text(encoding="utf-8")
    assert result.changed is True
    assert result.action == "updated"
    assert "保留我" in content
    assert "旧 legacy block" not in content
    assert "新 Hydrator 规矩" in content
    assert content.count("FRAMEPACK MANAGED BLOCK START") == 1
    assert "version=0.10.0" in content
    assert "hash=sha256:" in content


def test_sync_appends_to_full_legacy_framepack_agents_doc_without_deleting_content(tmp_path):
    from hooks.guardrails import sync_project_agents

    plugin_dir = make_plugin(tmp_path, guardrails="# Framepack Guardrails\n\n新 managed block")
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    legacy_doc = """# Framepack Agent Guide

<!-- version: 0.9.1 — sync with plugin.yaml and README -->

旧整份 Framepack AGENTS.md
用户后加的项目规则也要保留

## ⚔️ 铁律：HyperFrames 结构优先
旧铁律
"""
    (project_dir / "AGENTS.md").write_text(legacy_doc, encoding="utf-8")

    result = sync_project_agents(project_dir, plugin_dir)

    content = (project_dir / "AGENTS.md").read_text(encoding="utf-8")
    assert result.changed is True
    assert result.action == "inserted"
    assert "旧整份 Framepack AGENTS.md" in content
    assert "用户后加的项目规则也要保留" in content
    assert "新 managed block" in content
    assert content.count("FRAMEPACK MANAGED BLOCK START") == 1
    assert "version=0.10.0" in content


def test_sync_updates_managed_block_in_legacy_doc_without_deleting_content(tmp_path):
    from hooks.guardrails import sync_project_agents

    plugin_dir = make_plugin(tmp_path, guardrails="# Framepack Guardrails\n\n最终单块")
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    duplicated = """# Framepack Agent Guide

<!-- version: 0.9.1 — sync with plugin.yaml and README -->

旧整份 Framepack AGENTS.md
用户后加的项目规则也要保留

## ⚔️ 铁律：HyperFrames 结构优先
旧铁律

<!-- FRAMEPACK MANAGED BLOCK START version=0.9.2 hash=sha256:old source=plugin -->
# Framepack Guardrails

半新 block
<!-- FRAMEPACK MANAGED BLOCK END -->
"""
    (project_dir / "AGENTS.md").write_text(duplicated, encoding="utf-8")

    result = sync_project_agents(project_dir, plugin_dir)

    content = (project_dir / "AGENTS.md").read_text(encoding="utf-8")
    assert result.changed is True
    assert result.action == "updated"
    assert "旧整份 Framepack AGENTS.md" in content
    assert "用户后加的项目规则也要保留" in content
    assert "半新 block" not in content
    assert "最终单块" in content
    assert content.count("FRAMEPACK MANAGED BLOCK START") == 1
    assert "version=0.10.0" in content


def test_sync_repairs_body_drift_even_if_header_hash_matches(tmp_path):
    from hooks.guardrails import build_guardrails_payload, sync_project_agents

    plugin_dir = make_plugin(tmp_path, guardrails="# Framepack Guardrails\n\n真实规则")
    payload = build_guardrails_payload(plugin_dir)
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    tampered = (
        f"<!-- FRAMEPACK MANAGED BLOCK START version=0.10.0 hash={payload.digest} source=plugin -->\n"
        "# Framepack Guardrails\n\n被手改坏的规则\n"
        "<!-- FRAMEPACK MANAGED BLOCK END -->\n"
    )
    (project_dir / "AGENTS.md").write_text(tampered, encoding="utf-8")

    result = sync_project_agents(project_dir, plugin_dir)

    content = (project_dir / "AGENTS.md").read_text(encoding="utf-8")
    assert result.changed is True
    assert result.action == "updated"
    assert "被手改坏的规则" not in content
    assert "真实规则" in content


def test_sync_repairs_stale_version_even_if_hash_matches(tmp_path):
    from hooks.guardrails import build_guardrails_payload, sync_project_agents

    plugin_dir = make_plugin(tmp_path, version="0.10.0", guardrails="# Framepack Guardrails\n\n同一份规则")
    payload = build_guardrails_payload(plugin_dir)
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    stale_version_block = payload.block.replace("version=0.10.0", "version=0.9.4")
    (project_dir / "AGENTS.md").write_text(stale_version_block, encoding="utf-8")

    result = sync_project_agents(project_dir, plugin_dir)

    content = (project_dir / "AGENTS.md").read_text(encoding="utf-8")
    assert result.changed is True
    assert result.action == "updated"
    assert "version=0.10.0" in content
    assert "version=0.9.1" not in content


def test_sync_noops_when_hash_matches(tmp_path):
    from hooks.guardrails import build_guardrails_payload, sync_project_agents

    plugin_dir = make_plugin(tmp_path, guardrails="# Framepack Guardrails\n\n稳定规矩")
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    payload = build_guardrails_payload(plugin_dir)
    block = payload.block
    (project_dir / "AGENTS.md").write_text("# User Rules\n\n" + block, encoding="utf-8")
    before = (project_dir / "AGENTS.md").stat().st_mtime_ns

    result = sync_project_agents(project_dir, plugin_dir)
    after = (project_dir / "AGENTS.md").stat().st_mtime_ns

    assert result.changed is False
    assert result.action == "noop"
    assert before == after


def test_sync_write_failure_falls_back_to_injection(tmp_path, monkeypatch):
    from hooks import guardrails

    plugin_dir = make_plugin(tmp_path)
    project_dir = tmp_path / "project"
    project_dir.mkdir()
    ctx = FakeCtx()

    def boom(*args, **kwargs):
        raise PermissionError("readonly")

    monkeypatch.setattr(guardrails, "_atomic_write_text", boom)

    result = guardrails.sync_project_agents(project_dir, plugin_dir, ctx=ctx)

    assert result.changed is False
    assert result.action == "injected_only"
    assert result.error and "readonly" in result.error
    assert ctx.messages
    role, message = ctx.messages[0]
    assert role == "user"
    assert "Framepack Guardrails" in message
    assert "最新铁律" in message
