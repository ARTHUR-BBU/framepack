"""Hermes adapter — patch tracking and drift detection.

This module tracks local patches applied to the Hermes framework and detects
when they have been overwritten by an upgrade. It uses a marker-based approach:
each patch is registered with a unique comment marker, and we simply check
whether that marker still exists in the target file.

Design principles:
  - Report-first: detect and report, never auto-apply patches.
  - Marker-based: robust to unrelated upstream changes (unlike file hashing).
  - Version-gated: only re-checks when Hermes version actually changes.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path

import os

logger = logging.getLogger(__name__)


# ── Hermes environment detection ───────────────────────────────────────


def detect_hermes_version() -> str | None:
    """Detect the currently running Hermes version.

    Tries importlib.metadata first (most reliable for installed packages),
    falls back to reading pyproject.toml from the install directory.
    """
    try:
        import importlib.metadata
        return importlib.metadata.version("hermes-agent")
    except Exception:
        pass

    install = find_hermes_install()
    if install:
        pyproject = install / "pyproject.toml"
        if pyproject.is_file():
            import re
            text = pyproject.read_text(encoding="utf-8")
            match = re.search(r'version\s*=\s*["\']([^"\']+)', text)
            if match:
                return match.group(1)
    return None


def find_hermes_install() -> Path | None:
    """Find the Hermes installation root directory.

    Uses the actual imported module path first (most reliable), then
    falls back to the HERMES_HOME environment variable.
    """
    try:
        import tools.skills_tool
        return Path(tools.skills_tool.__file__).resolve().parents[1]
    except (ImportError, AttributeError):
        pass

    hermes_home = os.environ.get("HERMES_HOME")
    if hermes_home:
        # HERMES_HOME points to the parent of hermes-agent/, not hermes-agent/ itself
        candidate = Path(hermes_home) / "hermes-agent"
        if candidate.is_dir():
            return candidate
        candidate = Path(hermes_home)
        if (candidate / "pyproject.toml").is_file():
            return candidate
    return None


@dataclass(frozen=True)
class PatchStatus:
    """Result of checking a single patch."""

    patch_id: str
    status: str  # "ok" | "file_missing" | "marker_missing"
    target: str
    description: str


def load_patch_registry(project_dir: Path) -> dict:
    """Load the patch registry from .framepack/hermes_patches.json.

    Returns an empty registry (version=0, patches=[]) if the file is
    missing or malformed — graceful degradation, never crashes.
    """
    patches_file = Path(project_dir) / ".framepack" / "hermes_patches.json"
    if not patches_file.is_file():
        return _empty_registry()

    try:
        data = json.loads(patches_file.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to read hermes_patches.json: %s", exc)
        return _empty_registry()

    # Ensure required keys
    data.setdefault("version", 0)
    data.setdefault("patches", [])
    data.setdefault("last_known_hermes_version", None)
    data.setdefault("last_known_hyperframes_version", None)
    data.setdefault("upstream_features", [])
    return data


def _empty_registry() -> dict:
    """Default empty registry with all known keys."""
    return {
        "version": 0,
        "patches": [],
        "last_known_hermes_version": None,
        "last_known_hyperframes_version": None,
        "upstream_features": [],
    }


def check_patches(hermes_home: Path, registry: dict) -> list[PatchStatus]:
    """Check all registered patches against the current Hermes installation.

    For each patch:
      - target file missing     → "file_missing"
      - marker not in file       → "marker_missing" (overwritten by upgrade)
      - marker found             → "ok"
    """
    statuses: list[PatchStatus] = []
    hermes_home = Path(hermes_home)

    for patch in registry.get("patches", []):
        target_rel = patch.get("target", "")
        marker = patch.get("marker", "")
        patch_id = patch.get("id", "unknown")
        description = patch.get("description", "")

        target_path = hermes_home / target_rel

        if not target_path.is_file():
            statuses.append(
                PatchStatus(
                    patch_id=patch_id,
                    status="file_missing",
                    target=target_rel,
                    description=description,
                )
            )
            continue

        try:
            content = target_path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            logger.warning("Cannot read %s: %s", target_path, exc)
            statuses.append(
                PatchStatus(
                    patch_id=patch_id,
                    status="file_missing",
                    target=target_rel,
                    description=description,
                )
            )
            continue

        if marker and marker in content:
            statuses.append(
                PatchStatus(
                    patch_id=patch_id,
                    status="ok",
                    target=target_rel,
                    description=description,
                )
            )
        else:
            statuses.append(
                PatchStatus(
                    patch_id=patch_id,
                    status="marker_missing",
                    target=target_rel,
                    description=description,
                )
            )

    return statuses


def patch_audit_report(hermes_home: Path, project_dir: Path) -> str:
    """Generate a human-readable patch audit report.

    Returns a clean summary string suitable for Agent consumption.
    """
    registry = load_patch_registry(project_dir)

    if not registry.get("patches"):
        return "No Hermes patches registered for this project."

    statuses = check_patches(hermes_home, registry)
    issues = [s for s in statuses if s.status != "ok"]

    if not issues:
        return "All Hermes patches intact."

    lines = [f"Hermes patch drift detected ({len(issues)} issue{'s' if len(issues) > 1 else ''}):"]
    for s in issues:
        if s.status == "file_missing":
            lines.append(f"  [{s.patch_id}] {s.target} — file not found")
        elif s.status == "marker_missing":
            lines.append(
                f"  [{s.patch_id}] {s.target} — patch marker missing (overwritten by upgrade?)"
            )
    return "\n".join(lines)


def should_check_patches(project_dir: Path, current_version: str) -> bool:
    """Version-gated trigger: should we run patch checks now?

    Returns True if:
      - First run (last_known_version is None)
      - Hermes version changed since last check

    Returns False if:
      - Same version as last check (skip redundant work)

    Side effect: when returning True, updates last_known_hermes_version
    in the registry file so subsequent calls with the same version skip.
    """
    project_dir = Path(project_dir)
    patches_file = project_dir / ".framepack" / "hermes_patches.json"

    if not patches_file.is_file():
        return False

    try:
        data = json.loads(patches_file.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return False

    last_known = data.get("last_known_hermes_version")

    if last_known == current_version:
        return False

    # Version changed or first run — update and return True
    data["last_known_hermes_version"] = current_version
    try:
        patches_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    except OSError as exc:
        logger.warning("Cannot update hermes_patches.json: %s", exc)

    return True


def run_patch_audit_if_needed(project_dir: Path) -> str | None:
    """Version-gated patch audit — returns a report string or None to skip.

    This is the main entry point for hook integration. It:
      1. Detects the current Hermes version
      2. Checks should_check_patches (version-gated)
      3. If should check, runs patch_audit_report and returns the result
      4. If should skip, returns None

    Returns:
      - Report string if patches need checking (may be "All Hermes patches intact.")
      - None if version hasn't changed (skip)
    """
    project_dir = Path(project_dir)
    version = detect_hermes_version()
    if version is None:
        logger.debug("Cannot detect Hermes version, skipping patch audit")
        return None

    if not should_check_patches(project_dir, version):
        return None

    hermes_install = find_hermes_install()
    if hermes_install is None:
        logger.warning("Cannot locate Hermes installation for patch audit")
        return None

    report = patch_audit_report(hermes_install, project_dir)
    return report
