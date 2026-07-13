# Framepack Codex Director Workbench — Design

## Summary

Framepack is rebuilt as a **Codex-first director layer for programmatic video**. Its primary user experience is a browser workbench opened from Codex. It turns a brief and local assets into a reviewable HTML/CSS/GSAP director preview, then hands the approved package to HyperFrames for rendering, audio, voiceover, subtitles, and final media QA.

The first release supports **Codex only**. Hermes and Claude Code are explicitly out of scope until the Codex workflow has been proven on real projects. The core uses stable files and CLI commands so future host integrations can wrap it without changing the director workflow.

The existing Hermes plugin stays only in Git history. New code may selectively reimplement proven rules, weapons, templates, and quality heuristics; it must not import, copy, or depend on the old plugin runtime.

## Product Boundary

Framepack owns the creative decision loop before final media production:

```text
Brief + assets → direction → storyboard → HTML animation preview
→ snapshots + taste review → user approval / explicit waiver → HyperFrames handoff
```

HyperFrames owns execution after handoff: lint/check/render, audio and TTS, subtitles, media inspection, export, publish, and cloud rendering.

Framepack promises a reviewable HTML animation sample and a truthful handoff package. It never promises a final MP4 before HyperFrames completes its own QA.

## Architecture

### Codex Director Workbench

`apps/director-workbench/` is the browser-facing application. It is the default Framepack entry point in Codex and has five connected views:

1. **Brief** — objective, aspect ratio (16:9 or 9:16), target duration, assets, and audio/subtitle intent.
2. **Direction** — visual identity, motion rhythm, motifs, scene outline, and explicit exclusions.
3. **Preview** — the generated HTML animation, a timeline, and selected proof frames.
4. **Review** — technical findings, taste result, concrete revision actions, user approval, or explicit waiver.
5. **Handoff** — an immutable summary of the approved preview and the exact work HyperFrames must perform.

The workbench starts and observes local Framepack CLI jobs. It does not contain a second copy of pipeline logic.

### Director Engine and CLI

`packages/director-engine/` contains deterministic project operations. It reads and writes the project file contract, invokes local build/preview tooling, and exposes:

```text
framepack director init <project> --aspect <16:9|9:16> --duration <seconds>
framepack director build <project>
framepack director serve <project>
framepack director snapshot <project>
framepack director audit <project>
framepack director handoff <project>
```

`packages/director-contracts/` owns versioned schemas and validators. `packages/hyperframes-bridge/` owns structural compatibility checks and handoff generation. The workbench, CLI, and tests all use these same packages.

No `adapters/hermes/` or `adapters/claude-code/` directories are created in this release. A future integration must call this CLI and consume these files rather than introduce host-specific business logic.

## Project File Contract

For a director-preview project, Framepack produces and maintains:

```text
project/
├── index.html
├── frame.md
├── public/
│   ├── assets/
│   ├── fonts/
│   └── vendor/gsap.min.js
├── .framepack/
│   ├── asset-intake.md
│   ├── storyboard.md
│   ├── html-build-report.md
│   ├── preview-report.md
│   ├── preview-snapshots/
│   ├── taste-audit.md
│   ├── approval.json
│   └── handoff-manifest.json
└── .hyperframes/render-plan.md
```

`approval.json` records one of `approved` or `waived`, the preview build identity, user rationale, and timestamp. It is required for handoff. A waiver is never silently inferred.

`handoff-manifest.json` has version `1.0` and includes the source build identity, aspect ratio, dimensions, duration, HTML entry, preview status, taste result, audio/subtitle/BGM requirements, HyperFrames action list, known risks, and render notes.

## Preview and Quality Gates

`build` creates a HyperFrames-compatible `index.html` with only local assets, fonts, and GSAP. It always declares an explicit root composition and exact scene time windows.

The bridge rejects a build that violates any of these rules:

- root has `data-start="0"`, an explicit total duration, and dimensions matching its selected aspect ratio;
- every scene is a timed `.clip` with an inner visual wrapper;
- media is a root child with IDs, timing, explicit placement, and explicit video z-index;
- no animation targets a clip root's opacity, filter, or transform;
- timelines are registered in `window.__timelines["main"]`, deterministic, and seek-safe;
- no `repeat:-1`, external runtime CDN, CSS-variable `font-family`, manual non-media `data-hf-id`, or `tl.set(... opacity: 0 ...)` initial-hidden pattern exists.

`snapshot` captures settled frames for every scene, transition midpoints, video-risk windows, and the final hold. `preview-report.md` records the time, expected state, observed state, and failures for each frame.

`audit` is a two-part gate:

- **Technical audit** is deterministic and blocks handoff for missing assets, invalid structure, black/empty proof frames, invalid scene visibility, or failed HyperFrames lint/check.
- **Taste audit** combines deterministic signals with an LLM assessment. It must output `pass`, `fail`, or `needs_review`; PPT feel, motion quality, visual density, material usage, audio readiness, a direct handoff recommendation, and concrete revision notes.

Automatic handoff is allowed only when technical audit passes, preview evidence is complete, the taste audit passes or is explicitly approved for review, and `approval.json` exists. A user can waive a taste failure, but the waiver and unresolved findings remain in the handoff manifest. Technical failures cannot be waived.

## Migration Policy

Old Hermes plugin files are not moved into the new worktree. Git history remains the archive.

The implementation maintains `docs/migration/legacy-inheritance.md`, listing each selectively reused rule, template, weapon, or asset with its historical Git source and its new owner. This is a provenance ledger, not a copy of legacy code.

Allowed inheritance:

- HyperFrames structure and seek-safe animation rules;
- reusable animation weapon recipes after independent validation;
- asset-intake, storyboard, compatibility, and taste-audit concepts;
- templates and bundled visual assets with clear source/license status.

Disallowed inheritance:

- Hermes hooks, injection flow, deployment scripts, plugin metadata, and runtime dependencies;
- legacy control loops whose behavior depends on Hermes;
- legacy tests that only prove Hermes integration.

## Testing and Acceptance

Tests are written before each engine behavior. The first fixture project is built in both 1920×1080 and 1080×1920 variants.

Required automated coverage:

1. File-contract and JSON-schema validation for intake, preview report, taste audit, approval, and handoff manifest.
2. HTML structural regressions for every hard compatibility rule above.
3. Local asset/font/vendor enforcement and deterministic timeline checks.
4. Snapshot-plan coverage for scene settles, transitions, video windows, and final hold.
5. Gate outcomes: technical failure blocks even with waiver; taste failure requires revision or explicit waiver; approved preview can produce a handoff package.
6. CLI-to-workbench job status integration for init, build, snapshot, audit, and handoff.
7. End-to-end Codex fixture: brief → build → HyperFrames lint/check → snapshots → audit → approval → handoff.

The first release is accepted only when this full loop runs in Codex for a 30-second 16:9 product explainer and a 9:16 variant, and the browser workbench lets a user inspect the actual dynamic sample before approving handoff.

## Explicit Non-goals for Release One

- Hermes and Claude Code plugins, hooks, compatibility tests, and deployment.
- Final MP4 rendering, encoding, cloud rendering, publishing, audio mixing, voice generation, subtitle burning, and HyperFrames runtime changes.
- Automatic use of every historical Framepack asset or weapon.
