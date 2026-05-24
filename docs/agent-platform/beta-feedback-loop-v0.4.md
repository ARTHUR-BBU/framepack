# Framepack 0.4 Beta Feedback Loop

Loop ID: `BETA-FEEDBACK-11`

Date: 2026-05-24

Purpose: turn the published beta into a repeatable feedback system for real users, Codex, Claude Code, and maintainers.

## Feedback Goal

The first beta is not only a package release. It is a way to learn where agent-native video production breaks down in real projects.

The feedback loop should collect evidence about:

- installation and first-run friction
- MCP discovery and tool availability
- workflow pack and creative direction pack fit
- generated package clarity
- `readiness` and `nextActionItems` usefulness
- HyperFrames runtime availability
- visual QA evidence collection
- asset forge task clarity
- agent handoff quality

## Standard Beta Trial Script

Ask Codex or Claude Code:

```text
Install Framepack beta in this project. Verify version/help/MCP, initialize the agent workflow, recommend packs, generate a small video project package from a short markdown source, validate it, inspect status, run runtime doctor, and report readiness, nextActionItems, missing assets, runtime gaps, and any confusing step.
```

Expected agent commands:

```bash
npm install framepack@beta --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
npx framepack init-agent --target codex --scope project
npx framepack init-agent --target claude-code --scope project
npx framepack packs recommend --source-type markdown --output-type case-explainer --goal "Explain the product" --audience "Founders" --format 16:9 --json
npx framepack atlas recommend --workflow-pack product-explainer --creative-direction-pack clean-saas-explainer --output-type case-explainer --format 16:9 --json
npx framepack generate --input case.md --output-dir out --goal "Explain the product" --audience "Founders" --project-name beta-feedback-case --auto-pack
npx framepack validate --project-dir out/beta-feedback-case
npx framepack status --project-dir out/beta-feedback-case --json
npx framepack runtime doctor --project-dir out/beta-feedback-case
```

Optional visual evidence when HyperFrames is available:

```bash
npx framepack runtime inspect --project-dir out/beta-feedback-case --json --samples 3
npx framepack runtime snapshot --project-dir out/beta-feedback-case --frames 3
```

## Feedback Report Template

Use the GitHub issue template at `.github/ISSUE_TEMPLATE/beta-feedback.md`, or use this same structure for discussion posts and agent handoff notes:

```markdown
## Environment

- Framepack version:
- Install method: npm beta / local tarball / source checkout
- Agent platform: Codex / Claude Code / other
- OS:
- Node version:
- HyperFrames version:

## Source And Goal

- Source type: markdown / thread / website / game-ad description / other
- Goal:
- Audience:
- Format:

## Commands Run

Paste the exact commands or agent summary.

## Observed Result

- Did install pass?
- Did MCP describe pass?
- Did package generation pass?
- Did validation pass?
- `readiness`:
- `nextActionItems`:
- Runtime doctor result:
- Visual inspect or snapshot result:

## Friction

- What confused the user?
- What confused the agent?
- Which command or package file was hardest to interpret?
- Was any next action missing or misleading?

## Evidence

Attach or paste:

- terminal output
- `PACKAGE_MANIFEST.json`
- `HANDOFF.md`
- `VIDEO_BRIEF.json`
- `ASSET_EXECUTION_PLAN.json`
- `CAPABILITY_GRAPH.json`
- `RUNTIME_MANIFEST.json`
- `VALIDATION_REPORT.md`
- runtime inspect JSON or snapshot manifest when available

## Severity

- P0: blocks installation, package generation, validation, or published CLI use
- P1: blocks an advertised beta workflow or creates false readiness
- P2: confusing, incomplete, or brittle but has a workaround
- P3: documentation, polish, or enhancement request
```

## Maintainer Triage

Use these buckets:

- `installation`: npm, Node, PATH, package tarball, first-run command friction
- `agent-onboarding`: Codex/Claude files, MCP setup, natural-language install flow
- `mcp-surface`: missing or confusing tools, resources, prompts, or schemas
- `workflow-pack`: route selection, pack recommendation, acceptance criteria
- `package-protocol`: missing files, stale derived artifacts, validation or repair behavior
- `runtime`: HyperFrames doctor, lint, inspect, snapshot, preview, render
- `visual-qa`: text overflow, layout, screenshots, inspect reports, snapshot evidence
- `asset-forge`: forge task clarity, `agent-sprite-forge` skill guidance, manual asset path
- `docs`: README, AGENTS, handoff, install docs, release notes

## Patch Policy

For beta patches:

- P0 fixes can justify an immediate `0.4.0-beta.x` patch.
- P1 fixes should batch only when they touch the same surface; do not wait for unrelated polish.
- P2 fixes should be grouped by workflow surface.
- P3 fixes should not block P0/P1 patches.

Every beta patch should include:

- a new changelog entry
- focused regression coverage
- `npm run typecheck`
- `npm test`
- `npm run release:gate` when packaging, runtime, MCP, or install behavior changes
- a short real trial note if the fix affects user onboarding or package generation

## What Agents Must Report

Agents should not end a beta trial with "it worked" only. They must report:

- exact Framepack version
- install path used
- MCP discovery result
- selected workflow pack and creative direction pack
- generated package path
- validation result
- `readiness`
- `nextActionItems`
- missing assets
- runtime availability
- visual evidence status
- unresolved confusion or manual step

## Plain-Language Summary

Now that Framepack has a beta package, the next job is learning from real use. This document tells users and agents exactly how to try the beta, what evidence to collect, how to report problems, and how maintainers should decide whether something needs an urgent beta patch or can wait. In simple terms: beta feedback should be reproducible, not just conversational.
