from core.skill_overlay_manager import SkillOverlay, apply_overlay, apply_overlays


def overlay(body="Root composition must explicitly set `data-duration`.") -> SkillOverlay:
    return SkillOverlay(
        id="hf-root-duration",
        target_skill="hyperframes",
        framepack_version="0.10.2",
        body=body,
        equivalent_phrases=("data-duration", "root composition"),
    )


def test_apply_overlay_inserts_provenance_managed_block_when_absent():
    result = apply_overlay("# HyperFrames\n\nOfficial text.\n", overlay())

    assert result.changed is True
    assert result.manual_review_required is False
    assert "<!-- FRAMEPACK HARDENING START id=hf-root-duration" in result.text
    assert "source=framepack@0.10.2" in result.text
    assert "target=hyperframes" in result.text
    assert "Root composition must explicitly set `data-duration`." in result.text
    assert "<!-- FRAMEPACK HARDENING END id=hf-root-duration -->" in result.text


def test_apply_overlay_is_idempotent_for_same_body():
    first = apply_overlay("# HyperFrames\n", overlay())
    second = apply_overlay(first.text, overlay())

    assert first.changed is True
    assert second.changed is False
    assert second.text.count("FRAMEPACK HARDENING START id=hf-root-duration") == 1


def test_apply_overlay_replaces_only_matching_framepack_managed_block():
    first = apply_overlay("# HyperFrames\n\nUser note outside managed block.\n", overlay("old body"))
    second = apply_overlay(first.text, overlay("new body"))

    assert second.changed is True
    assert "new body" in second.text
    assert "old body" not in second.text
    assert "User note outside managed block." in second.text


def test_apply_overlay_preserves_user_local_blocks_and_notes():
    text = """# HyperFrames

<!-- USER LOCAL HARDENING START id=china-proxy -->
Use local HTTPS proxy when registry times out.
<!-- USER LOCAL HARDENING END id=china-proxy -->

Normal user note.
"""

    result = apply_overlay(text, overlay())

    assert "<!-- USER LOCAL HARDENING START id=china-proxy -->" in result.text
    assert "Use local HTTPS proxy when registry times out." in result.text
    assert "Normal user note." in result.text
    assert result.preserved_user_blocks == ["china-proxy"]


def test_equivalent_official_text_marks_overlay_upstream_absorbed_without_duplicate_insert():
    official_text = "# HyperFrames\n\nThe root composition should set data-duration explicitly.\n"

    result = apply_overlay(official_text, overlay())

    assert result.changed is False
    assert result.upstream_absorbed == ["hf-root-duration"]
    assert "FRAMEPACK HARDENING START id=hf-root-duration" not in result.text


def test_user_local_equivalent_words_do_not_count_as_upstream_absorbed():
    text = """# HyperFrames

<!-- USER LOCAL HARDENING START id=project-note -->
This project mentions root composition and data-duration in a local note.
<!-- USER LOCAL HARDENING END id=project-note -->
"""

    result = apply_overlay(text, overlay())

    assert result.changed is True
    assert result.upstream_absorbed == []
    assert "FRAMEPACK HARDENING START id=hf-root-duration" in result.text
    assert "USER LOCAL HARDENING START id=project-note" in result.text


def test_malformed_existing_framepack_marker_requires_manual_review():
    text = """# HyperFrames

<!-- FRAMEPACK HARDENING START id=hf-root-duration source=framepack@0.10.1 target=hyperframes -->
old body without end marker
"""

    result = apply_overlay(text, overlay("new body"))

    assert result.changed is False
    assert result.manual_review_required is True
    assert "malformed" in " ".join(result.notes)
    assert "new body" not in result.text


def test_apply_overlays_combines_results_in_order():
    overlays = [
        overlay("Root composition must explicitly set `data-duration`."),
        SkillOverlay(
            id="hf-clip-root-animation-ban",
            target_skill="hyperframes",
            framepack_version="0.10.2",
            body="Do not animate clip roots with opacity/filter/transform.",
        ),
    ]

    result = apply_overlays("# HyperFrames\n", overlays)

    assert result.changed is True
    assert "id=hf-root-duration" in result.text
    assert "id=hf-clip-root-animation-ban" in result.text
    assert result.applied == ["hf-root-duration", "hf-clip-root-animation-ban"]
