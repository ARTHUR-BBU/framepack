# Package Protocol v1

Framepack project packages use `protocol: "framepack.project-package"` and `protocolVersion: 1`.

The v1 contract is centralized in `src/packaging/package-protocol.ts`. Package generation, package validation, and golden package summaries should read from that contract instead of redefining required files or compatibility files locally.

## Required Package Files

The minimal protocol surface for generated packages is:

- `PACKAGE_MANIFEST.json`
- `SCENE_PLAN.json`
- `SCENE_ASSET_MAP.json`
- `SOURCE_SCENE_MAP.json`
- `ASSET_PLAN.json`
- `ASSET_EXECUTION_PLAN.json`
- `HANDOFF.md`
- `FORGE_TASKS.md`

`validate --project-dir <package>` checks these files before deeper protocol validation.

`repair --project-dir <package>` can rebuild derived v1 files when the source JSON still exists and is valid. Its repair surface is intentionally narrow: `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, `PACKAGE_MANIFEST.json`, and the validation reports.

## Manifest Contract

`PACKAGE_MANIFEST.json` indexes:

- `entrypoints`: runtime and handoff files
- `artifacts`: source, planning, asset, execution, validation, runtime, and docs groups
- `capabilities`: source types, execution kinds, package lifecycle commands, and runtime backend
- `compatibility`: legacy files that remain available for older flows

For v1, `CAPTURE_EXECUTION_PLAN.json` remains a compatibility file. New consumers should prefer `ASSET_EXECUTION_PLAN.json`.

`PACKAGE_MANIFEST.json` is derivable from the project name, `VIDEO_BRIEF.json`, optional `SOURCE_MANIFEST.json`, `ASSET_EXECUTION_PLAN.json`, and the current validation report. Package repair may refresh manifest entrypoints, artifacts, capabilities, and compatibility fields from the centralized v1 contract.

`capabilities.packageCommands` is the machine-readable list of package-level operations an agent or tool can offer without parsing Markdown: `status`, `validate`, `repair`, `sync-assets`, `capture`, `runtime-doctor`, `preview`, and `render`.

## Asset Mapping Contract

`SCENE_ASSET_MAP.json` is the authoritative scene-to-asset lookup.

- `scenes[].recommendedAssets` and top-level `assets` are the primary v1 fields.
- `scenes[].recommendedCaptures` and top-level `captures` remain as compatibility fields for older website capture flows.
- Each execution item in `ASSET_EXECUTION_PLAN.json` must appear in top-level `assets`.
- Each top-level asset recommendation must appear on the corresponding scene entry.

`SCENE_ASSET_MAP.json` and `SOURCE_SCENE_MAP.json` are derivable from `SCENE_PLAN.json`, `ASSET_PLAN.json`, and optional `SOURCE_MANIFEST.json`. Package repair may rebuild them, preserving v1 compatibility fields such as `recommendedCaptures` and `captures`.

## Execution Contract

`ASSET_EXECUTION_PLAN.json` can include:

- `capture-screenshot`
- `compose-text-card`
- `forge-sprite-sheet`
- `forge-map-pack`
- `forge-fx-pack`
- `forge-prop-pack`
- `forge-character-pack`

Execution statuses are `pending`, `available`, `failed`, `skipped`, and `external`. Items marked `available` or `external` must point to existing package-relative outputs.

## Validation And Golden Checks

- `framepack status --project-dir <package>` prints package protocol health, asset execution state, forge task progress, runtime availability, readiness, and recommended next actions without writing package files. `--json` emits the same status summary as structured data for agents, UIs, and automation. Structured consumers should inspect `readiness` first, then use `nextActionItems` with stable `id`, `category`, `command`, and `reason`; `nextActions` remains a text compatibility field.
- `readiness` values are `blocked`, `needs-assets`, `needs-runtime`, and `ready`. They are designed as the first dispatch decision for agents before interpreting detailed action items.
- Status dispatch is intentionally stable:

  | readiness | Typical action ids | Preview/render |
  | --- | --- | --- |
  | `blocked` | `repair-protocol`, `validate-protocol`, `inspect-failed-assets`, `inspect-failed-forge-assets` | No |
  | `needs-assets` | `sync-assets`, `produce-forge-assets` | No |
  | `needs-runtime` | `runtime-doctor` | No |
  | `ready` | `preview` | Yes |

- `framepack validate --project-dir <package>` validates the package protocol and writes `VALIDATION_REPORT.json` / `VALIDATION_REPORT.md`.
- `framepack repair --project-dir <package>` repairs derivable v1 drift by rebuilding `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, and `PACKAGE_MANIFEST.json`, then writing validation reports. It does not generate assets, execute forge tasks, or migrate packages to a newer protocol.
- `framepack runtime doctor --project-dir <package>` checks runtime availability and package protocol health without writing validation reports.
- `npm test` includes golden package protocol summaries for markdown, thread, and game-ad routes.

## Future Versions

Protocol v2 should be introduced by adding a new explicit contract instead of mutating v1 in place. Migration or repair commands should preserve v1 compatibility fields unless the package manifest declares a newer protocol version.
