"""Promotion candidates after successful renders.

Framepack does not auto-promote templates/weapons into the main library.
It produces report-first candidates so the user/dev can decide.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from core.path_utils import read_json_or_none, to_posix_string


@dataclass(frozen=True)
class PromotionCandidate:
    """A reusable artifact candidate discovered from a successful case."""
    kind: str  # template | weapon
    name: str
    path: str
    reason: str


def detect_successful_render(project_dir: str | Path) -> bool:
    """Return True if project has a non-empty mp4 render artifact."""
    project = Path(project_dir)
    renders = project / "renders"
    if not renders.is_dir():
        return False
    for mp4 in renders.glob("*.mp4"):
        try:
            if mp4.stat().st_size > 0:
                return True
        except OSError:
            continue
    return False


def collect_promotion_candidates(project_dir: str | Path) -> list[PromotionCandidate]:
    """Collect reusable template/weapon candidates after successful render.

    This function is conservative:
    - no successful render => no candidates
    - candidates are reports, not automatic promotion side effects
    """
    project = Path(project_dir)
    if not detect_successful_render(project):
        return []

    candidates: list[PromotionCandidate] = []

    # Template candidate: rendered index.html plus optional case study evidence.
    index = project / "index.html"
    case_study = project / "CASE-STUDY.md"
    if index.is_file():
        reason = "successful render"
        if case_study.is_file():
            reason += " with case study evidence"
        candidates.append(PromotionCandidate(
            kind="template",
            name=f"{project.name or 'case'}-template",
            path=to_posix_string(index),
            reason=reason,
        ))

    # Project weapons stored in .framepack/weapons.
    weapons_dir = project / ".framepack" / "weapons"
    if weapons_dir.is_dir():
        for file in sorted(weapons_dir.iterdir()):
            if file.is_file() and file.suffix.lower() in (".js", ".css", ".html"):
                candidates.append(PromotionCandidate(
                    kind="weapon",
                    name=file.stem,
                    path=to_posix_string(file),
                    reason="project weapon used in successful render",
                ))

    # Arsenal used weapons can become documentation/reference candidates.
    arsenal = project / ".framepack" / "arsenal.json"
    data = read_json_or_none(arsenal)
    if isinstance(data, dict):
        weapons = data.get("weapons", {})
        if isinstance(weapons, dict):
            for name, meta in weapons.items():
                if isinstance(meta, dict):
                    status = str(meta.get("status") or meta.get("usage") or "").lower()
                    if status and status not in ("used", "active", "bound"):
                        continue
                    source = meta.get("path") or meta.get("source") or str(arsenal)
                else:
                    source = str(arsenal)
                candidates.append(PromotionCandidate(
                    kind="weapon",
                    name=str(name),
                    path=to_posix_string(source),
                    reason="arsenal weapon recorded in successful render",
                ))

    # Deduplicate by (kind, name, path)
    seen: set[tuple[str, str, str]] = set()
    unique: list[PromotionCandidate] = []
    for c in candidates:
        key = (c.kind, c.name, c.path)
        if key in seen:
            continue
        seen.add(key)
        unique.append(c)
    return unique


def write_promotion_report(project_dir: str | Path, candidates: list[PromotionCandidate]) -> Path:
    """Write .framepack/promotion-candidates.md and return its path."""
    project = Path(project_dir)
    fp = project / ".framepack"
    fp.mkdir(parents=True, exist_ok=True)
    path = fp / "promotion-candidates.md"

    lines = [
        "# Promotion Candidates",
        "",
        "Report-first candidates for template/weapon promotion after successful render.",
        "No automatic promotion has been performed.",
        "",
        f"Total candidates: {len(candidates)}",
        "",
    ]
    if candidates:
        lines.append("| kind | name | path | reason |")
        lines.append("|---|---|---|---|")
        for c in candidates:
            lines.append(f"| {c.kind} | {c.name} | {c.path} | {c.reason} |")
    else:
        lines.append("No candidates detected.")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    return path
