# Framepack

Framepack is a **Codex-first Build Studio for programmatic video**.

It turns a brief and local assets into a reviewable HTML/CSS/GSAP animation sample before HyperFrames renders the final video. Each build is frozen as a traceable version, so a later revision cannot silently overwrite the sample you reviewed. You review the moving sample in Codex's built-in browser, then explicitly approve it—or record a conscious taste waiver—before handing that exact build to HyperFrames.

```text
Brief + assets → direction + storyboard → immutable Build → snapshots + taste audit
→ explicit approval / waiver → HyperFrames lint, check, render, audio, captions and final QA
```

## Current support

Framepack currently supports **Codex only**. Hermes and Claude Code are deliberately not supported until this Codex workflow is proven on real projects. The old Hermes plugin remains available only through Git history.

## Quick start

```powershell
npm install
npm run director -- init C:\work\my-preview --aspect 16:9 --duration 30 --title "Product reveal"
npm run director -- build C:\work\my-preview
npm run director -- snapshot C:\work\my-preview
npm run director -- audit C:\work\my-preview
npm run director -- approve C:\work\my-preview --reason "Preview accepted"
npm run director -- handoff C:\work\my-preview
npm run director:serve -- C:\work\my-preview
```

Open the printed local URL in Codex's in-app browser. The Build Studio keeps three focused surfaces: **Builds** for version and evidence, **Preview** for the moving sample, and **Judgment** for approval, waiver, and handoff decisions.

## What changed in 0.2.0

- **Immutable builds** — every `build` writes to `.framepack/builds/<build-id>/`; `.framepack/current-build.json` points to the version currently shown in Studio. Root `index.html` is no longer the source of truth.
- **Skill roles with evidence** — Framepack records whether a skill acted as director, producer, or technical support, including the artifact paths and hashes it influenced.
- **Weapon choreography, not one-off effects** — a scene can use several proven motion actions across entrance, emphasis, and exit; the motion coverage report makes quiet or under-animated scenes visible before approval.
- **A smaller, stronger review desk** — the Studio does not duplicate Codex creative work. It only makes build, preview, evidence, and human judgment easy to inspect and decide.

## Responsibilities

| Framepack | HyperFrames |
| --- | --- |
| creative direction, storyboard, weapon choreography, immutable build, preview evidence, taste gate, handoff package | technical compatibility, lint/check/render, audio, TTS, subtitles, media QA, export and publish |

Technical problems cannot be waived. Taste failures require revision or a persisted user waiver. A handoff always names the approved immutable build; it is never silently inferred.

See [the Codex workbench guide](docs/codex-director-workbench.md) and [legacy inheritance record](docs/migration/legacy-inheritance.md).

Deployment details: [中文 Codex 部署说明](docs/codex-deployment.zh-CN.md).
