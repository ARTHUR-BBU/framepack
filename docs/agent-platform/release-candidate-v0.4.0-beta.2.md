# Framepack v0.4.0-beta.2 Release Candidate

Framepack `v0.4.0-beta.2` is the Creative Harness beta candidate.

It keeps the 0.4 agent-platform shape from `v0.4.0-beta.1`, then upgrades the center of the pipeline from "valid package generation" to "directed video project generation".

## What Changed Since v0.4.0-beta.1

- Added the beta.2 Creative Harness foundation:
  - `CREATIVE_BRIEF.json`
  - `NARRATIVE_ARC.json`
  - `VISUAL_DIRECTION.json`
  - `MOTION_PLAN.json`
  - `COMPOSITION_PROPOSAL.json`
  - `QUALITY_REPORT.json`
- Added a `CompositionProposal` layer so creative planning drives HyperFrames scene emission instead of living only as side documents.
- Upgraded generated `index.html` scenes with proposal ids, treatment ids, role metadata, motion intent, layout notes, visual hierarchy, visible text, and fallback visual cards.
- Fixed Markdown-like thread parsing so section headings are merged with their following body instead of becoming fake standalone posts.
- Improved script and storyboard generation so package handoff reads more like a directed video draft.
- Improved `repair` recovery for malformed `ASSET_EXECUTION_PLAN.json`.
- Fixed Windows HyperFrames `.cmd` discovery and execution when project paths contain spaces.
- Promoted package version to `0.4.0-beta.2`; keep npm `latest` untouched and publish this candidate to the `beta` dist-tag.

## Manual Test Focus

Run fresh beta tests against `framepack@beta` after publishing.

Prioritize these routes:

- Route 1: thread-to-video from real Markdown-like input.
- Route 2: website-to-video from a product or course page.
- Route 3: game-ad sprite-video with `--auto-pack`.

For each package, inspect:

- `COMPOSITION_PROPOSAL.json`
- `QUALITY_REPORT.json`
- `SCRIPT.md`
- `STORYBOARD.md`
- `index.html`
- `PACKAGE_MANIFEST.json`
- `HANDOFF.md`

The subjective bar is higher than beta.1:

> A user should be able to read the script and storyboard, open the generated HTML, and imagine the video direction before any external asset forge or final render work begins.

## Release Gate

Before publishing:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run --json
npm run release:scenarios
npm publish --access public --tag beta --dry-run
```

After publishing:

```bash
npm view framepack dist-tags versions --json
npx -y -p framepack@beta framepack --version
npx -y -p framepack@beta framepack --help
npm exec --yes --package=framepack@beta -- framepack mcp --describe
```

## Plain-Language Summary

Beta.1 proved that Framepack could package and expose an agent-native video workflow. Beta.2 makes the generated package feel more like a real creative handoff. Framepack now writes not only the plan, but also the creative brief, narrative arc, visual direction, motion plan, composition proposal, and quality report that tell an agent and HyperFrames how the video should feel, move, and be checked.
