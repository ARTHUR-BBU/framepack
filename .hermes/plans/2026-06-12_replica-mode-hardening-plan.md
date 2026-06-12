# Framepack Replica Mode Hardening Implementation Plan

> **For Hermes:** Use test-driven-development + verification-before-completion + requesting-code-review. This plan is derived from `C:\Users\LENOVO\Documents\AI-Coach-Vault\Shared\2026-06-12-Framepack复刻测试总结.md`.

**Goal:** Turn the reference-clone test findings into prioritized Framepack/HyperFrames guardrails, tests, and workflow rules.

**Architecture:** Treat Replica Mode as a stricter Reference Miner path: `VIDEO_DNA.md` + `.hermes/content_decomposition.md` + `TEMPLATE_BLUEPRINT.md` drive HyperFrames implementation. P0 rules are encoded in guardrails/director/reference-miner docs and regression tests; later P1/P2 items become engineering hygiene work.

**Tech Stack:** Framepack plugin skills, guardrails.md, AGENTS.md managed source, pytest documentation contract tests, HyperFrames CLI validation.

---

## 1. Source Findings

Test report baseline:

- Output: `F:\Framepack-01-test\renders\reference-clone-draft.mp4`
- Final video: 1280×720, 30fps, 1050 frames, 35.000s.
- Verified chain: Framepack analysis → expanded-prompt → HyperFrames HTML → lint → validate → snapshot → visual fixes → render → ffprobe.

Key observed failures/fixes:

1. expanded-prompt originally lacked explicit BG/MG/FG layers.
2. S7/S11 density exceptions needed explicit approval.
3. S11 `no outgoing transition` needed a valid final hold transition.
4. S4 contained conditional implementation ambiguity.
5. Snapshot revealed visual layout issues: S3 input size/position, S4 bubble overlap, S6 contrast, S10 testimonial overlap.
6. Snapshot polluted source HTML with `data-hf-id`; cleanup was required.
7. Render succeeded but output duration was short (26.7s) because root composition lacked explicit `data-duration`.
8. Lint warnings remained non-blocking but important: overlapping GSAP tweens, Studio edit blocked, timeline track too dense.
9. Validate contrast warnings remained non-blocking but useful for polish.

---

## 2. Prioritized Backlog

### P0 — Correctness / Render Integrity

These can produce a wrong final video even when lint/render exit successfully.

1. **Root composition duration required**
   - Rule: root composition must include explicit `data-duration` equal to total target duration.
   - Reason: HyperFrames may infer duration from active GSAP timeline and trim final black/hold/outro.
   - Evidence: first render produced 26.7s instead of 34.967s until root `data-duration="34.967"` was added.

2. **Replica Mode required deliverables**
   - Required before HTML:
     - `VIDEO_DNA.md`
     - `.hermes/content_decomposition.md`
     - `TEMPLATE_BLUEPRINT.md`
   - HTML coding must use `TEMPLATE_BLUEPRINT.md` as source of truth, not freeform imagination.

3. **Replica expanded-prompt ambiguity ban**
   - Disallow implementation ambiguity in Replica Mode:
     - `if strict...`
     - `maybe...`
     - `optionally...`
     - `merge if needed...`
     - `no outgoing transition`
   - Require explicit `approved exception` for deliberate density violations or final holds.

### P1 — Workflow QA / Visual Verification

These prevent visually broken output.

4. **Snapshot QA loop required**
   - Required flow:
     - contact sheet snapshot
     - visual issue list
     - targeted CSS/layout fixes
     - second snapshot on risky scenes
     - render only after visual hard blockers are cleared.

5. **Snapshot pollution cleanup required**
   - After snapshot, source `index.html` must have `data-hf-id count = 0`.

### P2 — Engineering Hygiene / Maintainability

These improve future editing and precision but do not block draft render.

6. **Timeline density policy**
   - `timeline_track_too_dense` warning means future split into sub-compositions.
   - Suggested layout:
     - `compositions/s01-hook.html`
     - `compositions/s02-logo.html`
     - ...
     - root `index.html` mounts scenes and declares total duration.

7. **Overlapping GSAP tweens hygiene**
   - Non-blocking for draft render, but add `overwrite: "auto"` or split timeline segments during polish.

8. **Studio editability warning policy**
   - `gsap_studio_edit_blocked` is non-blocking for render but matters if Studio editing is planned.

### P3 — Polish / Distribution Quality

9. **Contrast pass**
   - WCAG contrast warnings are non-blocking for draft render.
   - Required for product-page embed or advertising final delivery.

10. **Frame-by-frame reference alignment pass**
   - Extract matching frames from source and clone.
   - Build visual difference table.
   - Tune easing, typography, positions, and transitions.

---

## 3. Execution Plan

### Task 1: Add regression tests for P0 root duration and Replica deliverables

**Objective:** Make P0 rules executable as documentation contract tests.

**Files:**

- Modify: `framepack-plugin/tests/test_storyboard_hook.py`

**Tests:**

```python
def test_guardrails_require_root_composition_data_duration(): ...
def test_director_requires_root_composition_data_duration(): ...
def test_reference_miner_documents_replica_mode_deliverables(): ...
def test_reference_miner_documents_replica_ambiguity_ban(): ...
```

**Expected RED:** tests fail before guardrails/skills are updated.

---

### Task 2: Patch guardrails/director/reference-miner docs for P0

**Objective:** Encode P0 rules in the files Agent actually reads.

**Files:**

- Modify: `framepack-plugin/guardrails.md`
- Modify: `AGENTS.md`
- Modify: `framepack-plugin/skills/framepack-director/SKILL.md`
- Modify: `framepack-plugin/skills/framepack-reference-miner/SKILL.md`

**Required content:**

- Root composition must declare explicit `data-duration`.
- Do not rely on GSAP timeline inference for final hold/outro.
- Replica Mode requires `VIDEO_DNA.md`, `.hermes/content_decomposition.md`, `TEMPLATE_BLUEPRINT.md` before HTML.
- Replica Mode HTML must implement from `TEMPLATE_BLUEPRINT.md`.
- Ambiguous implementation language is banned unless converted to explicit approved exceptions.

---

### Task 3: Run tests and version bump to v0.9.4

**Objective:** Release P0 hardening as a hotfix.

**Files:**

- Modify: `framepack-plugin/plugin.yaml`
- Modify: `framepack-plugin/__init__.py`
- Modify: `framepack-plugin/hooks/on_pre_tool_call.py`
- Modify: `framepack-plugin/hooks/on_post_tool_call.py`
- Modify: all Framepack SKILL.md frontmatter
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CHANGELOG.md`

**Verification:**

```bash
cd F:/hyperframes/framepack-plugin
python -m pytest tests/ -q -o "addopts="
```

---

### Task 4: Deploy sync and project hydration check

**Objective:** Ensure active Hermes plugin and test project receive v0.9.4 rules.

**Commands:**

```bash
cp F:/hyperframes/framepack-plugin/__init__.py F:/Hermes_windows/plugins/framepack/__init__.py
cp F:/hyperframes/framepack-plugin/plugin.yaml F:/Hermes_windows/plugins/framepack/plugin.yaml
cp F:/hyperframes/framepack-plugin/guardrails.md F:/Hermes_windows/plugins/framepack/guardrails.md
cp -r F:/hyperframes/framepack-plugin/hooks/* F:/Hermes_windows/plugins/framepack/hooks/
cp -r F:/hyperframes/framepack-plugin/skills/* F:/Hermes_windows/plugins/framepack/skills/
```

Then run deployed Hydrator in `F:/Framepack-01-test` and confirm:

- changed=True on first run if old block exists.
- version=0.9.4.
- second run noop.
- managed block count remains 1.

---

### Task 5: Independent review and commit

**Objective:** Commit only after fresh verification and independent review.

**Checks:**

- static diff security scan
- full pytest
- independent reviewer via `delegate_task`
- `git status --short`

Commit message:

```bash
git commit -m "v0.9.4: harden Replica Mode render integrity"
```

---

## 4. Acceptance Criteria

P0 is complete when:

- Tests prove guardrails/director require root `data-duration`.
- Tests prove Reference Miner documents Replica Mode deliverables.
- Tests prove ambiguity ban is documented.
- Deployed plugin is v0.9.4.
- Test project AGENTS.md managed block hydrates to v0.9.4.
- Full plugin tests pass.

P1/P2/P3 remain planned unless explicitly implemented later.
