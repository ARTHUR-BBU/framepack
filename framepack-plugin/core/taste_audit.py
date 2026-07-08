"""Report-first Kinetic Taste Audit for Framepack creative artifacts.

Taste Audit is separate from Quality Audit. It does not lint, render, or mutate
files. It gives director critique for frame.md and expanded-prompt.md.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
from pathlib import Path
import re
from typing import Any

from .taste_grammar import moves_by_energy_level
from .taste_html_detectors import detect_html_taste_issues
from .taste_read import TasteContext, parse_taste_context
from .taste_rules import get_rule, priority_for_audit_severity, severity_for
from .taste_text_detectors import detect_text_taste_issues


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


SEVERITIES = ("blocker", "risk", "suggestion", "note")


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.is_file() else ""


def _summarize(issues: list[TasteAuditIssue]) -> dict[str, int]:
    summary = {severity: 0 for severity in SEVERITIES}
    for issue in issues:
        summary[issue.severity] = summary.get(issue.severity, 0) + 1
    return summary


_PRIORITY_TO_SEVERITY = {
    "P0": "blocker",
    "P1": "risk",
    "P2": "suggestion",
    "P3": "note",
}

_SEVERITY_TO_PRIORITY = {
    "blocker": "P0",
    "risk": "P1",
    "suggestion": "P2",
    "note": "P3",
}


def _priority_to_severity(priority: str, fallback: str) -> str:
    return _PRIORITY_TO_SEVERITY.get(priority, fallback)


def _dial_adjusted_priority(code: str, priority: str, taste_context: TasteContext) -> str:
    dials = taste_context.dials
    motion = dials.get("motion_intensity")
    variance = dials.get("design_variance")
    density = dials.get("visual_density")

    if code == "motion_claim_unproven" and motion is not None:
        if motion >= 8:
            return "P0"
        if motion <= 3 and priority == "P1":
            return "P2"
    if code == "no_controlled_surprise" and variance is not None:
        if variance <= 3:
            return "P3"
        if variance >= 8:
            return "P1"
    if code in {"flat_background", "decorative_generated_surface"} and density is not None:
        if density <= 3:
            return "P3"
        if density >= 8 and priority == "P2":
            return "P1"
    return priority


def _refine_issue_severities(issues: list[TasteAuditIssue], taste_context: TasteContext) -> None:
    for issue in issues:
        try:
            rule = get_rule(issue.code)
        except KeyError:
            continue
        priority = priority_for_audit_severity(issue.severity)
        if issue.code in {"product_absence", "text_dominance", "opening_visual_absence"} and taste_context.register in rule.registers:
            priority = severity_for(rule, register=taste_context.register, dials=taste_context.dials)
        priority = _dial_adjusted_priority(issue.code, priority, taste_context)
        issue.severity = _priority_to_severity(priority, issue.severity)


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
        # Query the single source of truth — no shadow vocabulary
        high_energy_moves = set(moves_by_energy_level("high"))
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



def _audit_text_dominance(expanded_prompt: str, expanded_path: Path) -> list[TasteAuditIssue]:
    text_lines = re.findall(r"^\s*(?:text|copy|headline|title)\s*:\s*(.+)$", expanded_prompt, re.I | re.M)
    word_count = sum(len(re.findall(r"\b\w+\b", line)) for line in text_lines)
    product_none = re.search(r"\bproduct\s*:\s*(?:none|n/?a|null|missing)\b", expanded_prompt, re.I)
    if len(text_lines) >= 3 and word_count >= 22 and product_none:
        return [
            TasteAuditIssue(
                code="text_dominance",
                severity="risk",
                message="Text is carrying the film while product presence is missing; this can collapse into animated PPT instead of a commercial video.",
                suggestion="Promote product visuals, UI, footage, or proof imagery to hero status; reduce copy to premium labels and cue words.",
                path=str(expanded_path),
                details={"text_lines": len(text_lines), "word_count": word_count},
            )
        ]
    return []


def _audit_product_absence(expanded_prompt: str, expanded_path: Path) -> list[TasteAuditIssue]:
    launch_signal = re.search(r"product\s+launch|website\s+to\s+video|commercial|brand\s+video", expanded_prompt, re.I)
    production_text = re.sub(r"product\s+launch|website\s+to\s+video|commercial|brand\s+video", "", expanded_prompt, flags=re.I)
    product_signal = re.search(
        r"\b(mockup|device|screenshot|screen|ui|interface|app\s+screen|logo|asset|footage|product\s+(?:visual|shot|hero|image|photo))\b",
        production_text,
        re.I,
    )
    if launch_signal and not product_signal:
        return [
            TasteAuditIssue(
                code="product_absence",
                severity="risk",
                message="Commercial/product intent is declared, but no concrete product visual is planned.",
                suggestion="Add product screenshots, UI cards, device mockups, logo moments, or explicit asset waivers before production.",
                path=str(expanded_path),
            )
        ]
    return []


def _audit_flat_background(expanded_prompt: str, expanded_path: Path) -> list[TasteAuditIssue]:
    flat_bg = re.search(r"background\s*:\s*(?:solid|plain|flat)\b", expanded_prompt, re.I)
    no_depth = re.search(r"depth\s+layers?\s*:\s*(?:none|no|0)\b", expanded_prompt, re.I)
    if flat_bg and no_depth:
        return [
            TasteAuditIssue(
                code="flat_background",
                severity="suggestion",
                message="Scene uses a flat/solid background with no depth layers; this risks a slide-deck look.",
                suggestion="Add 2-5 restrained atmosphere layers: product shadow, gradient wash, grid, particles, depth cards, or motif echoes.",
                path=str(expanded_path),
            )
        ]
    return []


def _audit_weapon_preset_missing(project: Path) -> list[TasteAuditIssue]:
    plan_path = project / ".framepack" / "weapon-load-plan.json"
    if not plan_path.is_file():
        return []
    try:
        data = json.loads(plan_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []

    issues: list[TasteAuditIssue] = []
    for scene in data.get("scenes", []):
        for match in scene.get("matches", []):
            if match.get("reuse_mode") in {"full", "adapt"} and not match.get("preset_id"):
                issues.append(
                    TasteAuditIssue(
                        code="weapon_preset_missing",
                        severity="suggestion",
                        message="A selected reusable weapon has no preset recommendation; the Agent may use the tool without a quality recipe.",
                        suggestion="Add a preset or params_hint for this weapon, or record a waiver explaining why the scene is hand-tuned.",
                        path=str(plan_path),
                        scene=str(scene.get("scene") or scene.get("scene_id") or ""),
                        details={"weapon_id": match.get("id") or match.get("weapon_id")},
                    )
                )
    return issues


def _audit_bgm_unplanned(expanded_prompt: str, expanded_path: Path) -> list[TasteAuditIssue]:
    audio_signal = re.search(r"\b(audio|bgm|music|soundtrack|rhythm)\b", expanded_prompt, re.I)
    unplanned = re.search(r"\b(?:audio|bgm|music)\s*:\s*(?:tbd|none|missing|unplanned)|no\s+bgm\s+plan", expanded_prompt, re.I)
    if audio_signal and unplanned:
        return [
            TasteAuditIssue(
                code="bgm_unplanned",
                severity="suggestion",
                message="Rhythm/audio is mentioned but BGM planning is unresolved; motion may lose its spine.",
                suggestion="Choose a BGM direction, beat cues, or an explicit no-music waiver before render planning.",
                path=str(expanded_path),
            )
        ]
    return []


def _has_proof_frames(project: Path) -> bool:
    roots = [
        project / ".framepack" / "proof-frames",
        project / ".framepack" / "proofs",
        project / "proofs",
        project / "snapshots",
    ]
    return any(root.is_dir() and any(root.rglob("*.png")) for root in roots)


def _has_canonical_motion_proof_frames(project: Path) -> bool:
    proof_root = project / ".framepack" / "proof-frames"
    return proof_root.is_dir() and any(proof_root.rglob("*.png"))


def _audit_no_proof_frames(project: Path) -> list[TasteAuditIssue]:
    html_path = project / "index.html"
    if html_path.is_file() and not _has_proof_frames(project):
        return [
            TasteAuditIssue(
                code="no_proof_frames",
                severity="suggestion",
                message="index.html exists but no proof frames/snapshots were found; taste cannot be checked from prose alone.",
                suggestion="Capture representative proof frames or a contact sheet before pre-render taste sign-off.",
                path=str(html_path),
            )
        ]
    return []


def _has_significant_motion_claim(expanded_prompt: str, html: str) -> bool:
    text = expanded_prompt + "\n" + html
    prose_motion = re.search(
        r"\b(high[-\s]?energy|kinetic\s+choreography|morph(?:ing)?|parallax|trail(?:s)?|snap\s+CTA|explodes?\s+into)\b",
        text,
        re.I,
    )
    code_motion = re.search(r"(?:\bgsap\.|\banime\s*\(|@keyframes\b)", text, re.I)
    return bool(prose_motion or code_motion)


def _audit_motion_claim_unproven(project: Path, expanded_prompt: str, html: str) -> list[TasteAuditIssue]:
    if not html or not _has_significant_motion_claim(expanded_prompt, html) or _has_canonical_motion_proof_frames(project):
        return []
    proof_path = project / ".framepack" / "proof-frames"
    return [
        TasteAuditIssue(
            code="motion_claim_unproven",
            severity="risk",
            message="The plan claims significant motion but no proof frames/contact sheet demonstrate it.",
            suggestion="Attach representative proof frames/contact sheet or lower the motion claim to match what is actually shown.",
            path=str(proof_path),
        )
    ]


def _audit_commercial_signals(project: Path, expanded_prompt: str, expanded_path: Path) -> list[TasteAuditIssue]:
    issues: list[TasteAuditIssue] = []
    if expanded_prompt:
        issues.extend(_audit_text_dominance(expanded_prompt, expanded_path))
        issues.extend(_audit_product_absence(expanded_prompt, expanded_path))
        issues.extend(_audit_flat_background(expanded_prompt, expanded_path))
        issues.extend(_audit_bgm_unplanned(expanded_prompt, expanded_path))
    issues.extend(_audit_weapon_preset_missing(project))
    issues.extend(_audit_no_proof_frames(project))
    return issues


def audit_project(project_dir: str | Path) -> TasteAuditReport:
    project = Path(project_dir)
    frame_path = project / "frame.md"
    expanded_path = project / ".hyperframes" / "expanded-prompt.md"
    html_path = project / "index.html"
    frame_md = _read(frame_path)
    expanded_prompt = _read(expanded_path)
    html = _read(html_path)
    taste_context = parse_taste_context(frame_md, expanded_prompt)

    issues: list[TasteAuditIssue] = []
    if expanded_prompt and not taste_context.explicit_taste_read:
        issues.append(
            TasteAuditIssue(
                code="missing_taste_read",
                severity="risk",
                message="No explicit taste_read declares the video register, audience, visual family, and anti-references.",
                suggestion="Add a taste_read block naming register, audience, visual_family, and anti_references before expanding or rendering.",
                path=str(frame_path),
                details={"inferred_register": taste_context.register},
            )
        )
    for context_issue in taste_context.issues:
        if context_issue.get("code") == "invalid_taste_dial":
            issues.append(
                TasteAuditIssue(
                    code="invalid_taste_dial",
                    severity="suggestion",
                    message=context_issue.get("message", "taste_dials must be integers from 1 to 10."),
                    suggestion="Set design_variance, motion_intensity, and visual_density to integers from 1 to 10.",
                    path=str(frame_path),
                )
            )
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
        issues.extend(detect_text_taste_issues(frame_md, expanded_prompt, taste_context))
        issues.extend(_audit_generic_fade_stack(expanded_prompt, expanded_path, frame_md=frame_md))
        issues.extend(_audit_static_mockup(expanded_prompt, expanded_path))
    if html:
        for html_issue in detect_html_taste_issues(html):
            issues.append(
                TasteAuditIssue(
                    code=html_issue.code,
                    severity=html_issue.severity,
                    message=html_issue.message,
                    suggestion=html_issue.suggestion,
                    path=str(html_path),
                    scene=html_issue.scene,
                    details=html_issue.details,
                )
            )
        issues.extend(_audit_motion_claim_unproven(project, expanded_prompt, html))
    issues.extend(_audit_commercial_signals(project, expanded_prompt, expanded_path))
    issues.extend(_audit_surprise_usage(frame_md, expanded_prompt, frame_path, expanded_path))
    issues.extend(_audit_motif_transformation(frame_md, expanded_prompt, frame_path, expanded_path))
    _refine_issue_severities(issues, taste_context)

    return TasteAuditReport(str(project), issues, _summarize(issues))


def audit_commercial_taste(project_dir: str | Path) -> TasteAuditReport:
    """Compatibility API for Phase 3 commercial taste audit."""
    return audit_project(project_dir)
