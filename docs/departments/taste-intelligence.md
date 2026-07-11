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

### 5.1 Brief-read audit issue codes

Purpose: prove the Agent actually understood the video type before expanding. This family includes both registered Taste rules and narrow parser/validation issues such as `invalid_taste_dial`.

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
- `product_presence_weak`
- `copy_overcrowding`
- `scene_layout_repetition`
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

## 9. Detector lifecycle

Taste rules are products, not loose regex snacks. Every detector should move through the same lifecycle so the layer grows like a calibrated palate, not a junk drawer.

### 9.1 Proposal — why does this rule exist?

Before adding a detector, write the rule's commercial failure in one sentence:

```text
When <input artifact> contains <observable signal>, the film risks <commercial failure>, unless <known legitimate exception>.
```

Examples:

```text
When expanded-prompt.md repeats centered headline + background in 3 scenes, the film risks feeling templated, unless the repetition is an intentional refrain with visible escalation.

When product_launch direction contains only abstract gradients and no product/UI/logo/device scene, the film risks becoming brand filler instead of a product film, unless the user approved an abstract teaser.
```

Proposal checklist:

- **Artifact**: `frame.md`, `.hyperframes/expanded-prompt.md`, `index.html`, proof frames, or a receipt file.
- **Observable signal**: exact text/HTML/pixel evidence, not vibes.
- **Commercial harm**: why users would care.
- **Legitimate exceptions**: event teaser, kinetic type, luxury restraint, missing assets, approved waiver.
- **Repair target**: where the Agent should fix it.
- **Acceptance**: what makes the issue resolved.

### 9.2 Registry contract — one rule, one source of truth

Every user-facing Taste rule should have a `TasteRule` in `core/taste_rules.py` before it ships.

There are two allowed code classes:

| Code class | Registry requirement | Example |
|---|---|---|
| **Taste rule** | Must have a `TasteRule`; can appear in action cards, public detector inventories, severity policy, and retirement notes. | `product_presence_weak`, `copy_overcrowding`, `motion_claim_unproven` |
| **Parser / validation issue** | May use fallback handling when it is a narrow input-shape error; should not be treated as a full commercial taste rule unless promoted later. | `invalid_taste_dial` |

Required fields for registered Taste rules:

| Field | Rule of thumb |
|---|---|
| `id` | Stable snake_case code; never encode severity in the name. |
| `category` | One of the current taste families: `brief_read`, `asset_truth`, `motion_slop`, `composition_slop`, `copy_slop`, `implementation_slop`, `evidence_gap`. |
| `default_severity` | Start conservative; promote only with evidence. |
| `registers` | Encode known film-type exceptions here, not hidden in detector prose. |
| `message` | What smells wrong and why it hurts. |
| `acceptance` | Concrete repair condition. |
| `repair_target` | The file or receipt the Agent should change/attach. |
| `artifacts` | Inputs the rule depends on. |
| `source_refs` | Why this rule exists: skill section, taste case, detector note, or review finding. |

Rule drift guardrail:

- If `registers` names an override, `_refine_issue_severities()` or the detector path must actually apply it.
- If a detector emits `risk`, Quality Audit / Taste Control behavior must match the policy table.
- If a parser / validation issue becomes user-facing enough to need acceptance text, register it or explicitly document why fallback handling is intentional.
- Department docs may carry the full detector inventory; public README tables are capability highlights and must stay truthful, not necessarily exhaustive.

### 9.3 Test matrix — prove both teeth and manners

Every detector needs at least these tests:

| Test kind | Purpose |
|---|---|
| Positive hit | A realistic bad artifact triggers the rule. |
| Negative guard | A legitimate good/approved pattern does not trigger. |
| Register tuning | Film-type override changes severity when applicable. |
| Action-card path | `risk` / `blocker` produces the expected Taste Control card or Intervention event. |
| Parser edge case | Regex/scanner handles realistic wording variants, negation, punctuation, repeated scenes, and malformed but common prose. |

For text/prompt detectors, include false-positive and false-negative probes. The negated-product lesson is canonical:

```text
No product, UI, logo, device, or app screen appears.
Logo: absent.
UI screenshots are missing.
Product shot is not shown.
Device: none.
Screenshot: absent.
```

All of those mean **no concrete product scene**. A detector that counts them as product presence is lying politely.

### 9.4 Severity tuning — detector finds, refiner decides volume

Detector code should answer: “Did this smell happen?”

Severity refinement should answer: “How loud is this for this film type?”

Use this split:

- Detector emits the natural base severity for the finding.
- `TasteRule.default_severity` and `registers` define the policy baseline.
- `_refine_issue_severities()` applies register-aware overrides and dial-aware promotion/demotion.
- Taste Control only turns `blocker` / `risk` into open decision cards.
- Quality Audit maps Taste severity into P0/P1/P2/P3 consistently.

Avoid hiding policy in ad-hoc detector branches unless the exception depends on local evidence that the registry cannot express, such as kinetic-type wording in a specific opening scene.

### 9.5 Release gates — what must pass before a detector lands

A detector change is not done until:

1. RED test reproduced the intended miss or false positive.
2. GREEN targeted tests pass.
3. Focused Taste suite passes.
4. Full plugin suite passes.
5. If plugin runtime/code files changed, sync them to `F:/Hermes_windows/plugins/framepack/`.
6. If runtime files were synced, MD5 proves source and deployed copies match.
7. If plugin runtime behavior changed, deployed focused/full tests pass.
8. Fresh `hermes-verify-*` ad-hoc script proves the changed behavior or documentation contract.
9. Independent reviewer passes, or documented fallback is used without `[verified]` prefix.
10. Public docs / bilingual README surfaces mention the active capability if it is user-facing; otherwise department docs are the full internal inventory.

### 9.6 Tuning after real cases — detectors need receipts

After a real commercial case, classify detector behavior:

| Outcome | Action |
|---|---|
| True positive | Keep; optionally add the case shape to tests. |
| False positive | Add a negative guard before changing detector logic. |
| False negative | Add a positive regression before broadening detection. |
| Noisy suggestion | Downgrade severity, narrow trigger, or require additional evidence. |
| Repeated waiver | Turn the waiver reason into a register override or documented exception. |
| Repeated user complaint | Promote severity or move the rule earlier in the workflow. |

Do not tune from vibes. Tune from a concrete case, expected output, and a regression test.

### 9.7 Retirement — stale rules should leave cleanly

A detector should be retired or merged when:

- another detector catches the same commercial failure with better precision;
- a HyperFrames upstream feature makes the smell structurally impossible;
- the rule creates repeated false positives in legitimate styles;
- the rule has no active tests, no recent cases, and no clear acceptance path;
- the finding cannot be explained to a user without sounding like internal lint trivia.

Retirement procedure:

1. Mark the rule as replaced in docs or merge its acceptance text into the successor rule.
2. Remove detector code and tests in the same change.
3. Keep historical mention only if it explains a migration.
4. Verify no README / Quality Audit / Taste Control surface still names the removed rule.
5. Run the same source/deploy/reviewer gates as an added detector.

## 10. Current vertical slice status

Implemented (v0.19.0 shipped):

- rule registry with register-aware severity mapping
- taste_read / taste_dials parsing
- 9 prompt-level detectors (opening_visual_absence through ui_debris_copy)
- 8 HTML implementation slop detectors (gradient_text_slop through decorative_generated_surface)
- proof-frame evidence loop with ProofEvidence metadata
- Taste Control action cards grouped by Revise / Proof / Waiver
- Taste → Intervention events bridge
- register-aware severity refinement from taste_dials
- Director Bible detectors for repeated layouts, weak product presence, and copy overcrowding
- detector lifecycle policy for proposing, testing, tuning, and retiring rules
- real-render dogfood verification: slop 6 codes caught, clean 0 false positives

Next priority:

1. richer Director Bible detectors for transition/rhythm genericness and product-presence quality scoring
2. first real-case scorecard archive: capture true/false positive receipts from commercial cases
3. decimal-precision detector coverage (extend border-radius to handle `32.5px` etc.)
