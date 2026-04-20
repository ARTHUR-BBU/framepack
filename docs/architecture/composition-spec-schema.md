# CompositionSpec Schema

`CompositionSpec` is the internal compile target consumed by the HyperFrames adapter.

## Fields

- `width`: Pixel width of the final composition.
- `height`: Pixel height of the final composition.
- `fps`: Render frame rate.
- `durationSec`: Full composition runtime.
- `scenes`: Render-ready scene entries.
- `theme`: Shared visual defaults.
  - `palette`: Named palette identifier such as `default`.

## CompositionScene

Each scene entry includes:

- `sceneId`: Stable scene identifier from `ScenePlan`.
- `htmlTemplate`: Markup fragment for the scene body.
- `cssClassNames`: CSS classes applied to the scene root or scene content.
- `assetRefs`: Asset references preserved for render-time resolution.

## Contract Notes

- `CompositionSpec` is narrower than `ScenePlan` and excludes review-only fields.
- The spec is still adapter-neutral; HyperFrames-specific wiring happens after this stage.
- The first version supports the dimensions and theme shape needed by the case explainer pipeline.
