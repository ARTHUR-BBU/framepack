---
name: Framepack beta feedback
about: Report a Framepack beta install, agent workflow, package, runtime, or visual QA issue
title: "[beta-feedback] "
labels: beta-feedback
assignees: ""
---

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

Paste exact commands or the agent's command summary.

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

Attach or paste relevant output and package files:

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
