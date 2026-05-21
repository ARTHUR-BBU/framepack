# Framepack v0.4.0-alpha.1 Real Scenario Test Report

This report defines the three real scenario checks required before tagging or publishing `v0.4.0-alpha.1`.

Run:

```bash
npm run release:scenarios
```

For debuggable output:

```bash
npm run release:scenarios -- --keep --output-dir out/real-scenarios-v0.4.0-alpha.1
```

## Scenario Matrix

| Scenario | Source | Route | What It Proves |
| --- | --- | --- | --- |
| `markdown-product-explainer` | `examples/case-explainer-input.md` | `generate --input ... --auto-pack` | Markdown/product input still compiles into a complete planning package. |
| `thread-editorial-video` | `examples/thread.txt` | `generate --thread-file ... --auto-pack` | Thread input still compiles into source-to-scene planning artifacts. |
| `game-ad-sprite-video` | inline game-ad description | `generate --game-ad-description ... --format 9:16 --auto-pack` | Sprite-video packages persist `capabilityStackSelection` and include forge execution tasks. |

Each scenario generates a real project package, runs `validate`, runs `status --json`, and checks that `protocolStatus` is `passed`.

## Acceptance Criteria

- `markdown-product-explainer` includes `SCENE_PLAN.json` as a planning artifact.
- `thread-editorial-video` includes `SOURCE_SCENE_MAP.json` as a planning artifact.
- `game-ad-sprite-video` persists `capabilityStackSelection.id === "game-ad-sprite-video-stack"`.
- `game-ad-sprite-video` includes `forge-character-pack`, `forge-map-pack`, and `forge-fx-pack` execution items.
- All three packages validate without installing external skills, calling hosted image/video generation, or requiring HyperFrames rendering.

## Relationship To Release Gate

`npm run release:gate` remains the final release-candidate gate. `npm run release:scenarios` is a more legible product-readiness harness: it shows that the alpha can handle three practical user routes, not only internal unit tests.

For users new to Framepack: this script is a rehearsal. It asks Framepack to create three different video project packages the way a real agent would: one from a document, one from a social thread, and one from a game-style ad brief. Then it checks whether each package is structurally healthy and ready for the next agent or HyperFrames step.
