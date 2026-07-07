# PRD: Framepack Taste Layer 2.0 - Anti-Slop Commercial Video Intelligence

> Research synthesis from Taste Skill v2 and Impeccable, adapted into Framepack's Taste Control Loop.
>
> Date: 2026-07-07
> Status: PRD / design proposal, no implementation yet
> Related baseline: `.hermes/designs/2026-07-07--taste-control-loop.md`

## 0. Verdict

Framepack's current taste layer is a good kitchen ticket: it catches obvious bad dishes before serving. Taste Skill and Impeccable show the next jump: the kitchen needs a **chef's palate vocabulary plus a health inspector scanner**.

The upgrade is not "copy their frontend rules into Framepack." That would be lazy and wrong. The upgrade is:

1. **Taste Skill contribution**: brief inference, dials, anti-slop bans, pre-flight discipline, layout/motion/asset rules.
2. **Impeccable contribution**: shared design vocabulary, brand vs product registers, deterministic anti-pattern detector, command-like refinement lanes, DESIGN.md / PRODUCT.md context artifacts.
3. **Framepack adaptation**: convert these into video-native Director gates: `frame.md` intent, `expanded-prompt.md` choreography, `index.html` structure, and proof-frame pixel evidence.

In restaurant terms: Taste Skill is the cookbook, Impeccable is the inspector with a checklist and vocabulary, Framepack must become the executive chef who knows whether this is a perfume ad, SaaS launch film, event teaser, or product demo.

## 1. Research inputs

### 1.1 Taste Skill v2

Sources inspected:

- `https://www.tasteskill.dev/`
- `https://www.tasteskill.dev/docs`
- `https://www.tasteskill.dev/changelog`
- cloned repo: `.hermes/research/taste-layer-sources/taste-skill`
- core file: `skills/taste-skill/SKILL.md`
- companion files: `redesign-skill`, `gpt-tasteskill`, imagegen / brandkit skills

High-signal findings:

- Reads the brief before output. It declares a one-line design read: page kind, audience, vibe, design system / aesthetic family.
- Uses three dials: `DESIGN_VARIANCE`, `MOTION_INTENSITY`, `VISUAL_DENSITY`.
- Maps briefs to real design systems where applicable, instead of faking Material, Fluent, Carbon, Polaris, Primer, GOV.UK, etc.
- Enforces three locks: color consistency, shape consistency, page theme consistency.
- Has a hard pre-flight checklist. If one box fails, the output is not done.
- Treats imagery as mandatory for brand/landing work. Text-only minimalism is incomplete, not refined.
- Bans high-frequency AI tells: AI-purple gradients, three equal cards, div fake screenshots, em-dashes, section-number eyebrows, scroll cues, version labels, decorative dots, photo-credit captions, fake precision, overused fonts, generic copy.
- Motion is not decoration: every animation must communicate hierarchy, storytelling, feedback, or state.
- Canonical scroll/motion skeletons avoid raw scroll listeners and enforce reduced-motion alternatives.

Important limitation for Framepack:

Taste Skill is frontend-page oriented. Its rules cannot be imported 1:1 into video. Example: "hero fits viewport" becomes "opening beat fits first 2.5 seconds and has a product/visual hook before copy." "Section-layout repetition" becomes "scene rhythm family repetition." "CTA button wrap" becomes "CTA lockup is legible in final hold."

### 1.2 Impeccable

Sources inspected:

- `https://impeccable.style/`
- `https://github.com/pbakaus/impeccable`
- cloned repo: `.hermes/research/taste-layer-sources/impeccable`
- `README.md`
- `skill/SKILL.src.md`
- `skill/reference/brand.md`
- `skill/reference/product.md`
- `skill/reference/critique.md`
- `skill/reference/audit.md`
- `skill/reference/polish.md`
- `skill/reference/animate.md`
- detector registry: `cli/engine/registry/antipatterns.mjs`

High-signal findings:

- Product spine: 1 skill, 23 commands, live browser iteration, 45 deterministic detector rules.
- It creates shared artifacts (`PRODUCT.md`, `DESIGN.md`) so future commands know the audience, register, voice, anti-references, colors, type, and components.
- It distinguishes **brand register** and **product register**:
  - Brand: design is the product. Distinctiveness matters. Safe equals invisible.
  - Product: design serves the task. Earned familiarity matters. Surprise is expensive.
- It uses a deterministic detector for AI slop and quality issues, no LLM/API required.
- It layers LLM critique on top of deterministic evidence, not instead of it.
- Detector rule families include typography, palette, card structure, spacing rhythm, motion, copy cadence, image quality, accessibility, and provider-specific model tells.
- It has provider-tuned rules: Codex/GPT tells such as hairline border plus wide shadow, decorative grid backgrounds, theater-framing copy; Gemini tells such as image hover transform.
- Critique flow separates independent design review from deterministic detector evidence, then synthesizes.

Important limitation for Framepack:

Impeccable's detector is built for websites and source files. Framepack needs a multi-artifact detector across Director docs, HyperFrames HTML, and rendered proof frames. A pure HTML detector will miss video failures like "five pretty scenes but no kinetic continuity" or "product appears only as a flat screenshot."

## 2. What this means for Framepack

Framepack's current taste layer is mostly **director-document audit**:

- `frame.md` taste block exists?
- `expanded-prompt.md` has kinetic continuity?
- product missing?
- text carrying the film?
- mockup static?
- generic fades repeated?
- proof frames missing?

That is good, but it is still close to a proofreader. The new target is a **four-stage taste nervous system**:

```text
Brief / assets
  -> intent register + taste dials
  -> Director Bible audit
  -> HTML / implementation slop detector
  -> proof-frame / motion evidence audit
  -> Taste Control ledger: revise / proof / waiver
```

The taste layer should answer four questions:

1. **Read the room**: What kind of film is this, for whom, with what register and risk appetite?
2. **Block AI reflexes**: Which cheap generated-video tells are present?
3. **Demand physical evidence**: Do frames and motion prove the claim, or is the prompt flattering itself?
4. **Make decisions auditable**: If a P1 is accepted, where is the waiver and why?

## 3. Product goals

### 3.1 Primary goal

Upgrade Framepack Taste Control from a small P1 ledger into a reusable commercial-video taste system that catches generic AI-video / animated-PPT patterns before preview/render and turns every serious problem into a concrete action card.

### 3.2 Success criteria

The feature is successful when:

- A vague product/brand video brief produces an explicit `taste_read` and register before creative expansion.
- `frame.md` contains video-native dials derived from the brief, not arbitrary default values.
- `expanded-prompt.md` is audited for Taste Skill / Impeccable-derived anti-slop patterns translated into video language.
- `index.html` is audited for implementation tells: gradient text, fake UI divs, generic card cascades, decorative grids/glows, unsupported motion, remote production assets.
- Proof frames are required for serious taste signoff, with at least a contact sheet or sampled frames before render/publish.
- P1 taste debt cannot be ignored. The Agent must revise, attach proof, or record a user-approved waiver.
- False positives are controlled by register, dials, and explicit context. A restrained luxury film should not be punished for low motion if restraint is intentional.

### 3.3 Non-goals

- Do not install or vendor Taste Skill / Impeccable as runtime dependencies in Framepack in this phase.
- Do not copy their SKILL.md content wholesale into Framepack rules.
- Do not turn taste into a hard P0 compiler block. Taste remains advisory decision forcing, not render law.
- Do not replace HyperFrames lint/render. Framepack checks meaning and taste; HyperFrames checks structure and output.
- Do not build live browser editing like Impeccable Live Mode in this phase.
- Do not use API-key LLM critique as the only signal. Deterministic and artifact-based checks come first.

## 4. Users and jobs-to-be-done

### 4.1 Primary user: 老田 / Framepack director-builder

Job:

- Turn vague creative intent into a commercial video that does not look like PPT, default AI demo, or generic template.
- Keep quality high while moving fast.
- Know exactly why a render is not ready.

Pain today:

- The Agent can write beautiful-sounding prompts but still produce cheap visual outcomes.
- Soft suggestions are easy to ignore in the rush to render.
- Visual taste debt is hard to compare across projects.

### 4.2 Secondary user: future Framepack Agent

Job:

- Follow explicit taste rails without needing taste memory in the model weights.
- Make better creative decisions with fewer user corrections.
- Avoid known AI tells automatically.

Pain today:

- Many rules live in prose, memory, or human preference.
- The Agent can pass tests while still making a mediocre film.
- There is no compact machine-readable taste contract.

## 5. Core concept: Taste Layer 2.0

### 5.1 Four ledgers, one control loop

Framepack should maintain four related but separate artifacts:

| Artifact | Purpose | Source inspiration | Commit? |
|---|---|---|---|
| `frame.md` `taste_read` / `control_profile` | Intent and dials | Taste Skill brief inference | Yes |
| `.framepack/taste-rules.json` | Active rule pack and thresholds | Impeccable detector registry | Yes / generated |
| `.framepack/taste-audit.json` | Current findings and action cards | Current Taste Control | No, usually generated |
| `.framepack/taste-debt.md` | Human-readable kitchen ticket | Current Taste Control | No, usually generated |

The current `taste-audit.json` and `taste-debt.md` stay. The new item is a rule pack that makes the taste layer data-driven instead of hardcoded.

### 5.2 Registers

Add video-native registers inspired by Impeccable's brand/product split:

| Register | When | Good taste means | Main failure mode |
|---|---|---|---|
| `brand_film` | Brand, campaign, luxury, event | Distinctiveness, mood, memory | Safe/invisible, text-only prettiness |
| `product_launch` | Product reveal, SaaS, app | Product proof, clear value, premium staging | Animated PPT, fake UI, text dominance |
| `website_to_video` | URL capture / site trailer | Faithful brand DNA plus cinematic translation | Generic rewrite, lost website identity |
| `explainer` | Concept education | Clarity, pacing, visual metaphor | Dense copy, flat icons, no story spine |
| `product_ui` | Dashboard/app demo | Earned familiarity, interface choreography | Over-decoration, fake affordances |
| `event_teaser` | Conference / launch date | Kinetic type, rhythm, anticipation | Random typography attacks, no CTA clarity |

Rule severity depends on register. Example:

- `text_dominance` is P1 for `product_launch`, but may be P2 for `event_teaser` if kinetic typography is the declared visual subject.
- `low_motion` is P1 for `event_teaser` with high energy, but P3 for restrained luxury object films.
- `decorative_grid_background` is P1 for luxury, maybe P3 for data-cathedral if it organizes data.

### 5.3 Dials

Map Taste Skill's three dials into Framepack's existing five-element control profile.

| Taste Skill dial | Framepack control relationship | Video interpretation |
|---|---|---|
| `DESIGN_VARIANCE` | 木 `creative_autonomy` + 金 `restraint_force` inverse | How much composition may break symmetry/template defaults |
| `MOTION_INTENSITY` | 水 `motion_dynamism` + 火 `atmosphere_density` | How much choreography and transition energy is expected |
| `VISUAL_DENSITY` | 火 `atmosphere_density` + 金 `restraint_force` | How much information/texture lives in each frame |

Proposed additional derived fields in `frame.md`:

```yaml
taste_read:
  register: product_launch
  audience: technical buyers
  visual_family: interface_ballet_saas
  anti_references:
    - animated PPT
    - AI purple gradient SaaS hero
    - static screenshot slide
taste_dials:
  design_variance: 7
  motion_intensity: 6
  visual_density: 4
  rationale: "Product launch needs clear UI proof with moderate cinematic motion."
```

The five-element profile remains the behavior driver. The three dials are the outside-world taste vocabulary bridge.

## 6. Rule taxonomy

### 6.1 Rule levels

| Level | Meaning | Action |
|---|---|---|
| P0 | Structural impossibility or unsafe output | Existing HyperFrames / quality gate blocks |
| P1 | Major taste debt likely to make output commercially weak | Taste Control decision required |
| P2 | Quality improvement, should fix before final render | Advisory, included in debt report |
| P3 | Note / context | Log only |

Taste rules should almost never become P0. P1 is the important zone: no silent ignore.

### 6.2 Rule categories

| Category | Examples | Artifact |
|---|---|---|
| `brief_read` | missing register, missing audience, no anti-reference | `frame.md` |
| `visual_identity` | inconsistent palette/radius/theme, missing brand DNA | `frame.md`, HTML |
| `asset_truth` | no product visual, fake div screenshot, broken/placeholder image | prompt, HTML, proof frames |
| `copy_slop` | em-dash, generic SaaS words, fake precision, too much text | prompt, HTML |
| `composition_slop` | three equal cards, repeated section markers, decorative grid, flat background | prompt, HTML, frames |
| `motion_slop` | generic fade stack, bounce/elastic, motion claimed but not shown, no reduced motion | prompt, HTML, frames |
| `implementation_slop` | remote fonts, unsupported scroll listeners, CSS/GSAP conflicts, div fake UI | HTML/CSS/JS |
| `evidence_gap` | no proof frames, no contact sheet, no scene frame samples | project files |

### 6.3 Video-native translations from Taste Skill

| Taste Skill / Impeccable rule | Framepack video rule | Severity default |
|---|---|---|
| Brief inference required | `missing_taste_read` | P1 for new creative work |
| Design dials explicit | `missing_taste_dials` | P2 |
| Real images required | `visual_asset_absence` | P1 brand/product |
| Div fake screenshot banned | `fake_product_ui_divs` | P1 product launch |
| Hero needs real visual | `opening_visual_absence` | P1 |
| Hero fits viewport | `opening_beat_overloaded` | P1 if first scene copy > threshold |
| Three equal cards banned | `generic_card_grid_scene` | P2/P1 depending register |
| Section layout repetition | `scene_layout_repetition` | P2 |
| No scroll cues/version labels | `ui_debris_copy` | P2 |
| No em-dashes | `copy_punctuation_slop` | P2, P1 if pervasive |
| No fake precise numbers | `fake_precision` | P2/P1 in product proof scenes |
| Motion motivated | `unmotivated_motion` | P1 when high motion used without story role |
| Motion claimed = shown | `motion_claim_unproven` | P1 |
| Reduced motion mandatory | `missing_reduced_motion` | P2/P1 for HTML |
| No raw scroll listener | `raw_scroll_listener` | P2/P1 if render risk |
| No decorative grids/glows | `decorative_generated_surface` | P2/P1 if dominant |
| Brand vs product register | `register_mismatch` | P1 if severe |

### 6.4 Video-native translations from Impeccable detector rules

A subset should be ported as deterministic Framepack HTML/text detectors:

| Impeccable detector | Framepack detector target | Notes |
|---|---|---|
| `gradient-text` | HTML/CSS | Ban visible gradient text in commercial video unless explicitly art-directed |
| `ai-color-palette` | `frame.md`, CSS colors | Detect AI purple/cyan default palette without brand rationale |
| `cream-palette` | `frame.md`, CSS colors | Detect saturated beige craft palette when not brand-backed |
| `nested-cards` | HTML | Video card stacks can be valid, but nested card UI is a fake dashboard tell |
| `monotonous-spacing` | HTML/proof heuristics | Harder deterministically; start as prompt/HTML repeated value heuristic |
| `bounce-easing` | JS/CSS/GSAP strings | Ban `bounce`, `elastic`, extreme ease unless comedic/playful register |
| `dark-glow` | CSS box-shadow / text-shadow | Generated dark-tech tell |
| `icon-tile-stack` | HTML | P2 unless explicitly product UI icon grid |
| `hero-eyebrow-chip` | prompt/HTML | Translate to opening scene micro-label clutter |
| `repeated-section-kickers` | prompt/HTML | Translate to scene-label repetition |
| `numbered-section-markers` | prompt/HTML | Detect 01/02/03 scene labels as decoration |
| `em-dash-overuse` | visible copy | Deterministic, easy |
| `marketing-buzzword` | visible copy | Dictionary-based first pass |
| `aphoristic-cadence` | visible copy | Pattern-based, avoid overfitting |
| `oversized-h1` | HTML/proof | Video equivalent: headline dominates scene without visual subject |
| `extreme-negative-tracking` | CSS | Possible HTML detector |
| `broken-image` | HTML/assets | Already adjacent to HyperFrames checks |
| `low-contrast` | proof-frame / CSS | Later phase with screenshot sampling |
| `line-length`, `tiny-text`, `tight-leading` | HTML/CSS/proof | Later phase; proof-frame OCR may help |
| provider-gated GPT/Codex tells | HTML/CSS | Codex grid background, ghost-card, over-rounding map directly to HyperFrames CSS |

## 7. Proposed architecture

### 7.1 New modules

```text
framepack-plugin/core/
  taste_rules.py              # rule registry, register-aware severity mapping
  taste_read.py               # derive/read taste_read + dials from frame.md
  taste_text_detectors.py     # prompt/copy detectors
  taste_html_detectors.py     # index.html/CSS/JS detectors
  taste_proof_detectors.py    # proof-frame/contact-sheet checks, initially evidence existence
  taste_rule_schema.py        # dataclasses / JSON schema helpers
```

Current modules remain:

```text
core/taste_audit.py           # orchestrates taste checks
core/taste_control.py         # ledger and pre-render injection
core/taste_grammar.py         # kinetic vocabulary
core/taste_specimens.py       # reference DNA
```

### 7.2 Rule schema

```python
TasteRule(
    id="fake_product_ui_divs",
    category="asset_truth",
    default_severity="P1",
    registers={"product_launch": "P1", "brand_film": "P2", "explainer": "P2"},
    artifacts=["expanded_prompt", "html"],
    message="Product preview appears to be div-built fake UI instead of a real screenshot, generated image, or real component preview.",
    acceptance="Replace with real product screenshot, generated product image, real component preview, or explicit user-approved asset waiver.",
    source_refs=["tasteskill:4.8", "impeccable:detector:nested-cards"],
)
```

Key requirements:

- Rule metadata is data, not scattered prose in code.
- Every P1 rule has an acceptance string.
- Every rule has source references for traceability.
- Severity can be overridden by register and dials.
- Waiver can target `issue_id`, `rule_id`, or `category`, but broad waivers need explicit reason and expiry.

### 7.3 Detector orchestration

`audit_project(project)` becomes a dispatcher:

```text
load context
  -> frame.md, expanded-prompt.md, index.html, .framepack artifacts
  -> derive taste_read/register/dials/control_profile
run prompt detectors
run HTML detectors if index.html exists
run proof detectors if proof frames exist or index.html exists
merge findings
map severities by register/dials
return TasteAuditReport
```

### 7.4 Taste Control integration

`taste_control.py` should remain thin and stable:

- It consumes `TasteAuditIssue` objects.
- It does not know every rule's internal logic.
- It writes the ledger.
- It builds pre-render messages.

This is important: the kitchen ticket should not contain the whole culinary school.

## 8. User experience

### 8.1 When starting a creative video

Agent should produce a compact read:

```text
Reading this as: product_launch for technical founders, with interface-ballet SaaS language.
Taste dials: variance 7, motion 6, density 4.
Anti-references: animated PPT, AI-purple SaaS gradient, static screenshot slide.
```

Then this read is persisted to `frame.md`, not lost in chat.

### 8.2 Before preview/render

If debt exists:

```text
🎛️ Framepack Taste Control - P1 taste debt needs a decision

Open P1: 3

1. fake_product_ui_divs
   Why: product preview is built from generic div rectangles.
   Fix: use real screenshot/generated image/real component preview.

2. opening_visual_absence
   Why: first scene is text + gradient, no visual hook.
   Fix: product/brand image must carry the opening beat.

Choose: revise / proof / waiver.
```

### 8.3 Waivers

Waivers must stay allowed but serious. A waiver is not a trash can; it is the chef writing, "yes, we intentionally served it this way."

Proposed waiver shape:

```json
{
  "waivers": [
    {
      "rule_id": "opening_visual_absence",
      "reason": "User approved typography-only teaser. Product reveal intentionally delayed until scene 2.",
      "approved_by": "user",
      "expires": "2026-08-01"
    }
  ]
}
```

Broad waivers should warn if they match multiple P1s.

## 9. False positive control

Taste systems get annoying when they yell at intentional choices. Use four controls:

1. **Register**: product UI and brand film have different rules.
2. **Dials**: low motion with low `motion_intensity` is fine; low motion with high `motion_intensity` is debt.
3. **Explicit intent**: if `expanded-prompt.md` documents why a rule is intentionally violated, downgrade when safe.
4. **Proof**: if proof frames show the output works, accept or downgrade.

Examples:

- Kinetic type event with no product shot in first 2 seconds: P3 if register is event teaser and text is the product.
- Brand film with a single dramatic color switch: not a theme-lock violation if declared as one deliberate act.
- Data cathedral with grid lines: not decorative grid slop if grid organizes metrics or spatial architecture.

## 10. TDD fixture strategy

Create fixture projects under `framepack-plugin/tests/fixtures/taste_layer/`:

```text
product_launch_text_ppt/
  frame.md
  .hyperframes/expanded-prompt.md
  index.html
  expected.json

brand_film_intentional_restraint/
  frame.md
  .hyperframes/expanded-prompt.md
  expected.json

fake_ui_div_preview/
  index.html
  expected.json

codex_grid_background/
  index.html
  expected.json

event_teaser_kinetic_type_allowed/
  frame.md
  .hyperframes/expanded-prompt.md
  expected.json
```

Each rule should have:

- At least 3 positive fixtures.
- At least 3 false-positive fixtures.
- One register-specific severity fixture.
- One waiver fixture if P1.

This mirrors Impeccable's fixture discipline and prevents taste rules from becoming vibes-only regex soup.

## 11. Rollout plan

### Phase A: Rule registry and context compiler

Build data-driven rule registry and `taste_read` parser. No new detection beyond existing behavior yet.

### Phase B: Prompt/doc detectors

Add Taste Skill-derived checks for `frame.md` and `expanded-prompt.md`:

- missing taste read
- missing dials
- opening visual absence
- text overload
- fake precision
- em-dash/copy slop
- repeated scene labels
- scene rhythm repetition
- motion claimed not planned

### Phase C: HTML/CSS detectors

Add Impeccable-inspired deterministic checks for `index.html`:

- gradient text
- AI purple/cream palette tells
- decorative grid/glow backgrounds
- fake UI div preview
- bounce/elastic easing
- raw scroll listeners
- repeated card/grid structures
- missing reduced motion
- remote production assets

### Phase D: Proof-frame evidence

Require at least proof frames/contact sheet before final taste signoff. Start with evidence-existence checks; later add visual/OCR checks.

### Phase E: Rule-pack productization

Expose rule pack docs and allow controlled updates without editing detector code. Add source references, severity table, and rule lifecycle.

## 12. Open design decisions

These should be decided in implementation planning, not left vague:

1. Should `.framepack/taste-rules.json` be checked in or generated from Python registry?
   - Recommendation: generated from Python registry for now, committed only in case projects if needed.
2. Should P2 debt inject before render?
   - Recommendation: include P2 summary only when P1 exists; otherwise write ledger silently.
3. Should proof-frame absence be P1 or P2?
   - Recommendation: P1 only when `index.html` exists and command is `render/publish`; P2 for preview.
4. Should external Impeccable CLI be used directly?
   - Recommendation: no. Port the relevant concepts. External CLI is frontend-site oriented and Node 24 dependent.
5. Should visual-frame critique use LLM vision?
   - Recommendation: later, optional, never the only gate.

## 13. Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Over-blocking | Taste gate becomes annoying and slows production | Register/dial severity mapping, waivers, advisory not P0 |
| Regex soup | Detector becomes brittle | Rule schema + fixtures + false-positive tests |
| Imported frontend bias | Website rules punish video decisions | Translate every rule into video-native semantics |
| Model-flattery loop | Agent writes proof text instead of proof frames | Require artifact evidence paths |
| Stale rules | AI tells change quickly | Rule source refs, version field, update plan |
| MD5/newline drift | Deployment sync claims mismatch | Normalize newline in sync workflow or compare text + md5 policy explicitly |

## 14. Acceptance criteria for Taste Layer 2.0

A release candidate is acceptable when:

- All existing taste control tests still pass.
- New rule registry tests pass.
- At least 12 new rule detectors have TDD fixture coverage.
- At least 5 false-positive fixtures prove register-aware downgrades.
- Hook injection remains advisory and never P0-blocks render.
- Source and deployed plugin directories are synced with explicit newline/md5 policy.
- Independent worktree QA passes.
- A real Framepack commercial case produces useful debt cards that a human agrees are not noise.

## 15. Summary

Taste Skill teaches: read the room, choose dials, ban the cheap moves, run a hard pre-flight.

Impeccable teaches: create shared design vocabulary, separate brand/product registers, back taste with deterministic detectors, and persist context.

Framepack should now teach the Agent: a commercial video is not a webpage and not a slide deck. It is a sequence of visual proof, rhythm, product truth, and controlled surprise. The Taste Layer 2.0 job is to catch the moments where the Agent says "premium" but serves warmed-over AI garnish.
