from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8", errors="replace")


def test_framepack_skill_mentions_vnext_director_workbench_contract():
    content = read("skills/framepack/SKILL.md")
    for phrase in [
        "Intent Router",
        "Director Story Bible",
        "Handoff Manifest",
        "Pre-render Taste Audit",
        "Framepack advises; user decides",
        "ask for assets",
        "HyperFrames catalog + Framepack dynamic arsenal",
    ]:
        assert phrase in content


def test_director_skill_mentions_asset_intake_and_story_bible():
    content = read("skills/framepack-director/SKILL.md")
    for phrase in [
        "ask for assets",
        "Director Story Bible",
        "Handoff Manifest",
        "Pre-render Taste Audit",
        "Studio preview",
        "Framepack advises; user decides",
    ]:
        assert phrase in content


def test_guardrails_mentions_vnext_director_workbench_boundaries():
    content = read("guardrails.md")
    for phrase in [
        "Intent Router",
        "Director Story Bible",
        "Handoff Manifest",
        "Pre-render Taste Audit",
        "Framepack advises; user decides",
    ]:
        assert phrase in content
