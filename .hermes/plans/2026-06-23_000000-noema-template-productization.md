# NOEMA Template Productization Implementation Plan

> **For Hermes:** Implement directly in this session; documentation/schema/html changes only, no Python code.

**Goal:** Upgrade `aura-noema-scroll-video-template` from a verified gold sample into an agent-managed reusable template package.

**Architecture:** Keep the existing static HyperFrames composition as the source of truth. Add user-facing activation docs, a stronger variable/schema seed, a QA checklist, and minimal layout-audit annotations for intentional poster-style layering.

**Tech Stack:** Markdown, JSON, existing HyperFrames HTML, `npx hyperframes@0.6.121`, `ffprobe`.

---

## Tasks

1. Capture baseline with `npx hyperframes@0.6.121 lint`, `validate`, and `inspect --samples 15`.
2. Rewrite `aura-noema-scroll-video-template/README.md` as the template entrypoint.
3. Create `aura-noema-scroll-video-template/TEMPLATE-USAGE.md` with scene mapping and reuse workflow.
4. Create `aura-noema-scroll-video-template/TEMPLATE-QA.md` with exact validation commands and reporting format.
5. Expand `aura-noema-scroll-video-template/variables.json` into a schema seed while keeping concrete NOEMA defaults.
6. Patch `aura-noema-scroll-video-template/index.html` with minimal `data-layout-allow-*` annotations for intentional poster overlap/occlusion.
7. Verify with lint/validate/inspect/render/ffprobe and stale-asset grep guidance.
8. Update session todo and report actual output.

## Validation

Run from `F:/hyperframes/aura-noema-scroll-video-template`:

```bash
npx hyperframes@0.6.121 lint
npx hyperframes@0.6.121 validate
npx hyperframes@0.6.121 inspect --samples 15
npx hyperframes@0.6.121 render --output dist/noema-scroll-template.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,avg_frame_rate,nb_frames,duration -show_entries format=duration,size -of json dist/noema-scroll-template.mp4
```
