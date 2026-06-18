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
    # English terms (original)
    if "Kinetic Continuity" in expanded_prompt and "Action relay" in expanded_prompt:
        return True
    # Chinese terms
    if "动能连续性" in expanded_prompt and "动作接力" in expanded_prompt:
        return True
    # Structural signals: multiple scenes with incoming/outgoing/transition markers
    # This catches emerging/editorial styles that use different terminology
    incoming_count = len(re.findall(r"\bincoming\b", expanded_prompt, re.I))
    outgoing_count = len(re.findall(r"\boutgoing\b", expanded_prompt, re.I))
    transition_count = len(re.findall(r"\btransition\b", expanded_prompt, re.I))
    if incoming_count >= 2 and outgoing_count >= 2 and transition_count >= 1:
        return True
    return False


def _is_blur_crossfade_only(transitions: list[str]) -> bool:
    """Check if all matched transitions are blur crossfade (emerging style)."""
    for t in transitions:
        # Strip "transition:" prefix, check if it's exclusively blur-crossfade
        cleaned = re.sub(r"^transition[^:]*:\s*", "", t, flags=re.I).strip()
        if not re.match(r"^blur\s*(\-?\s*)?crossfade", cleaned, re.I):
            return False
    return True


def _is_emerging_style(frame_md: str) -> bool:
    """Detect emerging style from frame.md context."""
    # High energy or data/AI/cyberpunk reference DNA
    if re.search(r"energy.*high|energy_arc.*crescendo|energy_arc.*build_to_snap", frame_md, re.I):
        return True
    if re.search(r"data_cathedral|kinetic_type_event|ambient_grid", frame_md, re.I):
        return True
    # No gravity (floating elements typical of emerging)
    if re.search(r"gravity.*none", frame_md, re.I):
        return True
    return False


def _audit_generic_fade_stack(expanded_prompt: str, path: Path, frame_md: str = "") -> list[TasteAuditIssue]:
    all_transitions = re.findall(r"transition[^\n]*(?:crossfade|fade|blur\s+crossfade)", expanded_prompt, re.I)
    blur_only = _is_blur_crossfade_only(all_transitions)

    if len(all_transitions) < 3:
        return []

    if blur_only and _is_emerging_style(frame_md):
        # Emerging style legitimately uses blur crossfade — downgrade to note
        return [
            TasteAuditIssue(
                code="generic_fade_stack",
                severity="note",
                message="Multiple blur-crossfade transitions detected; this is acceptable in emerging/data styles but verify it doesn't feel repetitive.",
                suggestion="Consider varying at least one transition (hard cut, data-morph, or grid-collapse) for visual rhythm.",
                path=str(path),
                details={"count": len(all_transitions), "blur_only": True},
            )
        ]

    # Plain fade or luxury blur-crossfade stack → still risk
    return [
        TasteAuditIssue(
            code="generic_fade_stack",
            severity="risk",
            message="Multiple transitions rely on fade/crossfade language; the film may feel like independent slides instead of one kinetic world.",
            suggestion="Replace at least one fade with Mask → Portal, Echo → Transform, or a motif-driven transition.",
            path=str(path),
            details={"count": len(all_transitions), "blur_only": blur_only},
        )
    ]


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
    filtered: list[str] = []
    for mention in mentions:
        value = mention.strip()
        normalized = value.strip('"\'').strip().lower()
        if normalized in {"none", "no", "null", "false", "n/a", "na"}:
            continue
        filtered.append(value)
    return filtered


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


def _is_intentionally_restrained(frame_md: str) -> bool:
    """Detect if the frame.md intentionally restrains surprise (editorial/minimal styles).

    Signs of intentional restraint:
    - energy_arc contains 'restrained' or 'clarity' (editorial build)
    - taste_moves contain only low-energy moves (no editorial_punch, no system_awakening)
    - atmosphere mentions restraint (Chinese: 克制)
    """
    # Check energy_arc for restraint signals
    if re.search(r"restrained_build|restrained.*clarity|calm_hold", frame_md, re.I):
        return True
    # Check if taste_moves are exclusively low-energy
    taste_moves_match = re.search(r"taste_moves:\s*\n((?:\s+-\s+.+\n)+)", frame_md)
    if taste_moves_match:
        moves_block = taste_moves_match.group(1)
        high_energy_moves = {"editorial_punch", "system_awakening", "kinetic_typography_attack",
                             "data_cathedral", "interface_ballet"}
        moves_found = set()
        for move_match in re.finditer(r"-\s+(\w+)", moves_block):
            move = move_match.group(1).lower().strip()
            moves_found.add(move)
        if moves_found and not (moves_found & high_energy_moves):
            return True
    # Check atmosphere for restraint
    if re.search(r"克制|restrained|intentional.*minimal", frame_md, re.I):
        return True
    return False


def _audit_surprise_usage(frame_md: str, expanded_prompt: str, frame_path: Path, expanded_path: Path) -> list[TasteAuditIssue]:
    text = frame_md + "\n" + expanded_prompt
    issues: list[TasteAuditIssue] = []
    has_taste = "taste:" in frame_md or "taste_moves" in frame_md
    mentions = _surprise_mentions(text)

    if has_taste and not mentions:
        severity = "note" if _is_intentionally_restrained(frame_md) else "suggestion"
        message = (
            "Taste direction is intentionally restrained; no surprise operator expected."
            if severity == "note"
            else "Taste direction exists but no controlled surprise is declared; output may be tasteful but too safe."
        )
        suggestion = None if severity == "note" else (
            "Add one optional surprise_operator with intent, or explicitly document why this piece should stay restrained."
        )
        issues.append(
            TasteAuditIssue(
                code="no_controlled_surprise",
                severity=severity,
                message=message,
                suggestion=suggestion,
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


def _is_structural_motif(motif_value: str) -> bool:
    """Check if a motif is structural (grid, line, pattern) vs narrative (character, object).

    Structural motifs are ambient patterns that don't need a 'becomes X' narrative arc.
    """
    structural_patterns = {
        "grid", "line", "lines", "scanline", "scanlines", "border",
        "frame", "pattern", "noise", "grain", "texture", "dot", "dots",
    }
    normalized = motif_value.lower().strip().replace("-", "_").replace(" ", "_")
    parts = normalized.split("_")
    return bool(set(parts) & structural_patterns)


def _audit_motif_transformation(frame_md: str, expanded_prompt: str, frame_path: Path, expanded_path: Path) -> list[TasteAuditIssue]:
    motif_match = re.search(r"^\s*motif\s*:\s*(.+)$", frame_md, re.I | re.M)
    if not motif_match:
        return []

    motif_value = motif_match.group(1).strip()
    structural = _is_structural_motif(motif_value)

    transformation_signal = re.search(
        r"→|becomes|turns\s+into|transforms?|mutation|reincarnation|变成|转化|转生|变形",
        expanded_prompt,
        re.I,
    )
    if not transformation_signal:
        if structural:
            # Structural motifs don't require narrative transformation — note at most
            return [
                TasteAuditIssue(
                    code="motif_not_transformed",
                    severity="note",
                    message=f"Structural motif '{motif_value}' has no transformation arc; this is acceptable for grid/pattern motifs.",
                    suggestion="If this motif should evolve, add a state path. Otherwise, document it as a persistent structural element.",
                    path=str(expanded_path if expanded_prompt else frame_path),
                )
            ]
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
        issues.extend(_audit_generic_fade_stack(expanded_prompt, expanded_path, frame_md=frame_md))
        issues.extend(_audit_static_mockup(expanded_prompt, expanded_path))
    issues.extend(_audit_surprise_usage(frame_md, expanded_prompt, frame_path, expanded_path))
    issues.extend(_audit_motif_transformation(frame_md, expanded_prompt, frame_path, expanded_path))

    return TasteAuditReport(str(project), issues, _summary(issues))
