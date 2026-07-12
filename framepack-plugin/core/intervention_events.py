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


# Codes from different departments that share the same root cause.
# When these appear together, they should be correlated, not shown as
# independent findings.
_CORRELATION_FAMILIES: list[set[str]] = [
    # Proof-frame evidence: Taste says "motion claim unproven",
    # Audit says "no proof frames" — same root cause.
    {"motion_claim_unproven", "no_proof_frames"},
    # Weapon gate: Taste says "fake product UI", Weapon says "fake call" —
    # both about implementation dishonesty. (Future expansion.)
    # {"fake_product_ui_divs", "weapon_not_called"},
]


def _correlation_family(code: str) -> frozenset[str] | None:
    for family in _CORRELATION_FAMILIES:
        if code in family:
            return frozenset(family)
    return None


def correlate_events(events: Iterable[InterventionEvent]) -> list[list[InterventionEvent]]:
    """Group events that share a root-cause family.

    Returns a list of groups. Events with no correlation family form
    single-element groups. Events in the same family are merged into
    one group, deduped by (department, code, artifact).
    """
    materialized = list(events)
    # Dedupe first
    seen: set[tuple[str, str, str]] = set()
    deduped: list[InterventionEvent] = []
    for event in materialized:
        if event.key() in seen:
            continue
        seen.add(event.key())
        deduped.append(event)

    # Build correlation groups
    uncorrelated: list[InterventionEvent] = []
    family_buckets: dict[frozenset[str], list[InterventionEvent]] = {}
    for event in deduped:
        family = _correlation_family(event.code)
        if family:
            family_buckets.setdefault(family, []).append(event)
        else:
            uncorrelated.append(event)

    result: list[list[InterventionEvent]] = []
    for bucket in family_buckets.values():
        result.append(bucket)
    for event in uncorrelated:
        result.append([event])
    return result


def summarize_events(events: Iterable[InterventionEvent]) -> dict[str, object]:
    materialized = list(events)
    return {
        "total": len(materialized),
        "by_severity": dict(Counter(event.severity for event in materialized)),
        "by_action": dict(Counter(event.required_action for event in materialized)),
    }


# ── Phase 5: Audit → Intervention bridge ──

# Audit severity (P0-P3) → Intervention severity.
# P0 = structural failure, must stop.
# P1 = promise not kept, user must decide.
# P2/P3 = advisory, FYI.
_AUDIT_SEVERITY_MAP: dict[str, Severity] = {
    "P0": "hard_stop",
    "P1": "decision_required",
    "P2": "advisory",
    "P3": "advisory",
}


def _audit_severity(audit_severity: str) -> Severity:
    mapped = _AUDIT_SEVERITY_MAP.get(audit_severity, "advisory")
    return mapped  # type: ignore[return-value]


def intervention_events_for_pre_render(findings: list) -> list[InterventionEvent]:
    """Convert Pre-render Audit findings into reusable railguard events.

    Audit reports the problem; Intervention decides how hard to pull back.
    """
    events: list[InterventionEvent] = []
    for finding in findings:
        events.append(
            make_event(
                department="audit",
                code=finding.code,
                severity=_audit_severity(finding.severity),
                reason=finding.message,
                required_action="revise",
                artifact="pre-render-audit",
                acceptance=finding.suggestion,
            )
        )
    return events


def intervention_events_for_quality_audit(issues: list) -> list[InterventionEvent]:
    """Convert Quality Audit issues into reusable railguard events.

    Audit reports the problem; Intervention decides how hard to pull back.
    """
    events: list[InterventionEvent] = []
    for issue in issues:
        events.append(
            make_event(
                department="audit",
                code=issue.code,
                severity=_audit_severity(issue.severity),
                reason=issue.message,
                required_action="revise",
                artifact=issue.path or "quality-audit",
                acceptance=f"Resolve {issue.code} before proceeding.",
            )
        )
    return events
