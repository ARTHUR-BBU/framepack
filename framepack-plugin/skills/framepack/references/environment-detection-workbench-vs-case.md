# Framepack environment detection — root workbench vs case project

Use this when the user asks to "check the current Framepack environment" or similar.

## Why this matters

A Framepack workbench root and a real case project are different animals:

- Workbench root may only contain orchestration files (`AGENTS.md`, `.hermes/CONTEXT.md`, `cases/`, `reports/`)
- Real Framepack/HyperFrames assets usually live in a case subdirectory
- Reporting root as "missing `.framepack`" is misleading if the active case is healthy

## Recommended sequence

1. Read the workbench handoff/context first.
   - Confirm whether you are at the root workbench or inside a case project.
2. Check Hermes + plugin state.
   - Hermes version
   - `hermes status`
   - `hermes plugins list`
   - `hermes tools list` if tool availability matters
3. Check runtime versions.
   - Node / npm / npx
   - `npx hyperframes --version`
   - Python / uv if relevant to the plugin scripts
4. Find the actual case directories before judging health.
   - Search for `frame.md`, `.hyperframes/expanded-prompt.md`, `.framepack/arsenal.json`, `index.html`, `package.json`
   - Treat the root as a workbench if those files only appear under `cases/<name>/`
5. Run Framepack doctor twice when useful:
   - once on the workbench root
   - once on the active case directory
   This separates "workbench layout is normal" from "case project is healthy/broken".
6. Check HyperFrames version drift.
   - Compare `npx hyperframes --version` with the version pinned in the case `package.json`
   - If they differ, call it out explicitly as a workflow risk: ad-hoc `npx hyperframes ...` may run a different version than `npm run check/render`
7. If Framepack doctor returns guarded mode with `run_blank_smoke`, actually run the blank smoke.
   - Prefer the exact discovered version, e.g. `npx --yes hyperframes@0.6.103 init --example blank ...`
   - Do not stop at the recommendation; execute it and report the real result
8. Verify the active case itself.
   - `npm run check`
   - Framepack quality audit if available
   - Confirm presence of render output if the user cares about production readiness

## Key interpretation rules

- Missing `.framepack/` at the workbench root is not a bug by itself.
- A case can be healthy even when the root is only a staging workbench.
- "Guarded" is not "blocked". It means: do the smoke test before trusting handoff.
- The most important actionable risk is often version drift between:
  - package-pinned HyperFrames scripts
  - default `npx hyperframes` resolution

## Suggested reporting format

Summarize in four layers:

1. Workbench status
2. Hermes/Framepack plugin status
3. HyperFrames compatibility status
4. Active case health + concrete risks

This keeps the answer operational instead of mixing root-layout facts with case-runtime facts.