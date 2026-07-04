# Framepack

> **HyperFrames Director Workbench.**
> Framepack v0.17.0 turns fuzzy video intent into a director-approved HyperFrames workflow: route the job, ask for assets, write the creative bible, hand off cleanly, then taste-audit before render.

Framepack is a Hermes Agent Plugin for HyperFrames 0.7.3. The new boundary is clear:

- **Framepack owns direction:** Intent Router, asset intake, `frame.md`, `expanded-prompt.md` as the Director Story Bible, Handoff Manifest, dynamic arsenal guidance, and Pre-render Taste Audit.
- **HyperFrames owns production:** official workflows, Studio preview, catalog, variables, media tools, HTML/GSAP composition, lint, render, publish, and cloud execution.

Kitchen analogy: HyperFrames is the professional kitchen. Framepack is the chef who chooses the menu, checks ingredients, tastes the dish before service, and lets the kitchen cook with its own equipment.

## HyperFrames 0.7.3 workflow

```text
User idea
  ↓
Framepack Intent Router
  ├── product-launch-video
  ├── website-to-video
  ├── faceless-explainer
  ├── pr-to-video
  ├── embedded-captions
  ├── graphic-overlays
  ├── motion-graphics
  ├── template reuse
  └── reference/template extraction
  ↓
ask for assets + co-create direction
  ↓
frame.md = visual identity
expanded-prompt.md = Director Story Bible
  ↓
Handoff Manifest
  ↓
HyperFrames 0.7.3 official workflow + Studio preview
  ↓
Framepack Pre-render Taste Audit
  ↓
User decides: revise / add assets / render anyway
  ↓
HyperFrames render / publish / cloud
```

## What Framepack does

- Routes the request before writing anything.
- Asks for useful assets: logo, screenshots, BGM, source video, DESIGN.md, mood board, brand palette, reference video, HTML/animation snippets, proof points.
- Produces `frame.md` and `.hyperframes/expanded-prompt.md` as the creative source of truth.
- Produces or references a Handoff Manifest so HyperFrames 0.7.3 knows the workflow, constraints, missing assets, candidate catalog/arsenal items, and QA red lines.
- Runs report-first semantic checks that HyperFrames lint cannot see: stale template props, missing asset-intake, old domain leftovers, arsenal drift, and taste risks.

## What Framepack does not do

- It does not write, fix, or own HyperFrames HTML.
- It does not replace `hyperframes lint`, Studio preview, render, publish, or cloud workflows.
- It does not block render during taste audit. Framepack advises; user decides.

## Plugin Hooks (v0.16.0)

```text
pre_tool_call:
  ├── classify HyperFrames 0.7.3 command intent
  ├── production commands → Guardrail Hydrator + Arsenal preflight + Timeline sync + Quality Audit
  ├── preview/render/publish/cloud surfaces → Pre-render Taste Audit
  └── discovery/catalog/media/scaffold commands → no handoff warning

post_tool_call:
  ├── Framepack skill_view → Guardrail Hydrator sync + current-session injection
  ├── frame.md write → quality check + weight/control-profile pathway
  ├── expanded-prompt.md write → Arsenal reconcile + Director Story Bible quality check
  └── lint JSON output → upstream warning classification cache
```

## Skills

| Skill | What |
|---|---|
| framepack | Main Director Workbench guide |
| framepack-director | Intent → frame.md + Director Story Bible |
| framepack-animation-library | Dynamic arsenal and animation weapons |
| framepack-gsap | HyperFrames-safe GSAP recipes |
| framepack-arsenal | Weapon registry lifecycle |
| framepack-reference-miner | Reference video/webpage → motion DNA/template extraction |
| framepack-production-quality | Timeline/proof/semantic quality checks |
| framepack-sprite-forge | Sprite-sheet and chroma-key workshop |

## Install

```bash
# 1. Clone
git clone https://github.com/ARTHUR-BBU/framepack --depth 1

# 2. Copy to Hermes plugins
# Linux/macOS:
cp -r framepack/framepack-plugin ~/.hermes/plugins/framepack
# Windows:
xcopy /E /I framepack\framepack-plugin %HERMES_HOME%\plugins\framepack

# 3. Enable
hermes plugins enable framepack

# 4. Verify
hermes plugins list
# You should see `framepack` enabled with version **0.17.0**.
```

## Compatibility

Framepack v0.16.0 officially supports **HyperFrames 0.7.3**.

- supported_min: `0.7.3`
- supported_max_tested: `0.7.3`
- supported band: `0.7.x` with probe-before-trust for newer versions
- versions below `0.7.3` require upgrade before Framepack handoff

## Test it

In a Hermes chat, from any project directory:

```text
帮我做一个 30 秒的科技品牌发布视频。你自己判断路线，但先问我要不要提供素材。
```

Expected behavior: Framepack routes the request, asks for assets, builds the creative direction, hands off to HyperFrames 0.7.3, and gives a Pre-render Taste Audit before final render.

## Updating

```bash
cd framepack
git pull
cp -r framepack-plugin <hermes-home>/plugins/framepack
# Restart Hermes
```

Project `AGENTS.md` files are repaired automatically on next Framepack invocation via Guardrail Hydrator. The hydrator only edits the `FRAMEPACK MANAGED BLOCK` and preserves user/project rules outside that block.

## License

MIT
