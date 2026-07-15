# Framepack Build Studio

The Build Studio is a local browser surface for one project. Start it with `npm run director:serve -- <project>`, then open its local URL in Codex's in-app browser. It is deliberately compact: Codex remains the creative room; Studio is the place to inspect versioned evidence and make the human decision.

1. **Build** writes a seek-safe, HyperFrames-compatible frozen build to `.framepack/builds/<build-id>/`, including local GSAP, assets, manifest, motion coverage, and receipt evidence. `.framepack/current-build.json` selects the version currently under review.
2. **Preview** serves that current build. The three Studio areas are **Builds**, **Preview**, and **Judgment**.
3. **Extract proof frames** runs HyperFrames snapshot at scene settles, transitions, and the final hold inside that build's `preview-snapshots/` directory.
4. **Run taste audit** separates technical validity from commercial judgment and includes motion coverage evidence.
5. **Approve** is available only when technical audit passes. **Waive taste issue** records a reason and never bypasses a technical failure.
6. **Handoff to HyperFrames** creates `.framepack/handoff-manifest.json` and `.hyperframes/render-plan.md`, both of which name the approved build entry instead of relying on a mutable root `index.html`.

The required project sources are `frame.md`, `.framepack/asset-intake.md`, and `.framepack/storyboard.md`. Build outputs live under `.framepack/builds/<build-id>/`; the current pointer is `.framepack/current-build.json`. Root-level audit and report files are convenience pointers, while the selected build remains the authoritative evidence package.
