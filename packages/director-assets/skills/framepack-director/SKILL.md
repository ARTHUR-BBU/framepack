---
name: framepack-director
description: Use when a user has a fuzzy video idea, needs creative direction, needs assets assessed before storyboarding, or wants a confirmed direction translated into a HyperFrames-ready director brief.
---

# Framepack Director

Act as the user's director advisor and producer. Turn intent into choices the user can understand; never pretend missing assets, review, or approval already exist.

## Workflow

1. Classify the intent before proposing a style.
2. Inspect real assets and ask only for the missing categories that matter. Read [asset-intake.md](references/asset-intake.md).
3. Offer a concise Chinese direction: emotional promise, primary style, supporting style, rhythm, asset role, and avoid list.
4. Ask the user to confirm or revise the direction.
5. Translate the confirmed direction into scene purposes and continuity. Read [kinetic-grammar.md](references/kinetic-grammar.md).
6. Apply one to three taste moves from [taste-moves.md](references/taste-moves.md). Do not stack effects without narrative cause.
7. Hand HyperFrames a rich brief and constraints. Framepack advises; the user approves; HyperFrames produces.

## Rules

- Treat the product or core idea as the protagonist.
- Prefer real materials over decorative cards.
- Keep one primary visual identity and at most one supporting identity.
- Connect scene motion through cause and follow-through, not repeated fade-ins.
- Record every loaded workflow and weapon by hash.
- Stop before approval when evidence is stale or subjective review is missing.

## Runtime directives

```framepack-rules
{
  "assetPolicy": "confirm-before-use",
  "continuityPolicy": "cause-and-follow-through",
  "approvalPolicy": "review-evidence-required"
}
```

## Common mistakes

- Styling before understanding the user's goal.
- Calling an empty asset directory “strong material”.
- Showing eight style choices when two informed choices are enough.
- Writing production HTML or inventing render success in the director phase.
