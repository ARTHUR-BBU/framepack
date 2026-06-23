"""Placeholder-Smell Audit — detect scaffolding/vibe-filler copy in HTML.

Catches text that feels like internal workflow labels, status placeholders,
generic hype, or unsupported claims — the kind of copy that replaces real
narrative meaning.

This is advisory: it never blocks render. It makes placeholder-smell
visible so it can be fixed before delivery.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from core.path_utils import markdown_table_cell


@dataclass(frozen=True)
class PlaceholderFinding:
    word: str
    code: str  # internal_workflow_word | placeholder_status | generic_hype | unsupported_claim | context_mismatch
    context: str  # surrounding text for human review
    severity: str = "P2"  # P1 if high count, P2 normal, P3 minor


@dataclass(frozen=True)
class PlaceholderAuditReport:
    verdict: str  # CLEAN | LOW | MEDIUM | HIGH | SKIP
    findings: list[PlaceholderFinding]
    total_finding_count: int = 0
    html_path: Optional[str] = None


# ---------------------------------------------------------------------------
# Pattern definitions
# ---------------------------------------------------------------------------

# Internal workflow words — these are animation/scene labels, not copy
# Match as standalone uppercase words inside HTML elements
_INTERNAL_WORKFLOW_WORDS = {
    "LOAD", "PUNCH", "CALL", "HOLD", "BLOCK", "ENTER", "EXIT",
    "FADE", "SLAM", "CUT", "WIPE", "DIVE", "RISE", "SWELL",
    "ENGINE", "DUEL", "CARRY", "CONTROL", "PRESSURE",
}

# Placeholder status phrases
_PLACEHOLDER_STATUS = {
    "ARRIVAL PENDING", "COMING SOON", "TBD", "TODO", "PLACEHOLDER",
    "PENDING", "TBA",
}

# Generic hype phrases
_GENERIC_HYPE = {
    "NEXT LEVEL", "GAME CHANGER", "UNLEASHED", "NEXT GEN",
    "WORLD CLASS", "BEST IN CLASS",
}

# Proper noun patterns that should NOT be flagged
# (multi-word uppercase that look like names, teams, places)
_PROPER_NOUN_HINTS = {
    "MANCHESTER", "UNITED", "LIVERPOOL", "CHELSEA", "ARSENAL",
    "BARCELONA", "REAL MADRID", "BRAZIL", "ENGLAND", "FRANCE",
    "SERIE A", "PREMIER LEAGUE", "LA LIGA",
    "OLD TRAFFORD", "ANFIELD", "CAMP NOU",
    "WORLD CUP", "CHAMPIONS LEAGUE",
}


def _extract_visible_text(html: str) -> list[tuple[str, str]]:
    """Extract visible text fragments from HTML.

    Returns list of (text, surrounding_context) tuples.
    """
    # Remove script/style content
    clean = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html, flags=re.DOTALL | re.IGNORECASE)
    # Find text between tags
    fragments = []
    for match in re.finditer(r">([^<]+)<", clean):
        text = match.group(1).strip()
        if text and len(text) > 1:
            # Get surrounding context (±30 chars)
            start = max(0, match.start() - 30)
            end = min(len(clean), match.end() + 30)
            context = re.sub(r"<[^>]+>", " ", clean[start:end]).strip()
            fragments.append((text, context))
    return fragments


def _is_proper_noun(text: str) -> bool:
    """Check if uppercase text is likely a proper noun (team, place, person)."""
    upper = text.upper()
    # Check against known proper noun hints
    for hint in _PROPER_NOUN_HINTS:
        if hint in upper:
            return True
    # Multi-word all-caps with common name patterns (contains · or -)
    if "·" in text or " - " in text:
        return True
    # Contains non-ASCII (likely real names like ÉDERSON)
    if any(ord(c) > 127 for c in text):
        return True
    # Contains digits (dates, numbers like "2026")
    if re.search(r"\d{3,}", text):
        return True
    return False


def audit_placeholder_smell(html: str) -> PlaceholderAuditReport:
    """Audit HTML text for placeholder-smell patterns.

    Returns a report with findings and a verdict level.
    """
    fragments = _extract_visible_text(html)
    findings: list[PlaceholderFinding] = []
    seen_words: set[str] = set()

    for text, context in fragments:
        upper = text.upper().strip()

        # Check placeholder status phrases
        for phrase in _PLACEHOLDER_STATUS:
            if phrase in upper and phrase not in seen_words:
                findings.append(PlaceholderFinding(
                    word=text,
                    code="placeholder_status",
                    context=context,
                    severity="P1",
                ))
                seen_words.add(phrase)

        # Check generic hype phrases
        for phrase in _GENERIC_HYPE:
            if phrase in upper and phrase not in seen_words:
                findings.append(PlaceholderFinding(
                    word=text,
                    code="generic_hype",
                    context=context,
                ))
                seen_words.add(phrase)

        # Skip proper nouns before checking single-word patterns
        if _is_proper_noun(text):
            continue

        # Check single internal workflow words (exact match)
        if upper in _INTERNAL_WORKFLOW_WORDS and upper not in seen_words:
            findings.append(PlaceholderFinding(
                word=text,
                code="internal_workflow_word",
                context=context,
            ))
            seen_words.add(upper)

        # Check for standalone single-word uppercase fragments (3-12 chars)
        # that aren't proper nouns — these are often placeholder labels
        if (
            text.isupper()
            and 3 <= len(text) <= 12
            and not _is_proper_noun(text)
            and upper not in seen_words
            and " " not in text
        ):
            findings.append(PlaceholderFinding(
                word=text,
                code="internal_workflow_word",
                context=context,
                severity="P3",
            ))
            seen_words.add(upper)

    # Determine verdict
    count = len(findings)
    p1_count = sum(1 for f in findings if f.severity == "P1")
    if p1_count >= 2 or count >= 5:
        verdict = "HIGH"
    elif count >= 3:
        verdict = "MEDIUM"
    elif count >= 1:
        verdict = "LOW"
    else:
        verdict = "CLEAN"

    return PlaceholderAuditReport(
        verdict=verdict,
        findings=findings,
        total_finding_count=count,
    )


def audit_project_placeholder_smell(
    project_dir: str | Path,
    write_report: bool = False,
) -> PlaceholderAuditReport:
    """Audit index.html in a project for placeholder-smell.

    If write_report=True, writes .framepack/placeholder-audit.md.
    """
    project = Path(project_dir)
    html_path = project / "index.html"

    if not html_path.is_file():
        return PlaceholderAuditReport(
            verdict="SKIP",
            findings=[],
            html_path=None,
        )

    try:
        html = html_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return PlaceholderAuditReport(
            verdict="SKIP",
            findings=[],
            html_path=str(html_path),
        )
    report = audit_placeholder_smell(html)

    # Attach path
    report = PlaceholderAuditReport(
        verdict=report.verdict,
        findings=report.findings,
        total_finding_count=report.total_finding_count,
        html_path=str(html_path),
    )

    if write_report:
        fp_dir = project / ".framepack"
        fp_dir.mkdir(parents=True, exist_ok=True)
        report_path = fp_dir / "placeholder-audit.md"
        report_path.write_text(
            _render_audit_markdown(report), encoding="utf-8", newline="\n"
        )

    return report


def _render_audit_markdown(report: PlaceholderAuditReport) -> str:
    lines = [
        "# Placeholder-Smell Audit",
        "",
        f"**Verdict:** {report.verdict}",
        f"**Findings:** {report.total_finding_count}",
        "",
    ]
    if report.findings:
        lines.append("| Word | Code | Severity | Context |")
        lines.append("|---|---|---|---|")
        for f in report.findings:
            # Truncate context for readability
            ctx = f.context[:80] + "…" if len(f.context) > 80 else f.context
            lines.append(
                f"| {markdown_table_cell(f.word)} | {markdown_table_cell(f.code)} | "
                f"{markdown_table_cell(f.severity)} | {markdown_table_cell(ctx)} |"
            )
    else:
        lines.append("No placeholder-smell patterns detected.")
    lines.append("")
    return "\n".join(lines)
