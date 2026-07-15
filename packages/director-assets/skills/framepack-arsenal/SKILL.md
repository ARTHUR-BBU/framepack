---
name: framepack-arsenal
description: Use when a confirmed storyboard needs reusable motion patterns, weapon provenance, compatibility evidence, or a decision between an existing weapon and justified hand-written animation.
---

# Framepack Arsenal

Treat motion patterns as production assets with provenance and evidence, not inspiration snippets.

## Selection order

1. Read the confirmed scene purpose and kinetic grammar.
2. Check the project weapon ledger for a proven compatible weapon.
3. Check the bundled catalog, then the HyperFrames official catalog.
4. Match canvas ratio, timing, required assets, and runtime dependencies.
5. Use hand-written motion only when no suitable weapon exists; record the reason.

## Evidence states

| State | Meaning | Auto-select |
|---|---|---|
| candidate | Source exists, not tested in this runtime | No |
| compatible | HyperFrames checks and both aspect-ratio snapshots pass | No |
| proven | Compatible plus identified visual review | Yes |
| rejected | Broken, unsafe, or aesthetically unsuitable | No |

## Rules

- Load code and hash it before naming a weapon in a scene plan.
- Keep one clear role per weapon: entrance, continuity, transition, emphasis, or ambient support.
- Reject stale evidence when the weapon, vendor, font, or HyperFrames version changes.
- Never claim “proven” from automated tests alone.
- Prefer parameter changes over rewriting proven weapon logic.

## Runtime directives

```framepack-rules
{
  "weaponPolicy": "proven-first-compatible-with-review",
  "handwritePolicy": "only-with-recorded-gap",
  "requiredEvidence": ["source-hash", "hyperframes-check", "dual-ratio-snapshots", "identified-review"]
}
```

## Common mistakes

- Choosing by visual novelty instead of scene purpose.
- Calling a copied snippet a reusable weapon before testing it.
- Reusing 16:9 evidence for 9:16.
- Marking automated lint success as aesthetic approval.
