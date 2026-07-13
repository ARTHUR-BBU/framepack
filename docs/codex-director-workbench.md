# Codex Director Workbench

The workbench is a local browser surface for one project. Start it with `npm run director:serve -- <project>`, then open its local URL in Codex's in-app browser.

1. **Build preview** writes a seek-safe, HyperFrames-compatible `index.html` and vendors GSAP locally.
2. **Extract proof frames** runs HyperFrames snapshot at scene settles, transitions, and the final hold.
3. **Run taste audit** separates technical validity from commercial judgment.
4. **Approve** is available only when technical audit passes. **Waive taste issue** records a reason and never bypasses a technical failure.
5. **Handoff to HyperFrames** creates `.framepack/handoff-manifest.json` and `.hyperframes/render-plan.md`.

The required project files are `frame.md`, `index.html`, `.framepack/asset-intake.md`, `.framepack/storyboard.md`, `.framepack/preview-report.md`, `.framepack/taste-audit.md`, `.framepack/approval.json`, `.framepack/handoff-manifest.json`, and `.hyperframes/render-plan.md`.
