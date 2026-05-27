---
name: framepack
description: Use Framepack when a user wants a polished HyperFrames or Remotion video from vague creative intent, assets, references, or prompt/composition work.
---

# Framepack Codex Skill

Use Framepack when the user asks for video creative work, asset-to-video planning, HyperFrames or Remotion composition, more polish, more motion, a business-looking video, a game-style ad, or a result inspired by a reference.

## Workflow

1. Inspect `framepack mcp --describe` when MCP is not connected.
2. Create a workbench with `framepack create --idea "<idea>" --assets <dir> --output-dir <dir>`.
3. Read `FRAMEPACK.md`, `ASSETS.md`, `DIRECTION.md`, `COMPOSITION.md`, and `ITERATIONS.md`.
4. Translate fuzzy user language into concrete visual language, motion language, template route, and HyperFrames/Remotion implementation choices.
5. Use the HITL loop in `DIRECTION.md` / `ITERATIONS.md`: ask the user to choose or modify the proposal before locking the first composition when taste is fuzzy.
6. Run `framepack workbench check --project-dir <dir>` before claiming the workbench is ready.
7. Keep state in workbench files, not model memory.
8. Use HyperFrames-safe rules: CSS first frame visible, scene switches with `tl.set()`, one animation engine per element, and timeline registration on `window.__timelines`.
