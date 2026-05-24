# Framepack 0.4 Beta Onboarding Trials

Trial ID: `BETA-ONBOARDING-08`

Date: 2026-05-24

Purpose: verify that Codex and Claude Code onboarding paths work in separate clean projects instead of a shared mixed workspace.

## Scope

The trial uses the published npm alpha line:

- package: `framepack@alpha`
- resolved version: `0.4.0-alpha.4`
- execution mode: installed package, invoked through `npx framepack`
- source checkout dependency: none

This trial does not claim beta readiness by itself. It removes one beta blocker: platform onboarding separation.

## Codex Clean Install Trial

Clean project:

```text
C:\Users\LENOVO\AppData\Local\Temp\framepack-codex-beta-trial-c8be5a74b24a493095dccbc63eb87f13
```

Commands exercised:

```bash
npm install framepack@alpha --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
npx framepack init-agent --target codex --scope project
npx framepack packs recommend --source-type markdown --output-type case-explainer --goal "Explain agent-native launch systems" --audience "Founders" --format 16:9 --json
npx framepack generate --input case.md --output-dir out --goal "Explain agent-native launch systems" --audience "Founders" --project-name codex-markdown-case --auto-pack
npx framepack validate --project-dir out/codex-markdown-case
npx framepack status --project-dir out/codex-markdown-case --json
```

Observed evidence:

- Version returned `0.4.0-alpha.4`.
- Help included the stable alpha first-run command.
- MCP surface included `generateProject`.
- Codex files existed:
  - `AGENTS.md`
  - `.framepack/agent/codex/SKILL.md`
  - `.framepack/agent/codex/INSTALL.md`
- `CLAUDE.md` was absent.
- Generated project existed at `out/codex-markdown-case`.
- Validation passed.
- Status readiness was `ready`.
- Next action item was `preview`.
- Recommended workflow was `product-explainer`.

## Claude Code Clean Install Trial

Clean project:

```text
C:\Users\LENOVO\AppData\Local\Temp\framepack-claude-beta-trial-18802626c33b441786b3eca4fa636fae
```

Commands exercised:

```bash
npm install framepack@alpha --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
npx framepack init-agent --target claude-code --scope project
npx framepack packs recommend --source-type thread --output-type case-explainer --goal "Explain the agent harness shift" --audience "Founders" --format 16:9 --json
npx framepack generate --thread-file thread.txt --output-dir out --goal "Explain the agent harness shift" --audience "Founders" --project-name claude-thread-case --auto-pack
npx framepack validate --project-dir out/claude-thread-case
npx framepack status --project-dir out/claude-thread-case --json
```

Observed evidence:

- Version returned `0.4.0-alpha.4`.
- Help included the stable alpha first-run command.
- MCP surface included `generateProject`.
- Claude Code files existed:
  - `CLAUDE.md`
  - `.mcp.json`
- Codex skill file was absent.
- Generated project existed at `out/claude-thread-case`.
- Validation passed.
- Status readiness was `needs-assets`.
- Next action item was `sync-assets`.
- Recommended workflow was `thread-to-video`.

## Findings

- Codex and Claude Code onboarding paths can be exercised independently.
- Each path writes only its own platform-specific workflow files.
- Both paths can generate, validate, and status-check a package after install.
- Thread packages correctly remain `needs-assets` until text cards or other assets are materialized.
- Markdown/product packages can reach `ready` when no materialization blocker remains.

## Remaining Beta Work

The remaining beta blockers are now narrower:

- Run HyperFrames compatibility review near the beta tag.
- Run a fresh real user trial against the actual beta candidate tag.
- Decide whether beta should include a packaged visual QA report artifact or only a documented visual QA policy.

## Plain-Language Summary

This trial checked Codex and Claude Code separately. Codex got its own clean folder and produced Codex-specific workflow files. Claude Code got a different clean folder and produced Claude-specific files. Both installed Framepack from npm, checked MCP, generated a project package, validated it, and reported next actions. This proves Framepack is not just working in one mixed test folder; the two agent platform entry paths are independently usable.
