"""Storyboard Preview readiness gate."""

from __future__ import annotations

import re
from pathlib import Path

from core.gates.types import GateResult, GateStatus


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _scene_count(text: str) -> int:
    matches = re.findall(r"^#{2,4}\s*Scene\s+\d+\b", text, re.IGNORECASE | re.MULTILINE)
    if matches:
        return len(matches)
    return len(re.findall(r"\bScene\s+\d+\b", text, re.IGNORECASE))


def _has_field(text: str, field: str) -> bool:
    field_re = re.compile(rf"^(?P<indent>\s*)[-*]\s*{re.escape(field)}\s*:\s*(?P<value>.*)$", re.IGNORECASE)
    lines = text.splitlines()
    for index, line in enumerate(lines):
        match = field_re.match(line)
        if not match:
            continue
        if match.group("value").strip():
            return True
        parent_indent = len(match.group("indent"))
        for child in lines[index + 1:]:
            stripped = child.strip()
            if not stripped:
                continue
            child_indent = len(child) - len(child.lstrip())
            if child_indent <= parent_indent:
                return False
            if stripped.startswith(("-", "*")) and len(stripped) > 1:
                return True
        return False
    return False


def _has_true(text: str, field: str) -> bool:
    return bool(re.search(rf"[-*]\s*{re.escape(field)}\s*:\s*true\b", text, re.IGNORECASE))


def _declared_scene_count(text: str) -> int | None:
    match = re.search(r"scene_count\s*:\s*(\d+)", text, re.IGNORECASE)
    return int(match.group(1)) if match else None


def check_storyboard_preview(project_dir: str | Path) -> GateResult | None:
    """Require a user-facing storyboard preview for non-trivial story bibles."""

    project = Path(project_dir)
    expanded = _read(project / ".hyperframes" / "expanded-prompt.md")
    scenes = _scene_count(expanded)
    if scenes < 2:
        return None

    path = project / ".framepack" / "storyboard-preview.md"
    if not path.is_file():
        return GateResult(
            name="Storyboard Preview",
            status=GateStatus.RED,
            evidence="missing .framepack/storyboard-preview.md for multi-scene story bible",
            risk="user-facing creative confirmation was skipped",
        )

    text = _read(path)
    missing = [field for field in ["Visual", "Feel", "Key", "recurring_motifs"] if not _has_field(text, field)]
    if missing:
        return GateResult(
            name="Storyboard Preview",
            status=GateStatus.YELLOW,
            evidence=f".framepack/storyboard-preview.md incomplete: missing {', '.join(missing)}",
            risk="preview exists but does not carry enough creative proof",
        )

    declared = _declared_scene_count(text)
    if declared is not None and declared != scenes:
        return GateResult(
            name="Storyboard Preview",
            status=GateStatus.YELLOW,
            evidence=f"storyboard scene_count={declared} does not match story bible scenes={scenes}",
            risk="user may have confirmed a stale or partial storyboard",
        )

    if not (_has_true(text, "user_confirmed") or _has_field(text, "waiver_reason")):
        return GateResult(
            name="Storyboard Preview",
            status=GateStatus.YELLOW,
            evidence=".framepack/storyboard-preview.md exists but is not user-confirmed",
            risk="creative direction preview was not explicitly accepted",
        )

    return GateResult(
        name="Storyboard Preview",
        status=GateStatus.GREEN,
        evidence=".framepack/storyboard-preview.md (preview contract confirmed)",
        risk="",
    )
