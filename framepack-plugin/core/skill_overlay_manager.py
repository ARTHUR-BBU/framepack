"""Apply Framepack-shipped hardening overlays to local skills safely.

The overlay manager owns provenance-marked text blocks. It must never bulldoze a
whole skill file, because local HyperFrames skills may contain official upstream
content, Framepack-shipped hardening, and user-local hardening.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass(frozen=True)
class SkillOverlay:
    id: str
    target_skill: str
    framepack_version: str
    body: str
    equivalent_phrases: tuple[str, ...] = ()
    merge_policy: str = "append_if_missing"


@dataclass(frozen=True)
class OverlayApplyResult:
    text: str
    changed: bool
    applied: list[str] = field(default_factory=list)
    upstream_absorbed: list[str] = field(default_factory=list)
    preserved_user_blocks: list[str] = field(default_factory=list)
    manual_review_required: bool = False
    notes: list[str] = field(default_factory=list)


def managed_block_start(overlay: SkillOverlay) -> str:
    return (
        f"<!-- FRAMEPACK HARDENING START id={overlay.id} "
        f"source=framepack@{overlay.framepack_version} target={overlay.target_skill} -->"
    )


def managed_block_end(overlay: SkillOverlay) -> str:
    return f"<!-- FRAMEPACK HARDENING END id={overlay.id} -->"


def _block_text(overlay: SkillOverlay) -> str:
    body = overlay.body.strip("\n")
    return f"{managed_block_start(overlay)}\n{body}\n{managed_block_end(overlay)}"


def _managed_block_pattern(overlay_id: str) -> re.Pattern[str]:
    return re.compile(
        r"<!--\s*FRAMEPACK HARDENING START\s+[^>]*\bid="
        + re.escape(overlay_id)
        + r"\b[^>]*-->.*?<!--\s*FRAMEPACK HARDENING END\s+id="
        + re.escape(overlay_id)
        + r"\s*-->",
        re.DOTALL,
    )


def _has_malformed_marker(text: str, overlay_id: str) -> bool:
    start_re = re.compile(
        r"<!--\s*FRAMEPACK HARDENING START\s+[^>]*\bid=" + re.escape(overlay_id) + r"\b[^>]*-->",
    )
    end_re = re.compile(
        r"<!--\s*FRAMEPACK HARDENING END\s+id=" + re.escape(overlay_id) + r"\s*-->",
    )
    full_re = _managed_block_pattern(overlay_id)
    starts = len(start_re.findall(text))
    ends = len(end_re.findall(text))
    full = len(full_re.findall(text))
    return starts != ends or (starts > 0 and full != starts)


def has_any_malformed_framepack_marker(text: str) -> bool:
    """Return True if any Framepack managed hardening marker is unbalanced.

    This is stricter than per-overlay validation. A broken managed block with an
    unknown id still means the file is not safe for automated writes; otherwise
    we could append new overlays below a half-open old recall sticker.
    """
    start_re = re.compile(r"<!--\s*FRAMEPACK HARDENING START\s+[^>]*\bid=([^\s>]+)[^>]*-->")
    end_re = re.compile(r"<!--\s*FRAMEPACK HARDENING END\s+id=([^\s>]+)\s*-->")
    starts = start_re.findall(text)
    ends = end_re.findall(text)
    if starts != ends:
        return True
    for overlay_id in set(starts + ends):
        if _has_malformed_marker(text, overlay_id):
            return True
    return False


def _find_user_blocks(text: str) -> list[str]:
    ids: list[str] = []
    for match in re.finditer(r"<!--\s*USER LOCAL HARDENING START\s+[^>]*\bid=([^\s>]+)", text):
        ids.append(match.group(1))
    return ids


def _strip_managed_and_user_blocks(text: str) -> str:
    """Remove provenance-managed blocks before upstream-equivalence scanning.

    A user-local note that mentions a Framepack rule is not the same thing as
    official upstream absorbing that rule. Equivalence checks must look only at
    ordinary skill text, not local sticky notes or existing managed overlays.
    """
    without_framepack = re.sub(
        r"<!--\s*FRAMEPACK HARDENING START\s+[^>]*-->.*?<!--\s*FRAMEPACK HARDENING END\s+id=[^>]+-->",
        "",
        text,
        flags=re.DOTALL,
    )
    return re.sub(
        r"<!--\s*USER LOCAL HARDENING START\s+[^>]*-->.*?<!--\s*USER LOCAL HARDENING END\s+id=[^>]+-->",
        "",
        without_framepack,
        flags=re.DOTALL,
    )


def _equivalent_present(text: str, overlay: SkillOverlay) -> bool:
    if not overlay.equivalent_phrases:
        return False
    candidate_text = _strip_managed_and_user_blocks(text).lower()
    return all(phrase.lower() in candidate_text for phrase in overlay.equivalent_phrases)


def apply_overlay(skill_text: str, overlay: SkillOverlay) -> OverlayApplyResult:
    user_blocks = _find_user_blocks(skill_text)

    if _has_malformed_marker(skill_text, overlay.id):
        return OverlayApplyResult(
            text=skill_text,
            changed=False,
            preserved_user_blocks=user_blocks,
            manual_review_required=True,
            notes=[f"malformed Framepack hardening block for overlay {overlay.id}"],
        )

    desired = _block_text(overlay)
    pattern = _managed_block_pattern(overlay.id)
    existing = pattern.search(skill_text)

    if existing:
        if existing.group(0) == desired:
            return OverlayApplyResult(
                text=skill_text,
                changed=False,
                preserved_user_blocks=user_blocks,
                applied=[],
                notes=[f"overlay {overlay.id} already current"],
            )
        new_text = skill_text[: existing.start()] + desired + skill_text[existing.end() :]
        return OverlayApplyResult(
            text=new_text,
            changed=True,
            preserved_user_blocks=user_blocks,
            applied=[overlay.id],
            notes=[f"updated Framepack hardening overlay {overlay.id}"],
        )

    if _equivalent_present(skill_text, overlay):
        return OverlayApplyResult(
            text=skill_text,
            changed=False,
            preserved_user_blocks=user_blocks,
            upstream_absorbed=[overlay.id],
            notes=[f"overlay {overlay.id} appears upstream absorbed"],
        )

    separator = "\n\n" if skill_text and not skill_text.endswith("\n\n") else ""
    new_text = f"{skill_text}{separator}{desired}\n"
    return OverlayApplyResult(
        text=new_text,
        changed=True,
        preserved_user_blocks=user_blocks,
        applied=[overlay.id],
        notes=[f"inserted Framepack hardening overlay {overlay.id}"],
    )


def apply_overlays(skill_text: str, overlays: list[SkillOverlay] | tuple[SkillOverlay, ...]) -> OverlayApplyResult:
    text = skill_text
    changed = False
    applied: list[str] = []
    upstream_absorbed: list[str] = []
    preserved_user_blocks: list[str] = []
    notes: list[str] = []
    manual_review_required = False

    for overlay in overlays:
        result = apply_overlay(text, overlay)
        text = result.text
        changed = changed or result.changed
        applied.extend(result.applied)
        upstream_absorbed.extend(result.upstream_absorbed)
        for block_id in result.preserved_user_blocks:
            if block_id not in preserved_user_blocks:
                preserved_user_blocks.append(block_id)
        notes.extend(result.notes)
        manual_review_required = manual_review_required or result.manual_review_required
        if result.manual_review_required:
            break

    return OverlayApplyResult(
        text=text,
        changed=changed,
        applied=applied,
        upstream_absorbed=upstream_absorbed,
        preserved_user_blocks=preserved_user_blocks,
        manual_review_required=manual_review_required,
        notes=notes,
    )
