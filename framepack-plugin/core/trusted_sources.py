"""Framepack trusted source registry — the security gate for arsenal URLs.

Philosophy: Framepack is not a random internet downloader.
Only trusted domains get auto-download. Unknown sources are
recorded as candidates but refused — like an airport security gate:
walk through the scanner, or we flag your bag.
"""

from dataclasses import dataclass
import re


@dataclass(frozen=True)
class TrustedSource:
    pattern: re.Pattern
    label: str
    license_note: str


TRUSTED_SOURCES: list[TrustedSource] = [
    TrustedSource(
        pattern=re.compile(r"^https://registry\.npmjs\.org/"),
        label="npm registry",
        license_note="external package; verify license before redistribution",
    ),
    TrustedSource(
        pattern=re.compile(r"^https://github\.com/greensock/"),
        label="GSAP (GreenSock) GitHub",
        license_note="external library; verify GSAP license before redistribution",
    ),
    TrustedSource(
        pattern=re.compile(r"^https://cdn\.jsdelivr\.net/npm/gsap/"),
        label="GSAP via jsDelivr CDN",
        license_note="external CDN; verify GSAP license before redistribution",
    ),
    TrustedSource(
        pattern=re.compile(r"^https://unpkg\.com/gsap/"),
        label="GSAP via unpkg CDN",
        license_note="external CDN; verify GSAP license before redistribution",
    ),
    TrustedSource(
        pattern=re.compile(r"^framepack://"),
        label="Framepack built-in",
        license_note="included in Framepack distribution",
    ),
]


def is_trusted_url(url: str) -> tuple[bool, str | None, str | None]:
    """Check if a URL matches any trusted source pattern.

    Args:
        url: The URL to check.

    Returns:
        (trusted: bool, label: str|None, license_note: str|None)

        When trusted=False, both label and license_note are None.
    """
    for source in TRUSTED_SOURCES:
        if source.pattern.search(url):
            return True, source.label, source.license_note
    return False, None, None


def list_trusted_sources() -> list[dict]:
    """Return all trusted sources as dicts (for display/serialization)."""
    return [
        {
            "pattern": s.pattern.pattern,
            "label": s.label,
            "license_note": s.license_note,
        }
        for s in TRUSTED_SOURCES
    ]
