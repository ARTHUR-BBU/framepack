# Framepack 0.4 HyperFrames Compatibility Review

Review ID: `HYPERFRAMES-COMPAT-09`

Date: 2026-05-24

Purpose: verify the HyperFrames runtime path before the Framepack `0.4` beta line.

## Scope

This review checks both the Framepack-pinned runtime dependency and the current npm latest HyperFrames runtime:

- previous local dependency observed before this review: `hyperframes 0.5.5`
- npm latest observed during this review: `hyperframes 0.6.40`
- Framepack dependency after this review: `hyperframes ^0.6.40`
- package under test: `out/hyperframes-compat-09/markdown-runtime-check`
- package source: `examples/case-explainer-input.md`

This review does not publish a beta release by itself. It removes the HyperFrames compatibility blocker for beta preparation.

## Registry And Runtime Evidence

Registry check:

```bash
npm view hyperframes version dist-tags --json
```

Observed result:

```json
{
  "version": "0.6.40",
  "dist-tags": {
    "alpha": "0.6.0-alpha.14",
    "latest": "0.6.40"
  }
}
```

Local runtime after dependency update:

```bash
npx hyperframes --version
```

Observed result:

```text
0.6.40
```

The HyperFrames `0.6.40` help surface still includes the Framepack-relevant commands:

- `preview`
- `render`
- `lint`
- `inspect`
- `snapshot`
- `doctor`
- `upgrade`
- `skills`
- `capture`
- `remove-background`

It also adds `lambda`, which Framepack does not orchestrate in `0.4`.

## Framepack Package Evidence

Package generation:

```bash
node dist/cli.js generate --input examples/case-explainer-input.md --output-dir out/hyperframes-compat-09 --goal "Verify HyperFrames compatibility" --audience "Framepack maintainers" --project-name markdown-runtime-check --auto-pack
```

Observed result:

```text
Generated video project package at F:\hyperframes\out\hyperframes-compat-09\markdown-runtime-check
```

Package validation:

```bash
node dist/cli.js validate --project-dir out/hyperframes-compat-09/markdown-runtime-check
```

Observed result:

```text
Package validation passed for F:\hyperframes\out\hyperframes-compat-09\markdown-runtime-check.
```

Package status:

```bash
node dist/cli.js status --project-dir out/hyperframes-compat-09/markdown-runtime-check --json
```

Observed key fields:

```json
{
  "readiness": "ready",
  "protocolStatus": "passed",
  "issueCount": 0,
  "runtimeAvailable": true,
  "runtimeBinary": "F:\\hyperframes\\node_modules\\.bin\\hyperframes.cmd",
  "nextActionItems": ["preview"]
}
```

Runtime doctor:

```bash
node dist/cli.js runtime doctor --project-dir out/hyperframes-compat-09/markdown-runtime-check
```

Observed key fields:

```text
available: true
version: 0.6.40
packageStatus: passed
sceneCount: 6
issueCount: 0
```

Framepack upgrade check after the dependency bump reports no update gap:

```json
{
  "current": "0.6.40",
  "latest": "0.6.40",
  "updateAvailable": false
}
```

## HyperFrames 0.6.40 Direct Runtime Evidence

Direct latest runtime lint:

```bash
hyperframes@0.6.40 lint F:\hyperframes\out\hyperframes-compat-09\markdown-runtime-check
```

Observed result:

```text
0 errors, 0 warnings
```

Direct latest runtime inspect:

```bash
hyperframes@0.6.40 inspect --json --samples 3 F:\hyperframes\out\hyperframes-compat-09\markdown-runtime-check
```

Observed key fields:

```json
{
  "ok": true,
  "errorCount": 0,
  "warningCount": 0,
  "issueCount": 0,
  "_meta": {
    "version": "0.6.40",
    "latestVersion": "0.6.40",
    "updateAvailable": false
  }
}
```

## Findings

- Framepack-generated package structure remains readable by HyperFrames `0.6.40`.
- HyperFrames `0.6.40` preserves the command surface Framepack depends on for beta: `doctor`, `lint`, `inspect`, `snapshot`, `preview`, `render`, and `upgrade`.
- The `runtime inspect` JSON contract still exposes `ok`, issue counts, and `_meta.version`.
- Framepack should move its runtime dependency to `^0.6.40` for the beta line so fresh installs do not remain on the older `0.5.5` runtime.
- HyperFrames `lambda` is visible in `0.6.40`, but Framepack should treat it as future capability atlas material instead of adding it to beta orchestration.

## Remaining Beta Work

The remaining beta blocker is now a fresh real user trial against the actual beta candidate tag.

That trial should use the installed beta candidate, not the source checkout, and should verify:

- one-prompt agent onboarding
- pack recommendation
- package generation
- validation
- status readiness and next action IDs
- HyperFrames runtime availability with the updated dependency

## Plain-Language Summary

HyperFrames is the rendering body behind Framepack packages. This review checked whether our Framepack package still works with the newer HyperFrames runtime. It does: the package validates, HyperFrames can lint it, and HyperFrames can inspect it without layout issues. We also updated Framepack so new installs use the newer HyperFrames line instead of staying on the older one.
