"""Framepack project-local timeline manifest runtime.

The timeline manifest is a production ledger: scenes, timings, locks, proofs,
and continuity metadata. It is not a renderer and does not replace HyperFrames.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re
import tempfile
from typing import Any

TIMELINE_SCHEMA_VERSION = "1.0.0"
TIMELINE_KIND = "framepack_timeline_manifest"
DEFAULT_PLUGIN_VERSION = "0.11.1"
VALID_SCENE_STATUSES = {"draft", "review", "locked", "superseded"}


@dataclass
class TimelineWarning:
    code: str
    message: str
    severity: str
    scene: str | None = None
    details: dict[str, Any] | None = None


@dataclass
class TimelineSyncResult:
    changed: bool
    action: str
    path: Path
    warnings: list[TimelineWarning]
    error: str | None = None


def _now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _timeline_path(project_dir: Path) -> Path:
    return Path(project_dir) / ".framepack" / "timeline-manifest.json"


def default_timeline(project_dir: Path, plugin_version: str = DEFAULT_PLUGIN_VERSION) -> dict[str, Any]:
    now = _now()
    project_dir = Path(project_dir)
    return {
        "schema_version": TIMELINE_SCHEMA_VERSION,
        "kind": TIMELINE_KIND,
        "project": {
            "name": project_dir.name,
            "duration": None,
            "width": None,
            "height": None,
            "fps": None,
            "output": None,
        },
        "source_files": {
            "frame_md": "frame.md",
            "expanded_prompt": ".hyperframes/expanded-prompt.md",
            "html": "index.html",
            "arsenal": ".framepack/arsenal.json",
        },
        "scenes": [],
        "audio": {"narration": [], "music": None},
        "captions": {"script": None, "style": None, "output": None, "proofs": []},
        "proofs": {
            "directory": ".framepack/proofs",
            "contact_sheet": ".framepack/proofs/contact-sheet.jpg",
            "required": [],
        },
        "change_requests": [],
        "created_at": now,
        "updated_at": now,
        "plugin_version_created": plugin_version,
        "plugin_version_updated": plugin_version,
    }


def _atomic_write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=str(path.parent), delete=False) as tmp:
        json.dump(data, tmp, ensure_ascii=False, indent=2)
        tmp.write("\n")
        tmp_path = Path(tmp.name)
    tmp_path.replace(path)


def _normalize_timeline(data: dict[str, Any], project_dir: Path | None = None) -> tuple[dict[str, Any], bool]:
    changed = False
    if data.get("schema_version") != TIMELINE_SCHEMA_VERSION:
        data["schema_version"] = TIMELINE_SCHEMA_VERSION
        changed = True
    if data.get("kind") != TIMELINE_KIND:
        data["kind"] = TIMELINE_KIND
        changed = True
    if not isinstance(data.get("project"), dict):
        data["project"] = {}
        changed = True
    if project_dir and not data["project"].get("name"):
        data["project"]["name"] = project_dir.name
        changed = True
    if "scenes" not in data or not isinstance(data.get("scenes"), list):
        data["scenes"] = []
        changed = True
    if "proofs" not in data or not isinstance(data.get("proofs"), dict):
        data["proofs"] = {"directory": ".framepack/proofs", "contact_sheet": ".framepack/proofs/contact-sheet.jpg", "required": []}
        changed = True
    return data, changed


def load_timeline(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid timeline manifest JSON: {path}") from exc
    if not isinstance(data, dict):
        raise ValueError(f"Invalid timeline manifest JSON: root must be object: {path}")
    data, _changed = _normalize_timeline(data)
    return data


def ensure_timeline(project_dir: Path, plugin_version: str = DEFAULT_PLUGIN_VERSION) -> TimelineSyncResult:
    project_dir = Path(project_dir)
    path = _timeline_path(project_dir)
    try:
        if not path.exists():
            data = default_timeline(project_dir, plugin_version)
            _atomic_write_json(path, data)
            return TimelineSyncResult(True, "created", path, [])
        data = load_timeline(path)
        data, changed = _normalize_timeline(data, project_dir)
        warnings = validate_timeline(data, project_dir)
        if changed:
            data["updated_at"] = _now()
            data["plugin_version_updated"] = plugin_version
            _atomic_write_json(path, data)
            return TimelineSyncResult(True, "migrated", path, warnings)
        return TimelineSyncResult(False, "exists", path, warnings)
    except Exception as exc:  # defensive hook/script boundary
        return TimelineSyncResult(False, "error", path, [], error=str(exc))


def _scene_dict(scene_id: str, start: float, duration: float, track_index: int | None = None) -> dict[str, Any]:
    scene: dict[str, Any] = {
        "id": scene_id,
        "start": float(start),
        "duration": float(duration),
        "track_index": track_index,
        "status": "draft",
        "proofs": [],
    }
    return scene


def _parse_float(value: str) -> float | None:
    try:
        number = float(value.strip().rstrip("s"))
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def _parse_int(value: str) -> int | None:
    try:
        return int(float(value.strip()))
    except (TypeError, ValueError):
        return None


def _coerce_float(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _coerce_int(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _dedupe_scenes(scenes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for scene in scenes:
        scene_id = str(scene.get("id", "")).strip()
        if not scene_id or scene_id in seen:
            continue
        seen.add(scene_id)
        deduped.append(scene)
    return deduped


def parse_hyperframes_time_windows(text: str) -> list[dict[str, Any]]:
    """Parse Framepack/HyperFrames scene time windows from markdown-ish text."""
    scenes: list[dict[str, Any]] = []
    compact = re.compile(
        r"\b(?P<id>scene[_-]?\d+)\b\s*:\s*start\s*=\s*(?P<start>-?\d+(?:\.\d+)?)s?\s*,\s*duration\s*=\s*(?P<duration>\d+(?:\.\d+)?)s?(?:\s*,\s*(?:track|track_index)\s*=\s*(?P<track>\d+))?",
        re.IGNORECASE,
    )
    for match in compact.finditer(text):
        scenes.append(_scene_dict(match.group("id"), float(match.group("start")), float(match.group("duration")), _parse_int(match.group("track") or "")))

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|") or "---" in stripped.lower() or "scene" not in stripped.lower():
            continue
        cells = [cell.strip() for cell in stripped.strip("|").split("|")]
        if len(cells) < 3:
            continue
        scene_id = cells[0]
        if not re.fullmatch(r"scene[_-]?\d+", scene_id, re.IGNORECASE):
            continue
        start = _parse_float(cells[1])
        duration = _parse_float(cells[2])
        if start is None or duration is None:
            continue
        track = _parse_int(cells[3]) if len(cells) > 3 else None
        scenes.append(_scene_dict(scene_id, start, duration, track))
    return _dedupe_scenes(scenes)


def parse_html_clips(html: str) -> list[dict[str, Any]]:
    """Best-effort extraction of HyperFrames clip timing attributes.

    This reads only time scheduling metadata; it is not a DOM/structure audit.
    """
    scenes: list[dict[str, Any]] = []
    tag_pattern = re.compile(r"<(?P<tag>\w+)\b(?P<attrs>[^>]*\bclass=[\"'][^\"']*\bclip\b[^\"']*[\"'][^>]*)>", re.IGNORECASE | re.DOTALL)
    attr_pattern = re.compile(r"(?P<key>[\w:-]+)\s*=\s*[\"'](?P<value>[^\"']*)[\"']")
    for match in tag_pattern.finditer(html):
        attrs = {m.group("key"): m.group("value") for m in attr_pattern.finditer(match.group("attrs"))}
        scene_id = attrs.get("id") or attrs.get("data-composition-id")
        start = _parse_float(attrs.get("data-start", ""))
        duration = _parse_float(attrs.get("data-duration", ""))
        if not scene_id or start is None or duration is None:
            continue
        track = _parse_int(attrs.get("data-track-index", ""))
        scenes.append(_scene_dict(scene_id, start, duration, track))
    return _dedupe_scenes(scenes)


def _scene_end(scene: dict[str, Any]) -> float:
    return float(scene.get("start", 0)) + float(scene.get("duration", 0))


def _merge_scenes(existing: list[dict[str, Any]], discovered: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[TimelineWarning], bool]:
    warnings: list[TimelineWarning] = []
    changed = False
    by_id = {str(scene.get("id")): dict(scene) for scene in existing if scene.get("id")}
    order = [str(scene.get("id")) for scene in existing if scene.get("id")]
    for scene in discovered:
        scene_id = str(scene["id"])
        current = by_id.get(scene_id)
        if not current:
            by_id[scene_id] = scene
            order.append(scene_id)
            changed = True
            continue
        locked = current.get("status") == "locked" or current.get("locks", {}).get("status") == "locked"
        timing_changed = any(current.get(key) != scene.get(key) for key in ("start", "duration", "track_index"))
        if locked and timing_changed:
            warnings.append(
                TimelineWarning(
                    "locked_scene_timing_changed",
                    f"Locked scene {scene_id!r} timing differs from discovered time window; preserving locked manifest values",
                    "P1",
                    scene=scene_id,
                    details={"manifest": {k: current.get(k) for k in ("start", "duration", "track_index")}, "discovered": {k: scene.get(k) for k in ("start", "duration", "track_index")}},
                )
            )
            continue
        merged = dict(current)
        for key in ("start", "duration", "track_index"):
            if merged.get(key) != scene.get(key):
                merged[key] = scene.get(key)
                changed = True
        merged.setdefault("status", "draft")
        merged.setdefault("proofs", [])
        by_id[scene_id] = merged
    return [by_id[scene_id] for scene_id in order if scene_id in by_id], warnings, changed


def _timeline_duration(scenes: list[dict[str, Any]]) -> float | None:
    if not scenes:
        return None
    return max(_scene_end(scene) for scene in scenes)


def sync_timeline_from_project(project_dir: Path, plugin_version: str = DEFAULT_PLUGIN_VERSION) -> TimelineSyncResult:
    project_dir = Path(project_dir)
    ensure_result = ensure_timeline(project_dir, plugin_version)
    path = ensure_result.path
    if ensure_result.error:
        return ensure_result

    discovered: list[dict[str, Any]] = []
    expanded_prompt_path = project_dir / ".hyperframes" / "expanded-prompt.md"
    if expanded_prompt_path.exists():
        discovered = parse_hyperframes_time_windows(expanded_prompt_path.read_text(encoding="utf-8"))
    if not discovered:
        html_path = project_dir / "index.html"
        if html_path.exists():
            discovered = parse_html_clips(html_path.read_text(encoding="utf-8"))
    if not discovered:
        return ensure_result

    try:
        before = path.read_text(encoding="utf-8")
        data = load_timeline(path)
        merged_scenes, merge_warnings, scenes_changed = _merge_scenes(data.get("scenes", []), discovered)
        data["scenes"] = merged_scenes
        duration = _timeline_duration(merged_scenes)
        if duration is not None and data.setdefault("project", {}).get("duration") != duration:
            data["project"]["duration"] = duration
            scenes_changed = True
        warnings = ensure_result.warnings + merge_warnings + validate_timeline(data, project_dir)
        if scenes_changed:
            data["updated_at"] = _now()
            data["plugin_version_updated"] = plugin_version
        after = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        if before != after:
            _atomic_write_json(path, data)
            action = "synced" if not merge_warnings else "exists"
            return TimelineSyncResult(True, action, path, warnings)
        return TimelineSyncResult(False, "exists", path, warnings)
    except Exception as exc:  # defensive hook/script boundary
        return TimelineSyncResult(False, "error", path, [], error=str(exc))


def validate_timeline(data: dict[str, Any], project_dir: Path | None = None) -> list[TimelineWarning]:
    warnings: list[TimelineWarning] = []
    if data.get("kind") != TIMELINE_KIND or data.get("schema_version") != TIMELINE_SCHEMA_VERSION:
        warnings.append(TimelineWarning("timeline_manifest_invalid", "timeline manifest schema/kind is invalid", "P0"))
    scenes = data.get("scenes") if isinstance(data.get("scenes"), list) else []
    normalized: list[dict[str, Any]] = []
    for scene in scenes:
        if not isinstance(scene, dict):
            continue
        scene_id = str(scene.get("id", "")).strip()
        start = _coerce_float(scene.get("start"))
        duration = _coerce_float(scene.get("duration"))
        track = scene.get("track_index")
        track_index = 0 if track is None else _coerce_int(track)
        if not scene_id or start is None or duration is None or track_index is None:
            warnings.append(TimelineWarning("timeline_scene_invalid", "timeline scene requires id and numeric start/duration/track_index", "P1", scene=scene_id or None))
            continue
        status = scene.get("status", "draft")
        if status not in VALID_SCENE_STATUSES:
            warnings.append(TimelineWarning("timeline_scene_invalid_status", f"scene {scene_id!r} has invalid status {status!r}", "P2", scene=scene_id))
        normalized_scene = dict(scene)
        normalized_scene["start"] = start
        normalized_scene["duration"] = duration
        normalized_scene["track_index"] = track_index
        normalized.append(normalized_scene)

    by_track: dict[int, list[dict[str, Any]]] = {}
    for scene in normalized:
        track = int(scene.get("track_index", 0))
        by_track.setdefault(track, []).append(scene)
    for track_scenes in by_track.values():
        ordered = sorted(track_scenes, key=lambda item: float(item.get("start", 0)))
        previous: dict[str, Any] | None = None
        for scene in ordered:
            if previous and float(scene.get("start", 0)) < _scene_end(previous):
                warnings.append(
                    TimelineWarning(
                        "timeline_scene_overlap",
                        f"Scene {scene.get('id')!r} overlaps previous scene {previous.get('id')!r} on the same track",
                        "P1",
                        scene=str(scene.get("id")),
                        details={"previous": previous.get("id"), "track_index": scene.get("track_index", 0)},
                    )
                )
                break
            previous = scene
    return warnings
