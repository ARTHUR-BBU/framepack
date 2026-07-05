# Commercial Video Quality Engine Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn Framepack’s weapon system from “prevents naked GSAP” into a productized quality engine that proves weapons are visually good, enforces meaningful preset usage, and catches PPT-like commercial videos before render.

**Architecture:** Build the loop in small layers: first a strict Weapon Gate Effectiveness Evaluation harness, then a one-weapon Bench for rendered evidence, then scorecards/presets, then Taste Audit signals, then SDK/Figma metadata integration. Do not add more bureaucracy without visual evidence.

**Tech Stack:** Python plugin code under `framepack-plugin/core/`, CLI scripts under `framepack-plugin/scripts/`, pytest under `framepack-plugin/tests/`, HyperFrames CLI (`npx hyperframes keyframes/snapshot/validate/render`), existing Framepack hook and audit architecture.

---

## Product metaphor

Framepack currently has a kitchen rule: “you must use the official knives.”

This plan adds:

1. **Knife inspection** — are the knives sharp and safe?
2. **Recipe cards** — which knife settings make food taste good?
3. **Plate inspection** — does the dish look like a premium commercial video, or like PPT with confetti?
4. **Mystery shopper tests** — can an Agent still cheat the gate?

---

## Current context

Design source:
- `F:/hyperframes/.hermes/designs/2026-07-05--commercial-video-quality-engine.md`

Recently implemented defensive layer:
- `framepack-plugin/core/weapon_load_plan.py`
- `framepack-plugin/core/weapon_enforcement.py`
- `framepack-plugin/hooks/on_pre_tool_call.py`
- `framepack-plugin/hooks/on_post_tool_call.py`
- `framepack-plugin/core/quality_audit.py`
- `framepack-plugin/core/weapon_sources.py`
- `framepack-plugin/core/pre_render_audit.py`

Existing tests to extend:
- `framepack-plugin/tests/test_weapon_enforcement_gate.py`
- `framepack-plugin/tests/test_quality_audit.py`
- `framepack-plugin/tests/test_framepack_match_weapons_cli.py`
- `framepack-plugin/tests/test_weapon_matching_hooks.py`

Hard requirements:
- TDD: RED → GREEN for all code changes.
- Strictly evaluate whether weapon gates are truly effective, not just unit-green.
- Source and deployed plugin must both pass tests.
- Plugin changes must sync to `F:/Hermes_windows/plugins/framepack/`.
- `framepack-plugin/skills/framepack/SKILL.md` must sync to deployed plugin and standalone skill when changed.
- md5 verification is mandatory after deployment sync.

---

## Phase 0 — Strict Weapon Gate Effectiveness Evaluation

**Purpose:** Before adding taste features, prove the existing gates cannot be trivially bypassed.

**Verdict logic:** A gate is not “effective” because a unit test passes. It is effective only if it catches realistic Agent cheating patterns:

- plan exists but HTML ignores it
- weapon function appears in comment/string only
- weapon function is referenced but not called
- wrong function casing
- fake local shim named like the weapon function
- weapon function is called with empty/default unsafe parameters
- patch writes HTML in multi-file patch
- terminal writes HTML via redirection
- terminal writes HTML via Python script
- subdirectory `cd` path tricks
- HANDWRITE waiver with vague checked sources

### Task 0.1: Create gate effectiveness test matrix fixture

**Objective:** Define the cheating patterns as data, not scattered tests.

**Files:**
- Create: `framepack-plugin/tests/fixtures/weapon_gate_cases.py`
- Test: `framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py`

**Step 1: Write failing test**

Create `test_weapon_gate_effectiveness_matrix.py` with a fixture table like:

```python
from tests.fixtures.weapon_gate_cases import GATE_BYPASS_CASES


def test_gate_bypass_matrix_has_required_cases():
    ids = {case.case_id for case in GATE_BYPASS_CASES}
    assert "function_in_comment_only" in ids
    assert "function_string_only" in ids
    assert "fake_local_shim" in ids
    assert "empty_preset_call" in ids
    assert "terminal_redirect_index_html" in ids
```

Run:

```bash
python -m pytest framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py -q -o "addopts="
```

Expected: FAIL — fixture missing.

**Step 2: Implement fixture dataclass**

Create `framepack-plugin/tests/fixtures/weapon_gate_cases.py`:

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class GateBypassCase:
    case_id: str
    html: str
    should_block: bool
    reason: str


GATE_BYPASS_CASES = [
    GateBypassCase(
        case_id="function_in_comment_only",
        html="""<script>// numberCountUp({ target: '#metric' })</script>""",
        should_block=True,
        reason="comments are not implementation",
    ),
    GateBypassCase(
        case_id="function_string_only",
        html="""<script>const fn = 'numberCountUp';</script>""",
        should_block=True,
        reason="strings are not implementation",
    ),
    GateBypassCase(
        case_id="fake_local_shim",
        html="""<script>function numberCountUp(){}; numberCountUp({});</script>""",
        should_block=True,
        reason="local fake shim is not loaded weapon code",
    ),
    GateBypassCase(
        case_id="empty_preset_call",
        html="""<script>numberCountUp({});</script>""",
        should_block=True,
        reason="function call without preset-quality params is not enough",
    ),
    GateBypassCase(
        case_id="proper_weapon_call_with_load_marker",
        html="""<script src="parts/references/number-count-up.js"></script><script>numberCountUp({ preset: 'luxury_metric', target: '#metric', duration: 1.4 });</script>""",
        should_block=False,
        reason="loaded canonical weapon and used preset params",
    ),
]
```

**Step 3: Verify pass**

Run same pytest. Expected: PASS.

---

### Task 0.2: Evaluate current post-write gate against bypass matrix

**Objective:** Establish the truth: which bypasses current gate catches and which it misses.

**Files:**
- Modify: `framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py`

**Step 1: Write failing tests against current behavior**

Add helper to create a temp project with:
- `.framepack/weapon-load-plan.json`
- `index.html` from case

Then call:

```python
from core.weapon_enforcement import check_weapon_implementation


def test_current_gate_effectiveness_matrix(tmp_path):
    results = {}
    for case in GATE_BYPASS_CASES:
        project = make_project(tmp_path, case)
        violations = check_weapon_implementation(project)
        blocked = bool(violations)
        results[case.case_id] = blocked

    assert results["function_in_comment_only"] is True
    assert results["function_string_only"] is True
    assert results["fake_local_shim"] is True
    assert results["empty_preset_call"] is True
    assert results["proper_weapon_call_with_load_marker"] is False
```

Expected: FAIL — current gate likely misses comments/strings/fake shims/empty calls because it only searches canonical function call text.

**Step 2: Do not fix yet**

Record actual current miss list in a test comment or assertion message. This creates honest baseline evidence.

---

### Task 0.3: Harden weapon implementation detection

**Objective:** Make gate check real implementation, not string coincidence.

**Files:**
- Modify: `framepack-plugin/core/weapon_enforcement.py`
- Modify: `framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py`
- Possibly Modify: `framepack-plugin/core/quality_audit.py` if both share logic

**Implementation direction:**

Add a small parser layer in `weapon_enforcement.py`:

```python
@dataclass(frozen=True)
class WeaponUsageEvidence:
    weapon_id: str
    function_name: str
    function_called: bool
    script_loaded: bool
    local_shim_detected: bool
    preset_or_params_present: bool
    notes: tuple[str, ...] = ()
```

Detection rules:

1. Strip HTML comments before function search.
2. Strip JS string literals enough to avoid counting `'numberCountUp'`.
3. Detect `<script src="...number-count-up.js">` or equivalent reference path.
4. Detect local fake shim: `function numberCountUp(` or `const numberCountUp =` inside HTML.
5. Detect actual call: `numberCountUp(` outside comments/strings and not only declaration.
6. For Phase 0, consider empty `{}` params insufficient if selected plan has or requires a preset.

**Step 1: Run matrix test to verify RED**

```bash
python -m pytest framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py -q -o "addopts="
```

Expected: FAIL before hardening.

**Step 2: Implement minimal parser helpers**

Keep helpers small:

```python
def _strip_html_comments(text: str) -> str: ...
def _strip_js_strings(text: str) -> str: ...
def _has_script_load(html: str, weapon_id: str, ref_path: str | None) -> bool: ...
def _has_local_shim(script_text: str, function_name: str) -> bool: ...
def _has_function_call(script_text: str, function_name: str) -> bool: ...
```

**Step 3: Gate criteria**

A selected builtin weapon passes only if:

- canonical function is called
- canonical weapon script/reference is loaded OR the function came from a known bundled inline weapon block with marker
- no local fake shim shadows the canonical function
- required preset/params are present when plan specifies them

**Step 4: Verify matrix pass**

Expected: all matrix cases match `should_block`.

---

### Task 0.4: Add hook-level bypass tests

**Objective:** Test the actual hooks, not only pure functions.

**Files:**
- Modify: `framepack-plugin/tests/test_weapon_enforcement_gate.py`
- Possibly Modify: `framepack-plugin/hooks/on_pre_tool_call.py`
- Possibly Modify: `framepack-plugin/hooks/on_post_tool_call.py`

**Cases:**

1. `write_file` index.html with fake shim → blocked post-write.
2. `patch` index.html with function in comment only → blocked post-write.
3. terminal redirect `python build.py > "index.html"` without plan → blocked pre-write.
4. terminal redirect with plan but fake shim output → if post hook cannot inspect terminal output, render/preview must be blocked by quality audit / pre-render gate.

**Important design note:** Terminal commands do not always trigger post-write file inspection. If terminal can mutate `index.html`, pre-write can require plan but cannot inspect final HTML. Therefore add a **render/preview hard stop** when `index.html` mtime is newer than last weapon enforcement receipt.

Artifact:
- `.framepack/weapon-enforcement-receipt.json`

Receipt fields:

```json
{
  "index_html_sha256": "...",
  "checked_at": "2026-07-05T...",
  "violations": [],
  "weapon_plan_sha256": "..."
}
```

Render/preview command is allowed only if receipt sha matches current `index.html` and has zero violations.

---

## Phase 1 — Weapon Bench for one weapon (`caption-clip-wipe`)

**Purpose:** Prove the visual loop on one high-value commercial weapon.

### Task 1.1: Add scorecard schema

**Files:**
- Create: `framepack-plugin/core/weapon_scorecard.py`
- Test: `framepack-plugin/tests/test_weapon_scorecard.py`

**Step 1: Write failing schema test**

```python
from core.weapon_scorecard import WeaponScorecard, ScoreSet


def test_scorecard_classification_a():
    card = WeaponScorecard(
        weapon_id="caption-clip-wipe",
        scores=ScoreSet(
            impact=5,
            polish=5,
            commercial_fit=5,
            parameter_safety=4,
            hyperframes_safety=5,
            composability=4,
        ),
        recommended_presets=["editorial_lower_third"],
        avoid=["long_body_copy"],
    )
    assert card.score_class == "A"
```

Expected: FAIL.

**Step 2: Implement dataclasses**

Include:
- `ScoreSet`
- `WeaponScorecard`
- `score_class` property
- `to_dict()` / `from_dict()`
- JSON read/write helpers

Classification:
- A: average >= 4.5 and no dimension < 4
- B: average >= 3.7 and no dimension < 3
- C: average >= 2.8
- D: else

---

### Task 1.2: Add bench CLI skeleton

**Files:**
- Create: `framepack-plugin/scripts/framepack_weapon_bench.py`
- Test: `framepack-plugin/tests/test_weapon_bench_cli.py`
- Update: `framepack-plugin/plugin.yaml` CLI command registration if needed

**CLI shape:**

```bash
python framepack-plugin/scripts/framepack_weapon_bench.py run caption-clip-wipe --project <dir> --format json
python framepack-plugin/scripts/framepack_weapon_bench.py score caption-clip-wipe --project <dir> --format markdown
```

**First implementation:** no real render yet. It should create deterministic artifact paths and a placeholder demo HTML.

Expected output JSON:

```json
{
  "weapon_id": "caption-clip-wipe",
  "demo_html": ".framepack/weapon-bench/caption-clip-wipe/demo.html",
  "scorecard": ".framepack/weapon-bench/caption-clip-wipe/scorecard.json"
}
```

---

### Task 1.3: Generate real demo HTML for `caption-clip-wipe`

**Files:**
- Create/Modify: `framepack-plugin/core/weapon_bench.py`
- Test: `framepack-plugin/tests/test_weapon_bench_demo_generation.py`

**Requirements:**

Demo HTML must:
- Use valid HyperFrames structure
- Include explicit `data-duration`
- Use `.clip` + `.scene-inner`
- Load GSAP and the weapon reference JS
- Call `captionClipWipe()` with preset-quality params
- Avoid animating clip root
- Register `window.__timelines["main"]`

**Test assertions:**

```python
html = generate_demo_html("caption-clip-wipe")
assert 'data-duration="' in html
assert 'class="clip"' in html
assert 'captionClipWipe(' in html
assert 'window.__timelines["main"]' in html
assert 'caption-clip-wipe.js' in html
```

---

### Task 1.4: Run HyperFrames smoke for bench demo

**Files:**
- Test: `framepack-plugin/tests/test_weapon_bench_runtime_smoke.py`
- Script may be skipped in CI if `npx hyperframes` unavailable, but must run locally.

**Commands:**

```bash
python framepack-plugin/scripts/framepack_weapon_bench.py run caption-clip-wipe --project F:/hyperframes/.framepack/bench-smoke --format json
npx hyperframes lint F:/hyperframes/.framepack/bench-smoke --json
npx hyperframes validate F:/hyperframes/.framepack/bench-smoke
npx hyperframes keyframes F:/hyperframes/.framepack/bench-smoke
```

Expected:
- lint 0 errors
- validate exits 0
- keyframes exits 0 or produces actionable diagnostics

If snapshot/render is expensive, defer render to manual acceptance after lint/validate/keyframes are green.

---

### Task 1.5: Produce first real scorecard

**Files:**
- Create: `framepack-plugin/weapon-scorecards/caption-clip-wipe.json`
- Create: `framepack-plugin/weapon-scorecards/caption-clip-wipe.md`
- Test: `framepack-plugin/tests/test_weapon_scorecards_registry.py`

Initial expected rating can be provisional but must be evidence-linked:

```json
{
  "weapon_id": "caption-clip-wipe",
  "score_class": "A",
  "scores": {
    "impact": 4,
    "polish": 5,
    "commercial_fit": 5,
    "parameter_safety": 4,
    "hyperframes_safety": 5,
    "composability": 4
  },
  "recommended_presets": ["editorial_lower_third", "premium_product_callout"],
  "avoid": ["long_body_copy", "full-screen-paragraph"],
  "evidence": {
    "demo_html": ".framepack/weapon-bench/caption-clip-wipe/demo.html"
  }
}
```

**Important:** Do not call it final A-class until runtime smoke passes and a human/visual inspection note exists.

---

## Phase 2 — Preset Pack and meaningful usage enforcement

### Task 2.1: Add weapon preset registry

**Files:**
- Create: `framepack-plugin/core/weapon_presets.py`
- Create: `framepack-plugin/weapon-presets/caption-clip-wipe.json`
- Test: `framepack-plugin/tests/test_weapon_presets.py`

Preset JSON shape:

```json
{
  "weapon_id": "caption-clip-wipe",
  "presets": {
    "editorial_lower_third": {
      "motion_role": "premium-callout",
      "duration": 0.8,
      "ease": "power3.out",
      "max_lines": 2,
      "safe_for": ["product-callout", "quote", "metric-label"],
      "avoid": ["body-copy", "paragraph"]
    }
  }
}
```

---

### Task 2.2: Extend weapon-load-plan schema with preset metadata

**Files:**
- Modify: `framepack-plugin/core/weapon_load_plan.py`
- Modify: `framepack-plugin/core/weapon_matcher.py`
- Test: `framepack-plugin/tests/test_weapon_load_plan.py`
- Test: `framepack-plugin/tests/test_framepack_match_weapons_cli.py`

New selected fields:

```json
{
  "weapon_id": "caption-clip-wipe",
  "reuse_mode": "full",
  "preset_id": "editorial_lower_third",
  "score_class": "A",
  "studio_editable": false
}
```

Expected behavior:
- If scorecard/preset exists, matcher suggests preset.
- If none exists, selected weapon remains valid but gets `preset_id: null` and a P2 audit suggestion.

---

### Task 2.3: Harden post-write gate for preset-quality calls

**Files:**
- Modify: `framepack-plugin/core/weapon_enforcement.py`
- Modify: `framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py`

Rules:

- If plan selected `preset_id`, HTML must reference it explicitly OR include equivalent required params.
- Empty object call `captionClipWipe({})` fails.
- Comments/strings/fake shim still fail.

Do not over-engineer full JS AST. Use conservative regex + documented limitations.

---

## Phase 3 — Taste Audit v1

### Task 3.1: Add taste audit module

**Files:**
- Create: `framepack-plugin/core/taste_audit.py`
- Test: `framepack-plugin/tests/test_taste_audit.py`

Initial signals:

1. `text_dominance`
2. `product_absence`
3. `flat_background`
4. `weapon_preset_missing`
5. `bgm_unplanned`
6. `no_proof_frames`

API:

```python
def audit_commercial_taste(project_dir: str | Path) -> TasteAuditReport: ...
```

Report:

```python
@dataclass
class TasteIssue:
    severity: str
    code: str
    message: str
    suggestion: str
```

---

### Task 3.2: Integrate taste audit into quality audit report

**Files:**
- Modify: `framepack-plugin/core/quality_audit.py`
- Modify: `framepack-plugin/scripts/framepack_quality_audit.py`
- Test: `framepack-plugin/tests/test_quality_audit.py`

Behavior:
- `framepack_quality_audit.py` includes taste issues in output.
- Taste audit is advisory unless P0 cheapness is extreme.
- Do not block render automatically yet; report-first.

---

## Phase 4 — SDK Editing Affordance Bridge

### Task 4.1: Add studio editability metadata to scorecards/presets

**Files:**
- Modify: `framepack-plugin/core/weapon_scorecard.py`
- Modify: `framepack-plugin/core/weapon_load_plan.py`
- Test: `framepack-plugin/tests/test_weapon_scorecard.py`
- Test: `framepack-plugin/tests/test_weapon_load_plan.py`

Fields:

```json
{
  "studio_editable": false,
  "editing_affordance": {
    "source": "hyperframes-sdk/resolveEditingAffordances",
    "editable_properties": [],
    "reason": "GSAP owns transform/opacity timeline"
  }
}
```

---

### Task 4.2: Add SDK affordance guidance to reports

**Files:**
- Modify: `framepack-plugin/core/warning_classifier.py`
- Modify: `framepack-plugin/core/quality_audit.py`
- Test: `framepack-plugin/tests/test_warning_classifier.py` if exists, else create it

Behavior:
- `gsap_studio_edit_blocked` remains upstream_limit.
- Report suggests SDK affordance adapter where relevant.
- Weapon plan exposes `studio_editable` so users know what Studio can edit.

---

## Phase 5 — Figma Motion as project-local weapon source

### Task 5.1: Detect Figma Motion artifacts

**Files:**
- Modify: `framepack-plugin/core/weapon_sources.py`
- Test: `framepack-plugin/tests/test_weapon_sources.py` or create it

Detection candidates:
- `.hyperframes/figma/`
- `figma-motion.json`
- `assets/figma/`
- HyperFrames figma import receipts if present

Output source:

```python
WeaponSource(
    id="project:figma-motion",
    source_type="project_local",
    kind="motion",
    reuse_mode="adapt",
    load={"command": "npx hyperframes figma ..."},
    keywords=("figma motion", "brand motion", "designer-authored"),
)
```

---

### Task 5.2: Match Figma Motion before HANDWRITE

**Files:**
- Modify: `framepack-plugin/core/weapon_matcher.py`
- Test: `framepack-plugin/tests/test_weapon_matcher.py` or existing matcher tests

Rule:
- If scene intent mentions brand motion / Figma / imported design and project-local Figma Motion source exists, prefer it over HANDWRITE.

---

## Phase 6 — Commercial Case Harness

### Task 6.1: Add case harness script skeleton

**Files:**
- Create: `framepack-plugin/scripts/framepack_commercial_case_harness.py`
- Test: `framepack-plugin/tests/test_commercial_case_harness.py`

CLI:

```bash
python framepack-plugin/scripts/framepack_commercial_case_harness.py run --case product-launch --project <dir> --format json
```

For first version, it validates required artifacts only:
- `frame.md`
- `.hyperframes/expanded-prompt.md`
- `.framepack/weapon-load-plan.json`
- `index.html`
- keyframes/snapshot evidence if present
- quality/taste reports

---

### Task 6.2: Add three fixture case definitions

**Files:**
- Create: `framepack-plugin/tests/fixtures/commercial_cases/product_launch.json`
- Create: `framepack-plugin/tests/fixtures/commercial_cases/website_to_video.json`
- Create: `framepack-plugin/tests/fixtures/commercial_cases/figma_brand_video.json`

Each fixture should define:
- intent
- expected artifact list
- expected weapon categories
- taste risks to catch

---

## Verification plan

### Focused commands during implementation

Run after each phase:

```bash
python -m pytest framepack-plugin/tests/test_weapon_gate_effectiveness_matrix.py -q -o "addopts="
python -m pytest framepack-plugin/tests/test_weapon_enforcement_gate.py -q -o "addopts="
python -m pytest framepack-plugin/tests/test_weapon_scorecard.py -q -o "addopts="
python -m pytest framepack-plugin/tests/test_weapon_bench_cli.py -q -o "addopts="
python -m pytest framepack-plugin/tests/test_taste_audit.py -q -o "addopts="
```

### Runtime commands after Phase 1

```bash
python framepack-plugin/scripts/framepack_weapon_bench.py run caption-clip-wipe --project F:/hyperframes/.framepack/bench-smoke --format json
npx hyperframes lint F:/hyperframes/.framepack/bench-smoke --json
npx hyperframes validate F:/hyperframes/.framepack/bench-smoke
npx hyperframes keyframes F:/hyperframes/.framepack/bench-smoke
```

### Full regression before claiming complete

```bash
python -m pytest framepack-plugin/tests -q -o "addopts="
cp -a framepack-plugin/. /f/Hermes_windows/plugins/framepack/
cp -f framepack-plugin/skills/framepack/SKILL.md /f/Hermes_windows/skills/software-development/framepack/SKILL.md
python -m pytest F:/Hermes_windows/plugins/framepack/tests -q -o "addopts="
```

### md5 sync check

Must compare changed plugin files source/deployed by md5. Do not rely on file size.

---

## Strict gate effectiveness acceptance criteria

Before Phase 1 can be called done, produce a short report:

`F:/hyperframes/.framepack/reports/weapon-gate-effectiveness.md`

It must include:

| Case | Expected | Actual | Status |
|---|---|---|---|
| function in comment only | block | block | pass |
| function string only | block | block | pass |
| fake local shim | block | block | pass |
| empty/default params | block | block | pass |
| real script load + preset call | allow | allow | pass |
| write_file bypass | block | block | pass |
| patch bypass | block | block | pass |
| terminal redirect stale receipt | block render/preview | block | pass |
| HANDWRITE vague waiver | block | block | pass |

If any case fails, do not proceed to weapon scorecards until either:
- the gate is fixed, or
- the limitation is documented with a concrete compensating control.

---

## Risks and tradeoffs

### Risk: Gate becomes too strict and blocks legitimate custom work

Mitigation:
- Keep HANDWRITE waiver path, but require real checked sources and reason.
- Add explicit fixture for valid HANDWRITE waiver.

### Risk: Regex parser becomes fake AST

Mitigation:
- Keep parser conservative and documented.
- Do not attempt complete JS parsing unless real bypasses require it.

### Risk: Bench becomes bureaucracy

Mitigation:
- Start with one weapon only.
- Require visual evidence before expanding to top 5.

### Risk: Taste audit pretends to judge beauty

Mitigation:
- Use concrete cheapness signals only: text dominance, product absence, missing proof frames, missing presets.
- Avoid fake “AI beauty score” without evidence.

---

## Recommended execution order

1. Phase 0 first: strict weapon gate effectiveness evaluation.
2. Fix any gate holes found.
3. Phase 1: bench `caption-clip-wipe` end-to-end.
4. Only then add presets and Taste Audit.
5. SDK/Figma integration after the first weapon bench proves useful.

This keeps us from decorating a leaky boat.
