# Kinetic Taste Engine

Framepack v0.11's Kinetic Taste Engine makes Director outputs feel like a directed motion world, not just a well-structured prompt.

Core pillars:

1. Reference DNA — compact specimens that explain why a reference has energy.
2. Visual Physics — the internal rules of a film: gravity, material, motion law, transformation rule, forbidden motion.
3. Kinetic Grammar — how actions connect: Cause → Reveal, Echo → Transform, Mask → Portal, etc.
4. Director Taste Moves — reusable directing techniques such as Object Worship and Interface Ballet.
5. Controlled Surprise — 1-2 intentional deviations with stated intent.

## frame.md taste block

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
      - random bounce
  energy_arc: slow_burn_to_punch
  motif: pearl_as_moon
  taste_moves:
    - object_worship
    - silence_before_drop
  surprise_operator:
    type: scale_violation
    intent: "Make the pearl feel celestial, not decorative."
```

## expanded-prompt Kinetic Continuity block

```markdown
#### Kinetic Continuity
- Incoming energy: inherits the previous scene's pearl orbit.
- Action relay: orbit line becomes title underline.
- Outgoing transition seed: underline expands into a gold wipe.
- Motif state: pearl → halo → portal.
```

## Execution Manifest motion semantics

```yaml
scene_1:
  motion_role: hook_mystery
  grammar: tension_release
  taste_move: object_worship
  surprise: scale_violation
  weapon: text-split-enter
  code: parts/references/text-split-enter.js
```

Rules:

- Keep taste block compact.
- Use stable English IDs in files; explain in the user's language in chat.
- Surprise is recommended, not mandatory; if used, include intent.
- Use at most 1-2 surprise operators.
- Framepack still stops at frame.md + expanded-prompt.md. Do not write HTML.
