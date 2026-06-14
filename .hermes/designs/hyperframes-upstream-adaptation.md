# HyperFrames Upstream Adaptation Strategy

Date: 2026-06-13
Status: proposal / design-first

## Why this exists

Framepack is downstream of HyperFrames. HyperFrames is moving quickly: npm latest is 0.6.97, published 2026-06-13, with frequent 0.6.x releases. Framepack must not hardcode one snapshot of HyperFrames assumptions and then silently rot.

The relationship should be:

- HyperFrames = runtime / studio / render engine / official composition contract
- Framepack = creative director / prompt factory / handoff producer / arsenal lifecycle manager
- Compatibility layer = thin, explicit, testable adapter between the two

## Current upstream snapshot

Observed via npm registry and `npx --yes hyperframes@0.6.97 --help`:

- Package: `hyperframes`
- Latest: `0.6.97`
- Dist-tags: `latest=0.6.97`, `alpha=0.6.0-alpha.14`
- Repository: `https://github.com/heygen-com/hyperframes`, package directory `packages/cli`
- Node requirement: `>=22`
- Related packages at same version:
  - `@hyperframes/core@0.6.97`
  - `@hyperframes/shader-transitions@0.6.97`

Important CLI surface in 0.6.97:

- Existing/core: `init`, `preview`, `render`, `lint`, `inspect`, `snapshot`, `info`, `compositions`, `docs`, `benchmark`, `doctor`, `browser`, `upgrade`
- Registry/content: `add`, `catalog`, `capture`
- Publishing/cloud: `publish`, `cloud`, `lambda`, `cloudrun`
- Media: `transcribe`, `tts`, `remove-background`
- Account/settings: `auth`, `feedback`, `telemetry`, `skills`

Important render additions / knobs:

- `--resolution` presets: landscape, portrait, 4k, square variants
- `--batch`, `--batch-concurrency`, `--batch-fail-fast`
- `--browser-gpu` / `--no-browser-gpu`
- `--page-side-compositing` / `--no-page-side-compositing`
- `--browser-timeout`, `--protocol-timeout`, `--player-ready-timeout`
- `--low-memory-mode`
- `--variables`, `--variables-file`, `--strict-variables`

Important upstream registry behavior:

- `catalog --json` currently returned `[]` in this environment.
- `init --example blank --non-interactive --skip-skills` works offline.
- `init --example product-promo` failed: registry unreachable or empty.
- `init --example video-edit` showed a long registry list, including many components/transitions/code snippets, but the requested item was unavailable.
- `warm-grain` / `kinetic-type` timed out in this environment.

Conclusion: Framepack must treat official registry/catalog as opportunistic, not guaranteed. `blank` is the only safe offline baseline observed.

## Problem discovered during this research

Framepack pre_tool_call hook was too broad:

- It treated `npx hyperframes info` / `doctor` / `upgrade` etc. as production handoff commands and injected missing `frame.md` warnings.
- It also treated `npm view hyperframes dist-tags` as a HyperFrames command because `hyperframes` appeared as an argument.

Fix implemented separately with regression tests:

- Discovery commands skip handoff hydration/audit/warnings.
- Shell command detection only matches `hyperframes` in command position, not ordinary arguments.
- Source tests passed: `114 passed in 1.69s`.

## Compatibility philosophy

Use the “port adapter” pattern:

Framepack core should not depend on raw HyperFrames CLI details directly. It should ask a local compatibility module questions such as:

- What HyperFrames version is active?
- Which commands exist?
- Which commands require Framepack handoff files?
- Which commands are discovery/tooling/cloud/account commands and should not warn about `frame.md`?
- Which examples are safe offline?
- Which render flags are supported?
- Which official registry items are available right now?
- Which official docs/skills changed relative to our patched local skills?

## Proposed architecture

### 1. Add `core/hyperframes_capabilities.py`

Responsibilities:

- Query HyperFrames version without requiring a composition:
  - preferred: `npx --yes hyperframes@latest --version`
  - fallback: npm registry JSON
- Parse `hyperframes --help` into command groups.
- Parse selected `<command> --help` outputs into flags.
- Return a normalized capability dict.

Suggested shape:

```json
{
  "package": "hyperframes",
  "version": "0.6.97",
  "checked_at": "2026-06-13T...",
  "commands": {
    "render": {"group":"Getting Started", "flags":["--resolution", "--batch", "--browser-timeout"]},
    "catalog": {"group":"Getting Started", "flags":["--json", "--type", "--tag"]}
  },
  "safe_offline_examples": ["blank"],
  "registry_available": false,
  "notes": []
}
```

### 2. Add `.framepack/hyperframes-capabilities.json`

Per-project cache, not source of truth.

Lifecycle:

- Created/updated when Framepack first sees a HyperFrames command or when user asks for upstream check.
- TTL e.g. 24h.
- Can be refreshed explicitly.
- Does not block work if network fails; falls back to last known or built-in conservative baseline.

### 3. Replace hardcoded hook command lists with capability categories

Commands should be classified:

- `requires_handoff`: `lint`, `inspect`, `preview`, `render`, `snapshot`, maybe `publish/cloud render/lambda render/cloudrun render`
- `discovery`: `help`, `version`, `info`, `doctor`, `browser`, `upgrade`, `docs`, `compositions`, `benchmark`, `skills`, `telemetry`, `feedback`, `auth`
- `project_scaffold`: `init`
- `registry`: `catalog`, `add`, `capture`
- `cloud_side_effect`: `publish`, `cloud`, `lambda`, `cloudrun`
- `media_preprocess`: `transcribe`, `tts`, `remove-background`

Framepack handoff warnings should apply to `requires_handoff` only.

### 4. Official skill diff monitor

HyperFrames ships official skills inside the npm package:

- `dist/skills/hyperframes/SKILL.md`
- `dist/skills/hyperframes-cli/SKILL.md`
- `dist/skills/gsap/SKILL.md`

Our local skills may intentionally contain downstream patches from real bugs. Therefore:

- Never blindly overwrite local skills.
- Maintain `upstream_sha`, `local_sha`, `local_patches` metadata.
- Produce a diff report:
  - upstream added commands/rules
  - local-only hardening rules
  - conflicts needing human review

Current observed state:

- `gsap` local == official 0.6.97.
- `hyperframes` local != official because local contains Framepack/template mining and pitfall hardening.
- `hyperframes-cli` local != official because local contains Windows preview orphan and snapshot pollution guidance.

### 5. Template / registry adapter

Do not hardcode `product-promo` as mandatory official baseline.

New rule:

- Preferred baseline: run `npx hyperframes init --example blank --non-interactive --skip-skills` because `blank` is confirmed offline-safe.
- Optional richer examples/components: query `catalog --json` or attempt `init --example <name>` with timeout.
- If registry fails/timeouts/empty: detect local proxy/VPN settings and retry once with that proxy environment.
- If proxy retry also fails/timeouts/empty: degrade gracefully to `blank` + local Framepack arsenal.

China/VPN handling:

- Probe environment variables: `HTTPS_PROXY`, `HTTP_PROXY`, `ALL_PROXY` and lowercase variants.
- Probe developer tool config: `npm config get https-proxy`, `npm config get proxy`, `git config --global --get http.proxy`, `git config --global --get https.proxy`.
- Probe Windows user proxy when available: `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings\\ProxyServer`.
- Retry registry with `HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` populated.
- Store only redacted proxy display URLs in reports; never write proxy credentials to `.framepack` reports.

### 6. Render flag feature gates

Framepack/HyperFrames skills should not assume every CLI supports every flag.

Before recommending advanced flags:

- Check active version / command help.
- Gate features:
  - `--resolution`: available in 0.6.97 render/init.
  - `--page-side-compositing`: available in 0.6.97 render.
  - `--batch`: available in 0.6.97 render.
  - cloud/lambda/cloudrun: available in 0.6.97, but side-effectful and auth/cloud dependent.

### 7. Scheduled upstream watcher

Optional cron job:

- Daily or weekly npm registry check for `hyperframes` latest.
- If latest changes:
  1. fetch package metadata
  2. run `--help` snapshots in temp dir
  3. diff official skills/docs against local
  4. produce human-readable report, no auto-edit

No recursive scheduling from cron. No auto-upgrade.

## Tests needed

- Hook command classification:
  - `npm view hyperframes dist-tags` does not trigger handoff warning.
  - `npx hyperframes info/doctor/upgrade/browser/docs/compositions/benchmark` does not trigger warning.
  - `npx hyperframes lint/render/preview/snapshot/inspect` does warn when handoff files missing.
- Capability parser:
  - parses 0.6.97 help output fixtures.
  - unknown command defaults conservative.
- Registry fallback:
  - empty catalog returns `registry_available=false` and does not fail.
  - timeout falls back to blank/local arsenal.
- Skill diff monitor:
  - detects local-only patches without marking them as drift errors.

## Open decisions

1. Should Framepack pin a known-good HyperFrames minor version for production tests, while also monitoring latest?
2. Should `hyperframes upgrade --check --json` be the preferred watcher input once stable, or should npm registry remain the source of truth?
3. Should official registry items be imported into `.framepack/arsenal.json`, or kept as separate upstream catalog entries until actually used?
4. Should cloud/lambda/cloudrun commands trigger stronger confirmation because they have external side effects?

## Recommended next step

Implement the compatibility adapter in small TDD slices:

1. Command classifier extracted from hook.
2. Capability snapshot command.
3. Registry fallback + blank baseline policy.
4. Skill diff report.
5. Optional cron watcher.
