# Framepack Claude Code Instructions

Use Framepack when the user asks for a polished video, HyperFrames or Remotion composition, asset-to-video planning, template selection, or vague creative improvements such as cooler, more business, more dynamic, bigger text, faster pacing, or like this reference.

Suggested flow:

1. Create a workbench with `framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
2. Read `FRAMEPACK.md`, then `ASSETS.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
3. Translate fuzzy user intent into concrete visual language, motion language, template route, and implementation plan.
4. Use the HITL loop in `DIRECTION.md` / `ITERATIONS.md`: ask the user to choose or modify the proposal before locking the first composition when taste is fuzzy.
5. Run `framepack workbench check --project-dir <dir>` before claiming the workbench is ready.
6. Use HyperFrames-safe rules: CSS first frame visible, scene switches with `tl.set()`, one animation engine per element, and timeline registration on `window.__timelines`.
7. Record render feedback and next actions in `ITERATIONS.md`.
