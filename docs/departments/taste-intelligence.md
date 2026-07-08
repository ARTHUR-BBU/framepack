# Taste Intelligence Department

> Role: Framepack's commercial taste nervous system.
>
> Plain-English job: Taste is the chef's tongue. It decides whether a video direction feels commercially usable, product-led, and non-cheap before the kitchen spends more time cooking it.

## 1. Department boundary

Taste Intelligence owns judgment about **commercial feel**:

- Is the product or real asset actually the hero?
- Does the opening have a visual hook, or is it just copy on a slide?
- Is the motion plan a story spine, or generic fade/slide movement?
- Is visible copy carrying the whole film?
- Does implementation contain obvious generated-video tells: fake UI, decorative grids, raw scroll hacks, missing reduced-motion fallbacks?
- Is there proof from pixels when the plan claims motion or product quality?

Taste does **not** own:

- exact weapon selection — Weapon Production owns that
- proof of weapon calls — Weapon Production / Audit own that
- HyperFrames structural validity — HyperFrames lint/validate owns that
- final user decision to render anyway — user owns that through waiver/decision

## 2. Input contracts

Taste may read:

| Input | Why it matters |
|---|---|
| `frame.md` | taste_read, taste_dials, visual physics, motif, controlled surprise |
| `.hyperframes/expanded-prompt.md` | scene beats, opening hook, product presence, copy, transitions, kinetic continuity |
| `index.html` | implementation-level AI slop and proof gaps |
| `.framepack/weapon-load-plan.json` | whether reusable weapons have presets/recipes |
| proof frames/contact sheets | whether prose promises are visible in pixels |

## 3. Output contracts

Taste outputs findings, not rewrites:

| Artifact | Purpose |
|---|---|
| `TasteAuditIssue` | raw taste finding from audit_project |
| `.framepack/taste-audit.json` | persisted action-card ledger |
| `.framepack/taste-debt.md` | human-readable debt receipt |
| `InterventionEvent(department="taste")` | reusable railguard event for decision_required pulls |

## 4. Severity policy

Taste now has a small register-aware “mixing console”: detectors say what smells wrong; the severity refiner decides how loud the alarm should be for this exact film type.

| Taste severity | Priority | Meaning | Intervention mapping |
|---|---:|---|---|
| `blocker` | `P0` | claimed quality cannot be trusted without evidence | `decision_required` |
| `risk` | `P1` | likely commercial-quality failure | `decision_required` |
| `suggestion` | `P2` | quality improvement, not mandatory | stays advisory unless promoted by register/dials |
| `note` | `P3` | context / acceptable caveat | no pullback |

Register and dials can shift severity:

- `product_absence` is P1 for product launch / website-to-video, but P2 for brand film.
- `motion_claim_unproven` becomes P0 when `taste_dials.motion_intensity >= 8`.
- `no_controlled_surprise` becomes P3 when `taste_dials.design_variance <= 3` because the brief is intentionally restrained.
- high visual density can promote composition slop; low visual density can downgrade decorative-surface concerns.

## 5. Current detector families

### 5.1 Brief-read detectors

Purpose: prove the Agent actually understood the video type before expanding.

Examples:

- `missing_taste_read`
- `missing_taste_dials`
- `invalid_taste_dial`
- `missing_taste_block`

### 5.2 Director Bible detectors

Purpose: catch bad direction before HTML exists.

Examples:

- `opening_visual_absence`
- `text_dominance`
- `product_absence`
- `static_mockup_risk`
- `generic_fade_stack`
- `missing_kinetic_continuity`
- `motif_not_transformed`

### 5.3 HTML implementation slop detectors

Purpose: catch rendered-product smells that lint can miss.

Examples:

- `fake_product_ui_divs` — fake div-built product dashboards instead of real assets
- `decorative_generated_surface` — grid/glow/crosshair/stripe surface with no story/data role
- `raw_scroll_listener` — direct scrollY/addEventListener scroll hacks
- `missing_reduced_motion` — motion without a fallback

Taste flags these because they affect perceived quality. It does not replace HyperFrames lint or Weapon enforcement.

### 5.4 Evidence-gap detectors

Purpose: force proof when prose claims are not enough.

Examples:

- `no_proof_frames`
- `motion_claim_unproven` — significant motion is claimed in the Director Bible or HTML, but canonical `.framepack/proof-frames/*.png` evidence is missing

## 6. Best-practice finding format

Every Taste finding should answer four questions:

```text
What smells wrong?
Why does that hurt commercial quality?
Where should the Agent fix it?
What acceptance condition makes it good enough?
```

Bad finding:

```text
This feels generic.
```

Good finding:

```text
Opening beat appears to rely on text without a concrete visual subject; the film may start like a slide, not a commercial. Add a product/UI/footage/logo/object visual hook before render.
```

## 7. Waiver policy

Taste allows waivers, but waivers must be concrete:

- who approved it
- which code/issue is waived
- why the commercial risk is acceptable
- what proof or constraint justifies the exception

Bad waiver:

```text
Looks fine.
```

Good waiver:

```text
No product assets exist yet; user approved typography-led teaser for event countdown cut.
```

## 8. Detector design rules

1. Prefer product truth over decorative polish.
2. Avoid false positives against legitimate kinetic typography, event teasers, and data/product grids.
3. Each detector must have at least one positive and one negative test.
4. If a detector produces a `risk`, prove it enters Taste Control and Intervention events.
5. Path fields should be project-relative once they become action cards/events.
6. Never hard-block directly from Taste; Taste requests a decision. Intervention handles the pullback.

## 9. Current vertical slice status

Implemented:

- rule registry foundation
- taste_read / taste_dials parsing
- prompt-level detectors
- audit integration
- Taste Control action cards
- Taste → Intervention events
- first HTML implementation slop detectors
- proof-frame evidence loop for significant motion claims
- register-aware severity refinement from `taste_dials`

Next priority:

1. richer Director Bible detectors for scene layout repetition and product-presence quality
2. detector lifecycle docs: how to add, test, tune, and retire rules
