# Framepack v0.4.0-beta.1 Real User Trial

Trial ID: `BETA-CANDIDATE-10`

Date: 2026-05-24

Purpose: verify that the published npm beta package can be installed in a clean project and used by an agent-style workflow without relying on the source checkout.

## Published Package State

Registry check after publish:

```json
{
  "dist-tags": {
    "latest": "0.4.0-alpha.1",
    "alpha": "0.4.0-alpha.4",
    "beta": "0.4.0-beta.1"
  },
  "versions": [
    "0.4.0-alpha.1",
    "0.4.0-alpha.2",
    "0.4.0-alpha.3",
    "0.4.0-alpha.4",
    "0.4.0-beta.1"
  ]
}
```

Framepack `latest` intentionally remained unchanged. The beta is exposed through `framepack@beta`.

## Published Beta Clean Install Trial

Clean project:

```text
C:\Users\LENOVO\AppData\Local\Temp\framepack-beta-published-trial-8bddd19b55e44860917a8d9dda032b08
```

Commands exercised:

```bash
npm install framepack@beta --no-audit --no-fund
npx framepack --version
npx framepack --help
npx framepack mcp --describe
npx framepack init-agent --target codex --scope project
npx framepack init-agent --target claude-code --scope project
npx framepack packs recommend --source-type markdown --output-type case-explainer --goal "Explain Framepack beta" --audience "Founders" --format 16:9 --json
npx framepack atlas recommend --workflow-pack product-explainer --creative-direction-pack clean-saas-explainer --output-type case-explainer --format 16:9 --json
npx framepack generate --input case.md --output-dir out --goal "Explain Framepack beta" --audience "Founders" --project-name beta-published-case --auto-pack
npx framepack validate --project-dir out/beta-published-case
npx framepack status --project-dir out/beta-published-case --json
npx framepack runtime doctor --project-dir out/beta-published-case
```

Observed evidence:

```json
{
  "trial": "BETA-CANDIDATE-10-published-beta",
  "installedFramepack": "0.4.0-beta.1",
  "installedHyperFrames": "0.6.40",
  "version": "0.4.0-beta.1",
  "helpHasBetaCommand": true,
  "mcpHasGenerateProject": true,
  "codexSkillExists": true,
  "claudeFileExists": true,
  "claudeMcpConfigExists": true,
  "recommendedWorkflow": "product-explainer",
  "recommendedCreativeDirection": "clean-saas-explainer",
  "atlasStack": "web-motion-explainer-stack",
  "validatePassed": true,
  "readiness": "ready",
  "protocolStatus": "passed",
  "nextActionItems": ["preview"],
  "runtimeDoctorHas0640": true
}
```

## Local Candidate Tarball Trial

Before publishing, the local candidate tarball was also installed in a clean project:

```text
C:\Users\LENOVO\AppData\Local\Temp\framepack-beta-candidate-trial-fc6d79445b2b493ba63411e013c92de7
```

Observed key evidence:

- installed version: `0.4.0-beta.1`
- help included `framepack@beta`
- MCP included `generateProject`
- Codex workflow file existed
- Claude Code workflow files existed
- pack recommendation returned `product-explainer`
- Atlas recommendation returned `web-motion-explainer-stack`
- validation passed
- status readiness was `ready`
- next action item was `preview`
- runtime doctor detected HyperFrames `0.6.40`

## Npm Cache Note

Three parallel `npx -p framepack@beta ...` probes timed out on Windows after publish. The registry state was already correct, and a clean installed-project trial passed. For this workflow, prefer installed project checks or sequential `npx -p` checks with isolated npm caches instead of running multiple fresh `npx -p` commands in parallel.

## Decision

The published npm beta package passed the fresh real user trial. This closes the last beta blocker recorded in `beta-readiness-v0.4.md`.

## Plain-Language Summary

This trial checked the real thing users will install: `framepack@beta`. It installed Framepack into a brand-new folder, verified the CLI and MCP surface, created Codex and Claude Code workflow files, asked Framepack to recommend packs, generated a video project package, validated it, checked status, and confirmed HyperFrames `0.6.40` was available. In simple terms: the beta package works from npm, not just from our source code.
