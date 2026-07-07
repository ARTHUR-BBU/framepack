# Plan: Taste Layer 2.0 Implementation Roadmap

> Derived from `.hermes/designs/2026-07-07--taste-layer-prd-tasteskill-impeccable.md`.
>
> Rule: strict TDD, no production claims without source + deployed verification. This plan intentionally stops before implementation until PRD approval.

## 0. North star

Turn Framepack Taste Control from a small kitchen ticket into a taste nervous system:

```text
brief read -> rule registry -> prompt audit -> HTML audit -> proof evidence -> revise/proof/waiver ledger
```

The key product principle: **taste is decision-forcing, not compiler-blocking**. P1 taste debt must not be ignored, but users can still waive with intent.

## 1. Workstream map

| Stream | Purpose | Main files | Risk |
|---|---|---|---|
| A. Rule registry | Data-driven taste rules and severity mapping | `core/taste_rules.py`, tests | Medium |
| B. Context compiler | Parse/derive register and dials | `core/taste_read.py`, `taste_audit.py` | Medium |
| C. Prompt detectors | Taste Skill rules adapted to `frame.md` / `expanded-prompt.md` | `core/taste_text_detectors.py` | Medium |
| D. HTML detectors | Impeccable-inspired deterministic slop checks | `core/taste_html_detectors.py` | High false-positive risk |
| E. Proof evidence | Contact sheet/proof-frame gates | `core/taste_proof_detectors.py` | Medium |
| F. Control integration | Keep ledger stable and hook advisory | `taste_control.py`, `on_pre_tool_call.py` | Low/medium |
| G. Deployment QA | Source/deploy sync, worktree QA | scripts/tests | Medium due newline/md5 |

## 2. Phase 0 - Research hardening and source ledger

### Goal

Make the research traceable and prevent future agents from treating this as vibes.

### Tasks

1. Add a compact research index.
   - Create: `.hermes/research/taste-layer-sources/README.md`
   - Include inspected sources, commit SHAs of cloned repos, key files, and extraction date.

2. Record source SHAs.
   - Command:
     ```bash
     cd .hermes/research/taste-layer-sources/taste-skill && git rev-parse HEAD
     cd ../impeccable && git rev-parse HEAD
     ```

3. Add PRD source appendix if needed.
   - Either keep inside PRD or create `.hermes/research/taste-layer-translation-matrix.md`.

### Verification

```bash
git status --short
python - <<'PY'
from pathlib import Path
for p in [
  Path('.hermes/designs/2026-07-07--taste-layer-prd-tasteskill-impeccable.md'),
  Path('.hermes/research/taste-layer-sources/taste-skill'),
  Path('.hermes/research/taste-layer-sources/impeccable'),
]:
  assert p.exists(), p
print('research_artifacts_ok=True')
PY
```

### Acceptance

- PRD points to real inspected files.
- No secrets or external API keys are stored.

## 3. Phase 1 - Rule schema and registry

### Goal

Introduce a data-driven rule registry without changing detector behavior yet.

### Files

- Create: `framepack-plugin/core/taste_rules.py`
- Create: `framepack-plugin/tests/test_taste_rules.py`
- Modify only if needed: `framepack-plugin/core/taste_audit.py`

### Data model

```python
@dataclass(frozen=True)
class TasteRule:
    id: str
    category: str
    default_severity: str
    message: str
    acceptance: str
    artifacts: tuple[str, ...]
    source_refs: tuple[str, ...] = ()
    registers: Mapping[str, str] = field(default_factory=dict)
```

Helper functions:

- `get_rule(rule_id)`
- `all_rules()`
- `severity_for(rule, register, dials)`
- `acceptance_for(rule_id)`
- `repair_target_for(rule_id, path)`

### Initial registry rules

Start with current rule equivalents:

- `text_dominance`
- `product_absence`
- `static_mockup_risk`
- `generic_fade_stack`
- `no_proof_frames`
- `missing_taste_block`
- `missing_kinetic_continuity`
- `no_controlled_surprise`
- `too_many_surprises`
- `surprise_without_intent`
- `motif_not_transformed`
- `flat_background`
- `weapon_preset_missing`
- `bgm_unplanned`

Then add new registry-only rules, not active yet:

- `missing_taste_read`
- `missing_taste_dials`
- `opening_visual_absence`
- `fake_product_ui_divs`
- `copy_punctuation_slop`
- `fake_precision`
- `ui_debris_copy`
- `scene_layout_repetition`
- `decorative_generated_surface`
- `raw_scroll_listener`
- `missing_reduced_motion`
- `motion_claim_unproven`

### TDD tests

1. `test_all_p1_rules_have_acceptance`
2. `test_rule_ids_are_unique`
3. `test_severity_defaults_to_rule_default`
4. `test_register_override_changes_severity`
5. `test_unknown_rule_raises_clear_error`
6. `test_current_acceptance_strings_match_existing_behavior_for_legacy_rules`

### Commands

```bash
cd framepack-plugin
PYTHONPATH= python -m pytest tests/test_taste_rules.py -q -o "addopts="
PYTHONPATH= python -m pytest tests/test_taste_control_loop.py tests/test_taste_audit.py -q -o "addopts="
```

### Acceptance

- Existing taste behavior unchanged.
- Registry can explain every current action-card acceptance string.

## 4. Phase 2 - Taste read and dial compiler

### Goal

Bridge Taste Skill's brief inference into Framepack's `frame.md` and five-element control profile.

### Files

- Create: `framepack-plugin/core/taste_read.py`
- Create: `framepack-plugin/tests/test_taste_read.py`
- Modify: `framepack-plugin/core/taste_audit.py`

### Behavior

Parse `frame.md` for optional:

```yaml
taste_read:
  register: product_launch
  audience: technical buyers
  visual_family: interface_ballet_saas
  anti_references: [...]
taste_dials:
  design_variance: 7
  motion_intensity: 6
  visual_density: 4
```

If missing, infer conservatively from existing project artifacts:

- product launch keywords -> `product_launch`
- website/url/capture -> `website_to_video`
- explainer keywords -> `explainer`
- event/conference/date -> `event_teaser`
- dashboard/app/demo -> `product_ui`
- fallback -> `brand_film`

Do not over-infer. Missing explicit data should create P2/P1 debt depending phase.

### TDD tests

1. `test_parse_explicit_taste_read_from_frame_md`
2. `test_infer_product_launch_from_expanded_prompt`
3. `test_infer_event_teaser_from_event_keywords`
4. `test_missing_taste_read_yields_issue_for_new_creative_project`
5. `test_dials_map_to_control_profile_without_overwriting_existing_values`
6. `test_invalid_dial_values_are_reported_not_crashed`

### Commands

```bash
cd framepack-plugin
PYTHONPATH= python -m pytest tests/test_taste_read.py -q -o "addopts="
PYTHONPATH= python -m pytest tests/test_taste_audit.py -q -o "addopts="
```

### Acceptance

- Framepack can name the register before applying taste rules.
- Register-aware severity exists but only affects new rule paths.

## 5. Phase 3 - Prompt / Director Bible detectors

### Goal

Adapt Taste Skill's anti-slop rules to `frame.md` and `expanded-prompt.md` before HTML exists.

### Files

- Create: `framepack-plugin/core/taste_text_detectors.py`
- Create: `framepack-plugin/tests/test_taste_text_detectors.py`
- Modify: `framepack-plugin/core/taste_audit.py`

### Rules to implement first

#### 3.1 `opening_visual_absence`

Flags when first scene / hook has text but no visual subject.

Positive signs:

- Scene 1 / opening / hook has only headline/copy/text.
- No product, image, footage, object, device, UI, logo, mascot, texture, or generated visual reference.

False-positive controls:

- `register: event_teaser` with `kinetic_typography_attack` can downgrade.
- Explicit cold-open mystery visual counts as visual subject.

#### 3.2 `copy_punctuation_slop`

Flags visible em-dash / en-dash usage in prompt copy intended for screen.

Positive signs:

- `—` or `–` inside `text:`, `headline:`, `copy:`, CTA, captions.

False-positive controls:

- Do not flag markdown separators in docs.
- Do not flag code comments unless they become visible copy.

#### 3.3 `fake_precision`

Flags unsupported exact numbers.

Positive signs:

- `99.99%`, `4.1x`, `48k`, `13.4 lb`, etc. without `source`, `real data`, `mock`, `sample`, `provided by user`.

False-positive controls:

- Product specs from assets/brief are allowed.

#### 3.4 `ui_debris_copy`

Flags video/PPT debris:

- version labels in hero/opening
- scroll cues
- city/time/weather strips
- section-number eyebrows
- decorative dots
- photo-credit captions as decoration

#### 3.5 `scene_layout_repetition`

Flags repeated scene grammar:

- 3+ consecutive scenes with same structure, e.g. headline -> card -> fade.
- 3+ fade/crossfade transitions already partly covered by `generic_fade_stack`; keep this broader.

### TDD fixtures

Create:

```text
framepack-plugin/tests/fixtures/taste_layer/text/
  opening_visual_absence.md
  opening_visual_allowed_kinetic_type.md
  copy_punctuation_slop.md
  fake_precision.md
  fake_precision_allowed_source.md
  ui_debris_copy.md
  scene_layout_repetition.md
```

### Tests

- One test per rule for positive detection.
- One false-positive test per rule.
- One integrated `audit_project` test showing rule appears in report.

### Commands

```bash
cd framepack-plugin
PYTHONPATH= python -m pytest tests/test_taste_text_detectors.py -q -o "addopts="
PYTHONPATH= python -m pytest tests/test_taste_audit.py tests/test_taste_control_loop.py -q -o "addopts="
```

### Acceptance

- At least 5 new prompt-level detectors.
- No increase in false positives against existing test corpus.

## 6. Phase 4 - HTML / implementation slop detectors

### Goal

Port the most relevant Impeccable deterministic checks into Framepack's HyperFrames HTML world.

### Files

- Create: `framepack-plugin/core/taste_html_detectors.py`
- Create: `framepack-plugin/tests/test_taste_html_detectors.py`
- Modify: `framepack-plugin/core/taste_audit.py`

### Initial detectors

#### 4.1 `fake_product_ui_divs`

Detect fake dashboards/screens built from generic div/card rectangles.

Signals:

- Classes/ids/text: `fake-dashboard`, `mock-terminal`, `task-list`, `window`, `browser-chrome`, `metric-card` combined with no real image/video/canvas/component source.
- Many repeated `.card`, `.row`, `.bar`, `.dot` inside a `mockup` container.

False-positive controls:

- Real component preview can include semantic UI if it maps to product and has meaningful content.
- Product UI register downgrades if it is actual UI choreography, not decorative fake.

#### 4.2 `gradient_text_slop`

Detect `background-clip:text`, `-webkit-text-fill-color: transparent`, Tailwind gradient text patterns.

#### 4.3 `decorative_generated_surface`

Detect:

- two-axis CSS grid backgrounds from linear gradients
- excessive glows on dark backgrounds
- repeating stripes
- decorative crosshair/hairline grids without data/canvas register

#### 4.4 `bounce_or_elastic_easing`

Detect GSAP/CSS easing strings:

- `bounce`, `elastic`, extreme overshoot curves.

#### 4.5 `raw_scroll_listener`

Detect `window.addEventListener('scroll'...)`, raw `scrollY` loops, unbounded requestAnimationFrame where likely animation.

#### 4.6 `missing_reduced_motion`

If JS/CSS animation exists but no `prefers-reduced-motion`, `matchMedia('(prefers-reduced-motion')`, or HyperFrames equivalent guard.

#### 4.7 `over_rounded_codex_cards`

Detect border-radius 32px+ on cards/sections/input-like containers. Advisory unless pervasive.

#### 4.8 `ghost_card_shadow_border`

Detect 1px border plus wide diffuse shadow on same card/button. Advisory by default.

### TDD requirements

For each detector:

- 3 positive snippets.
- 3 pass snippets.
- One integrated `audit_project` fixture.

### Commands

```bash
cd framepack-plugin
PYTHONPATH= python -m pytest tests/test_taste_html_detectors.py -q -o "addopts="
PYTHONPATH= python -m pytest tests/test_taste_audit.py tests/test_quality_audit.py tests/test_pre_render_hook.py -q -o "addopts="
```

### Acceptance

- At least 8 HTML-level detectors.
- No P0 hard block.
- `lint` still does not inject Taste Control.
- `render/preview/publish/snapshot` injection only when open P1 exists.

## 7. Phase 5 - Proof-frame evidence loop

### Goal

Move taste from prose to pixels without overbuilding visual AI scoring yet.

### Files

- Create: `framepack-plugin/core/taste_proof_detectors.py`
- Create: `framepack-plugin/tests/test_taste_proof_detectors.py`
- Modify: `framepack-plugin/core/taste_audit.py`
- Possibly extend: `core/proof_audit.py`

### Behavior

1. If `index.html` exists and command is preview:
   - P2 if no proof frames.
2. If command is render/publish:
   - P1 if no proof frames/contact sheet and commercial register is active.
3. Recognize proof locations:
   - `.framepack/proof-frames/*.png`
   - `.framepack/proofs/*.png`
   - `proofs/*.png`
   - `snapshots/*.png`
   - contact sheet file if available.
4. Future-ready metadata:
   - frame count
   - timestamps if encoded in filename
   - image dimensions

### Tests

1. `test_preview_without_proof_frames_is_p2`
2. `test_render_without_proof_frames_is_p1_for_commercial_register`
3. `test_proof_frames_suppress_no_proof_issue`
4. `test_noncommercial_register_downgrades_no_proof_frames`
5. `test_contact_sheet_counts_as_evidence`

### Commands

```bash
cd framepack-plugin
PYTHONPATH= python -m pytest tests/test_taste_proof_detectors.py tests/test_taste_control_loop.py -q -o "addopts="
```

### Acceptance

- Framepack demands visual receipts before serious render/publish.
- No visual LLM required yet.

## 8. Phase 6 - Taste Control message upgrade

### Goal

Make pre-render injection more actionable without becoming noisy.

### Files

- Modify: `framepack-plugin/core/taste_control.py`
- Modify: `framepack-plugin/tests/test_taste_control_loop.py`
- Modify: `framepack-plugin/tests/test_pre_render_hook.py`

### Behavior changes

Current message lists top cards. Upgrade to group by action:

```text
Revise now:
- opening_visual_absence: add a real visual subject to opening beat
- fake_product_ui_divs: replace mock divs with real/generated product image

Proof needed:
- motion_claim_unproven: attach contact sheet / proof frames

Waiver possible:
- event_teaser allows kinetic type opening if user approves delayed product reveal
```

Keep short. Maximum 5 cards inline; rest in `.framepack/taste-debt.md`.

### Tests

1. Existing message tests remain.
2. New grouped message snapshot test.
3. P2-only report does not inject.
4. P1 with waived card and open card injects only open card count.

### Acceptance

- Agent sees exact next action, not a generic warning.

## 9. Phase 7 - Deployment sync and newline/md5 fix

### Goal

Close the environment gap found by independent worktree QA: source/deploy can be text-equal but byte-MD5-different due CRLF/LF.

### Files

- Search for existing sync helper first.
- If no helper, create: `framepack-plugin/scripts/sync_to_deploy.py`
- Create tests if script is in plugin scope.

### Behavior

Preferred sync policy:

- Copy plugin files source -> deploy with LF normalization for `.py`, `.md`, `.json`, `.yaml`.
- Compute both:
  - text hash after newline normalization
  - byte md5 after copy
- Report both.
- Fail if deployed byte md5 differs immediately after copy.

### Commands

```bash
cd framepack-plugin
PYTHONPATH= python -m pytest tests/ -q -o "addopts="
python scripts/sync_to_deploy.py --check
python scripts/sync_to_deploy.py
python scripts/sync_to_deploy.py --check
```

### Acceptance

- No more ambiguous "text diff zero but md5 mismatch" release signal.

## 10. Phase 8 - Full verification and independent worktree QA

### Goal

Verify source, deployed plugin, and independent worktree.

### Commands

Source:

```bash
cd F:/hyperframes/framepack-plugin
PYTHONPATH= python -m pytest tests/test_taste_rules.py tests/test_taste_read.py tests/test_taste_text_detectors.py tests/test_taste_html_detectors.py tests/test_taste_proof_detectors.py tests/test_taste_control_loop.py tests/test_pre_render_hook.py -q -o "addopts="
PYTHONPATH= python -m pytest tests/ -q -o "addopts="
```

Deploy:

```bash
cd F:/Hermes_windows/plugins/framepack
PYTHONPATH= python -m pytest tests/test_taste_rules.py tests/test_taste_read.py tests/test_taste_text_detectors.py tests/test_taste_html_detectors.py tests/test_taste_proof_detectors.py tests/test_taste_control_loop.py tests/test_pre_render_hook.py -q -o "addopts="
PYTHONPATH= python -m pytest tests/ -q -o "addopts="
```

Ad-hoc behavior verification, using temp file per Hermes rule:

```bash
python - <<'PY'
from pathlib import Path
import tempfile
p = Path(tempfile.gettempdir()) / 'hermes-verify-taste-layer-2.py'
print(p)
PY
```

Kanban independent worktree QA:

- Board: `taste-layer-2-qa`
- Task: independent worktree full test + simplify review
- Acceptance: full suite green, no code changes unless real issue found, report source/deploy sync status.

### Acceptance

- Source full green.
- Deploy full green.
- Ad-hoc behavior proof green.
- Independent worktree QA green.
- No unexpected dirty files.

## 11. Suggested implementation sequence

Do not implement all at once. The correct sequence is:

1. PRD review and approval.
2. Phase 1 rule registry.
3. Phase 2 taste read compiler.
4. Phase 3 prompt detectors.
5. Stop and dogfood on one real case.
6. Phase 4 HTML detectors.
7. Stop and dogfood on one rendered/proof-frame case.
8. Phase 5 proof-frame evidence.
9. Phase 6 message polish.
10. Phase 7 sync/newline fix.
11. Phase 8 full verification.

This avoids the classic trap: building 40 clever rules that nobody trusts because false positives are noisy.

## 12. First implementation slice recommendation

After approval, start with a small but valuable slice:

### Slice 1: Rule registry + 3 prompt detectors

Rules:

- `missing_taste_read`
- `opening_visual_absence`
- `copy_punctuation_slop`

Why these first:

- They are high leverage.
- They are easy to test.
- They hit Framepack's biggest user-visible debt: text/PPT/generic opening.
- They do not require parsing complex HTML.

Acceptance:

- 1 new module for registry.
- 1 new module for text detectors.
- 10+ focused tests.
- Existing 1039 suite still green.
- Deploy sync verified.

## 13. Complexity budget

Keep the first release boring inside, sharp outside:

- No AST parser unless regex proves insufficient.
- No visual AI scoring yet.
- No external dependency on Impeccable CLI.
- No broad DSL engine.
- No new hook category unless existing pre-render hook cannot express command context.

This is a spice rack, not a second kitchen.

## 14. Done definition for the whole initiative

Taste Layer 2.0 is done when a real commercial video case can show:

1. `frame.md` contains register + dials.
2. `expanded-prompt.md` gets meaningful prompt-level taste audit.
3. `index.html` gets deterministic implementation slop audit.
4. Proof frames are required or recorded.
5. P1 cards are actionable and not noisy.
6. User can waive with a reason.
7. Full source/deploy/worktree verification passes.
8. The final output is visibly less PPT, less fake UI, less generic AI garnish.
