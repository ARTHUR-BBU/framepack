"""Proof-frame evidence module (Phase 5).

Extracts proof-frame detection from taste_audit.py into its own module.
Adds ProofEvidence metadata (frame count, recognized locations) so downstream
consumers can make richer decisions without re-scanning the filesystem.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import re
import typing as t

from .taste_rules import acceptance_for


# ── Issue type ──

@dataclass
class ProofTasteIssue:
    code: str
    severity: str
    message: str
    suggestion: str | None = None
    path: str | None = None
    details: dict | None = None


# ── Proof locations ──

_PROOF_ROOTS: tuple[str, ...] = (
    ".framepack/proof-frames",
    ".framepack/proofs",
    "proofs",
    "snapshots",
)


# ── Motion-claim detection ──

_PROSE_MOTION_RE = re.compile(
    r"\b(high[-\s]?energy|kinetic\s+choreography|morph(?:ing)?|parallax|trail(?:s)?|snap\s+CTA|explodes?\s+into)\b",
    re.I,
)
_CODE_MOTION_RE = re.compile(r"(?:\bgsap\.|\banime\s*\(|@keyframes\b)", re.I)


def _has_significant_motion_claim(expanded_prompt: str, html: str) -> bool:
    text = expanded_prompt + "\n" + html
    return bool(_PROSE_MOTION_RE.search(text) or _CODE_MOTION_RE.search(text))


# ── Filesystem scan ──

def _scan_proof_roots(project: Path) -> list[tuple[Path, list[Path]]]:
    """Return (root, png_files) for each proof root that has PNGs."""
    results: list[tuple[Path, list[Path]]] = []
    for rel in _PROOF_ROOTS:
        root = project / rel
        if root.is_dir():
            pngs = list(root.rglob("*.png"))
            if pngs:
                results.append((root, pngs))
    return results


def has_proof_frames(project: Path) -> bool:
    """Quick boolean check — does the project have any proof frames?"""
    return bool(_scan_proof_roots(project))


def has_canonical_motion_proof_frames(project: Path) -> bool:
    """Check the canonical .framepack/proof-frames directory only."""
    root = project / ".framepack" / "proof-frames"
    return root.is_dir() and any(root.rglob("*.png"))


# ── ProofEvidence metadata ──

@dataclass
class ProofEvidence:
    """Metadata about proof frames found in a project."""
    has_frames: bool = False
    frame_count: int = 0
    locations: list[str] = field(default_factory=list)

    @classmethod
    def from_project(cls, project: Path) -> "ProofEvidence":
        roots_data = _scan_proof_roots(project)
        total_pngs = sum(len(pngs) for _, pngs in roots_data)
        locs: list[str] = []
        for root, _ in roots_data:
            try:
                locs.append(str(root.relative_to(project)).replace("\\", "/"))
            except ValueError:
                locs.append(str(root))
        return cls(
            has_frames=total_pngs > 0,
            frame_count=total_pngs,
            locations=locs,
        )


# ── Audit functions ──

def audit_proof_evidence(
    project: Path,
    *,
    expanded_prompt: str = "",
    html: str = "",
) -> list[ProofTasteIssue]:
    """Audit proof-frame evidence for a project.

    Returns:
    - no_proof_frames (suggestion) if index.html exists without proof frames
    - motion_claim_unproven (risk) if significant motion is claimed without canonical proof
    """
    issues: list[ProofTasteIssue] = []

    html_path = project / "index.html"
    html_exists = html_path.is_file()

    if html_exists and not has_proof_frames(project):
        issues.append(
            ProofTasteIssue(
                code="no_proof_frames",
                severity="suggestion",
                message="index.html exists but no proof frames/snapshots were found; taste cannot be checked from prose alone.",
                suggestion=acceptance_for("no_proof_frames"),
                path=str(html_path),
            )
        )

    if html and _has_significant_motion_claim(expanded_prompt, html) and not has_canonical_motion_proof_frames(project):
        proof_path = project / ".framepack" / "proof-frames"
        issues.append(
            ProofTasteIssue(
                code="motion_claim_unproven",
                severity="risk",
                message="The plan claims significant motion but no proof frames/contact sheet demonstrate it.",
                suggestion=acceptance_for("motion_claim_unproven"),
                path=str(proof_path),
            )
        )

    return issues
