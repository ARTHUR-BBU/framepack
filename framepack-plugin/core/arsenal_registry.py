"""Project-local `.framepack/arsenal.json` registry runtime.

Guardrail Hydrator 管人; this module 管物.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
from pathlib import Path
import tempfile

from .builtin_weapons import resolve_builtin_weapon
from .execution_manifest import ManifestWeapon, parse_execution_manifest
from .trusted_sources import is_trusted_url

SCHEMA_VERSION = "1.0.0"
DEFAULT_PLUGIN_VERSION = "0.16.0"
VALID_STATUSES = {"active", "unused", "archived"}
VALID_SOURCES = {"builtin", "web", "local", "library"}


@dataclass
class ArsenalWarning:
    code: str
    message: str
    severity: str
    weapon_id: str | None = None

    @classmethod
    def from_error(cls, message: str) -> "ArsenalWarning":
        """Construct an arsenal_error warning from a raw error string.

        Used at hook boundaries where arsenal sync raised an exception and
        we need a warning-shaped object to feed into _build_arsenal_warning_message.
        """
        return cls(code="arsenal_error", message=message, severity="warn", weapon_id=None)


@dataclass
class ArsenalSyncResult:
    changed: bool
    action: str
    path: Path
    warnings: list[ArsenalWarning]
    error: str | None = None


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _registry_path(project_dir: Path) -> Path:
    return project_dir / ".framepack" / "arsenal.json"


def _default_registry(project_dir: Path, plugin_version: str = DEFAULT_PLUGIN_VERSION) -> dict:
    now = _now()
    return {
        "schema_version": SCHEMA_VERSION,
        "project": project_dir.name,
        "created_at": now,
        "updated_at": now,
        "plugin_version_created": plugin_version,
        "plugin_version_updated": plugin_version,
        "weapons": {},
        "download_rules": {
            "allowed_sources": [
                "framepack://",
                "nexu.io",
                "codepen.io/@gsap",
                "github.com/hyperframes",
            ],
            "max_file_size_kb": 100,
            "require_hash": True,
        },
    }


def _atomic_write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=str(path.parent), delete=False) as tmp:
        json.dump(data, tmp, ensure_ascii=False, indent=2)
        tmp.write("\n")
        tmp_path = Path(tmp.name)
    tmp_path.replace(path)


def _legacy_weapon_id(item: object) -> str | None:
    if isinstance(item, str):
        return item
    if isinstance(item, dict) and item.get("id"):
        return str(item["id"])
    return None


def _legacy_weapon_entry(weapon_id: str, item: object, group_name: str) -> dict:
    builtin = resolve_builtin_weapon(weapon_id)
    if builtin:
        entry = builtin
        entry["status"] = "active"
        entry.setdefault("used_by", [])
        return entry
    legacy_payload = {}
    if isinstance(item, dict):
        legacy_payload = {key: value for key, value in item.items() if key != "id"}
    return {
        "id": weapon_id,
        "source": "library",
        "status": "active",
        "legacy_group": group_name,
        "legacy": legacy_payload,
    }


def _migrate_legacy_weapon_groups(data: dict) -> bool:
    """Convert v0.7-style required/recommended lists into v1 weapon entries."""
    weapons = data.get("weapons")
    if not isinstance(weapons, dict):
        return False
    legacy_groups: dict[str, list[str]] = {}
    migrated_weapons: dict[str, dict] = {}
    changed = False
    for group_name in ("required", "recommended"):
        values = weapons.get(group_name)
        if isinstance(values, list):
            legacy_groups[group_name] = []
            for item in values:
                weapon_id = _legacy_weapon_id(item)
                if not weapon_id:
                    continue
                legacy_groups[group_name].append(weapon_id)
                if weapon_id in migrated_weapons:
                    continue
                migrated_weapons[weapon_id] = _legacy_weapon_entry(weapon_id, item, group_name)
            changed = True
    if not changed:
        return False
    for weapon_id, weapon in weapons.items():
        if weapon_id in {"required", "recommended"}:
            continue
        if isinstance(weapon, dict):
            migrated_weapons[weapon_id] = weapon
    data["legacy_weapon_groups"] = legacy_groups
    data["weapons"] = migrated_weapons
    return True


def _migrate(data: dict) -> tuple[dict, bool]:
    changed = False
    if "version" in data and "schema_version" not in data:
        data["migrated_from_version"] = data.pop("version")
        data["schema_version"] = SCHEMA_VERSION
        changed = True
    if _migrate_legacy_weapon_groups(data):
        changed = True
    if data.get("schema_version") != SCHEMA_VERSION:
        data["schema_version"] = SCHEMA_VERSION
        changed = True
    if "weapons" not in data or not isinstance(data.get("weapons"), dict):
        data["weapons"] = {}
        changed = True
    return data, changed


def load_arsenal(path: Path) -> dict:
    """Load and normalize an arsenal registry without writing it."""
    data = json.loads(path.read_text(encoding="utf-8"))
    data, _changed = _migrate(data)
    return data


def ensure_arsenal(project_dir: Path, plugin_dir: Path | None = None, plugin_version: str = DEFAULT_PLUGIN_VERSION) -> ArsenalSyncResult:
    """Ensure `.framepack/arsenal.json` and `.framepack/weapons/` exist.

    Existing registries are preserved; legacy schema is migrated atomically.
    `state.json` is intentionally not created.
    """
    project_dir = Path(project_dir)
    arsenal_dir = project_dir / ".framepack"
    weapons_dir = arsenal_dir / "weapons"
    path = _registry_path(project_dir)
    try:
        weapons_dir.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            data = _default_registry(project_dir, plugin_version)
            _atomic_write_json(path, data)
            return ArsenalSyncResult(True, "created", path, [])
        data = json.loads(path.read_text(encoding="utf-8"))
        data, changed = _migrate(data)
        if changed:
            data["updated_at"] = _now()
            data["plugin_version_updated"] = plugin_version
            _atomic_write_json(path, data)
            return ArsenalSyncResult(True, "migrated", path, validate_arsenal(data, project_dir))
        return ArsenalSyncResult(False, "exists", path, validate_arsenal(data, project_dir))
    except Exception as exc:  # defensive hook boundary
        return ArsenalSyncResult(False, "error", path, [], error=str(exc))


def sync_arsenal_from_project(
    project_dir: Path,
    plugin_dir: Path | None = None,
    plugin_version: str = DEFAULT_PLUGIN_VERSION,
) -> ArsenalSyncResult:
    """Ensure arsenal registry and reconcile it from `.hyperframes/expanded-prompt.md` when present."""
    project_dir = Path(project_dir)
    ensure_result = ensure_arsenal(project_dir, plugin_dir, plugin_version)
    path = ensure_result.path
    if ensure_result.error:
        return ensure_result

    manifest_path = project_dir / ".hyperframes" / "expanded-prompt.md"
    if not manifest_path.exists():
        return ensure_result

    try:
        manifest_weapons = parse_execution_manifest(manifest_path.read_text(encoding="utf-8"))
        if not manifest_weapons:
            return ensure_result

        before = path.read_text(encoding="utf-8")
        data = load_arsenal(path)
        data, reconcile_warnings = reconcile_manifest(data, manifest_weapons, plugin_dir)
        after = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        changed = before != after
        if changed:
            data["plugin_version_updated"] = plugin_version
            after = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
            _atomic_write_json(path, data)
        return ArsenalSyncResult(
            ensure_result.changed or changed,
            "synced" if ensure_result.changed or changed else "exists",
            path,
            [*ensure_result.warnings, *reconcile_warnings],
        )
    except Exception as exc:  # defensive hook boundary
        return ArsenalSyncResult(False, "error", path, ensure_result.warnings, error=str(exc))


def validate_arsenal(data: dict, project_dir: Path) -> list[ArsenalWarning]:
    warnings: list[ArsenalWarning] = []
    weapons = data.get("weapons")
    if not isinstance(weapons, dict):
        warnings.append(ArsenalWarning("missing_weapons", "arsenal.json missing weapons object", "error"))
        return warnings
    for weapon_id, weapon in weapons.items():
        if not isinstance(weapon, dict):
            warnings.append(ArsenalWarning("invalid_weapon", f"{weapon_id} is not an object", "error", weapon_id))
            continue
        status = weapon.get("status", "active")
        if status not in VALID_STATUSES:
            warnings.append(ArsenalWarning("invalid_status", f"{weapon_id} has invalid status {status}", "warn", weapon_id))
        source = weapon.get("source", "builtin")
        if source not in VALID_SOURCES:
            warnings.append(ArsenalWarning("invalid_source", f"{weapon_id} has invalid source {source}", "warn", weapon_id))
        if source in {"web", "local"} and not weapon.get("hash"):
            warnings.append(ArsenalWarning("missing_hash", f"{weapon_id} requires sha256 hash", "warn", weapon_id))
        if source == "web":
            url = weapon.get("url", "")
            trusted, _label, _note = is_trusted_url(url)
            if url and not trusted:
                warnings.append(ArsenalWarning("untrusted_url", f"{weapon_id} url is not trusted: {url}", "warn", weapon_id))
    return warnings


def _merge_used_by(existing: list[str], incoming: list[str]) -> tuple[list[str], bool]:
    merged = list(existing or [])
    changed = False
    for item in incoming:
        if item and item not in merged:
            merged.append(item)
            changed = True
    return merged, changed


def register_builtin_weapon(data: dict, weapon_id: str, used_by: list[str], plugin_dir: Path | None = None) -> tuple[bool, list[ArsenalWarning]]:
    catalog = resolve_builtin_weapon(weapon_id)
    if not catalog:
        return False, [ArsenalWarning("unknown_builtin_weapon", f"Unknown builtin weapon: {weapon_id}", "warn", weapon_id)]
    data.setdefault("weapons", {})
    now = _now()
    existing = data["weapons"].get(weapon_id)
    if existing:
        merged, used_changed = _merge_used_by(existing.get("used_by", []), used_by)
        changed = used_changed or existing.get("status") != "active"
        existing.update({k: v for k, v in catalog.items() if k != "id"})
        existing["id"] = weapon_id
        existing["used_by"] = merged
        existing["status"] = "active"
        existing["updated_at"] = now
        return changed, []
    entry = dict(catalog)
    entry.update({
        "id": weapon_id,
        "used_by": list(dict.fromkeys(used_by)),
        "status": "active",
        "hash": None,
        "registered_at": now,
        "updated_at": now,
    })
    data["weapons"][weapon_id] = entry
    return True, []


def reconcile_manifest(data: dict, manifest_weapons: list[ManifestWeapon], plugin_dir: Path | None = None) -> tuple[dict, list[ArsenalWarning]]:
    data.setdefault("weapons", {})
    warnings: list[ArsenalWarning] = []
    referenced: set[str] = set()
    changed = False

    for ref in manifest_weapons:
        if ref.handwrite or ref.id.upper() == "HANDWRITE":
            warnings.append(ArsenalWarning("handwrite_weapon", f"HANDWRITE used by {', '.join(ref.used_by) or 'unknown scene'}", "info", "HANDWRITE"))
            continue
        referenced.add(ref.id)
        if ref.source in (None, "builtin"):
            did_change, reg_warnings = register_builtin_weapon(data, ref.id, ref.used_by, plugin_dir)
            changed = changed or did_change
            if reg_warnings:
                warnings.append(ArsenalWarning("unknown_weapon", f"Manifest references unknown weapon: {ref.id}", "warn", ref.id))
        else:
            warnings.append(ArsenalWarning("unsupported_manifest_source", f"Unsupported manifest source for {ref.id}: {ref.source}", "warn", ref.id))

    for weapon_id, weapon in data.get("weapons", {}).items():
        source = weapon.get("source")
        if source in {"library"}:
            continue
        if weapon_id not in referenced and weapon.get("status") == "active":
            weapon["status"] = "unused"
            weapon["updated_at"] = _now()
            warnings.append(ArsenalWarning("unused_weapon", f"{weapon_id} exists in arsenal.json but is not referenced by Execution Manifest", "info", weapon_id))
            changed = True

    if changed:
        data["updated_at"] = _now()
        data["plugin_version_updated"] = DEFAULT_PLUGIN_VERSION
    warnings.extend(validate_arsenal(data, Path(".")))
    return data, warnings
