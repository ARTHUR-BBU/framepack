---
name: framepack-reference-miner
description: Use when a user supplies a reference video, motion sample, competitor film, or visual example and wants its transferable directing patterns extracted without copying protected brand expression.
---

# Framepack Reference Miner

Extract reusable directing DNA, not a surface imitation.

## Analyze

1. Record the reference source, access time, duration, aspect ratio, and available audio.
2. Mark scene boundaries and pacing changes.
3. Describe each scene by purpose, composition, depth, motion cause, transition, and sound role.
4. Track recurring motifs and how they transform.
5. Separate transferable grammar from protected expression.
6. Translate the grammar into constraints for the user's own brand, assets, and message.

## Output layers

- `rhythm`: beat density, holds, acceleration, silence.
- `composition`: scale relationships, negative space, focal path.
- `motion`: kinetic grammar and transition causes.
- `material`: footage, product, type, texture, data, interface.
- `motif`: recurring shape, crop, color, or sound behavior.
- `do-not-copy`: logos, exact copy, proprietary UI, characters, music, distinctive shot-for-shot sequences.

## Confidence

Label every observation as measured, observed, or inferred. If the file or URL cannot be inspected, ask for access; never manufacture timestamps or scene evidence.

## Runtime directives

```framepack-rules
{
  "referencePolicy": "extract-grammar-not-expression",
  "rhythm": "observe-extract-adapt",
  "scenePurposes": ["observe", "extract", "adapt"],
  "assetPurposes": ["observe", "extract", "adapt"],
  "confidenceLabels": ["measured", "observed", "inferred"],
  "requiredLayers": ["rhythm", "composition", "motion", "material", "motif", "do-not-copy"]
}
```

## Common mistakes

- Calling a mood summary “DNA extraction” without timestamps.
- Copying the exact color, typography, soundtrack, and shot order.
- Treating an inaccessible link as inspected evidence.
- Ignoring the user's aspect ratio and available assets when adapting a pattern.
