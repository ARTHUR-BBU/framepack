# HTML Quality Beyond Lint Plan

> **For Hermes:** This is a planning artifact. Do not implement blindly. Use it to guide the next Framepack/HyperFrames quality upgrade after the current v0.10.2 test cycle reports back.

**Goal:** Upgrade Framepack/HyperFrames testing from “lint errors are low” to “rendered video experience matches the creative intent.”

**Architecture:** Keep lint as the structural gate, but add semantic gates above it: audio timing, asset readiness, storyboard fidelity, snapshot QA, render integrity, and warning taxonomy. Framepack should produce reliable handoff documents; HyperFrames should execute and verify the actual media artifact.

**Tech Stack:** Framepack plugin, HyperFrames CLI, expanded-prompt.md, frame.md, `npx hyperframes lint/validate/snapshot/render`, ffprobe, Python/pytest for future automation.

---

## Implementation Status — 2026-06-14

Started first product pass from this plan:

- Implemented `core/quality_audit.py` as a report-first semantic audit for the issues exposed by `F:\Framepack-01-test\`: stale arsenal project/duration, Manifest weapons missing from registry, manual `data-hf-id`, Manifest-vs-HTML weapon parameter drift, and undeclared card-cascade implementations.
- Added `scripts/framepack_quality_audit.py` with JSON/Markdown output. Example: `python scripts/framepack_quality_audit.py F:/Framepack-01-test --format json`.
- Hardened `core/execution_manifest.py` so scene-keyed YAML blocks and `params:` are parsed; this fixes the empty-manifest blind spot that let Arsenal reconciliation silently miss real weapons.
- Expanded `core/builtin_weapons.py` to cover the v0.10.2 Digital Soliloquy weapon set.
- Integrated Quality Audit into `pre_tool_call` for handoff-consuming HyperFrames commands, non-blocking and report-only.
- Generated real test-project evidence: `F:\Framepack-01-test\framepack-quality-audit.json` reported P0=15 / P1=13 / total=28 issues before any manual cleanup.

Scope boundary preserved: Framepack still does not write/fix/render HTML; this audit is an 安检小票 for semantic risks that lint cannot see.

---

## Why This Plan Exists

Current observation from testing:

> 测试组写出来的 HTML，`hyperframes lint` errors 越来越少。

This is good. It means the HyperFrames structural guardrails are working:

- root composition duration is more likely to be present
- scene clips use `class="clip"`
- time windows are copied instead of guessed
- `scene-inner` wrappers are becoming standard
- data-hf-id pollution is better understood
- Agent is loading `hyperframes`, `hyperframes-cli`, and `gsap` skills before production

But low lint errors only prove the HTML skeleton is less broken.

They do NOT prove:

- the video feels right
- the narration fits the scene timing
- BGM exists or mixes correctly
- final hold is preserved
- storyboard intent is visible in snapshots
- the output MP4 has the correct duration/fps/resolution
- warnings are harmless

In short:

> lint 绿只是“没骨折”。下一步要验证“跑起来像不像人，跳舞有没有节奏，镜头有没有灵魂”。

---

## Current Context

Current product state:

- Framepack version: v0.10.2 — Environment & Upgrade Manager groundwork
- Branch: `framepack-agent-platform`
- Source plugin path: `F:\hyperframes\framepack-plugin\`
- Deployed plugin path: `F:\Hermes_windows\plugins\framepack\`
- Test project path: `F:\Framepack-01-test\`

Relevant existing machinery:

- Framepack Director writes `frame.md` + `.hyperframes/expanded-prompt.md`
- expanded-prompt includes HyperFrames Time Windows + Structure Checklist + Execution Manifest
- HyperFrames handles HTML, lint, validate, snapshot, render
- v0.10.2 already added report-first environment/upgrade infrastructure

Important constraint:

- Current test cycle is owned by the test group. Development should wait for feedback before implementing product changes.
- This plan is for the next development pass after test feedback lands.

---

## Core Principle

Split quality into six gates:

1. Structure Gate — “Can HyperFrames understand this HTML?”
2. Timing Gate — “Does audio/video duration align with scene windows?”
3. Asset Gate — “Do all referenced assets exist and work?”
4. Visual QA Gate — “Do snapshots show the intended movie, not just any image?”
5. Creative Fidelity Gate — “Does the output match the storyboard/emotional arc?”
6. Render Integrity Gate — “Does the final MP4 truly match target duration/fps/resolution?”

Lint mostly covers Gate 1. The product now needs gates 2-6.

---

## Proposed Test Report Format

Require future test group reports to include this structure instead of only saying “lint passed”.

```markdown
# HyperFrames Output QA Report

## 1. Structure

- lint errors:
- lint warnings:
- validate console errors:
- validate warnings:
- data-hf-id count after snapshot cleanup:

## 2. Timing

- target duration from expanded-prompt:
- root data-duration:
- voiceover duration from ffprobe:
- BGM duration from ffprobe:
- rendered MP4 duration from ffprobe:
- final hold preserved: yes/no
- scene windows copied exactly: yes/no

## 3. Assets

- referenced images exist: yes/no/list
- referenced audio exists: yes/no/list
- referenced video exists: yes/no/list
- missing assets:
- BGM policy if user did not provide BGM:

## 4. Visual QA

- snapshot times:
- all scenes visible: yes/no
- strongest scene:
- weakest scene:
- any blank/black/unexpected frames:
- readability problems:
- layout/overlap problems:

## 5. Creative Fidelity

- matches storyboard emotional arc: yes/no/partial
- scene-by-scene fidelity:
  - S1:
  - S2:
  - S3:
  - S4:
  - S5:
  - S6:
- biggest mismatch vs storyboard:

## 6. Render

- output path:
- width:
- height:
- fps:
- frame count:
- duration:
- file size:

## 7. Warning Taxonomy

- P0 blocking:
- P1 affects output quality:
- P2 engineering hygiene:
- P3 accessibility/optimization:
```

---

## Warning Taxonomy

Do not treat all warnings as equal.

### P0 — Blocking

Definition: Must fix before render/preview is considered valid.

Examples:

- lint errors
- validate console errors
- missing root `data-duration`
- broken/missing media asset that is referenced by HTML
- final render shorter than target duration
- blank scenes in snapshot
- missing `window.__timelines["main"]`

### P1 — Affects Output Quality

Definition: Video can render, but viewer experience is likely wrong.

Examples:

- voiceover duration exceeds target composition duration
- BGM too loud or missing despite being promised
- scene time windows do not match expanded-prompt
- final hold missing or visually wrong
- major text overlap/readability issue
- storyboard says “quiet doubt” but scene is visually busy

### P2 — Engineering Hygiene

Definition: Does not block draft delivery, but should be tracked for refactor.

Examples:

- `overlapping_gsap_tweens`
- `timeline_track_too_dense`
- `gsap_studio_edit_blocked`
- repeated ad-hoc GSAP where a weapon exists
- too many scenes in one track when sub-compositions would help

### P3 — Accessibility / Optimization

Definition: Quality improvements for production polish.

Examples:

- contrast warnings
- large asset size
- unnecessary DOM nodes
- text too small on mobile preview

---

## Phase 1: Manual QA Ritual for Current Test Cycle

Do this manually before automating anything.

### Task 1: Require real media probe after TTS

**Objective:** Catch voiceover duration mismatch before HTML timing hardens.

**Command:**

```bash
cd /f/Framepack-01-test
ffprobe -v error -show_entries format=duration,size -of json assets/voiceover.mp3
```

**Pass criteria:**

- file exists
- size > 0
- duration is known
- duration is compatible with target composition duration

**Decision rule:**

- If voiceover duration <= target duration with breathing room: continue.
- If voiceover duration > target duration: either extend total duration or compress narration.
- Do not blindly speed up contemplative narration just to fit.

### Task 2: Require asset existence check before validate/render

**Objective:** Prevent HTML from referencing assets that do not exist.

**Command:**

```bash
cd /f/Framepack-01-test
python - <<'PY'
from pathlib import Path
import re
html = Path('index.html').read_text(encoding='utf-8')
refs = re.findall(r'(?:src|href)=["\']([^"\']+)["\']', html)
missing = []
for ref in refs:
    if ref.startswith(('http://', 'https://', 'data:')):
        continue
    p = Path(ref)
    if not p.exists():
        missing.append(ref)
print('refs:', refs)
print('missing:', missing)
raise SystemExit(1 if missing else 0)
PY
```

**Pass criteria:**

- No missing local assets.

**Special rule for BGM:**

If the user did not provide BGM and the Agent did not generate one, do not reference `assets/bgm.mp3`. Silence is acceptable for draft; broken asset references are not.

### Task 3: Require six-point snapshot QA

**Objective:** Confirm every emotional beat appears visually.

**Command:**

```bash
cd /f/Framepack-01-test
npx hyperframes snapshot --at 2,8,18,30,41,52
```

**Pass criteria:**

- every snapshot has visible scene content
- no unexpected blank frame
- each snapshot corresponds to the expected storyboard beat
- text is readable
- no obvious overlap

**After snapshot:**

Clean snapshot pollution if HyperFrames writes `data-hf-id` into source HTML.

```bash
cd /f/Framepack-01-test
python - <<'PY'
from pathlib import Path
import re
p = Path('index.html')
s = p.read_text(encoding='utf-8')
s = re.sub(r'\sdata-hf-id="[^"]*"', '', s)
p.write_text(s, encoding='utf-8')
print('data-hf-id count after strip:', s.count('data-hf-id'))
PY
```

### Task 4: Require render + ffprobe

**Objective:** Prove that the final media artifact matches target duration and format.

**Command:**

```bash
cd /f/Framepack-01-test
mkdir -p renders
npx hyperframes render --output renders/draft.mp4 --quality draft
ffprobe -v error \
  -show_entries stream=width,height,r_frame_rate,nb_frames,duration \
  -show_entries format=duration,size \
  -of json renders/draft.mp4
```

**Pass criteria:**

- render exits 0
- MP4 exists and size > 0
- duration matches target within frame quantization
- resolution matches target aspect
- final hold is preserved

---

## Phase 2: Add Handoff Readiness Check

This is the key product improvement: users should not need to inspect expanded-prompt manually.

### Task 5: Define handoff readiness rules

**Objective:** Create a machine-checkable rule list for `.hyperframes/expanded-prompt.md`.

Rules:

- Style Block exists
- Rhythm Declaration exists
- Audio Plan exists if narration/BGM is used
- HyperFrames Time Windows exists
- total duration declared
- every scene has `data-start`, `data-duration`, `data-track-index`
- every scene has Concept, Mood, Narration, Depth Layers, Animation Choreography, Transition Out
- final scene must not say `No transition out`; use `Transition Out: final hold to end, 0.000s`
- every scene has 8-10 elements OR explicit approved exception
- Execution Manifest exists
- every scene has at least one manifest entry or explicit HANDWRITE reason
- weapon coverage summary distinguishes unique weapon types from usage count

### Task 6: Decide where this checker lives

Candidate paths:

- `framepack-plugin/core/handoff_readiness.py`
- `framepack-plugin/scripts/framepack_handoff_readiness.py`
- Hook integration in `hooks/on_post_tool_call.py` after expanded-prompt writes

Recommended split:

- Core parser/checker in `core/handoff_readiness.py`
- CLI/report wrapper in `scripts/framepack_handoff_readiness.py`
- Hook calls checker and emits non-blocking warnings first

Reason:

- Keeps logic testable.
- Keeps hook thin.
- Enables test group/manual CLI usage.

### Task 7: Add tests for readiness rules

Likely test file:

- `framepack-plugin/tests/test_handoff_readiness.py`

Test cases:

- valid prompt passes
- final scene with `No transition out` is flagged
- scene with 7 elements and no approved exception is flagged
- missing Execution Manifest is flagged
- weapon summary with ambiguous “Builtin weapons: 8” is flagged or normalized
- time windows total duration mismatch is flagged

---

## Phase 3: Add Audio Timing Estimator

### Task 8: Implement narration word count estimator

**Objective:** Estimate whether narration fits scene windows before TTS generation.

Candidate file:

- `framepack-plugin/core/audio_timing.py`

Input:

- narration text per scene
- scene duration per scene

Output:

- words per scene
- estimated WPM per scene
- risk level: ok / tight / too_fast

Suggested thresholds for contemplative narration:

- <= 130 wpm: ok
- 130-155 wpm: tight
- >155 wpm: too_fast

The recent test sample showed:

- S1: 171.4 wpm — too_fast
- S4: 166.7 wpm — too_fast

### Task 9: Add audio estimator tests

Likely test file:

- `framepack-plugin/tests/test_audio_timing.py`

Test cases:

- short narration in long scene -> ok
- 145 wpm -> tight
- 170 wpm -> too_fast
- punctuation/ellipsis does not break word counting

### Task 10: Add report output

Report format:

```json
{
  "total_words": 121,
  "scenes": [
    {"scene": "S1", "words": 20, "duration": 7, "wpm": 171.4, "risk": "too_fast"}
  ],
  "recommendations": [
    "S1 narration is too fast for contemplative voice; shorten text or extend scene."
  ]
}
```

---

## Phase 4: Add Render Integrity Report

### Task 11: Define render report schema

Candidate output file in test projects:

- `.framepack/render-integrity-report.json`

Fields:

```json
{
  "target_duration": 55,
  "root_data_duration": 55,
  "rendered_duration": 55.0,
  "fps": "30/1",
  "nb_frames": 1650,
  "width": 1080,
  "height": 1920,
  "file_size": 1234567,
  "final_hold_expected": true,
  "final_hold_preserved": true,
  "missing_assets": [],
  "data_hf_id_count": 0
}
```

### Task 12: Decide whether Framepack owns this

Framepack does not render HTML. HyperFrames owns rendering.

Recommended boundary:

- Framepack can define the QA rubric and report template.
- HyperFrames CLI or test group generates render evidence.
- Framepack hook can read/report preflight information, but should not become the renderer.

This avoids Framepack crossing back into “HTML auditor” territory.

---

## Phase 5: Update Skills / Docs

### Task 13: Update Framepack skill with “lint is not experience” rubric

Candidate file:

- `framepack-plugin/skills/framepack/SKILL.md`

Add section:

```markdown
## Quality Gates Beyond Lint

`npx hyperframes lint` proves structural compatibility, not creative correctness.
After lint passes, verify:
1. audio duration alignment
2. asset existence
3. snapshot storyboard fidelity
4. render ffprobe duration/fps/resolution
5. final hold preservation
6. warning taxonomy
```

### Task 14: Update director skill to mention handoff readiness

Candidate file:

- `framepack-plugin/skills/framepack-director/SKILL.md`

Add after storyboard preview:

```markdown
Before handing off to HyperFrames, run/perform handoff readiness:
- no `No transition out`
- final hold expressed as 0.000s transition
- every scene has 8-10 elements or approved exception
- narration WPM fits intended mood
- weapon summary distinguishes types vs usages
```

### Task 15: Update HyperFrames handoff notes in AGENTS.md

Candidate file:

- `AGENTS.md`

Add concise note:

```markdown
Lint 0 errors is not completion. After lint, require validate + snapshots + render + ffprobe + final hold check.
```

---

## Validation Strategy

When implementing later, use the project’s mandatory development skills:

- New feature / large change: load `brainstorming`
- Python changes: load `test-driven-development`
- Debugging: load `systematic-debugging`
- Completion claim: load `verification-before-completion`
- Pre-commit: load `requesting-code-review`

Suggested verification commands after implementation:

```bash
cd /f/hyperframes/framepack-plugin
python -m pytest tests/ -q -o "addopts="
```

Also verify deployment sync after plugin changes:

```bash
# Exact sync command should follow current Framepack deployment convention.
# Ensure F:\Hermes_windows\plugins\framepack\ matches source for plugin.yaml, hooks, core, skills, scripts, compat.
```

---

## Risks / Tradeoffs

### Risk 1: Turning Framepack back into an HTML auditor

Avoid this.

Framepack should check handoff readiness and define QA rubrics. HyperFrames should own actual HTML validation/rendering.

### Risk 2: Over-blocking creative flow

Readiness checks should start as warnings/report-only, not hard blockers, until test data proves which failures are truly P0.

### Risk 3: Users may ignore warnings

That is okay. The system should still record them in reports so failures are explainable after render.

### Risk 4: Audio estimates are approximate

Word count WPM is not exact TTS duration. Treat estimator as early warning, then verify with ffprobe after TTS generation.

---

## Recommended Next Step After Test Feedback

When the current test group returns results:

1. Classify each issue into one of the six gates.
2. Mark whether it was caught by current lint/validate.
3. If not caught, decide which future checker should catch it.
4. Implement the smallest checker/rubric that would have caught the issue.
5. Add regression tests.

Do not implement a giant QA framework at once. Build it from real misses.

---

## One-Sentence Product Thesis

Framepack v0.9-v0.10 made Agent HTML structurally safer; the next leap is making rendered videos experientially faithful.

Or in 老田 terms:

> 以前是防止车散架；现在要开始测乘客会不会晕车、司机有没有开到目的地、电影感有没有拍出来。
