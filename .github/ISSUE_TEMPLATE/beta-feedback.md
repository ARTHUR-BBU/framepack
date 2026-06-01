---
name: Framepack beta feedback
about: Report a Framepack install, agent workflow, workbench, build, runtime, or visual QA issue
title: "[framepack-feedback] "
labels: beta-feedback
assignees: ""
---

## Environment

- Framepack version:
- Install method: npm / local tarball / source checkout
- Agent platform: Codex / Claude Code / other
- OS:
- Node version:
- HyperFrames version:

## Source And Goal

- Idea/source:
- Assets folder:
- Goal:
- Audience:
- Format:
- Style words or reference:

## Commands Run

Paste exact commands or the agent's command summary.

Expected current path:

```bash
npx framepack create --idea "<idea>" --assets ./assets --output-dir ./out --project-name <name>
npx framepack workbench brief --project-dir ./out/<name>
npx framepack workbench audit --phase preflight --project-dir ./out/<name>
npx framepack workbench audit --phase design --project-dir ./out/<name>
npx framepack workbench audit --phase composition --project-dir ./out/<name>
npx framepack build --project-dir ./out/<name>
npx framepack preview --project-dir ./out/<name> --open
npx framepack workbench audit --phase preview --project-dir ./out/<name>
```

## Observed Result

- Did install pass?
- Did agent instructions/skills install?
- Did MCP describe pass, if used?
- Did workbench create pass?
- Did `workbench brief` explain the plan clearly?
- Did phase audits pass?
- Did build create `index.html` and `meta.json`?
- Did preview open and show visible content?
- Did render pass, if attempted?
- HyperFrames lint/inspect result, if available:
- Legacy package `readiness` / `nextActionItems`, if this was a package-protocol test:

## Friction

- What confused the user?
- What confused the agent?
- Which workbench file was hardest to interpret?
- Did the agent ignore any audit blocker?
- Was any next action missing or misleading?

## Evidence

Attach or paste relevant output and files:

- terminal output
- `HUMAN.md`
- `DIRECTION.md`
- `COMPOSITION.md`
- `ASSET_GAPS.md`
- `DESIGN.md`
- `DESIGN_TOKENS.md`
- `ITERATIONS.md`
- audit JSON output when available
- `index.html`
- `meta.json`
- preview screenshot or render sample
- runtime inspect JSON or snapshot manifest, if available

## Severity

- P0: blocks installation, workbench creation, build, preview, render, or published CLI use
- P1: blocks an advertised workflow or creates false readiness
- P2: confusing, incomplete, or brittle but has a workaround
- P3: documentation, polish, or enhancement request
