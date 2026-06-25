"""Template bundle discovery."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable

from .types import TemplateInspectReport, inspect_template_bundle


def _candidate_dirs(root: Path) -> list[Path]:
    candidates: list[Path] = []
    if (root / "TEMPLATE_CARD.md").is_file():
        candidates.append(root)
        return candidates
    for group in ("templates", "cases"):
        parent = root / group
        if parent.is_dir():
            candidates.extend(sorted(path for path in parent.iterdir() if path.is_dir()))
    return candidates


def discover_templates(
    roots: Iterable[str | Path],
    *,
    include_incomplete: bool = False,
) -> list[TemplateInspectReport]:
    """Discover template bundles under direct, templates/, and cases/ roots."""
    reports: list[TemplateInspectReport] = []
    seen: set[str] = set()
    for raw_root in roots:
        root = Path(raw_root)
        for candidate in _candidate_dirs(root):
            key = str(candidate.resolve()) if candidate.exists() else str(candidate)
            if key in seen:
                continue
            seen.add(key)
            report = inspect_template_bundle(candidate)
            if report.card is None and not include_incomplete:
                continue
            reports.append(report)

    def sort_key(report: TemplateInspectReport) -> tuple[str, str]:
        if report.card is None:
            return ("~", report.template_dir)
        return (report.card.id.lower(), report.card.name.lower())

    return sorted(reports, key=sort_key)
