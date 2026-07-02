"""HyperFrames capability alignment readiness gate."""

from __future__ import annotations

import re
from pathlib import Path

from core.gates.types import GateResult, GateStatus

_TRIGGER_RE = re.compile(
    r"https?://|\b(url|website|homepage|landing\s+page|capture|registry|sponsor\s+wall|logo\s+wall|parallax|skills\s+pack|hyperframes\s+add)\b|官网|网页|活动页|赞助商|标志墙",
    re.IGNORECASE,
)
_DECISION_RE = re.compile(r"^\s*-\s*(used|waived)\s*:\s*\S", re.IGNORECASE | re.MULTILINE)


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _project_text(project: Path) -> str:
    rels = [
        ".framepack/asset-intake.md",
        ".framepack/director-inspect.md",
        ".framepack/handoff-manifest.md",
        ".framepack/catalog-decision.md",
        ".hyperframes/expanded-prompt.md",
    ]
    return "\n".join(_read(project / rel) for rel in rels)


def check_hyperframes_capability_alignment(project_dir: str | Path) -> GateResult | None:
    """Warn when a project likely needs official HyperFrames capability routing."""

    project = Path(project_dir)
    artifact = project / ".framepack" / "hyperframes-capability-alignment.md"
    artifact_text = _read(artifact)
    if artifact_text and _DECISION_RE.search(artifact_text):
        return GateResult(
            name="HyperFrames Capability Alignment",
            status=GateStatus.GREEN,
            evidence=".framepack/hyperframes-capability-alignment.md (used/waived decisions recorded)",
            risk="",
        )

    if _TRIGGER_RE.search(_project_text(project)):
        return GateResult(
            name="HyperFrames Capability Alignment",
            status=GateStatus.YELLOW,
            evidence="website/catalog/logo/sponsor/capture signal found; record HyperFrames capture/catalog/skills-pack used or waived",
            risk="Framepack may duplicate official HyperFrames capabilities instead of directing them",
        )
    return None
