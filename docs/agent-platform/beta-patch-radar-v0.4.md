# Framepack 0.4 Beta Patch Radar

Radar ID: `BETA-PATCH-RADAR-13`

Date: 2026-05-24

Purpose: complete the post-cutoff beta radar phase by testing the published `framepack@beta` package in clean projects, classifying observed issues, and defining what will trigger `0.4.0-beta.2`.

## Scope

This phase is deliberately narrow.

It does:

- test the already published `framepack@0.4.0-beta.1`
- use empty consumer projects instead of the source checkout
- verify installation, first-run commands, onboarding files, MCP discovery, package generation, validation, status, runtime doctor, and game-ad forge task clarity
- classify issues into a beta patch queue
- define when `0.4.0-beta.2` should happen

It does not:

- add new architecture layers
- expand the MCP surface
- change package protocol v1
- install external asset forge skills
- claim visual-ready output without assets and visual QA evidence
- republish npm

## Published Package Baseline

Checked with:

```bash
npm view framepack dist-tags version --json
```

Observed:

```json
{
  "dist-tags": {
    "latest": "0.4.0-alpha.1",
    "alpha": "0.4.0-alpha.4",
    "beta": "0.4.0-beta.1"
  },
  "version": "0.4.0-alpha.1"
}
```

Interpretation:

- `framepack@beta` correctly resolves to `0.4.0-beta.1`.
- `latest` is intentionally still `0.4.0-alpha.1`.
- Users should install beta explicitly with `npm install framepack@beta`.

## Trial A: Clean Markdown Project

Trial goal: simulate a new user asking Codex or Claude Code to install Framepack beta, initialize the workflow, generate a simple explainer package, and inspect readiness.

Commands exercised:

```bash
npm init -y
npm install framepack@beta --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
npx framepack init-agent --target codex --scope project
npx framepack init-agent --target claude-code --scope project
npx framepack packs recommend --source-type markdown --output-type case-explainer --goal "Explain the course" --audience "Founders" --format 16:9 --json
npx framepack atlas recommend --workflow-pack product-explainer --creative-direction-pack clean-saas-explainer --output-type case-explainer --format 16:9 --json
npx framepack generate --input case.md --output-dir out --goal "Explain the course" --audience "Founders" --project-name beta-radar-markdown --auto-pack
npx framepack validate --project-dir out/beta-radar-markdown
npx framepack status --project-dir out/beta-radar-markdown --json
npx framepack runtime doctor --project-dir out/beta-radar-markdown
```

Observed result:

```json
{
  "version": "0.4.0-beta.1",
  "helpHasGenerate": true,
  "mcpHasGenerateProject": true,
  "codexSkill": true,
  "claudeMd": true,
  "mcpJson": true,
  "packsHasProductExplainer": true,
  "atlasHasWebMotion": true,
  "validatePassed": true,
  "statusReady": true,
  "doctorAvailable": true,
  "packageExists": true
}
```

Classification:

- P0: none
- P1: none
- P2: none observed in this path
- P3: npm printed a dependency deprecation warning for `node-domexception`; no Framepack patch is required unless users report confusion or install failure.

## Trial B: Clean Game-Ad Forge Project

Trial goal: verify that the beta game-ad path creates backend-neutral forge tasks, recommends `agent-sprite-forge`, gives skill instructions, and correctly stops at `needs-assets` instead of claiming finished assets.

Commands exercised:

```bash
npm init -y
npm install framepack@beta --no-audit --no-fund
npx framepack init-agent --target codex --scope project
npx framepack generate --game-ad-description "A founder course that teaches teams to ship agent-native video production systems with Framepack and HyperFrames." --output-dir out --goal "Promote the course" --audience "Founders" --project-name beta-radar-game-ad --format 9:16 --auto-pack
npx framepack validate --project-dir out/beta-radar-game-ad
npx framepack status --project-dir out/beta-radar-game-ad --json
```

Observed result:

```json
{
  "validatePassed": true,
  "statusNeedsAssets": true,
  "executionKinds": [
    "forge-character-pack",
    "forge-map-pack",
    "forge-fx-pack"
  ],
  "recommendsAgentSpriteForge": true,
  "handoffMentionsGenerate2dSprite": true,
  "handoffMentionsGenerate2dMap": true,
  "forgeTasksHasManualFallback": true
}
```

Important note:

The game-ad route currently uses `forge-character-pack` for the hero character, not `forge-sprite-sheet`. That is valid because the protocol supports both. Future tests and agent reports should not require `forge-sprite-sheet` for every sprite-style project.

Classification:

- P0: none
- P1: none
- P2: none observed in this path
- P3: none observed in this path

## Beta Patch Queue

Current queue after this radar:

| Priority | Area | Issue | Patch Decision |
| --- | --- | --- | --- |
| P0 | none | No install, CLI, MCP, generate, validate, or status blocker observed. | No `beta.2` trigger. |
| P1 | none | No advertised beta workflow blocker observed. | No `beta.2` trigger. |
| P2 | none | No reproducible workflow friction observed in the two clean trials. | Keep collecting real-user reports. |
| P3 | npm warning | `node-domexception` deprecation warning appears during install. | Track only; do not patch unless it creates user confusion or install failure. |

## `0.4.0-beta.2` Trigger Rules

Publish `0.4.0-beta.2` when one of these happens:

- P0: `npm install framepack@beta`, `npx framepack --version`, `npx framepack --help`, `mcp --describe`, `generate`, `validate`, or `status` fails in a clean project.
- P1: Codex or Claude Code onboarding files are generated incorrectly or lead agents into a dead end.
- P1: `readiness` or `nextActionItems` gives false confidence, especially for missing assets or missing runtime.
- P1: game-ad forge tasks stop being backend-neutral or imply `agent-sprite-forge` is installed automatically.
- P1: HyperFrames runtime doctor, lint, inspect, or snapshot integration breaks against the supported runtime line.
- P2 batch: multiple real users report the same confusing command, missing explanation, or handoff gap.

Do not publish `0.4.0-beta.2` for:

- speculative architecture improvements
- new model/provider integrations
- new asset forge automation
- community registry ideas
- wording polish with no user friction evidence

## User Test Project Entry

For the user's own test project, start with this natural-language request to Codex or Claude Code:

```text
Install Framepack beta in this project. Initialize the agent workflow for your platform, verify version/help/MCP, recommend packs, generate a small project package from my source, validate it, inspect status, run runtime doctor, and report readiness, nextActionItems, missing assets, runtime gaps, and any confusing step. Do not claim visual-ready output unless runtime inspect or snapshots provide evidence.
```

Minimum commands the agent should run:

```bash
npm install framepack@beta --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
npx framepack init-agent --target codex --scope project
npx framepack packs recommend --json
npx framepack generate --input <your-source.md> --output-dir out --goal "<goal>" --audience "<audience>" --project-name <project-name> --auto-pack
npx framepack validate --project-dir out/<project-name>
npx framepack status --project-dir out/<project-name> --json
npx framepack runtime doctor --project-dir out/<project-name>
```

For game-ad tests, use:

```bash
npx framepack generate --game-ad-description "<your product/course/brand description>" --output-dir out --goal "<goal>" --audience "<audience>" --project-name <project-name> --format 9:16 --auto-pack
```

If the package reports `needs-assets`, that is expected for forge workflows until the user, agent, or external backend produces the declared assets and metadata.

## Phase Decision

`BETA-PATCH-RADAR-13` is complete as an initial radar phase.

Decision:

- Do not publish `0.4.0-beta.2` yet.
- Start real user testing from the current `framepack@beta`.
- Convert only evidence-backed P0/P1 issues or repeated P2 friction into the next patch.
- Keep broader architecture work separate from beta patch work.

## Plain-Language Summary

We tested the published beta like a new user would: install it in empty projects, ask it to generate packages, validate them, and inspect what is missing. The normal explainer path worked. The game-ad forge path also worked and correctly said assets are still needed instead of pretending the video is finished. So the next move is not another code sprint. The next move is real user testing. If those tests expose blockers or repeated confusion, that becomes `0.4.0-beta.2`.
