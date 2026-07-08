"""HTML-level Taste detectors for implementation slop.

Taste owns the commercial smell test; these detectors do not replace
HyperFrames lint or Weapon enforcement. They flag AI-ish implementation patterns
that make a rendered piece feel cheap even when the code technically runs.
"""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any

from .taste_rules import acceptance_for


HTML_PATH = "index.html"


@dataclass
class HtmlTasteIssue:
    code: str
    severity: str
    message: str
    suggestion: str | None = None
    path: str | None = None
    scene: str | None = None
    details: dict[str, Any] | None = None


_PRODUCT_UI_CLASS_RE = re.compile(
    r"\b(product|dashboard|mockup|app|interface|browser|sidebar|chart|metric|card|panel)\b",
    re.I,
)
_REAL_ASSET_RE = re.compile(r"<(?:img|video|canvas|svg)\b|\b(src|poster)\s*=", re.I)
_DIV_RE = re.compile(r"<div\b[^>]*(?:class|id)\s*=\s*(['\"])(?P<value>.*?)\1", re.I | re.S)

_RAW_SCROLL_RE = re.compile(r"\b(?:window\.|document\.)?addEventListener\s*\(\s*['\"]scroll['\"]|\bscrollY\b|\bonscroll\b", re.I)
_SAFE_SCROLL_RE = re.compile(r"\b(ScrollTrigger|useScroll|IntersectionObserver|scroll-timeline|view-timeline)\b", re.I)

_MOTION_RE = re.compile(r"\b(gsap\.|anime\(|\.animate\(|animation\s*:|@keyframes|transition\s*:)", re.I)
_REDUCED_MOTION_RE = re.compile(r"prefers-reduced-motion|reducedMotion|matchMedia\s*\(\s*['\"]\(prefers-reduced-motion", re.I)

_DECORATIVE_SURFACE_RE = re.compile(r"\b(grid|glow|crosshair|stripe|scanline|noise|particle|orb|mesh-gradient)\b", re.I)
_STORY_ROLE_RE = re.compile(r"\b(product|data|metric|topology|architecture|map|timeline|proof|real|navigation|status)\b", re.I)


def _detect_fake_product_ui_divs(html: str) -> HtmlTasteIssue | None:
    if _REAL_ASSET_RE.search(html):
        return None
    div_values = [match.group("value") for match in _DIV_RE.finditer(html)]
    productish = [value for value in div_values if _PRODUCT_UI_CLASS_RE.search(value)]
    if len(productish) < 4:
        return None
    return HtmlTasteIssue(
        code="fake_product_ui_divs",
        severity="risk",
        message="Product preview appears to be div-built fake UI instead of a real screenshot, generated image, or real component preview.",
        suggestion=acceptance_for("fake_product_ui_divs"),
        path=HTML_PATH,
        details={"matched_classes": productish[:8]},
    )


def _detect_raw_scroll_listener(html: str) -> HtmlTasteIssue | None:
    if not _RAW_SCROLL_RE.search(html) or _SAFE_SCROLL_RE.search(html):
        return None
    return HtmlTasteIssue(
        code="raw_scroll_listener",
        severity="suggestion",
        message="Raw scroll listener or scrollY animation logic detected; this is janky and hard to render reliably.",
        suggestion=acceptance_for("raw_scroll_listener"),
        path=HTML_PATH,
    )


def _detect_missing_reduced_motion(html: str) -> HtmlTasteIssue | None:
    if not _MOTION_RE.search(html) or _REDUCED_MOTION_RE.search(html):
        return None
    return HtmlTasteIssue(
        code="missing_reduced_motion",
        severity="suggestion",
        message="Motion is present but no reduced-motion fallback is declared.",
        suggestion=acceptance_for("missing_reduced_motion"),
        path=HTML_PATH,
    )


def _detect_decorative_generated_surface(html: str) -> HtmlTasteIssue | None:
    matches = _DECORATIVE_SURFACE_RE.findall(html)
    if len(matches) < 3 or _STORY_ROLE_RE.search(html):
        return None
    return HtmlTasteIssue(
        code="decorative_generated_surface",
        severity="suggestion",
        message="Decorative generated surface detected: grid, glow, stripe, or crosshair treatment without a story or data role.",
        suggestion=acceptance_for("decorative_generated_surface"),
        path=HTML_PATH,
        details={"surface_terms": sorted(set(term.lower() for term in matches))[:8]},
    )


def detect_html_taste_issues(html: str) -> list[HtmlTasteIssue]:
    issues: list[HtmlTasteIssue] = []
    if not html.strip():
        return issues
    for detector in (
        _detect_fake_product_ui_divs,
        _detect_raw_scroll_listener,
        _detect_missing_reduced_motion,
        _detect_decorative_generated_surface,
    ):
        issue = detector(html)
        if issue:
            issues.append(issue)
    return issues
