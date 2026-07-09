"""Taste Control Loop ledger for Framepack commercial-quality debt.

This module turns taste-audit findings into a small persistent receipt. It does
not block rendering by itself; hooks can inject the receipt before preview/render
so the Agent must choose revise / proof / waiver instead of silently ignoring P1
creative debt.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from typing import Any

from .intervention_events import InterventionEvent, make_event
from .path_utils import to_posix_string
from .taste_rules import acceptance_for, priority_for_audit_severity, repair_target_for


TASTE_AUDIT_PATH = Path(".framepack") / "taste-audit.json"
TASTE_DEBT_PATH = Path(".framepack") / "taste-debt.md"
TASTE_WAIVERS_PATH = Path(".framepack") / "taste-waivers.json"


@dataclass
class TasteActionCard:
    issue_id: str
    code: str
    severity: str
    message: str
    required_action: str
    acceptance: str
    repair_target: str
    status: str
    path: str | None = None
    scene: str | None = None
    waiver: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class TasteControlReport:
    project_dir: str
    cards: list[TasteActionCard]
    summary: dict[str, int]

    @property
    def open_count(self) -> int:
        return self.summary.get("open", 0)

    def to_dict(self) -> dict[str, Any]:
        return {
            "kind": "framepack_taste_control",
            "project_dir": self.project_dir,
            "summary": dict(self.summary),
            "cards": [card.to_dict() for card in self.cards],
        }


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _issue_id(code: str, path: str | None, scene: str | None, message: str) -> str:
    raw = "|".join([code or "", path or "", scene or "", message or ""])
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()[:12]


def _load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def _load_previous_cards(project: Path) -> dict[str, dict[str, Any]]:
    data = _load_json(project / TASTE_AUDIT_PATH)
    cards = data.get("cards", [])
    if not isinstance(cards, list):
        return {}
    previous: dict[str, dict[str, Any]] = {}
    for card in cards:
        if isinstance(card, dict) and card.get("issue_id"):
            previous[str(card["issue_id"])] = card
    return previous


def _load_waivers(project: Path) -> list[dict[str, Any]]:
    data = _load_json(project / TASTE_WAIVERS_PATH)
    waivers = data.get("waivers", [])
    return [w for w in waivers if isinstance(w, dict) and str(w.get("reason", "")).strip()]


def _matching_waiver(card: TasteActionCard, waivers: list[dict[str, Any]]) -> dict[str, Any] | None:
    for waiver in waivers:
        issue_id = str(waiver.get("issue_id", "")).strip()
        code = str(waiver.get("code", "")).strip()
        if issue_id and issue_id == card.issue_id:
            return waiver
        if code and code == card.code:
            return waiver
    return None


def _acceptance_for(code: str) -> str:
    try:
        return acceptance_for(code)
    except KeyError:
        return "Revise the cited creative artifact, attach proof frames, or record a user-approved waiver with a concrete reason."


def _repair_target_for(path: str | None, code: str) -> str:
    try:
        return repair_target_for(code, path)
    except KeyError:
        return path or "frame.md or .hyperframes/expanded-prompt.md"


def _card_from_taste_issue(issue: Any) -> TasteActionCard:
    issue_id = _issue_id(issue.code, issue.path, issue.scene, issue.message)
    return TasteActionCard(
        issue_id=issue_id,
        code=issue.code,
        severity=priority_for_audit_severity(issue.severity),
        message=issue.message,
        required_action="revise",
        acceptance=_acceptance_for(issue.code),
        repair_target=_repair_target_for(issue.path, issue.code),
        status="open",
        path=issue.path,
        scene=issue.scene,
    )


def _project_relative_target(project: Path, target: str) -> str:
    try:
        return to_posix_string(Path(target).relative_to(project))
    except ValueError:
        return target


def _normalize_card_targets(project: Path, cards: list[TasteActionCard]) -> None:
    for card in cards:
        card.repair_target = _project_relative_target(project, card.repair_target)
        if card.path:
            card.path = _project_relative_target(project, card.path)


def _summarize(cards: list[TasteActionCard]) -> dict[str, int]:
    summary = {"open": 0, "waived": 0, "resolved": 0}
    for card in cards:
        summary[card.status] = summary.get(card.status, 0) + 1
    return summary


def _write_json(project: Path, report: TasteControlReport) -> None:
    fp = project / ".framepack"
    fp.mkdir(parents=True, exist_ok=True)
    payload = report.to_dict()
    payload["generated_at"] = _utc_now()
    (project / TASTE_AUDIT_PATH).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )


def _write_markdown(project: Path, report: TasteControlReport) -> None:
    fp = project / ".framepack"
    fp.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Framepack Taste Debt",
        "",
        f"Open: {report.summary.get('open', 0)} · Waived: {report.summary.get('waived', 0)} · Resolved: {report.summary.get('resolved', 0)}",
        "",
    ]
    if not report.cards:
        lines.append("No open taste debt recorded.")
    for card in report.cards:
        label = card.status.upper()
        lines.extend(
            [
                f"## {label} — {card.code}",
                "",
                f"- issue_id: `{card.issue_id}`",
                f"- action: `{card.required_action}`",
                f"- target: `{card.repair_target}`",
                f"- message: {card.message}",
                f"- acceptance: {card.acceptance}",
            ]
        )
        if card.waiver:
            lines.append(f"- waiver: {card.waiver.get('reason')}")
        lines.append("")
    (project / TASTE_DEBT_PATH).write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8", newline="\n")


def build_taste_control(project_dir: str | Path) -> TasteControlReport:
    """Build and persist the current Taste Control ledger for a project."""
    project = Path(project_dir)
    previous = _load_previous_cards(project)
    waivers = _load_waivers(project)

    from .taste_audit import audit_project as audit_taste_project

    taste_report = audit_taste_project(project)
    current_cards = [
        _card_from_taste_issue(issue)
        for issue in taste_report.issues
        if issue.severity in {"blocker", "risk"}
    ]

    for card in current_cards:
        waiver = _matching_waiver(card, waivers)
        if waiver:
            card.status = "waived"
            card.required_action = "waiver"
            card.waiver = waiver

    current_ids = {card.issue_id for card in current_cards}
    resolved_cards: list[TasteActionCard] = []
    for issue_id, old in previous.items():
        if issue_id in current_ids or old.get("status") == "resolved":
            continue
        if old.get("status") in {"open", "waived"}:
            old_card = TasteActionCard(
                issue_id=issue_id,
                code=str(old.get("code", "")),
                severity=str(old.get("severity", "P1")),
                message=str(old.get("message", "")),
                required_action=str(old.get("required_action", "revise")),
                acceptance=str(old.get("acceptance", "")),
                repair_target=str(old.get("repair_target", "")),
                status="resolved",
                path=old.get("path"),
                scene=old.get("scene"),
                waiver=old.get("waiver") if isinstance(old.get("waiver"), dict) else None,
            )
            resolved_cards.append(old_card)

    cards = current_cards + resolved_cards
    _normalize_card_targets(project, cards)
    report = TasteControlReport(str(project), cards, _summarize(cards))
    _write_json(project, report)
    _write_markdown(project, report)
    return report


def build_taste_control_message(report: TasteControlReport) -> str:
    """Return a pre-render injection message for open taste debt, or ''."""
    open_cards = [card for card in report.cards if card.status == "open"]
    if not open_cards:
        return ""
    lines = [
        "🎛️ **Framepack Taste Control — open taste debt needs a decision**",
        "",
        f"Open taste debt: {len(open_cards)}",
        "",
        "Before preview/render, choose one per card: revise / proof / waiver.",
        "",
        "Top action cards:",
    ]
    for card in open_cards[:5]:
        scene = f" ({card.scene})" if card.scene else ""
        lines.append(f"- `{card.code}`{scene}: {card.message}")
        lines.append(f"  - target: `{card.repair_target}`")
        lines.append(f"  - acceptance: {card.acceptance}")
    if len(open_cards) > 5:
        lines.append(f"- … {len(open_cards) - 5} more open card(s)")
    lines.extend(
        [
            "",
            "Receipts:",
            "- `.framepack/taste-audit.json`",
            "- `.framepack/taste-debt.md`",
            "- waiver file: `.framepack/taste-waivers.json`",
        ]
    )
    return "\n".join(lines)


def intervention_events_for_taste_report(report: TasteControlReport) -> list[InterventionEvent]:
    """Convert open Taste action cards into reusable railguard events."""
    events: list[InterventionEvent] = []
    project = Path(report.project_dir)
    for card in report.cards:
        if card.status != "open":
            continue
        artifact = _project_relative_target(project, card.repair_target)
        events.append(
            make_event(
                department="taste",
                code=card.code,
                severity="decision_required",
                reason=card.message,
                required_action="revise",
                artifact=artifact,
                acceptance=card.acceptance,
            )
        )
    return events
