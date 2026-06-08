"""Pre-tool-call hook: intercept HyperFrames HTML writes BEFORE they land.

This is the "从观察到执法" (observe → enforce) shift.
When the agent is about to write a broken index.html, we scan the pending
content against the HyperFrames contract and workbench readiness checklist —
injecting warnings BEFORE the tool executes, giving the agent a chance to
reconsider.

Philosophy (MVP): warn, don't block. The agent is still the director.
Framepack is the safety officer tapping on the shoulder.

v0.7.10: Added workbench-readiness gate — checks for STORYBOARD.md,
COMPOSITION.md, DESIGN.md, DESIGN_TOKENS.md before allowing index.html writes.
"""

import logging
import os

logger = logging.getLogger(__name__)

# Reuse the HTML audit engine from the post_tool_call hook
from .on_post_tool_call import _run_html_checks, _is_hyperframes_html, _safe_inject


# ── Required workbench files (must exist before writing index.html) ──

_WORKBENCH_REQUIRED_FILES = [
    ("STORYBOARD.md", "Scene structure, emotional arc, timing beats"),
    ("COMPOSITION.md", "Weapon assignments, transitions, timeline map"),
    ("DESIGN.md", "Typography hierarchy, visual language, layout system"),
    ("DESIGN_TOKENS.md", "Color tokens, font tokens, spacing tokens"),
]

_WORKBENCH_RECOMMENDED_FILES = [
    ("FRAMEPACK.md", "Project brief and creative direction"),
    ("DIRECTION.md", "Motion direction and animation philosophy"),
    (".framepack/arsenal.json", "Weapon inventory and recommendations"),
]


def _check_workbench_readiness(file_path: str) -> dict:
    """Check if the workbench has all required files before writing index.html.

    Derives the project directory from the index.html path, then checks for
    required and recommended workbench files.

    Returns:
        dict with:
            project_dir: str — the workbench directory
            missing_required: list[(filename, description)]
            missing_recommended: list[(filename, description)]
            ready: bool — all required files present
    """
    project_dir = os.path.dirname(os.path.abspath(file_path))

    missing_required = []
    for filename, desc in _WORKBENCH_REQUIRED_FILES:
        full_path = os.path.join(project_dir, filename)
        if not os.path.isfile(full_path):
            missing_required.append((filename, desc))

    missing_recommended = []
    for filename, desc in _WORKBENCH_RECOMMENDED_FILES:
        full_path = os.path.join(project_dir, filename)
        if not os.path.isfile(full_path):
            missing_recommended.append((filename, desc))

    return {
        "project_dir": project_dir,
        "missing_required": missing_required,
        "missing_recommended": missing_recommended,
        "ready": len(missing_required) == 0,
    }


def _build_readiness_message(result: dict) -> str:
    """Build a user-facing message from workbench readiness check results."""
    missing = result["missing_required"]
    recommended = result["missing_recommended"]

    prefix = (
        "🚨 **STOP — Workbench not ready for index.html**\n\n"
        f"The following required design documents are missing from "
        f"`{result['project_dir']}`. Writing index.html without these is "
        f"like shooting a film without a script or a shot list:\n\n"
    )

    lines = []
    for filename, desc in missing:
        lines.append(f"🔴 **{filename}** — {desc}")

    if recommended:
        lines.append("")
        for filename, desc in recommended:
            lines.append(f"💡 **{filename}** — {desc} (recommended)")

    lines.append("")
    lines.append(
        "**Fix:** Generate these files before writing index.html. "
        "Start with STORYBOARD.md (scenes and timing), then COMPOSITION.md "
        "(weapon assignments), then DESIGN.md + DESIGN_TOKENS.md (visual system)."
    )

    return prefix + "\n".join(lines)


def register(ctx):
    """Register the pre_tool_call hook for HyperFrames HTML interception."""

    def on_pre_tool_call(
        tool_name: str = "",
        args: dict | None = None,
        task_id: str = "",
        session_id: str = "",
        **kwargs,
    ):
        """Fires BEFORE every tool call."""

        if tool_name != "write_file":
            return

        if not args:
            return

        file_path = args.get("path", "")
        if not _is_hyperframes_html(file_path):
            return

        content = args.get("content", "")
        if not content.strip():
            return

        # ── Gate 1: Workbench readiness (design docs must exist) ──
        readiness = _check_workbench_readiness(file_path)
        if not readiness["ready"]:
            message = _build_readiness_message(readiness)
            message += (
                "\n\n_You can still write this file — the choice is yours. "
                "But the resulting video is likely to look like a toy without "
                "proper design scaffolding._"
            )
            _safe_inject(ctx, message, role="user")
            logger.info(
                "pre_tool_call readiness gate failed for %s (%d required files missing)",
                file_path, len(readiness["missing_required"]),
            )
            # Continue to HTML audit — both gates should fire independently

        # ── Gate 2: HyperFrames HTML contract audit ──
        findings = _run_html_checks(content)
        violations = [f for f in findings if not f["passed"]]

        if not violations:
            return  # Clean — let it through silently

        p0_count = sum(1 for v in violations if "P0" in v["severity"])
        p1_count = sum(1 for v in violations if "P1" in v["severity"])

        # ── Build urgency-appropriate warning ──
        if p0_count > 0:
            prefix = (
                f"🚨 **STOP — {p0_count} HyperFrames P0 violation(s) detected "
                f"BEFORE writing index.html**\n\n"
                f"These WILL cause a blank render. Fix them BEFORE you write:\n\n"
            )
        elif p1_count >= 3:
            prefix = (
                f"⚠️  **WARNING — {p1_count} HyperFrames P1 issues in "
                f"pending index.html**\n\n"
                f"These are likely to break the render. Consider fixing now:\n\n"
            )
        else:
            prefix = (
                f"💡 **Heads-up — {len(violations)} HyperFrames issue(s) in "
                f"pending index.html:**\n\n"
            )

        lines = []
        for v in violations:
            icon = "🔴" if "P0" in v["severity"] else "🟡"
            lines.append(f"{icon} **[{v['check_id']}]** {v['message']}")

        message = prefix + "\n".join(lines)
        message += (
            "\n\n_You can still write this file — the choice is yours. "
            "But a post-write audit will flag these again._"
        )

        _safe_inject(ctx, message, role="user")
        logger.info(
            "pre_tool_call warning injected for %s (%d P0, %d P1)",
            file_path, p0_count, p1_count,
        )

    ctx.register_hook("pre_tool_call", on_pre_tool_call)
    logger.info("Framepack pre_tool_call hook registered (HyperFrames HTML interceptor)")
