"""Pre-tool-call hook: intercept HyperFrames HTML writes BEFORE they land.

This is the "从观察到执法" (observe → enforce) shift.
When the agent is about to write a broken index.html, we scan the pending
content against the HyperFrames contract and inject a warning BEFORE the
tool executes — giving the agent a chance to reconsider.

Philosophy (MVP): warn, don't block. The agent is still the director.
Framepack is the safety officer tapping on the shoulder.
"""

import logging

logger = logging.getLogger(__name__)

# Reuse the HTML audit engine from the post_tool_call hook
from .on_post_tool_call import _run_html_checks, _is_hyperframes_html, _safe_inject


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

        # ── Run the same regex audit against the PENDING content ──
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
