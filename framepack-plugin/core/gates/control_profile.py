"""Control Profile consistency readiness gate."""

from __future__ import annotations

import re
from pathlib import Path

from core.gates.types import GateResult, GateStatus

_AGGRESSIVE_VERBS = ["SLAM", "CRASH", "BURST", "SHATTER", "PUNCH", "SMASH", "WHIP", "EXPLODE"]
_SOFT_VERBS = ["fade", "drift", "breathe", "float", "glide", "soft", "gentle", "calm"]
_SUPPORT_TERMS = ["visual_style", "reference_dna", "reference", "weapon", "arsenal", "catalog", "template", "style:"]


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _profile_value(frame_md: str, key: str) -> str | None:
    match = re.search(rf"\b{re.escape(key)}\s*:\s*([\w-]+)", frame_md, re.IGNORECASE)
    return match.group(1).lower() if match else None


def _count_terms(text: str, terms: list[str]) -> int:
    return sum(len(re.findall(rf"\b{re.escape(term)}\b", text, re.IGNORECASE)) for term in terms)


def check_control_profile_consistency(project_dir: str | Path) -> GateResult | None:
    """Check weight/output consistency for motion and autonomy controls."""

    project = Path(project_dir)
    frame = _read(project / "frame.md")
    if "control_profile" not in frame:
        return None

    expanded = _read(project / ".hyperframes" / "expanded-prompt.md")
    combined = f"{frame}\n{expanded}"
    issues: list[str] = []

    motion = _profile_value(frame, "motion_dynamism")
    aggressive = _count_terms(expanded, _AGGRESSIVE_VERBS)
    soft = _count_terms(expanded, _SOFT_VERBS)
    if motion == "low" and aggressive >= 3:
        issues.append("motion_dynamism=low conflicts with aggressive animation verbs")
    if motion == "high" and soft >= 4 and aggressive == 0:
        issues.append("motion_dynamism=high conflicts with mostly soft/low-energy verbs")

    autonomy = _profile_value(frame, "creative_autonomy")
    support = _count_terms(combined, _SUPPORT_TERMS)
    if autonomy == "low" and support < 2:
        issues.append("creative_autonomy=low lacks style/reference/weapon support evidence")

    if issues:
        return GateResult(
            name="Control Profile",
            status=GateStatus.YELLOW,
            evidence="; ".join(issues),
            risk="five-weight director controls may be treated as decoration instead of production constraints",
        )

    return GateResult(
        name="Control Profile",
        status=GateStatus.GREEN,
        evidence="control_profile weights match available director evidence",
        risk="",
    )
