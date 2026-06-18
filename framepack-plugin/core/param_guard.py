"""Param guard — pre-write parameter reference card for HyperFrames.

This module generates a "parameter cheat sheet" from the Execution Manifest,
so that when the Agent writes index.html, exact parameter values are visible
in context — preventing memory-based parameter drift.

Flow:
  1. expanded-prompt.md is written (post_tool_call hook)
  2. extract_param_card() parses the Manifest section
  3. Card is injected into the session via ctx.inject_message()
  4. Agent writes HTML with exact values in front of them
"""

from __future__ import annotations

import logging
from pathlib import Path

from .execution_manifest import parse_execution_manifest

logger = logging.getLogger(__name__)


def extract_param_card(project_dir: str | Path) -> str | None:
    """Parse Execution Manifest from expanded-prompt.md and generate a
    parameter reference card.

    Returns None if:
      - .hyperframes/expanded-prompt.md doesn't exist
      - No Execution Manifest section found
      - No weapons with params in manifest

    Returns a formatted string card otherwise.
    """
    project = Path(project_dir)
    expanded_path = project / ".hyperframes" / "expanded-prompt.md"
    if not expanded_path.is_file():
        return None

    try:
        text = expanded_path.read_text(encoding="utf-8")
    except Exception as e:
        logger.warning("Could not read expanded-prompt.md: %s", e)
        return None

    weapons = parse_execution_manifest(text)
    if not weapons:
        return None

    # Filter out HANDWRITE weapons
    coded = [w for w in weapons if not w.handwrite]
    if not coded:
        return None

    # Build card
    lines = []
    lines.append("WEAPON PARAMETER REFERENCE CARD (from Execution Manifest)")
    lines.append("=" * 64)
    lines.append("")

    any_has_params = False
    for w in coded:
        label = f"  {w.id}"
        if w.used_by:
            label += f" (scenes: {', '.join(w.used_by)})"
        lines.append(label)

        if w.params:
            any_has_params = True
            for key, value in w.params.items():
                lines.append(f"    {key}: {value}")
        lines.append("")

    lines.append("=" * 64)
    lines.append("Use EXACT values above when writing HTML animation code.")
    lines.append("Do NOT translate from memory — copy-paste the values.")
    lines.append("=" * 64)

    return "\n".join(lines)
