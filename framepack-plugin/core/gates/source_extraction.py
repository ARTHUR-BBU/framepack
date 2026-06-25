"""Source Extraction readiness gate.

URL-driven projects should not jump straight into directing from a naked link.
They need source-intake evidence: how the source was read, what it says, and
what must be preserved.
"""

from __future__ import annotations

import re
from pathlib import Path

from core.gates.types import GateResult, GateStatus

_URL_RE = re.compile(r"https?://\S+", re.IGNORECASE)


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _has_source_url(project_dir: Path) -> bool:
    candidates = [
        project_dir / ".framepack" / "handoff-manifest.md",
        project_dir / ".framepack" / "director-inspect.md",
        project_dir / "frame.md",
        project_dir / ".hyperframes" / "expanded-prompt.md",
    ]
    return any(_URL_RE.search(_read(path)) for path in candidates)


def _has_filled_field(text: str, field: str) -> bool:
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


def check_source_extraction(project_dir: str | Path) -> GateResult | None:
    """Require source-intake for URL/source-driven projects.

    Returns None when no source URL is detected so the board is not noisy for
    asset-only or fully self-contained briefs.
    """

    project = Path(project_dir)
    if not _has_source_url(project):
        return None

    path = project / ".framepack" / "source-intake.md"
    if not path.is_file():
        return GateResult(
            name="Source Extraction",
            status=GateStatus.RED,
            evidence="missing .framepack/source-intake.md for URL/source-driven project",
            risk="director may be guessing from a link instead of extracted source content",
        )

    text = _read(path)
    method_failed = re.search(r"extraction_method\s*:\s*failed", text, re.IGNORECASE)
    has_failure_reason = _has_filled_field(text, "extraction_failed_reason") or _has_filled_field(text, "waiver_reason")
    if method_failed and has_failure_reason:
        return GateResult(
            name="Source Extraction",
            status=GateStatus.YELLOW,
            evidence=".framepack/source-intake.md records extraction failed/waived",
            risk="source was not machine-read; verify manual summary before final render",
        )

    required = ["extraction_method", "source_summary", "narrative_type", "must_preserve_points"]
    missing = [field for field in required if not _has_filled_field(text, field)]
    if missing:
        return GateResult(
            name="Source Extraction",
            status=GateStatus.YELLOW,
            evidence=f".framepack/source-intake.md incomplete: missing {', '.join(missing)}",
            risk="source extraction exists but does not fully constrain the director brief",
        )

    return GateResult(
        name="Source Extraction",
        status=GateStatus.GREEN,
        evidence=".framepack/source-intake.md (extraction contract complete)",
        risk="",
    )
