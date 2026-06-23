"""Pre-render Framepack taste/product audit.

This audit is intentionally advisory. HyperFrames owns technical validation;
Framepack points out taste, asset, and story-drift risks before the user chooses
whether to revise, add assets, or render anyway.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re


@dataclass(frozen=True)
class PreRenderFinding:
    severity: str
    code: str
    message: str
    suggestion: str


@dataclass(frozen=True)
class PreRenderAuditReport:
    verdict: str
    findings: list[PreRenderFinding]
    project_dir: str


NOEMA_ASSET_RE = re.compile(r"assets/(portraits|archive|artwork|qr)[^'\"\s>]*\.(?:jpg|jpeg|png)", re.I)


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _find_asset_intake(project_dir: Path) -> Path | None:
    for rel in (".framepack/asset-intake.md", "asset-intake.md"):
        path = project_dir / rel
        if path.is_file():
            return path
    return None


def _mentions_audio(text: str) -> bool:
    return bool(re.search(r"\b(bgm|music|audio|soundtrack|voiceover|narration|mp3|wav)\b|旁白|音乐|音频", text, re.I))


def _is_brand_or_product(text: str) -> bool:
    return bool(re.search(r"brand|product|launch|promo|saas|品牌|产品|发布|推广", text, re.I))


def audit_pre_render(project_dir: str | Path) -> PreRenderAuditReport:
    project = Path(project_dir)
    findings: list[PreRenderFinding] = []

    expanded_path = project / ".hyperframes" / "expanded-prompt.md"
    expanded = _read(expanded_path)
    if not expanded_path.is_file():
        findings.append(
            PreRenderFinding(
                severity="P1",
                code="missing_director_story_bible",
                message="Director Story Bible (`.hyperframes/expanded-prompt.md`) is missing before preview/render.",
                suggestion="Create or confirm expanded-prompt.md so HyperFrames has the user's richer creative intent.",
            )
        )

    asset_intake_path = _find_asset_intake(project)
    asset_intake = _read(asset_intake_path) if asset_intake_path else ""
    if asset_intake_path is None:
        findings.append(
            PreRenderFinding(
                severity="P2",
                code="missing_asset_intake",
                message="No asset-intake manifest found, so Framepack cannot tell which user materials are available.",
                suggestion="Ask for relevant 素材: logo, product screenshots, BGM, brand colors, reference video, DESIGN.md, or mood board.",
            )
        )

    html = _read(project / "index.html")
    stale_matches = NOEMA_ASSET_RE.findall(html)
    if stale_matches and "noema" not in expanded.lower():
        findings.append(
            PreRenderFinding(
                severity="P1",
                code="stale_source_domain_props",
                message="HTML still references old NOEMA visual props while the Director Story Bible targets another domain.",
                suggestion="Replace stale portraits/archive/artwork/QR props, or document why they remain semantically justified.",
            )
        )

    combined = "\n".join([expanded, asset_intake])
    if _is_brand_or_product(expanded) and not _mentions_audio(combined):
        findings.append(
            PreRenderFinding(
                severity="P2",
                code="optional_bgm_missing",
                message="Brand/product video has no BGM/audio plan recorded.",
                suggestion="Ask whether the user has BGM, a sound logo, voiceover preference, or wants programmatic silent visuals.",
            )
        )

    if any(f.severity in {"P0", "P1"} for f in findings):
        verdict = "NEEDS_USER_DECISION"
    elif findings:
        verdict = "WARN"
    else:
        verdict = "READY"

    return PreRenderAuditReport(verdict=verdict, findings=findings, project_dir=str(project))


def build_pre_render_audit_message(report: PreRenderAuditReport) -> str:
    lines = [
        "🎬 **Framepack Pre-render Taste Audit — advisory**",
        "",
        f"Verdict: {report.verdict}",
        "Framepack advises; user decides. This audit does not stop render.",
        "",
    ]

    if report.findings:
        lines.append("What feels undercooked:")
        for finding in report.findings:
            lines.append(f"- [{finding.severity}] {finding.code}: {finding.message}")
            lines.append(f"  Suggestion: {finding.suggestion}")
    else:
        lines.append("What works:")
        lines.append("- No obvious Framepack taste/asset drift risks found before render.")

    lines.extend(
        [
            "",
            "User choices:",
            "A. revise now",
            "B. add assets",
            "C. render anyway",
        ]
    )
    return "\n".join(lines)
