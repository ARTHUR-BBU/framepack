# ScenePlan Schema

`ScenePlan` is the Studio-owned review artifact between briefing and composition compilation.

## Fields

- `totalDurationSec`: Planned runtime across all scenes.
- `scenes`: Ordered scene list.

## Scene

Each scene includes:

- `sceneId`: Stable identifier for traceability across stages.
- `purpose`: Short description of the scene's role in the narrative.
- `startTimeSec`: Zero-based start time within the full plan.
- `durationSec`: Scene runtime in seconds.
- `narration`: Spoken content for the scene.
- `onScreenText`: Text strings intended for visible labels or callouts.
- `visualType`: One of `cover`, `problem`, `solution`, `workflow`, `highlights`, or `ending`.
- `assets`: Asset references needed by the scene.
- `transition`: Transition hint to the next scene, or `null` for the terminal scene.
- `validationNotes`: Review notes, warnings, or blocked conditions.

## Contract Notes

- `ScenePlan` is ordered and time-based.
- Scene timing must remain consistent with `totalDurationSec`.
- The structure is intentionally composition-agnostic so validation can happen before HyperFrames emission.
- The final scene must set `transition` to `null` to mark the end of the plan.
- `assets` may reference captures, generated text cards, or forge-produced assets. The actual materialization task lives in `ASSET_EXECUTION_PLAN.json`.
