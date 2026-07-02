from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from core.hyperframes_capabilities import capability_map, render_capability_markdown

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "framepack_hyperframes_capabilities.py"


def test_capability_map_contains_website_capture_catalog_and_skills_pack():
    data = capability_map()
    ids = {item["id"] for item in data["capabilities"]}

    assert "website-to-video" in ids
    assert "capture" in ids
    assert "catalog" in ids
    assert "official-skills-pack" in ids
    assert data["skills_pack"]["install"] == "npx skills add heygen-com/hyperframes"


def test_capability_markdown_mentions_framepack_boundary():
    markdown = render_capability_markdown(capability_map())

    assert "Framepack decides" in markdown
    assert "HyperFrames executes" in markdown
    assert "website-to-video" in markdown


def test_capability_cli_json_output():
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--format", "json"],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0
    data = json.loads(result.stdout)
    assert data["hyperframes_supported_window"]
    assert any(item["id"] == "capture" for item in data["capabilities"])
