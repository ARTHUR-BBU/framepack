"""Cross-case case-study mining.

Deterministic mining over local Framepack cases: tones, catalog usage,
lessons, and recurring readiness gaps. This is not a replacement for human
curation; it surfaces patterns worth productizing.
"""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

from core.path_utils import to_posix_string


@dataclass(frozen=True)
class CaseSummary:
    name: str
    path: str
    tone: str = ""
    catalog_components: list[str] = field(default_factory=list)
    lessons: list[str] = field(default_factory=list)
    red_count: int = 0
    yellow_count: int = 0
    green_count: int = 0
    red_gates: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class CaseMiningReport:
    total_cases: int
    cases: list[CaseSummary]
    tone_frequency: dict[str, int]
    catalog_frequency: dict[str, int]
    common_red_gates: dict[str, int]
    lessons: list[str]


def discover_cases(workbench_root: str | Path) -> list[Path]:
    """Discover case directories under <root>/cases."""
    root = Path(workbench_root)
    cases = root / "cases"
    if not cases.is_dir():
        return []
    return sorted([p for p in cases.iterdir() if p.is_dir()], key=lambda p: p.name)


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def _parse_case_study(text: str) -> tuple[str, list[str], list[str]]:
    tone = ""
    catalog: list[str] = []
    lessons: list[str] = []

    tone_match = re.search(r"^\s*[-*]?\s*Tone\s*:\s*(.+)$", text, re.IGNORECASE | re.MULTILINE)
    if tone_match:
        tone = tone_match.group(1).strip()

    catalog_match = re.search(r"^\s*[-*]?\s*Catalog\s*:\s*(.+)$", text, re.IGNORECASE | re.MULTILINE)
    if catalog_match:
        raw = catalog_match.group(1).strip()
        catalog = [x.strip() for x in re.split(r"[,，]", raw) if x.strip() and x.strip().lower() != "none"]

    for match in re.finditer(r"^\s*[-*]?\s*Lessons? learned\s*:\s*(.+)$", text, re.IGNORECASE | re.MULTILINE):
        value = match.group(1).strip()
        if value:
            lessons.append(value)

    return tone, catalog, lessons


def _parse_readiness(text: str) -> tuple[int, int, int, list[str]]:
    red = yellow = green = 0
    red_gates: list[str] = []
    for line in text.splitlines():
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) < 2:
            continue
        gate, status = parts[0], parts[1].upper()
        if gate.lower() in ("gate", "---") or set(gate) <= {"-"}:
            continue
        if "RED" in status or "🔴" in status:
            red += 1
            red_gates.append(gate)
        elif "YELLOW" in status or "🟡" in status:
            yellow += 1
        elif "GREEN" in status or "🟢" in status:
            green += 1
    return red, yellow, green, red_gates


def summarize_case(case_dir: str | Path) -> CaseSummary:
    """Summarize one case directory."""
    case = Path(case_dir)
    tone = ""
    catalog: list[str] = []
    lessons: list[str] = []

    for name in ("CASE-STUDY.md", "TEST-REPORT.md"):
        path = case / name
        if path.is_file():
            parsed_tone, parsed_catalog, parsed_lessons = _parse_case_study(_read(path))
            tone = tone or parsed_tone
            catalog.extend(parsed_catalog)
            lessons.extend(parsed_lessons)

    red = yellow = green = 0
    red_gates: list[str] = []
    readiness = case / ".framepack" / "render-readiness.md"
    if readiness.is_file():
        red, yellow, green, red_gates = _parse_readiness(_read(readiness))

    # Deduplicate preserving order
    catalog = list(dict.fromkeys(catalog))
    lessons = list(dict.fromkeys(lessons))
    red_gates = list(dict.fromkeys(red_gates))

    return CaseSummary(
        name=case.name,
        path=to_posix_string(case),
        tone=tone,
        catalog_components=catalog,
        lessons=lessons,
        red_count=red,
        yellow_count=yellow,
        green_count=green,
        red_gates=red_gates,
    )


def mine_cases(workbench_root: str | Path) -> CaseMiningReport:
    """Mine all cases in a workbench root."""
    summaries = [summarize_case(p) for p in discover_cases(workbench_root)]
    tone_counter: Counter[str] = Counter()
    catalog_counter: Counter[str] = Counter()
    red_gate_counter: Counter[str] = Counter()
    lessons: list[str] = []

    for summary in summaries:
        if summary.tone:
            tone_counter[summary.tone] += 1
        for comp in summary.catalog_components:
            catalog_counter[comp] += 1
        for gate in summary.red_gates:
            red_gate_counter[gate] += 1
        lessons.extend(summary.lessons)

    return CaseMiningReport(
        total_cases=len(summaries),
        cases=summaries,
        tone_frequency=dict(tone_counter),
        catalog_frequency=dict(catalog_counter),
        common_red_gates=dict(red_gate_counter),
        lessons=list(dict.fromkeys(lessons)),
    )


def write_mining_report(workbench_root: str | Path, report: CaseMiningReport) -> Path:
    """Write .framepack/cross-case-mining.md under workbench root."""
    root = Path(workbench_root)
    fp = root / ".framepack"
    fp.mkdir(parents=True, exist_ok=True)
    path = fp / "cross-case-mining.md"

    lines = [
        "# Cross-Case Mining",
        "",
        f"Total cases: {report.total_cases}",
        "",
        "## Tone frequency",
    ]
    if report.tone_frequency:
        for tone, count in sorted(report.tone_frequency.items(), key=lambda kv: (-kv[1], kv[0])):
            lines.append(f"- {tone}: {count}")
    else:
        lines.append("- none")

    lines.extend(["", "## Catalog frequency"])
    if report.catalog_frequency:
        for comp, count in sorted(report.catalog_frequency.items(), key=lambda kv: (-kv[1], kv[0])):
            lines.append(f"- {comp}: {count}")
    else:
        lines.append("- none")

    lines.extend(["", "## Common red gates"])
    if report.common_red_gates:
        for gate, count in sorted(report.common_red_gates.items(), key=lambda kv: (-kv[1], kv[0])):
            lines.append(f"- {gate}: {count}")
    else:
        lines.append("- none")

    lines.extend(["", "## Lessons"])
    if report.lessons:
        for lesson in report.lessons:
            lines.append(f"- {lesson}")
    else:
        lines.append("- none")

    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    return path
