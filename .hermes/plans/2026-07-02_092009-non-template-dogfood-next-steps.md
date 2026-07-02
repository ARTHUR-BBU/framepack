# Framepack Non-template Dogfood Follow-up Plan

> **For Hermes:** use this plan after the current non-template dogfood test session returns its report. Keep the current pipeline-first, artifact-based design unless the report shows a clear reason to expand it.

**Goal:** Use the incoming non-template dogfood feedback to decide whether Framepack needs lightweight Script/Timing evidence detectors, then package the current post-release work into the right release train.

**Architecture:** Keep the existing artifact + gate model. Do not introduce a state machine, `state.json`, or a schema engine. Treat `progress.md` as a user-facing evidence board and add only the smallest detector surface needed to make the official HyperFrames pipeline feel coherent for real non-template work.

**Tech Stack:** Python 3.11, pytest, existing Framepack plugin hooks, current `core.gates.*` checks, deployed plugin at `F:/Hermes_windows/plugins/framepack/`.

**Source design anchors:**
- `F:/hyperframes/.hermes/designs/2026-07-01--official-prompt-pipeline-alignment.md`
- `F:/hyperframes/.hermes/plans/2026-07-01_203809-non-template-pipeline-alignment.md`
- `F:/hyperframes/.hermes/reports/2026-07-02--framepack-non-template-dogfood-test-brief.md`

---

## Current confirmed state

- Framepack formal version remains `0.16.0`.
- Source and deployed plugin surfaces are md5-aligned for the critical files we checked.
- `pipeline_progress.py` already uses the official-style stages:
  - 素材准备
  - 视觉身份
  - 文案脚本
  - 分镜导演稿
  - 配音/节奏
  - 制作中
  - 验片交付
- `asset-intake.md` and `template-selection.md` both update `.framepack/progress.md`.
- Non-template projects now get a creation ticket instead of being forced into template-first mental models.
- Test brief has already been issued; the test team is expected to return a report, not source changes.

---

## Decision gate before implementation

### Input required

Wait for the test report from the separate test session and classify findings into:

- `P0` — blocks valid non-template workflow or corrupts artifacts
- `P1` — must fix before release, workaround exists
- `P2` — product / UX or evidence-clarity improvement
- `P3` — polish or future enhancement

### What to decide from the report

1. Are Script / Timing detectors necessary now, or is the current stage vocabulary enough?
2. Does the non-template creation ticket feel helpful or noisy?
3. Is `0.16.1` sufficient, or does the work merit `0.17.0` positioning?
4. Does any current hook behavior look miswired in real runtime, not just in unit tests?

---

## Task 1: Triaging the dogfood report into implementation targets

**Objective:** Convert the test team report into a short, ranked change list before touching code.

**Files:**
- Read: `F:/Framepack-01-test/reports/<latest>/REPORT.md`
- Read: `F:/Framepack-01-test/reports/<latest>/artifacts-index.md`
- Read: `F:/Framepack-01-test/reports/<latest>/command-output.txt`
- Update if needed: `F:/hyperframes/.hermes/CONTEXT.md`
- Update if needed: `F:/hyperframes/.hermes/plans/2026-07-02_092009-non-template-dogfood-next-steps.md`

**Steps:**
1. Extract every test finding and tag it P0–P3.
2. Map each finding to one of three buckets:
   - no code change needed
   - test/doc clarification only
   - code change required
3. Write down the exact file(s) that would change if the bucket is `code change required`.
4. Decide whether Script / Timing needs a detector or just a better label/prompt.

**Verification:**
- The triage output must answer: “What do we actually change next, and why?”
- No code changes yet.

---

## Task 2: If needed, add lightweight Script evidence detection

**Objective:** Make `文案脚本` visible only when the project has real script-like evidence, not just a stage label.

**Trigger condition:** Only do this if the dogfood report says the Script stage feels misleading or too empty.

**Likely files:**
- Modify: `F:/hyperframes/framepack-plugin/core/pipeline_progress.py`
- Modify: `F:/hyperframes/framepack-plugin/tests/test_pipeline_progress.py`
- Possibly modify: `F:/hyperframes/framepack-plugin/hooks/on_post_tool_call.py` if the hook should write a script-related artifact later

**Likely evidence candidates:**
- `script.md`
- `narration.md`
- `voiceover.md`
- `expanded-prompt.md` sections that explicitly contain narration / CTA / copy decisions

**Step outline:**
1. Write failing tests for the smallest acceptable script evidence case.
2. Run the focused pytest target and confirm failure.
3. Add the smallest detector code needed to make the test pass.
4. Re-run the focused and nearby progress tests.

**Non-goals:**
- Do not invent a big narrative schema.
- Do not create a new workflow database.
- Do not force every project to write a separate script file.

---

## Task 3: If needed, add lightweight Timing evidence detection

**Objective:** Make `配音/节奏` mean something real in the progress board.

**Trigger condition:** Only do this if the dogfood report says Timing feels opaque or the current board hides audio decisions.

**Likely files:**
- Modify: `F:/hyperframes/framepack-plugin/core/pipeline_progress.py`
- Modify: `F:/hyperframes/framepack-plugin/tests/test_pipeline_progress.py`
- Possibly modify: `F:/hyperframes/framepack-plugin/hooks/on_post_tool_call.py`

**Likely evidence candidates:**
- `audio-cues.md`
- `beat-map.json`
- `transcript.json`
- `timing-cues.md`
- BGM / TTS / beat sections inside `expanded-prompt.md`

**Step outline:**
1. Decide the minimum artifact that counts as timing evidence.
2. Write a failing test for that artifact.
3. Implement the detector with the least special cases possible.
4. Re-run progress tests and the hook-routing tests.

**Non-goals:**
- No deep audio analysis pipeline yet.
- No overfitted BPM detector unless the test report proves it is needed.

---

## Task 4: Decide release train and update release surfaces if we ship

**Objective:** Turn the current post-release work into either a patch release or a product-positioning release.

**Decision rule:**
- If the dogfood report is mostly green and the changes are polish/visibility → target `0.16.1`.
- If the report shows the work materially changed Framepack’s product identity → target `0.17.0`.

**Likely files if bumping version:**
- `F:/hyperframes/framepack-plugin/plugin.yaml`
- `F:/hyperframes/framepack-plugin/__init__.py`
- `F:/hyperframes/framepack-plugin/hooks/on_pre_tool_call.py`
- `F:/hyperframes/framepack-plugin/hooks/on_post_tool_call.py`
- `F:/hyperframes/framepack-plugin/AGENTS.md`
- `F:/hyperframes/framepack-plugin/README.md`
- `F:/hyperframes/framepack-plugin/docs/README.zh-CN.md`
- `F:/hyperframes/framepack-plugin/skills/*/SKILL.md`
- `F:/Hermes_windows/plugins/framepack/` mirror
- `F:/Hermes_windows/skills/software-development/framepack/SKILL.md`

**Verification:**
1. Run the version-sync / deploy-manifest tests.
2. Search for the previous version string in dotted, flattened, and underscored forms.
3. Compare source vs deployed md5 for the release surfaces.
4. Re-run the source and deployed pytest suites.

**Non-goals:**
- No partial bump.
- No version string drift.
- No “looks synced” claims without md5 verification.

---

## Task 5: Refresh second-brain and handoff notes after implementation

**Objective:** Keep the strategic record aligned with the actual release decision.

**Likely files:**
- `F:/Hermes-Second-Brain/03_Projects/Framepack/Current_Development_Status.md`
- `F:/Hermes-Second-Brain/03_Projects/Framepack/Strategic_Decisions.md`
- `F:/hyperframes/.hermes/CONTEXT.md`

**Steps:**
1. Record the report-backed decision about Script / Timing.
2. Record the release-train decision (`0.16.1` vs `0.17.0`).
3. Update the handoff state so the next session does not have to rediscover the same choice.

**Verification:**
- Handoff and second-brain entries should point at the same decision.
- No stale “template-first” wording should reappear as the main project stance.

---

## Validation checklist for the next implementation cycle

Run the relevant command set after each code step:

```bash
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_pipeline_progress.py -q -o "addopts="
cd F:/hyperframes/framepack-plugin && python -m pytest tests/test_post_tool_gate_routing.py -q -o "addopts="
cd F:/hyperframes/framepack-plugin && python -m pytest tests/ -q -o "addopts="
```

If a release bump happens, also run the version-sync / deployment md5 checks before claiming success.

---

## Open questions reserved for the test report

- Is the non-template creation ticket crisp or too chatty?
- Does `文案脚本` need a detector immediately, or is it acceptable as a label for now?
- Does `配音/节奏` need an artifact before release?
- Should the next release be framed as polish (`0.16.1`) or a product milestone (`0.17.0`)?
- Are there any hook/runtime mismatches only visible in the test session, not in unit tests?
