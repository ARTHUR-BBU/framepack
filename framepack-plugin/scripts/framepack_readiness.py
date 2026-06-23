#!/usr/bin/env python
"""Framepack Render Readiness Board CLI.

Usage:
    python scripts/framepack_readiness.py <project_dir>
    python scripts/framepack_readiness.py <project_dir> --json

Builds a readiness board from .framepack/ artifacts and writes
.framepack/render-readiness.md.
"""

from __future__ import annotations

import argparse
import json as json_module
import sys
from pathlib import Path

# Allow running from plugin root or scripts/
script_parent = Path(__file__).resolve().parent.parent
if str(script_parent) not in sys.path:
    sys.path.insert(0, str(script_parent))

from core.render_readiness import (
    build_readiness_board,
    render_board_markdown,
    render_board_summary,
    GateStatus,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Framepack Readiness Board")
    parser.add_argument("project_dir", help="Path to the video project directory")
    parser.add_argument("--json", action="store_true", help="Output JSON summary")
    parser.add_argument("--no-write", action="store_true", help="Don't write render-readiness.md")
    args = parser.parse_args()

    project = Path(args.project_dir)
    if not project.is_dir():
        print(f"Error: {project} is not a directory", file=sys.stderr)
        return 1

    board = build_readiness_board(project)

    if not args.no_write:
        fp_dir = project / ".framepack"
        fp_dir.mkdir(parents=True, exist_ok=True)
        md_path = fp_dir / "render-readiness.md"
        md_path.write_text(render_board_markdown(board), encoding="utf-8", newline="\n")

    summary = render_board_summary(board)
    print(summary)

    if args.json:
        data = {
            "overall": board.overall.value,
            "recommended_label": board.recommended_label,
            "gates": [
                {
                    "name": g.name,
                    "status": g.status.value,
                    "evidence": g.evidence,
                    "risk": g.risk,
                }
                for g in board.gates
            ],
        }
        print(json_module.dumps(data, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
