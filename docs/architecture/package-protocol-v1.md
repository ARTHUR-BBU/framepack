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

`repair --project-dir <package>` can rebuild derived v1 files when the source JSON still exists and is valid. Its repair surface is intentionally narrow: `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, `PACKAGE_MANIFEST.json`, `CAPABILITY_GRAPH.json`, `RUNTIME_MANIFEST.json`, and the validation reports.

## Manifest Contract

`PACKAGE_MANIFEST.json` indexes:

- `entrypoints`: runtime and handoff files
- `artifacts`: source, planning, asset, execution, validation, runtime, and docs groups
- `capabilities`: source types, execution kinds, package lifecycle commands, and runtime backend
- `compatibility`: legacy files that remain available for older flows

For v1, `CAPTURE_EXECUTION_PLAN.json` remains a compatibility file. New consumers should prefer `ASSET_EXECUTION_PLAN.json`.

`PACKAGE_MANIFEST.json` is derivable from the project name, `VIDEO_BRIEF.json`, optional `SOURCE_MANIFEST.json`, `ASSET_EXECUTION_PLAN.json`, and the current validation report. Package repair may refresh manifest entrypoints, artifacts, capabilities, and compatibility fields from the centralized v1 contract.

`capabilities.packageCommands` is the machine-readable list of package-level operations an agent or tool can offer without parsing Markdown: `status`, `validate`, `repair`, `sync-assets`, `capture`, `runtime-doctor`, `runtime-lint`, `runtime-inspect`, `runtime-snapshot`, `runtime-upgrade-check`, `preview`, and `render`.

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

## Capability Graph Contract

`CAPABILITY_GRAPH.json` is an additive v1 execution artifact. It is derivable from `PACKAGE_MANIFEST.json`, `VIDEO_BRIEF.json`, and `ASSET_EXECUTION_PLAN.json`.

Validation checks:

- `version` is `framepack.capability-graph.v1`
- `nodes` and `edges` are arrays
- `video-runtime.hyperframes` and `mcp.framepack` nodes exist
- node `kind`, `delivery`, `status`, `required`, `provider`, and `usedBy` fields are well-formed
- edges reference existing nodes and include a non-empty reason
- forge backends in `ASSET_EXECUTION_PLAN.json` have `asset-forge.<backend>` nodes
- required skills in `ASSET_EXECUTION_PLAN.json` have `skill.<requiredSkill>` nodes

## Runtime Manifest Contract

`RUNTIME_MANIFEST.json` is an additive v1 runtime artifact. It is derivable from HyperFrames runtime detection, package runtime entrypoints, and the command specs Framepack already emits in `meta.json` / `COMMANDS.md`.

It records:

- `version: "framepack.runtime-manifest.v1"`
- `backend: "hyperframes"`
- entrypoints for `index.html`, `hyperframes.json`, `meta.json`, composition directory, and asset directory
- detected runtime capabilities
- supported command specs for preview, lint, inspect, snapshot, render, and upgrade check when available
- evidence paths for validation reports, guardrails, snapshots, and runtime inspect reports

## Validation And Golden Checks

- `framepack status --project-dir <package>` prints package protocol health, asset execution state, forge task progress, runtime availability, readiness, and recommended next actions without writing package files. `--json` emits the same status summary as structured data for agents, UIs, and automation. Structured consumers should inspect `readiness` first, then use `nextActionItems` with stable `id`, `category`, `command`, and `reason`; `nextActions` remains a text compatibility field.
- `forgeBreakdown` groups forge execution counts by `executionKind`, `forgeBackend`, and `requiredSkill`. Missing backend or skill values are grouped under `unspecified`.
- `agent-sprite-forge` may be recommended in generated handoff docs when package tasks declare `forgeBackend: "agent-sprite-forge"`, but Framepack must not install or require it. Manual production, custom forge backends, and existing assets remain valid if outputs and metadata satisfy the task contract.
- `readiness` values are `blocked`, `needs-assets`, `needs-runtime`, and `ready`. They are designed as the first dispatch decision for agents before interpreting detailed action items.
- Status dispatch is intentionally stable:

  | readiness | Typical action ids | Preview/render |
  | --- | --- | --- |
  | `blocked` | `repair-protocol`, `validate-protocol`, `inspect-failed-assets`, `inspect-failed-forge-assets` | No |
  | `needs-assets` | `sync-assets`, `produce-forge-assets` | No |
  | `needs-runtime` | `runtime-doctor` | No |
  | `ready` | `preview` | Yes |

- `framepack validate --project-dir <package>` validates the package protocol, including capability graph structure when `CAPABILITY_GRAPH.json` exists, and writes `VALIDATION_REPORT.json` / `VALIDATION_REPORT.md`.
- `framepack repair --project-dir <package>` repairs derivable v1 drift by rebuilding `SCENE_ASSET_MAP.json`, `SOURCE_SCENE_MAP.json`, `PACKAGE_MANIFEST.json`, `CAPABILITY_GRAPH.json`, and `RUNTIME_MANIFEST.json`, then writing validation reports. It does not generate assets, execute forge tasks, or migrate packages to a newer protocol.
- `framepack runtime doctor --project-dir <package>` checks runtime availability and package protocol health without writing validation reports.
- `framepack runtime lint --project-dir <package>` runs HyperFrames composition linting.
- `framepack runtime inspect --project-dir <package>` checks visual layout and text overflow across the timeline. Agents can pass HyperFrames inspect options such as `--json`, `--samples`, `--at`, `--tolerance`, `--timeout`, `--max-issues`, `--collapse-static`, `--no-collapse-static`, and `--strict`.
- `framepack runtime snapshot --project-dir <package>` captures PNG key frames for visual verification. Agents can pass `--frames`, `--at`, and `--timeout`.
- `framepack runtime upgrade-check` explicitly checks HyperFrames updates through `hyperframes upgrade --check --json`. Ordinary `status`, `validate`, and package generation do not run this network check.
- HyperFrames 0.5.5 also has `publish`, but Framepack 0.2 does not orchestrate it because it uploads externally and returns a public URL.
- `npm test` includes golden package protocol summaries for markdown, thread, and game-ad routes.

## Future Versions

Protocol v2 should be introduced by adding a new explicit contract instead of mutating v1 in place. Migration or repair commands should preserve v1 compatibility fields unless the package manifest declares a newer protocol version.
