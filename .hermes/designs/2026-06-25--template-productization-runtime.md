# Template Arsenal Productization — Framepack Architecture Design

> Date: 2026-06-25
> Status: Design proposal, not yet implemented
> Trigger: test team delivered `video-template-productization` skill + report and asked Framepack dev to productize/engineer the module.

## 1. Verdict — corrected first principles

The earlier design over-complicated the problem by treating template
productization as a new runtime/audit lane. First principles are simpler:

> We need templates because a beautiful video, dynamic website, finished HTML
> animation, or finished HyperFrames project should be preserved and reused.

A Framepack template is therefore **not a separate runtime** and **not one skill
per template**. It is a **complete/special weapon** — a packaged file structure
with a name, description, fit-for-use notes, parameters, source HTML/project,
assets, renders, and examples.

The reusable skills are standard capabilities:

1. **Template Productization skill** — turns a beautiful source artifact into a
   packaged template weapon-suite.
2. **Template Use skill** — optional but likely useful; helps users choose from
   template cards and co-create a normal Framepack/HyperFrames video from the
   selected template.

Correct product spine:

```text
Beautiful source artifact
  → Template Productization skill packages it
  → template file structure / weapon-suite
  → register as an arsenal weapon-suite
  → show template list when user asks for template-based video
  → user selects template
  → Template Use skill guides parameter/material co-creation
  → co-create using user intent + template characteristics + exposed params
  → produce the same standard Framepack outputs
  → HyperFrames standard flow + standard audits
```

Analogy: this is not building a second factory. It is adding a set-menu dish to
the kitchen. The dish has a recipe card, ingredient slots, and suitable occasions;
the same kitchen hygiene/audit still applies.

### 1.1 Reference-video correction — heavy flow, not shallow inspiration

When the source artifact is a **reference video** and the user wants a new video
“like this”, Framepack should not merely mine a few notes and then freehand a new
project. That old approach is too lightweight.

Correct obligation:

```text
reference video
  → automatically mine/understand the reference
  → productize it into a temporary or durable template bundle
  → register/select that bundle as a template_suite weapon
  → use the template bundle + user requirements to co-create the new video
  → standard Framepack/HyperFrames production
```

So `framepack-reference-miner` should be treated as a legacy seed/instrument set,
not the final product lane. Its scripts and artifact names (`VIDEO_DNA.md`,
`TEMPLATE_BLUEPRINT.md`, `.hermes/content_decomposition.md`) are useful inputs,
but the modern reference workflow must continue into template productization
before generating the target video.

## 2. Existing Framepack surfaces

Current Framepack already has these relevant systems:

### 2.0 Existing DNA/template lineage

This module is **not greenfield**. Framepack already has three partial lines that
must be fused rather than duplicated:

1. **Reference Miner / Video DNA flow — legacy seed, now subsumed**
   - Skill: `framepack-reference-miner` / `creative/video-reference-miner`.
   - Status: early lightweight approach from before the full template-suite
     product concept. Keep the analysis instruments; do not stop at analysis.
   - Contract: reference video → `scenes.json`, `motion.json`, `colors.json`,
     `audio.json`, key frames / content decomposition → `VIDEO_DNA.md` +
     `TEMPLATE_BLUEPRINT.md`.
   - Existing Framepack docs also define Scripted Mode vs Adaptive Mode:
     the five scripts are preferred instruments, but inline ffmpeg/Python is
     allowed if commands, thresholds, sampling rates, audio method, assumptions,
     and weak spots are recorded.
   - Replica Mode hardening already says HTML implementation must start from
     `VIDEO_DNA.md`, `.hermes/content_decomposition.md`, and
     `TEMPLATE_BLUEPRINT.md`; vague implementation phrases must become locked
     decisions or approved exceptions.

2. **Intent-router template lanes**
   - `core/intent_router.py` already routes:
     - `framepack-reference-extraction` for mining a reference into a reusable
       pattern/template.
     - `framepack-template-reuse` for reusing an existing template.
   - Tests protect these routes in `tests/test_intent_router.py`.

3. **Promotion-candidate flow**
   - `core/promotion_candidates.py` already detects successful rendered cases
     and reports template/weapon promotion candidates.
   - It is deliberately report-first: no automatic promotion into the main
     library.
   - Tests protect it in `tests/test_promotion_candidates.py`.

Implication: the missing product spine is not a runtime; it is a pair of standard
skills plus a durable template bundle format. For reference-video jobs, this
spine is mandatory rather than optional:

```text
Reference video
  → Reference mining instruments
  → VIDEO_DNA / TEMPLATE_BLUEPRINT / content decomposition
  → Template Productization skill
  → template bundle/card + arsenal registration
  → Template Use skill / standard co-creation
  → Promotion candidate / registry decision
```

The design must therefore preserve old artifact names (`VIDEO_DNA.md`,
`TEMPLATE_BLUEPRINT.md`) as accepted inputs, but treat them as **intermediate
ingredients**, not as the finished reference workflow.

### 2.1 Case scaffolding

Files:
- `core/case_scaffolder.py`
- `scripts/framepack_scaffold_case.py`

Current standard case creates:

```text
AGENTS.md
package.json
hyperframes.json
frame.md
.hyperframes/expanded-prompt.md
.framepack/* workflow artifacts
assets/
renders/
```

This is close to a source project that can be productized, but not enough. It
needs a packaging step that creates template card/docs/params/assets evidence.

### 2.2 Workflow evidence / readiness gates

Files:
- `core/render_readiness.py`
- `core/gates/*`
- `core/gate_templates.py`

Current gate engine can represent durable workflow obligations, but template MVP
should not add special gates. Template fit belongs in selection + co-creation;
quality belongs in existing standard audits.

### 2.3 Quality / taste / pre-render audits

Files:
- `core/quality_audit.py`
- `core/pre_render_audit.py`
- `core/taste_audit.py`
- `scripts/framepack_quality_audit.py`

These already catch semantic drift and pre-render risks. Template-specific audit
should not be added for MVP; use the standard quality/taste/readiness checks.

### 2.4 Catalog / component decision

Files:
- `core/catalog_decision.py`
- `core/catalog_discovery.py`

Catalog decides whether official HyperFrames components help a case. Template
productization is adjacent but larger: a template is not a component; it is a
reusable weapon-suite with parameters, assets, examples, and source files.

### 2.5 Hooks

Files:
- `hooks/on_pre_tool_call.py`
- `hooks/on_post_tool_call.py`

Current pre-render hook runs readiness, quality audit, pre-render audit before
HyperFrames preview/render/publish/snapshot. Template MVP should not hook extra
checks here; use the existing audits after the template-guided project is built.

## 3. Product boundary

### Framepack owns

- Template discovery/registration as an arsenal category.
- Extracting or recording template DNA only enough to make the template reusable.
- Presenting a template list with name, description, and fit-for-use scope.
- Co-creating from user intent + template characteristics + parameter slots.
- Producing the same standard artifacts as the normal flow: `frame.md`,
  `.hyperframes/expanded-prompt.md`, handoff/arsenal evidence.

### HyperFrames owns

- HTML runtime and official render/check/snapshot execution.
- `data-composition-variables` / `--variables` / `--variables-file` behavior.
- Lint/validate/inspect/render implementation.

### Template weapon-suite owns

- Name, short description, and适用范围 / best-fit use cases.
- Parameter slots and required user inputs/assets.
- Source `index.html` / HyperFrames project / HTML animation / source notes.
- Assets, example renders, snapshots, and parameter examples.
- Usage instructions as docs inside the template package, not as a dedicated
  skill per template.

### Framepack must NOT do

- Generate arbitrary HTML animation logic inside the template module.
- Pretend visual DNA can be fully machine-verified with static regex.
- Replace HyperFrames catalog/components.
- Create a strict template-specific audit layer that fights user-confirmed
  creative deviation. If the user wants to break template limits, the co-creation
  process should record that choice and standard audits should handle quality.
- Force Framepack managed blocks into HyperFrames-local `my-video/AGENTS.md`
  unless product boundary changes.

## 4. Proposed architecture

The implementation should be arsenal-first, not runtime-first.

Recommended minimal package:

```text
framepack-plugin/core/templates/
├── __init__.py
├── types.py                 # TemplateCard, TemplateParam, TemplateBundle
├── registry.py              # discover/list registered template weapon-suites
├── productize.py            # package source artifact into a template bundle
├── scaffold.py              # create template file-structure skeleton
└── markdown.py              # render guide/parameter docs/cards
```

Add CLI:

```text
scripts/framepack_template.py
```

Commands:

```bash
python scripts/framepack_template.py list
python scripts/framepack_template.py package <source-project> --name <template-id>
python scripts/framepack_template.py inspect <template-id-or-dir>
python scripts/framepack_template.py scaffold <template-id>
```

MVP should implement `list`, `inspect`, and `scaffold/package` shape first.
Template use itself stays in the normal Framepack co-creation flow.

## 5. Template-as-weapon file contract

A template should be packaged like a larger, more complete weapon. The primary
product is a **template bundle/card**, not a new project runtime and not one skill
per template.

Recommended bundle shape:

```text
templates/<template-id>/
├── TEMPLATE_CARD.md               # name, description,适用范围, quick pick info
├── TEMPLATE_GUIDE.md              # how to use / creative traits / caveats
├── PARAMS.md                      # exposed parameters and required inputs
├── template.params.example.json   # example parameter payload
├── index.html                     # optional source composition skeleton
├── hyperframes.json               # optional if copied from HyperFrames project
├── package.json                   # optional render/check scripts
├── assets/                        # packaged images/fonts/video/sprites/etc.
├── renders/                       # example/golden renders for reference
├── snapshots/                     # visual examples/contact sheets
└── source/ or SOURCE_NOTES.md      # source project/html/video/site notes
```

Minimum machine-readable card can live in `template.card.json` or frontmatter in
`TEMPLATE_CARD.md`:

```yaml
id: miara-style-template
name: Miara Style Template
description: Glassy gradient mascot/product explainer template
template:
  kind: hyperframes_project
  suitable_for:
    - product launch
    - brand explainer
    - creator tool promo
  not_suitable_for:
    - legal-heavy corporate report
    - raw talking-head captioning
  params:
    - brand_name
    - tagline
    - bg_top_color
    - bg_bottom_color
    - accent_color
  source: F:/Framepack-01-test/cases/miara-style-template
```

This is deliberately closer to `framepack-animation-library` than to a new
render/audit subsystem. The template is a weapon-suite: bigger than one GSAP
snippet, but managed by the same “find → register → use → archive” philosophy.

## 6. Integration with Framepack workflow

### 6.1 Existing template lanes become UX, not new runtime

Current Framepack already routes `framepack-reference-extraction` and
`framepack-template-reuse`. Productization should make these routes usable:

```text
User asks for template-based video
  → Framepack lists available template cards
  → user chooses one
  → Template Use skill reads the selected template bundle/card
  → template-specific questions collect params/assets and clarify allowed breaks
  → Framepack co-creates normal frame.md + expanded-prompt.md
  → HyperFrames standard production flow
```

### 6.2 Arsenal registration

Templates should be registerable as arsenal entries with a special category:

```json
{
  "weapons": {
    "miara-style-template": {
      "kind": "template_suite",
      "source": "template_bundle",
      "path": "templates/miara-style-template",
      "description": "Glassy mascot/product explainer template",
      "suitable_for": ["product launch", "brand explainer"],
      "params": ["brand_name", "tagline", "accent_color"]
    }
  }
}
```

This keeps lifecycle management unified with weapons:

```text
discover → register → select → use → audit via standard checks → archive/promote
```

### 6.3 No template-specific gate/audit in MVP

Do not add `.framepack/template-audit.md` or dedicated template gates in MVP.
Template fit is resolved in the co-creation conversation:

- If the user stays within template parameters, reuse is efficient.
- If the user wants to break the template, that is a creative decision, not an
  automatic failure.

The resulting project still goes through normal quality/readiness/pre-render
audits.

## 7. Audit position — standard audit, not template police

Do not build a strict template-specific audit layer for MVP.

Template conformity is handled during co-creation:

- **Limited by parameters**: the template bundle/use workflow asks for the information and
  assets needed to fill parameter slots.
- **Broken deliberately by user choice**: if the user asks for something outside
  exposed params, the Agent records/reflects that creative decision rather than
  treating it as audit failure.

Then the result goes through the normal Framepack/HyperFrames checks:

- HyperFrames lint/validate/inspect/snapshot/render.
- Framepack quality audit.
- Framepack readiness board.
- Pre-render taste audit.

This is a better fit for the weight philosophy: template gravity guides the work,
but user-confirmed creative force can bend or break it.

The sections below are demoted from implementation requirements to optional future
evidence helpers.

<!-- Legacy over-engineered audit notes retained only for future reference.

Template Audit is not one check; it is four layers.

### 7.1 Structure audit

Report-first wrapper around existing HyperFrames checks:

- presence of `index.html`, `package.json`, `hyperframes.json`
- presence of `data-composition-variables` or a declared variable schema
- local assets required by manifest exist
- optional: recorded outputs from lint/validate/inspect

Framepack should not run long render commands automatically inside hooks. CLI can run them explicitly.

### 7.2 Snapshot audit

Check evidence exists:

- contact sheet exists
- audit points from manifest have corresponding snapshots or log entries
- `TEMPLATE_AUDIT.md` names key timepoints

This is evidence audit, not visual AI scoring in MVP.

### 7.3 DNA audit

MVP should be evidence-driven:

- manifest declares DNA locks
- `TEMPLATE_GUIDE.md` / `.template-audit/dna-summary.md` describe fixed DNA
- `index.html` contains marker comments or selectors named in the DNA lock evidence

Future: vision-assisted comparison between golden and variant snapshots.

### 7.4 Variant audit

Check both are represented:

- golden config/render/snapshot evidence
- variant config/render/snapshot evidence

MVP can allow “variant pending” as YELLOW; final template product should require it for GREEN.

-->

## 8. Productization levels

Avoid trying to build the whole SaaS product in one commit. Use levels:

### Level 0 — Template card recognition

Framepack can list templates as arsenal assets with name, description,适用范围,
parameter summary, and source path.

Deliverables:
- `core/templates/types.py`
- `core/templates/registry.py`
- `scripts/framepack_template.py list|inspect`
- tests using a temp template fixture

### Level 1 — Bundle scaffolding

Framepack can create a reusable template bundle skeleton.

Deliverables:
- `scaffold_template_bundle()` / `package_template_source()`
- CLI `scaffold`
- standard `TEMPLATE_CARD.md`, `PARAMS.md`, guide, example params generated

### Level 2 — Arsenal bridge

Framepack can record selected template as a weapon-suite and feed its parameters
into standard Framepack artifacts.

Deliverables:
- `.framepack/arsenal.json` records the template weapon-suite
- `.framepack/template-selection.md` optional evidence
- standard `frame.md` / `expanded-prompt.md` carry the actual co-created result

### Level 3 — Reuse UX

When user asks for template-based work, Agent can present the template list and
guide choice.

Deliverables:
- template list with name / description /适用范围
- template-specific questions derived from parameter docs

### Level 4 — Optional visual DNA helpers

Optional future layer:
- vision-assisted snapshot comparison
- golden vs variant contact-sheet diff
- mascot/trace/card-language scoring

## 9. MVP recommendation

Start with **Level 0 + Level 1**.

Why:
- It turns templates into discoverable arsenal assets.
- It avoids a second workflow/audit system.
- It gives real value immediately: existing `miara-style-template` can become
  a named reusable template bundle.
- It creates the UX contract needed for template selection.

MVP scope:

1. Add `core/templates/` with types/registry/productize/scaffold.
2. Add `scripts/framepack_template.py list|inspect|scaffold`.
3. Define template card schema: name, description,适用范围, params, assets,
   source project/path, examples.
4. Add tests for:
   - template card listing
   - template bundle skeleton generation
   - source project packaging preserves source path/assets docs
   - missing metadata is reported as incomplete card, not audit failure
5. Run list/inspect against `F:/Framepack-01-test/cases/miara-style-template`
   as a real smoke.

Do not yet:
- Add hook injections.
- Run renders automatically.
- Add vision scoring.
- Add template-specific audit gates.
- Force case scaffolder to always create template files for normal cases.

## 10. Why not just extend `case_scaffolder.py`?

Because a normal Framepack case and a template product are different animals.

Normal case:
> Make one video correctly.

Template product:
> Make a reusable production unit that can create many videos without drifting.

If `case_scaffolder.py` grows template logic inline, it becomes a junk drawer. Better:

- keep `case_scaffolder.py` for normal cases
- add `core/templates/scaffold.py` for template products
- let CLI expose separate commands

## 11. Why not put everything into `quality_audit.py`?

Because template productization is packaging/inventory work, not final video QA.

`quality_audit.py` asks:
> Does this produced HyperFrames project have semantic risks?

Template productization asks:
> Is this source artifact packaged as a reusable weapon-suite with name,
> description, fit scope, params, assets, and examples?

After a template is used to make a video, `quality_audit.py` remains the right
standard audit tool.

## 12. Why not treat templates as catalog components?

Catalog component:
> reusable piece inside a composition.

Template product:
> whole composition weapon-suite with docs/assets/params/examples/source files.

A template may use catalog components, but it is not one catalog component.

## 13. Error handling and reporting

All template inspect/list functions should be pure/read-only by default.

Return structured results:

```python
TemplateInspectReport(
    template_dir=str(path),
    status="complete|incomplete",
    issues=[TemplateIssue(...)],
    summary={...},
)
```

Severity:

- ERROR: cannot be treated as a template bundle.
- WARNING: usable as a draft template, but metadata/assets/docs incomplete.
- INFO: optional evidence/examples missing.

CLI exit codes:

- `0` when inspect/list command ran successfully, even if issues are reported.
- `2` only for invalid path/usage/internal error.

This matches Framepack’s report-first advisory philosophy.

## 14. Test plan

Use TDD once implementation begins.

Focused tests:

```text
tests/test_template_card.py
tests/test_template_registry.py
tests/test_template_cli.py
tests/test_template_scaffold.py
```

Integration smoke:

```bash
python scripts/framepack_template.py inspect F:/Framepack-01-test/cases/miara-style-template --format json
```

Full plugin verification:

```bash
cd framepack-plugin
python -m pytest tests/test_template_*.py -q -o "addopts="
python -m pytest tests/ -q -o "addopts="
```

Deployment sync:

- copy changed plugin files to `F:/Hermes_windows/plugins/framepack/`
- verify MD5 source vs deployed
- run deployed import smoke

## 15. Open design questions

1. Should template products live under `cases/<template-name>/`, or later under a separate `templates/` root?
   - Recommendation: MVP supports both, but tests use temp dirs. Workbench can keep real samples under `cases/` for now.

2. Should normal case scaffolding include template files?
   - Recommendation: no. Add explicit template scaffold path.

3. Should hooks automatically inject template-specific checks before render?
   - Recommendation: not in MVP. Start with CLI inventory/scaffold/package;
     normal render still uses existing audits.

4. Should visual DNA audit use vision models now?
   - Recommendation: no. First build evidence contract; add vision comparison only after golden/variant artifacts are stable.

## 16. Approval checkpoint

Before implementation, confirm this direction:

- New `core/templates/` package, not stuffing into existing audits.
- Start with Level 0 + small Level 1.
- CLI-first, hook-later.
- Evidence-based audit first, visual AI scoring later.
- Template products are adjacent to catalog/components, not a replacement.

If approved, next step is an implementation plan in `.hermes/plans/` with TDD phases.
