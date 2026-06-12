"""Arsenal Registry runtime tests."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from core.arsenal_registry import (
    ensure_arsenal,
    load_arsenal,
    register_builtin_weapon,
    reconcile_manifest,
    validate_arsenal,
)
from core.execution_manifest import ManifestWeapon


def test_ensure_arsenal_creates_missing_registry(tmp_path):
    result = ensure_arsenal(tmp_path, tmp_path)

    arsenal_path = tmp_path / ".framepack" / "arsenal.json"
    assert result.changed is True
    assert result.action == "created"
    assert arsenal_path.exists()
    data = json.loads(arsenal_path.read_text(encoding="utf-8"))
    assert data["schema_version"] == "1.0.0"
    assert data["project"] == tmp_path.name
    assert data["weapons"] == {}
    assert data["download_rules"]["require_hash"] is True


def test_ensure_arsenal_preserves_existing_user_registry(tmp_path):
    framepack = tmp_path / ".framepack"
    framepack.mkdir()
    arsenal_path = framepack / "arsenal.json"
    arsenal_path.write_text(
        json.dumps({"schema_version": "1.0.0", "weapons": {"custom": {"id": "custom"}}, "custom_field": "keep"}),
        encoding="utf-8",
    )

    result = ensure_arsenal(tmp_path, tmp_path)
    data = json.loads(arsenal_path.read_text(encoding="utf-8"))

    assert result.changed is False
    assert result.action == "exists"
    assert data["custom_field"] == "keep"
    assert "custom" in data["weapons"]


def test_ensure_arsenal_creates_weapons_dir_and_no_state_json(tmp_path):
    ensure_arsenal(tmp_path, tmp_path)

    assert (tmp_path / ".framepack" / "weapons").is_dir()
    assert not (tmp_path / ".framepack" / "state.json").exists()


def test_migrates_legacy_version_to_schema_version(tmp_path):
    framepack = tmp_path / ".framepack"
    framepack.mkdir()
    path = framepack / "arsenal.json"
    path.write_text(json.dumps({"version": "0.7.10", "weapons": {}}), encoding="utf-8")

    data = load_arsenal(path)

    assert data["schema_version"] == "1.0.0"
    assert data["migrated_from_version"] == "0.7.10"
    assert "version" not in data


def test_validate_warns_on_missing_weapons_object(tmp_path):
    warnings = validate_arsenal({"schema_version": "1.0.0"}, tmp_path)

    assert any(w.code == "missing_weapons" for w in warnings)


def test_validate_warns_on_invalid_weapon_status(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {"x": {"id": "x", "source": "builtin", "status": "ghost"}}}

    warnings = validate_arsenal(data, tmp_path)

    assert any(w.code == "invalid_status" and w.weapon_id == "x" for w in warnings)


def test_validate_warns_on_web_weapon_without_hash(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {"x": {"id": "x", "source": "web", "status": "active"}}}

    warnings = validate_arsenal(data, tmp_path)

    assert any(w.code == "missing_hash" and w.weapon_id == "x" for w in warnings)


def test_register_builtin_weapon_adds_entry(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {}}

    changed, warnings = register_builtin_weapon(data, "text-split-enter", ["scene_1"], tmp_path)

    assert changed is True
    assert warnings == []
    weapon = data["weapons"]["text-split-enter"]
    assert weapon["source"] == "builtin"
    assert weapon["kind"] == "part"
    assert weapon["skill"] == "framepack:framepack-animation-library"
    assert weapon["file"] == "parts/text-split-enter.md"
    assert weapon["used_by"] == ["scene_1"]
    assert weapon["status"] == "active"


def test_register_builtin_weapon_merges_used_by_without_duplicates(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {}}
    register_builtin_weapon(data, "text-split-enter", ["scene_1"], tmp_path)

    changed, warnings = register_builtin_weapon(data, "text-split-enter", ["scene_1", "scene_2"], tmp_path)

    assert changed is True
    assert warnings == []
    assert data["weapons"]["text-split-enter"]["used_by"] == ["scene_1", "scene_2"]


def test_register_unknown_builtin_returns_warning(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {}}

    changed, warnings = register_builtin_weapon(data, "ghost-weapon", ["scene_1"], tmp_path)

    assert changed is False
    assert any(w.code == "unknown_builtin_weapon" and w.weapon_id == "ghost-weapon" for w in warnings)


def test_reconcile_registers_manifest_builtin_weapons(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {}}
    manifest = [ManifestWeapon(id="text-split-enter", source="builtin", used_by=["scene_1"])]

    updated, warnings = reconcile_manifest(data, manifest, tmp_path)

    assert "text-split-enter" in updated["weapons"]
    assert not [w for w in warnings if w.severity == "error"]


def test_reconcile_marks_unreferenced_weapons_unused(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {}}
    register_builtin_weapon(data, "text-split-enter", ["scene_1"], tmp_path)

    updated, warnings = reconcile_manifest(data, [], tmp_path)

    assert updated["weapons"]["text-split-enter"]["status"] == "unused"
    assert any(w.code == "unused_weapon" for w in warnings)


def test_reconcile_warns_on_unknown_manifest_weapon(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {}}
    manifest = [ManifestWeapon(id="unknown-fx", source="builtin", used_by=["scene_1"])]

    _updated, warnings = reconcile_manifest(data, manifest, tmp_path)

    assert any(w.code == "unknown_weapon" and w.weapon_id == "unknown-fx" for w in warnings)


def test_reconcile_keeps_handwrite_out_of_registry_but_warns(tmp_path):
    data = {"schema_version": "1.0.0", "weapons": {}}
    manifest = [ManifestWeapon(id="HANDWRITE", source=None, used_by=["scene_4"], handwrite=True, reason="custom")]

    updated, warnings = reconcile_manifest(data, manifest, tmp_path)

    assert updated["weapons"] == {}
    assert any(w.code == "handwrite_weapon" for w in warnings)
