from pathlib import Path
import json
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_framepack_builtin_sources_exclude_deprecated_transitions_pack():
    from core.weapon_sources import list_framepack_builtin_sources

    ids = {source.id for source in list_framepack_builtin_sources()}

    assert "number-count-up" in ids
    assert "data-chart-editorial" in ids
    assert "transitions-pack" not in ids
    assert all(source.status == "executable" for source in list_framepack_builtin_sources())


def test_specialist_skill_sources_include_gsap_and_hyperframes_refs():
    from core.weapon_sources import list_specialist_skill_sources

    ids = {source.id for source in list_specialist_skill_sources()}

    assert "skill:gsap" in ids
    assert "skill:hyperframes:captions" in ids
    assert "skill:hyperframes:transitions" in ids
    assert "skill:framepack-reference-miner" in ids


def test_project_local_sources_read_arsenal(tmp_path):
    from core.weapon_sources import list_project_local_sources

    framepack = tmp_path / ".framepack"
    framepack.mkdir()
    (framepack / "arsenal.json").write_text(
        json.dumps({
            "weapons": {
                "custom-marble-wipe": {
                    "source": "local",
                    "kind": "part",
                    "status": "active",
                    "code": ".framepack/weapons/custom-marble-wipe.js",
                    "function": "customMarbleWipe",
                }
            }
        }),
        encoding="utf-8",
    )

    sources = list_project_local_sources(tmp_path)

    assert [source.id for source in sources] == ["custom-marble-wipe"]
    assert sources[0].load["file_path"] == ".framepack/weapons/custom-marble-wipe.js"


def test_official_sources_document_proxy_retry_rule():
    from core.weapon_sources import list_hyperframes_official_sources

    sources = list_hyperframes_official_sources()

    assert any(source.id == "hyperframes:catalog" for source in sources)
    catalog = next(source for source in sources if source.id == "hyperframes:catalog")
    assert "proxy" in catalog.notes.lower()
    assert "127.0.0.1:59527" in catalog.notes
