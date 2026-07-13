# Framepack

Framepack is a **Codex-first director workbench for programmatic video**.

It turns a brief and local assets into a reviewable HTML/CSS/GSAP animation sample before HyperFrames renders the final video. You review the moving sample in Codex's built-in browser, then explicitly approve it—or record a conscious taste waiver—before handing it to HyperFrames.

```text
Brief + assets → direction + storyboard → HTML preview → snapshots + taste audit
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

Open the printed local URL in Codex's in-app browser. The workbench provides a director desk, sample preview, proof frames, audit result, and approval controls.

## Responsibilities

| Framepack | HyperFrames |
| --- | --- |
| direction, storyboard, HTML sample, preview snapshots, taste gate, handoff | lint/check/render, audio, TTS, subtitles, media QA, export and publish |

Technical problems cannot be waived. Taste failures require revision or a persisted user waiver. A handoff is never silently inferred.

See [the Codex workbench guide](docs/codex-director-workbench.md) and [legacy inheritance record](docs/migration/legacy-inheritance.md).
