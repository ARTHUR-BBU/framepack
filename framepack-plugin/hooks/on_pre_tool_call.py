"""Pre-tool-call hook: verify frame.md exists before HyperFrames takes over.

v0.9.1 philosophy: Framepack's job is done once frame.md + expanded-prompt.md
are written. HyperFrames handles HTML. This hook only checks the handoff
readiness — does frame.md exist? If the agent tries to run `hyperframes`
commands without frame.md, warn once.

That's it. No HTML auditing. No workbench readiness gates. No 13-file checks.
"""

import logging
import os
import re

logger = logging.getLogger(__name__)

from .on_post_tool_call import _safe_inject


def register(ctx):
    """Register the pre_tool_call hook for handoff readiness."""

    def on_pre_tool_call(
        tool_name: str = "",
        args: dict | None = None,
        task_id: str = "",
        session_id: str = "",
        **kwargs,
    ):
        # Only watch for terminal commands that invoke hyperframes
        if tool_name != "terminal":
            return
        if not args:
            return

        command = args.get("command", "")
        # Only match "hyperframes" as a command word, not as a path component
        # e.g. "hyperframes lint" ✓  "npx hyperframes init" ✓  "/f/hyperframes" ✗
        if not re.search(r'(?:^|\s)(?:npx\s+)?hyperframes(?:\s|$)', command):
            return

        # Skip init and help — those don't need frame.md
        if "hyperframes init" in command or "hyperframes help" in command:
            return

        # Check: does frame.md exist in the working directory?
        # Derive project dir from the command's workdir or cwd
        workdir = args.get("workdir", "") or os.getcwd()
        frame_md_path = os.path.join(workdir, "frame.md")

        if os.path.isfile(frame_md_path):
            return  # frame.md exists, clean handoff

        # Warn — but don't block
        expanded_path = os.path.join(workdir, ".hyperframes", "expanded-prompt.md")
        has_expanded = os.path.isfile(expanded_path)

        if not has_expanded:
            message = (
                "⚠️ **HyperFrames 命令检测到，但交接文件缺失**\n\n"
                "Framepack 的职责是产出两个文件交给 HyperFrames：\n"
                "- `frame.md` — 视觉身份（配色、字体、动效参数）\n"
                "- `.hyperframes/expanded-prompt.md` — 创意细化（场景、节奏、转场）\n\n"
                "两个都还没有。建议先让 Framepack 完成创意阶段。\n\n"
                "_你可以继续执行，但 HyperFrames 会使用默认参数，效果可能不理想。_"
            )
        else:
            message = (
                "⚠️ **frame.md 缺失**\n\n"
                "`expanded-prompt.md` 已就绪，但 `frame.md` 还没有。\n"
                "frame.md 是 HyperFrames 的视觉身份输入（配色、字体、动效参数）。\n"
                "没有它，HyperFrames 会使用默认样式。\n\n"
                "_建议先生成 frame.md 再继续。_"
            )

        _safe_inject(ctx, message, role="user")
        logger.info("pre_tool_call: frame.md missing, handoff warning injected")

    ctx.register_hook("pre_tool_call", on_pre_tool_call)
    logger.info("Framepack v0.9.1 pre_tool_call hook registered (handoff readiness)")
