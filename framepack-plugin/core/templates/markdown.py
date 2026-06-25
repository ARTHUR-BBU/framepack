"""Markdown renderers for template bundle docs."""

from __future__ import annotations

from .types import TemplateCard


def render_template_card(card: TemplateCard) -> str:
    suitable = "\n".join(f"  - {item}" for item in card.suitable_for)
    not_suitable = "\n".join(f"  - {item}" for item in card.not_suitable_for)
    params = "\n".join(f"  - {item}" for item in card.params)
    return f"""---
id: {card.id}
name: {card.name}
description: {card.description}
suitable_for:
{suitable or '  - general video'}
not_suitable_for:
{not_suitable or '  - unspecified'}
params:
{params or '  - brief'}
---
# {card.name}

{card.description}

## Suitable for

{chr(10).join(f'- {item}' for item in card.suitable_for) or '- General video'}
"""


def render_params_doc(card: TemplateCard) -> str:
    lines = ["# Template Parameters", "", "Use these slots during Framepack co-creation.", ""]
    for param in card.params:
        lines.append(f"- `{param}`: TODO describe required value / asset")
    if not card.params:
        lines.append("- `brief`: User creative brief")
    lines.append("")
    return "\n".join(lines)


def render_template_guide(card: TemplateCard) -> str:
    return f"""# {card.name} Guide

## What this template is

{card.description}

## How to use

1. Confirm the template fit with the user.
2. Collect the parameters and assets listed in `PARAMS.md`.
3. Co-create normal `frame.md` / `.hyperframes/expanded-prompt.md` outputs.
4. Build/render through the standard HyperFrames flow.

## Creative boundary

Template parameters guide reuse, but user-confirmed creative breaks are allowed and should be recorded in the normal Framepack handoff.
"""


def render_source_notes(card: TemplateCard, source: str | None = None, reference_artifacts: list[str] | None = None) -> str:
    lines = ["# Source Notes", "", f"Template: {card.name}", ""]
    if source:
        lines.extend([f"Source: {source}", ""])
    if reference_artifacts:
        lines.append("## Reference video intermediate artifacts")
        lines.append("")
        lines.append("These are analysis ingredients for template productization, not the final workflow.")
        lines.append("")
        for artifact in reference_artifacts:
            lines.append(f"- {artifact}")
        lines.append("")
    return "\n".join(lines)
