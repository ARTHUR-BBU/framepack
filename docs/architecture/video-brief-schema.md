# VideoBrief Schema

`VideoBrief` is the normalized input contract for the first Studio video pipeline.

## Fields

- `goal`: Short statement of the video objective.
- `audience`: Primary viewer group.
- `format`: Video aspect ratio, one of `16:9` or `9:16`.
- `style`: Presentation directives.
  - `tone`: Free-form tone label such as `direct`.
  - `pacing`: One of `slow`, `medium`, or `fast`.
  - `brandName`: Brand or studio name used for voice and labeling.
- `sourceMaterials`: Ordered input sources preserved for downstream planning.
  - `kind`: `markdown` for raw narrative content or `structured` for extracted source data.
  - `title`: Human-readable source label.
  - `body`: Source content text.
- `constraints`: Review-time limits and exclusions.
  - `maxDurationSec`: Total allowed runtime.
  - `requiredPoints`: Key points that must appear in the plan or narration.
  - `bannedTerms`: Terms that must not appear in the generated output.
- `outputType`: Pipeline target. Current package generators support `case-explainer` and the lightweight `game-ad` sprite-video demo route.

## Contract Notes

- `VideoBrief` is the handoff between normalization and scene planning.
- The brief does not contain scene timing or composition details.
- Any additional source files are carried through `sourceMaterials` instead of being flattened into free text.
- Markdown, website, and thread brief normalization currently targets `case-explainer`.
- The `game-ad` route builds a specialized brief from a short description and bypasses the generic markdown/website/thread brief compiler until the pipeline registry is introduced.
