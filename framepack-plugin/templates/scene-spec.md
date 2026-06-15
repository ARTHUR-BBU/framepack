# Framepack Scene Spec

> A precise construction sheet for one HyperFrames scene. This is a production ledger, not prose decoration.

## Scene Identity

- Scene ID: `scene_01`
- Status: `draft` | `review` | `locked` | `superseded`
- Time Window: `start=0.000s`, `duration=4.000s`, `track_index=0`
- Creative Purpose: What job does this scene do in the whole video?

## Visual Contract

- frame.md colors used exactly:
  - primary:
  - accent:
  - background:
  - surface:
- Typography:
  - heading:
  - body:
- Atmosphere:

## Beat Timeline

| Time | Layer | Element | Action | Notes |
|---:|---|---|---|---|
| 0.000s | BG |  |  | entry frame |
| 0.300s | MG |  |  | hook |
| 2.800s | FG |  |  | transition prep |
| 3.950s | ALL |  |  | proof frame |

## Continuity

- First frame depends on: `previous_scene.final_frame` or `none`
- Carryover elements:
  - element:
  - expected state at first frame:
- Boundary proof points:
  - label: `scene_01_boundary_after`
    time: `0.050`
    required: true

## Weapons / Animation Contract

| Element | Weapon | Function | Parameters | Source |
|---|---|---|---|---|
|  |  |  |  | Execution Manifest |

Rules:
- If a weapon is declared, call the canonical function from arsenal/builtin catalog.
- HANDWRITE is allowed only when explicitly declared in Execution Manifest.
- Do not animate clip roots; animate inner wrappers.

## Proof Frames

| Label | Time | Required | Reason |
|---|---:|---|---|
| `scene_01_first` | 0.050 | true | first-frame continuity |
| `scene_01_final` | 3.950 | true | last-frame transition proof |

## Surgical Change Log

| Request ID | Locked Scope | Change | Allowed Files | Notes |
|---|---|---|---|---|
|  |  |  |  |  |

## Negative Checks

- No manual non-media `data-hf-id`.
- No parameter drift from Execution Manifest.
- No unregistered weapon usage.
- No unverified carryover dependency.
