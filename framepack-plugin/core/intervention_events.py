"""Reusable intervention events for Framepack railguards.

Business departments decide what is wrong. This module only standardizes how
Framepack pulls the Agent back on track: severity, required action, artifact,
and acceptance receipt.
"""

from __future__ import annotations

from collections import Counter, OrderedDict
from dataclasses import asdict, dataclass
from typing import Iterable, Literal

Department = Literal["intent", "director", "taste", "weapon", "audit", "intervention", "knowledge", "platform"]
Severity = Literal["advisory", "decision_required", "hard_stop"]
RequiredAction = Literal["revise", "load_weapon", "attach_proof", "write_waiver", "ask_user", "stop"]

DEPARTMENTS = {"intent", "director", "taste", "weapon", "audit", "intervention", "knowledge", "platform"}
SEVERITIES = {"advisory", "decision_required", "hard_stop"}
REQUIRED_ACTIONS = {"revise", "load_weapon", "attach_proof", "write_waiver", "ask_user", "stop"}


@dataclass(frozen=True)
class InterventionEvent:
    department: Department
    code: str
    severity: Severity
    reason: str
    required_action: RequiredAction
    artifact: str
    acceptance: str

    def key(self) -> tuple[str, str, str]:
        return (self.department, self.code, self.artifact)

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


def _validate(value: str, allowed: set[str], label: str) -> None:
    if value not in allowed:
        allowed_values = ", ".join(sorted(allowed))
        raise ValueError(f"Unknown intervention {label}: {value!r}. Expected one of: {allowed_values}")


def make_event(
    *,
    department: str,
    code: str,
    severity: str,
    reason: str,
    required_action: str,
    artifact: str,
    acceptance: str,
) -> InterventionEvent:
    _validate(department, DEPARTMENTS, "department")
    _validate(severity, SEVERITIES, "severity")
    _validate(required_action, REQUIRED_ACTIONS, "action")
    return InterventionEvent(
        department=department,  # type: ignore[arg-type]
        code=code,
        severity=severity,  # type: ignore[arg-type]
        reason=reason,
        required_action=required_action,  # type: ignore[arg-type]
        artifact=artifact,
        acceptance=acceptance,
    )


def group_events(events: Iterable[InterventionEvent]) -> dict[str, list[InterventionEvent]]:
    grouped: "OrderedDict[str, list[InterventionEvent]]" = OrderedDict()
    seen: set[tuple[str, str, str]] = set()
    for event in events:
        if event.key() in seen:
            continue
        seen.add(event.key())
        grouped.setdefault(event.severity, []).append(event)
    return dict(grouped)


def summarize_events(events: Iterable[InterventionEvent]) -> dict[str, object]:
    materialized = list(events)
    return {
        "total": len(materialized),
        "by_severity": dict(Counter(event.severity for event in materialized)),
        "by_action": dict(Counter(event.required_action for event in materialized)),
    }
