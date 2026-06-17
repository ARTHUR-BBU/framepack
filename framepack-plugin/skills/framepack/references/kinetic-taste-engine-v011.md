# Framepack v0.11 — Kinetic Taste Engine

Use this reference when planning or implementing Framepack's next creative layer after the v0.10.x production-safety work.

## Core lesson

Aesthetic benchmark/rubric alone is too smooth and too safe. It can produce standard "good taste" but not necessarily personality, energy, or surprise.

Do not frame v0.11 as just:

```text
Benchmark Catalog → Rubric → Score
```

That makes Framepack an aesthetic school inspector.

Frame v0.11 as:

```text
Reference DNA → Visual Physics → Kinetic Grammar → Director Taste Moves → Controlled Surprise
```

That makes Framepack a director's small cerebellum: balance, rhythm, motion instinct, and controlled risk.

## Product thesis

Benchmark is fuel, not the steering wheel.

The steering wheel is:

- Visual Physics — the internal laws of the film world
- Kinetic Grammar — how motion causes, echoes, transforms, and hands off energy
- Director Taste Moves — reusable expressive techniques, not templates
- Controlled Surprise — 1-2 intentional departures that create memory

## Why this matters

A video can be structurally correct, lint-clean, manifest-complete, and still feel like a showroom sample.

Animation is not a poster. Its native material is change:

- elements enter and leave
- energy rises and releases
- shapes transform
- transitions carry meaning
- mockups and components perform
- motifs mutate across scenes

So taste infrastructure must model time, motion, and relationships, not only static visual quality.

## The four-layer model

### 1. Reference DNA

Do not treat references as templates or style labels. Treat them as dissected specimens.

For each specimen, capture:

- Hook DNA — what makes the first second stop the viewer?
- Energy Arc — how does energy build, breathe, punch, and settle?
- Motion DNA — what are the dominant motion laws?
- Transition DNA — how do scenes transform into each other?
- Component DNA — how are UI/mockups/products choreographed?
- Motif DNA — what visual idea recurs and mutates?
- Surprise DNA — what moment creates memory?
- Ending DNA — how does the CTA resolve the world?

### 2. Visual Physics

Every film should have internal physics.

Example:

```yaml
visual_physics:
  gravity: low
  materials: [pearl, silk, shadow, soft gold light]
  motion_law: [slow drift, orbital reveal, sudden light cut]
  transformation_rule:
    - circles become halos
    - halos become portals
    - light streaks become text underlines
  forbidden_motion:
    - generic slide-in
    - random bounce
```

Visual physics turns adjectives like "premium" or "dreamlike" into executable creative constraints.

### 3. Kinetic Grammar

Single animation verbs are not enough. The system needs motion sentence patterns:

- Cause → Reveal
- Echo → Transform
- Mask → Portal
- Tension → Release
- Scatter → Assemble
- Follow-through
- Breath → Punch → Silence

Use these to avoid isolated scene entrances and create action relay between scenes.

### 4. Director Taste Moves

Taste moves are expressive techniques, not templates.

Initial set:

- Object Worship
- Editorial Punch
- Silence Before Drop
- Motif Reincarnation
- Interface Ballet
- Data Cathedral
- Liquid Brand
- Cold Open
- Kinetic Typography Attack
- Product Reveal Ritual
- System Awakening
- Human Imperfection

### 5. Controlled Surprise

Surprise is the controlled departure that creates memory.

Initial set:

- Scale Violation
- Tempo Break
- Material Shift
- Spatial Flip
- Negative Space Shock
- Misdirection
- Motif Mutation
- Abrupt Stillness
- Imperfect Human Touch
- Impossible Transition

Rules:

- Use at most 1-2 surprise operators per video.
- Require intent.
- Require brand fit.
- Must be feasible for HyperFrames/GSAP.
- Must not sacrifice readability or CTA.

Surprise is chili, not the meal.

## Output implications

### frame.md

Add a compact `taste:` block:

```yaml
taste:
  reference_dna:
    - luxury_object_emergence
  visual_physics:
    gravity: low
    materials: [pearl, silk, shadow]
    motion_law: [slow drift, orbital reveal]
    transformation_rule:
      - circles become halos
      - halos become portals
    forbidden_motion:
      - generic slide-in
  energy_arc: slow_burn_to_punch
  motif: pearl_as_moon
  taste_moves:
    - object_worship
    - silence_before_drop
  surprise_operator:
    type: scale_violation
    intent: "Make the pearl feel celestial, not decorative."
```

### expanded-prompt.md

Add per-scene `Kinetic Continuity`:

```markdown
#### Kinetic Continuity
- Incoming energy: inherits the previous scene's pearl orbit.
- Action relay: orbit line becomes title underline.
- Outgoing transition seed: underline expands into a gold wipe.
- Motif state: pearl → halo → portal.
```

### Execution Manifest

Extend scene entries with optional motion semantics:

```yaml
scene_1:
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
  weapon: text-split-enter
```

Keep the existing weapon binding contract intact.

## Taste Audit principle

Taste Audit is not Quality Audit.

Quality Audit asks: is it safe, complete, structurally sane?

Taste Audit asks:

- Is there a memory hook?
- Is there action relay between scenes?
- Is the mockup/component choreographed or merely placed?
- Are transitions meaningful or generic fade stack?
- Does the motif transform?
- Is energy too even?
- Is there controlled surprise with intent?

Do not output fake total scores. Output director critique:

- strong points
- risks
- suggestions

## MVP recommendation

Do not block v0.11 on external ingestion of all references.

Start with:

- 6-8 built-in high-signal reference specimens
- 7 kinetic grammar patterns
- 12 taste moves
- 10 surprise operators
- compact frame.md taste block
- expanded-prompt Kinetic Continuity
- report-first Taste Audit CLI/script

External nexu/html-video/html-anything ingestion can come after the system shape is proven.
