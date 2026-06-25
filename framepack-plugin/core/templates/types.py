"""Template bundle data types and inspection helpers."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

_TEMPLATE_ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
_REFERENCE_ARTIFACTS = (
    "source/VIDEO_DNA.md",
    "source/TEMPLATE_BLUEPRINT.md",
    "source/content_decomposition.md",
)


@dataclass(frozen=True)
class TemplateIssue:
    """Advisory issue discovered while inspecting a template bundle."""

    severity: str
    code: str
    message: str
    path: str | None = None

    def to_dict(self) -> dict[str, str | None]:
        return {
            "severity": self.severity,
            "code": self.code,
            "message": self.message,
            "path": self.path,
        }


@dataclass(frozen=True)
class TemplateCard:
    """Human-facing template card used for selection and co-creation."""

    id: str
    name: str
    description: str
    suitable_for: tuple[str, ...]
    params: tuple[str, ...]
    path: str
    not_suitable_for: tuple[str, ...] = ()
    schema_version: str = "1.0"
    kind: str = "template_suite"
    source: str = "template_bundle"

    def to_dict(self) -> dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "kind": self.kind,
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "suitable_for": list(self.suitable_for),
            "not_suitable_for": list(self.not_suitable_for),
            "params": list(self.params),
            "path": self.path,
            "source": self.source,
        }


@dataclass(frozen=True)
class TemplateInspectReport:
    """Report-first inspection result for a template bundle."""

    template_dir: str
    status: str
    card: TemplateCard | None = None
    issues: tuple[TemplateIssue, ...] = ()
    summary: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "template_dir": self.template_dir,
            "status": self.status,
            "card": self.card.to_dict() if self.card else None,
            "issues": [issue.to_dict() for issue in self.issues],
            "summary": self.summary,
        }


def _to_posix(path: Path) -> str:
    return str(path).replace("\\", "/")


def _parse_scalar(value: str) -> str:
    value = value.strip()
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        return value[1:-1]
    return value


def _parse_frontmatter(text: str) -> dict[str, str | list[str]]:
    if not text.startswith("---"):
        return {}
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    end_index = None
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = index
            break
    if end_index is None:
        return {}

    data: dict[str, str | list[str]] = {}
    current_list_key: str | None = None
    for raw_line in lines[1:end_index]:
        if not raw_line.strip() or raw_line.lstrip().startswith("#"):
            continue
        stripped = raw_line.strip()
        if stripped.startswith("-") and current_list_key:
            items = data.setdefault(current_list_key, [])
            if isinstance(items, list):
                item = stripped[1:].strip()
                items.append(_parse_scalar(item))
            continue
        if ":" not in raw_line:
            current_list_key = None
            continue
        key, value = raw_line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if value:
            data[key] = _parse_scalar(value)
            current_list_key = None
        else:
            data[key] = []
            current_list_key = key
    return data


def _as_tuple(value: str | list[str] | None) -> tuple[str, ...]:
    if value is None:
        return ()
    if isinstance(value, str):
        return (value,) if value else ()
    return tuple(str(item) for item in value if str(item))


def _valid_template_id(template_id: str) -> bool:
    return bool(_TEMPLATE_ID_RE.fullmatch(template_id)) and ".." not in template_id


def load_template_card(template_dir: str | Path) -> TemplateCard | None:
    """Load TEMPLATE_CARD.md frontmatter into a TemplateCard, if present."""
    root = Path(template_dir)
    card_path = root / "TEMPLATE_CARD.md"
    if not card_path.is_file():
        return None
    data = _parse_frontmatter(card_path.read_text(encoding="utf-8"))
    template_id = str(data.get("id") or root.name)
    name = str(data.get("name") or template_id)
    description = str(data.get("description") or "")
    return TemplateCard(
        id=template_id,
        name=name,
        description=description,
        suitable_for=_as_tuple(data.get("suitable_for")),
        not_suitable_for=_as_tuple(data.get("not_suitable_for")),
        params=_as_tuple(data.get("params")),
        path=_to_posix(root),
        schema_version=str(data.get("schema_version") or "1.0"),
        kind=str(data.get("kind") or "template_suite"),
        source=str(data.get("source") or "template_bundle"),
    )


def inspect_template_bundle(template_dir: str | Path) -> TemplateInspectReport:
    """Inspect a template bundle without mutating it."""
    root = Path(template_dir)
    issues: list[TemplateIssue] = []
    card = load_template_card(root)
    if card is None:
        issues.append(TemplateIssue(
            severity="ERROR",
            code="missing_template_card",
            message="TEMPLATE_CARD.md is required for a template bundle.",
            path=_to_posix(root / "TEMPLATE_CARD.md"),
        ))
        return TemplateInspectReport(
            template_dir=_to_posix(root),
            status="incomplete",
            card=None,
            issues=tuple(issues),
            summary={"issue_count": len(issues)},
        )

    if not _valid_template_id(card.id):
        issues.append(TemplateIssue(
            "ERROR",
            "invalid_template_id",
            "Template id must use only letters, numbers, dots, underscores, or hyphens and must not contain '..'.",
            _to_posix(root / "TEMPLATE_CARD.md"),
        ))
    if card.kind != "template_suite":
        issues.append(TemplateIssue(
            "ERROR",
            "invalid_template_kind",
            "Template bundles must declare kind: template_suite.",
            _to_posix(root / "TEMPLATE_CARD.md"),
        ))

    required_docs = [
        ("PARAMS.md", "missing_params_doc", "PARAMS.md should describe exposed parameters and required inputs."),
        ("TEMPLATE_GUIDE.md", "missing_template_guide", "TEMPLATE_GUIDE.md should explain creative traits and usage."),
        ("template.params.example.json", "missing_example_params", "template.params.example.json should provide example values."),
    ]
    for filename, code, message in required_docs:
        if not (root / filename).is_file():
            issues.append(TemplateIssue("WARNING", code, message, _to_posix(root / filename)))

    evidence_dirs = ["assets", "renders", "snapshots"]
    for dirname in evidence_dirs:
        if not (root / dirname).exists():
            issues.append(TemplateIssue(
                "INFO",
                f"missing_{dirname}_dir",
                f"{dirname}/ is recommended evidence for a complete template bundle.",
                _to_posix(root / dirname),
            ))

    has_source = any((root / name).exists() for name in ("index.html", "source", "SOURCE_NOTES.md"))
    if not has_source:
        issues.append(TemplateIssue(
            "INFO",
            "missing_source_evidence",
            "A template bundle should include source HTML/project notes or SOURCE_NOTES.md.",
            _to_posix(root),
        ))

    reference_artifacts = [artifact for artifact in _REFERENCE_ARTIFACTS if (root / artifact).is_file()]
    has_error = any(issue.severity == "ERROR" for issue in issues)
    has_warning = any(issue.severity == "WARNING" for issue in issues)
    status = "incomplete" if has_error else "draft" if has_warning else "complete"
    summary = {
        "schema_version": card.schema_version,
        "kind": card.kind,
        "id": card.id,
        "name": card.name,
        "params": list(card.params),
        "suitable_for": list(card.suitable_for),
        "reference_artifacts_present": bool(reference_artifacts),
        "reference_artifacts": reference_artifacts,
        "issue_count": len(issues),
    }
    return TemplateInspectReport(
        template_dir=_to_posix(root),
        status=status,
        card=card,
        issues=tuple(issues),
        summary=summary,
    )
