"""Report-first Kinetic Taste Audit for Framepack creative artifacts.

Taste Audit is separate from Quality Audit. It does not lint, render, or mutate
files. It gives director critique for frame.md and expanded-prompt.md.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
import re
from typing import Any


@dataclass
class TasteAuditIssue:
    code: str
    severity: str
    message: str
    suggestion: str | None = None
    path: str | None = None
    scene: str | None = None
    details: dict[str, Any] | None = None


@dataclass
class TasteAuditReport:
    project_dir: str
    issues: list[TasteAuditIssue]
    summary: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": "framepack_taste_audit",
            "project_dir": self.project_dir,
            "summary": dict(self.summary),
            "issues": [asdict(issue) for issue in self.issues],
        }


SEVERITIES = ("risk", "suggestion", "note")


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _summary(issues: list[TasteAuditIssue]) -> dict[str, int]:
    summary = {severity: 0 for severity in SEVERITIES}
    for issue in issues:
        summary[issue.severity] = summary.get(issue.severity, 0) + 1
    return summary


def _has_taste_block(frame_md: str) -> bool:
    return "taste:" in frame_md and "visual_physics" in frame_md


def _has_kinetic_continuity(expanded_prompt: str) -> bool:
    return "Kinetic Continuity" in expanded_prompt and "Action relay" in expanded_prompt


def _audit_generic_fade_stack(expanded_prompt: str, path: Path) -> list[TasteAuditIssue]:
    transition_mentions = re.findall(r"transition[^\n]*(?:crossfade|fade|blur\s+crossfade)", expanded_prompt, re.I)
    if len(transition_mentions) >= 3:
        return [
            TasteAuditIssue(
                code="generic_fade_stack",
                severity="risk",
                message="Multiple transitions rely on fade/crossfade language; the film may feel like independent slides instead of one kinetic world.",
                suggestion="Replace at least one fade with Mask → Portal, Echo → Transform, or a motif-driven transition.",
                path=str(path),
                details={"count": len(transition_mentions)},
            )
        ]
    return []


def _audit_static_mockup(expanded_prompt: str, path: Path) -> list[TasteAuditIssue]:
    if re.search(r"static\s+mockup|mockup\s+(?:centered|sits|placed|shown|displayed)", expanded_prompt, re.I):
        return [
            TasteAuditIssue(
                code="static_mockup_risk",
                severity="risk",
                message="Mockup appears as a static placed object; this risks a screenshot-on-slide feel.",
                suggestion="Use Interface Ballet or Product Reveal Ritual: choreograph the mockup entrance, relationship to UI cards, and outgoing transition seed.",
                path=str(path),
            )
        ]
    return []


def _surprise_mentions(text: str) -> list[str]:
    mentions = re.findall(r"\bsurprise(?:_operator)?\s*:\s*([^\n]+)", text, re.I)
    mentions.extend(re.findall(r"\bsurprise\s*=\s*([^\n]+)", text, re.I))
    return [mention.strip() for mention in mentions]


def _frame_surprise_operator_requires_intent(frame_md: str) -> bool:
    lines = frame_md.splitlines()
    missing_intent = False
    for index, line in enumerate(lines):
        match = re.match(r"^(?P<indent>\s*)surprise_operator\s*:\s*(?P<inline>.*)$", line, re.I)
        if not match:
            continue

        parent_indent = len(match.group("indent"))
        operator_text = match.group("inline").strip()
        body_lines: list[str] = []
        for child in lines[index + 1 :]:
            if not child.strip():
                continue
            child_indent = len(child) - len(child.lstrip())
            if child_indent <= parent_indent:
                break
            body_lines.append(child)

        if body_lines:
            operator_text = "\n".join(body_lines)
        if not re.search(r"(^|[{,])\s*intent\s*:", operator_text, re.I | re.M):
            missing_intent = True
    return missing_intent


def _audit_surprise_usage(frame_md: str, expanded_prompt: str, frame_path: Path, expanded_path: Path) -> list[TasteAuditIssue]:
    text = frame_md + "\n" + expanded_prompt
    issues: list[TasteAuditIssue] = []
    has_taste = "taste:" in frame_md or "taste_moves" in frame_md
    mentions = _surprise_mentions(text)

    if has_taste and not mentions:
        issues.append(
            TasteAuditIssue(
                code="no_controlled_surprise",
                severity="suggestion",
                message="Taste direction exists but no controlled surprise is declared; output may be tasteful but too safe.",
                suggestion="Add one optional surprise_operator with intent, or explicitly document why this piece should stay restrained.",
                path=str(frame_path),
            )
        )
    if len(mentions) > 2:
        issues.append(
            TasteAuditIssue(
                code="too_many_surprises",
                severity="risk",
                message="More than two surprise operators are declared; surprise may become random chaos instead of controlled contrast.",
                suggestion="Keep at most 1-2 surprise operators and make each serve the brand/story.",
                path=str(expanded_path if expanded_prompt else frame_path),
                details={"count": len(mentions), "mentions": mentions},
            )
        )
    if _frame_surprise_operator_requires_intent(frame_md):
        issues.append(
            TasteAuditIssue(
                code="surprise_without_intent",
                severity="risk",
                message="A frame.md surprise_operator is declared without an intent; controlled surprise needs a reason, not random weirdness.",
                suggestion="Add an intent explaining what the surprise should make the viewer feel or remember.",
                path=str(frame_path),
            )
        )
    return issues


def _audit_motif_transformation(frame_md: str, expanded_prompt: str, frame_path: Path, expanded_path: Path) -> list[TasteAuditIssue]:
    if not re.search(r"^\s*motif\s*:", frame_md, re.I | re.M):
        return []
    transformation_signal = re.search(
        r"→|becomes|turns\s+into|transforms?|mutation|reincarnation|变成|转化|转生|变形",
        expanded_prompt,
        re.I,
    )
    if not transformation_signal:
        return [
            TasteAuditIssue(
                code="motif_not_transformed",
                severity="suggestion",
                message="A visual motif is declared but the expanded prompt does not describe how it transforms across scenes.",
                suggestion="Give the motif a state path, e.g. pearl → halo → portal → CTA ring.",
                path=str(expanded_path if expanded_prompt else frame_path),
            )
        ]
    return []


def audit_project(project_dir: str | Path) -> TasteAuditReport:
    project = Path(project_dir)
    frame_path = project / "frame.md"
    expanded_path = project / ".hyperframes" / "expanded-prompt.md"
    frame_md = _read(frame_path)
    expanded_prompt = _read(expanded_path)

    issues: list[TasteAuditIssue] = []
    if frame_md and not _has_taste_block(frame_md):
        issues.append(
            TasteAuditIssue(
                code="missing_taste_block",
                severity="suggestion",
                message="frame.md has no compact taste block; Director output may lack visual physics and controlled surprise.",
                suggestion="Add taste.reference_dna, taste.visual_physics, taste.energy_arc, taste.motif, taste_moves, and optional surprise_operator.",
                path=str(frame_path),
            )
        )
    if expanded_prompt and not _has_kinetic_continuity(expanded_prompt):
        issues.append(
            TasteAuditIssue(
                code="missing_kinetic_continuity",
                severity="suggestion",
                message="expanded-prompt.md has no Kinetic Continuity blocks; scenes may behave like isolated entrances.",
                suggestion="For each scene, add Incoming energy, Action relay, Outgoing transition seed, and Motif state.",
                path=str(expanded_path),
            )
        )

    if expanded_prompt:
        issues.extend(_audit_generic_fade_stack(expanded_prompt, expanded_path))
        issues.extend(_audit_static_mockup(expanded_prompt, expanded_path))
    issues.extend(_audit_surprise_usage(frame_md, expanded_prompt, frame_path, expanded_path))
    issues.extend(_audit_motif_transformation(frame_md, expanded_prompt, frame_path, expanded_path))

    return TasteAuditReport(str(project), issues, _summary(issues))
