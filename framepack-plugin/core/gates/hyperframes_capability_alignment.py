"""HyperFrames capability alignment readiness gate."""

from __future__ import annotations

import re
from pathlib import Path

from core.gates.types import GateResult, GateStatus

_TRIGGER_RE = re.compile(
    r"https?://|\b(url|website|homepage|landing\s+page|capture|registry|sponsor\s+wall|logo\s+wall|parallax|skills\s+pack|hyperframes\s+add)\b|官网|网页|活动页|赞助商|标志墙",
    re.IGNORECASE,
)
_DECISION_RE = re.compile(r"^\s*-\s*(used|waived)\s*:\s*(\S+)(.*)", re.IGNORECASE | re.MULTILINE)

_WORKFLOW_SKILL_IDS = {
    "product-launch-video",
    "website-to-video",
    "faceless-explainer",
    "pr-to-video",
    "embedded-captions",
    "talking-head-recut",
    "motion-graphics",
    "music-to-video",
    "slideshow",
    "general-video",
    "remotion-to-hyperframes",
}


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


def _parse_decisions(text: str) -> list[tuple[str, str, str]]:
    """Parse decisions into [(action, target, reason), ...]."""
    decisions = []
    for m in _DECISION_RE.finditer(text):
        action = m.group(1).lower()
        target = m.group(2).strip().rstrip("()")
        reason = m.group(3).strip().strip("()").strip()
        decisions.append((action, target, reason))
    return decisions


def _check_evidence(project: Path, action: str, target: str, reason: str) -> bool:
    """Return True if the declaration has supporting evidence."""
    target_lower = target.lower().strip()

    if action == "used":
        # Workflow skills need overlay-receipt
        for skill_id in _WORKFLOW_SKILL_IDS:
            if skill_id in target_lower:
                return (project / ".framepack" / "overlay-receipt.md").exists()
        if "capture" in target_lower:
            return (project / "capture").is_dir() or (project / "capture" / "tokens.json").exists()
        if "catalog" in target_lower or "skills" in target_lower:
            return (project / ".framepack" / "catalog-decision.md").exists()
        # Generic used with descriptive text — treat as evidenced
        return True

    if action == "waived":
        return bool(reason)

    return True


def check_hyperframes_capability_alignment(project_dir: str | Path) -> GateResult | None:
    """Warn when a project likely needs official HyperFrames capability routing."""

    project = Path(project_dir)
    artifact = project / ".framepack" / "hyperframes-capability-alignment.md"
    artifact_text = _read(artifact)

    if artifact_text:
        decisions = _parse_decisions(artifact_text)
        if decisions:
            all_evidenced = all(
                _check_evidence(project, action, target, reason)
                for action, target, reason in decisions
            )
            if all_evidenced:
                return GateResult(
                    name="HyperFrames Capability Alignment",
                    status=GateStatus.GREEN,
                    evidence=".framepack/hyperframes-capability-alignment.md (used/waived decisions with evidence)",
                    risk="",
                )
            missing = [
                f"{action}:{target}"
                for action, target, reason in decisions
                if not _check_evidence(project, action, target, reason)
            ]
            return GateResult(
                name="HyperFrames Capability Alignment",
                status=GateStatus.YELLOW,
                evidence=f"decisions exist but evidence missing for: {', '.join(missing)}",
                risk="Declaration without evidence — capability may not have been actually used",
            )

    if _TRIGGER_RE.search(_project_text(project)):
        return GateResult(
            name="HyperFrames Capability Alignment",
            status=GateStatus.YELLOW,
            evidence="website/catalog/logo/sponsor/capture signal found; record HyperFrames capture/catalog/skills-pack used or waived",
            risk="Framepack may duplicate official HyperFrames capabilities instead of directing them",
        )
    return None
