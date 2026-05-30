# Changelog

## 0.5.0-alpha.24

- add 3 MCP knowledge query tools: querySceneTemplate, recommendAnimation, getComponentCode
- add MCP knowledge resources: video-design-best-practices, hyperframes-rules, scene-templates-index
- querySceneTemplate: query templates by purpose/category/tags, returns HTML/CSS/GSAP code
- recommendAnimation: recommend GSAP code for element+style combos (stat-number/headline/button/etc)
- getComponentCode: return complete code for any of 23 bundled Catalog Components
- knowledge base includes: HeyGen patterns (700+ templates), Synthesia practices, universal video design principles, agent template creation guide, HyperFrames 15 compatibility rules
- MCP repositioned from "command mirror" to "knowledge query interface"
- 193/191 tests pass (2 new: MCP tool registration, knowledge resources)

## 0.5.0-alpha.23

- add `framepack render --with-audio <file>` — wraps hyperframes render + ffmpeg audio merge
- add auto-copy of asset files to project's assets/ directory during `framepack create`
- upgrade `buildSkeletonHtml` to use scene templates from the template ecosystem
  - each scene role matched to best template via `findTemplateForSceneRole()`
  - entity placeholders filled from `extractIdeaEntities()` results
  - templates provide richer HTML with proper CSS structure, GSAP animation hints
- 191/189 tests pass (2 new: render --audio routing, asset auto-copy)

## 0.5.0-alpha.22

- add `extractIdeaEntities()` — extracts names, numbers, actions, and style keywords from user idea text
- upgrade `buildSkeletonHtml` to use entity extraction for scene content filling (names, numbers, actions appear in HTML)
- upgrade scene IDs from `hook`/`product` to `scene-0`/`scene-1` with `data-scene-id` attribute for explicit selectors
- fix video integration: video now inside scene div (not composition root) with GSAP opacity control
- fix opacity control: add `#scene-0 { opacity: 1 }` explicit selector (no longer depends on `:first-child`)
- fix duration regex: `30-second` and `30sec` now correctly matched
- scene content uses extracted entities (entity name in headlines, stats numbers, proof quotes)
- 189/189 tests pass (10 new: entity extraction, duration regex, entity content, scene ID selectors)

## 0.5.0-alpha.21

- add scene template system: `src/workbench/scene-templates.ts` with load, match, save, and stats functions
- add 20 built-in scene templates across 6 categories (opening, name-reveal, stats, footage, cta, transition)
- add 8 HyperFrames Block templates mapped to scene roles
- add `framepack scene-templates list` command to list all available templates
- add `framepack scene-templates recommend` command for template matching by category/tags
- add `framepack scene-templates stats` command for template ecosystem statistics
- add external template registry interface with 3 default registries (HyperFrames blocks, GSAP, Remotion)
- add `saveAgentTemplate()` for agents to create and persist custom templates
- add `findTemplateForSceneRole()` for automatic scene role → template matching
- templates use CSS variables (`var(--accent-primary)`) for brand colors, not hardcoded hex
- 185/185 tests pass (6 new scene template tests)

## 0.5.0-alpha.20

- fix P0: HyperFrames lint compliance — video at composition root, scene clip class, no animation overlap
- fix P1: brand color mapping — Primary (#DA291C) no longer overwritten by Accent (#FFE500)
- <video> moved to composition root level (fixes video_nested_in_timed_element error)
- all scene divs get class="clip" (fixes timed_element_missing_clip_class warning)
- <video> gets id="bg-video-N" (fixes media_missing_id error)
- separate entrance tweens for first vs subsequent scenes (fixes overlapping_gsap_tweens)
- 179/179 tests pass

## 0.5.0-alpha.19

- fix P0: enhanced HTML skeleton with design tokens, scene transitions, role-specific content, and media placeholders
- add `framepack scaffold --project-dir <dir>` command to regenerate index.html from existing workbench
- scene transitions: hard snap for fast templates (game-ad, data-shock), dissolve for others
- role-specific content: headline (impact pop), stats (number counter), product (scale reveal), cta (button), proof (quote)
- design tokens applied to CSS custom properties (--bg-primary, --accent-primary, --text-primary, etc.)
- video/image asset placeholders embedded when assets are provided
- HyperFrames safety: no Math.random(), no <br>, no video.play(), proper tl.set transitions
- 179/179 tests pass

## 0.5.0-alpha.18

- fix P0: bundle all 23 HyperFrames Catalog Components in npm package — zero network, zero timeout
- `framepack catalog install` installs components locally first, then tries blocks via HyperFrames CLI
- Apache 2.0 attribution for bundled HyperFrames components
- 177/177 tests pass

## 0.5.0-alpha.17

- fix P0: DESIGN_TOKENS brand color extraction — require 2+ keyword matches, no false positives
- fix P0: add `--brand-colors "#hex,#hex,..."` parameter to create command for explicit brand colors
- fix P0: extract duration from idea text ("30秒", "30 seconds", "30s") when --duration not specified
- improve game-ad HTML skeleton from 3 to 6 scenes (hook, action, stats, progression, reward, cta)
- 175/175 tests pass

## 0.5.0-alpha.16

- update all three READMEs (GitHub, npm, Chinese) with alpha.13-15 features
- add VIDEO_DNA section explaining reference video → DNA → create workflow
- add Component vs Block distinction to Catalog Bridge section
- add `framepack catalog install` to README quick start
- add `framepack lint / preview / render` to Commands section
- add `framepack create --dna` to Commands section
- 175/175 tests pass

## 0.5.0-alpha.15

- add `framepack catalog install` — batch-install all Catalog components with retry logic
- add `framepack lint` as top-level command (alias for `framepack runtime lint`)
- add `--dna <path>` flag to `framepack create` — create workbench from VIDEO_DNA.md
- update catalog-usage.md with Block vs Component distinction and usage patterns
- postinstall checks HyperFrames availability and reports version or install hint
- postinstall mentions `framepack catalog install` in quick start
- 175/175 tests pass

## 0.5.0-alpha.14

- add VIDEO_DNA reference example (365 lines, 8 segments, per-second GSAP HOW-TO code) as reference-miner skill reference
- rewrite VIDEO_DNA extraction template with standardized format: segments, per-second code, design tokens, 3-tier asset lists, feasibility assessment
- update reference-miner SKILL.md with complete VIDEO_DNA extraction workflow and reference links
- fix postinstall message not showing — always print welcome message first, then try agent install
- add cyan ANSI color to postinstall version output for visibility

## 0.5.0-alpha.13

- fix postinstall version string hardcoded at alpha.9 — now reads from package.json dynamically
- fix CLAUDE.md and AGENTS.md content duplication — playbooks only in SKILL.md files, agent files reference skills
- fix reference-miner skill missing references — added video-dna-template.md with extraction guide and TEMPLATE_BLUEPRINT conversion table
- add ASSET_GAPS.md to FRAMEPACK.md agent workflow reading list and all agent instruction files
- add preview step to FRAMEPACK.md agent workflow (npx hyperframes preview → user confirms → npx hyperframes render)
- remove Remotion parallel mentions from agent workflow files, keep HyperFrames as primary runtime
- bold Framepack version in postinstall output for better visibility

## 0.5.0-alpha.12

- updated GitHub README, npm README, and Chinese README to document all alpha.9-11 features
- added Design System Matching section with 22 curated design system names
- added External Capabilities section (agent-sprite-forge, Three.js, D3/Chart.js, Web Audio)
- updated Workbench Arsenal section from 7 to 12 workbench files (DESIGN.md, DESIGN_TOKENS.md, ASSET_GAPS.md, index.html)
- updated Skill Playbooks section with progressive disclosure pattern and references/ paths
- updated HyperFrames Safety section with 7 rules and index.html skeleton note
- updated Catalog Bridge section with Catalog Pre-Flight explanation
- 175/175 tests pass

## 0.5.0-alpha.11

- generate DESIGN.md by matching user style to one of 22 design systems and copying the full design spec into the project (HyperFrames builder auto-discovers design.md)
- generate DESIGN_TOKENS.md with extracted hex colors and typography from the matched design system
- add external capability recommendations to COMPOSITION.md Recommended Stack: agent-sprite-forge for game routes, Three.js for 3D, D3/Chart.js for data, Web Audio for audio-reactive
- 175/175 tests pass

## 0.5.0-alpha.10

- generate HyperFrames-passable index.html skeleton during `create` with proper data attributes, scene structure, entrance animations, and paused GSAP timeline
- 6 template-specific scene layouts (saas-launch, game-ad, course-promo, news-explainer, founder-story, data-shock)
- correct 1920x1080 or 1080x1920 dimensions based on format, first scene visible via CSS
- add test validating skeleton HTML passes all HyperFrames lint requirements
- 175/175 tests pass

## 0.5.0-alpha.9

- rewrote all four skills with HOW-level detail following HyperFrames progressive disclosure pattern (SKILL.md is a concise index, details loaded on demand from references/)
- framepack-director: design system index with 22 curated design.md files in references/designs/ (spacex, nike, ferrari, stripe, apple, etc.)
- framepack-hyperframes-builder: 15 HyperFrames compatibility rules in references/compatibility-rules.md, 8 animation code templates in references/code-templates.md
- framepack-template-fuser: catalog install guide and pre-flight checklist in references/catalog-usage.md
- added ASSET_GAPS.md to workbench output with blocking/optional gap analysis and tool recommendations
- enhanced COMPOSITION.md with Code Templates section (impact pop, kinetic type, hard snap, dissolve, scale reveal, number counter)
- enhanced COMPOSITION.md with HyperFrames Safety Checklist and Preview Before Render sections
- upgraded Catalog Plan to Catalog Pre-Flight with mandatory install-before-code steps
- fixed CLAUDE.md managed block to not inject FramePack title on fresh files
- fixed initAgentProject with independent try-catch per target (codex failure no longer blocks claude-code)
- fixed postinstall.mjs with INIT_CWD fallback and install guidance message listing skills and next steps
- 174/174 tests pass

## 0.5.0-alpha.8

- installed the four Framepack playbooks as real project skills for Claude Code under `.claude/skills`
- installed matching project skills for Codex-facing workflows under `.framepack/agent/codex/skills`
- updated agent instructions so Claude Code and Codex know the skills are registered, not just documented as prose
- added regression coverage for `framepack-director`, `framepack-template-fuser`, `framepack-hyperframes-builder`, and `framepack-reference-miner` generated skill files

## 0.5.0-alpha.7

- added 11 built-in HyperFrames prompt-template blueprints adapted from the Open Design template pattern
- added prompt-template recommendation through the workbench arsenal and `framepack templates prompt`
- wrote the selected HyperFrames Prompt Template and Template Fusion Plan into generated `COMPOSITION.md`
- extended `HUMAN.md` with plain-language template explanations for non-expert users
- upgraded `init-agent` Codex and Claude Code instructions with four Framepack playbooks: director, template fuser, HyperFrames builder, and reference miner
- introduced `VIDEO_DNA.md` and `TEMPLATE_BLUEPRINT.md` as the reference-video-to-template workflow targets

## 0.5.0-alpha.6

- added an explicit npm metadata README fallback with English and Chinese quick-start copy
- kept the full repository README and Chinese docs intact while ensuring the npm registry page cannot render as an empty README

## 0.5.0-alpha.5

- fixed npm package README metadata by publishing only root `README.md` as the npm display README
- embedded a Chinese quick-start section directly in the npm-facing README
- kept the full Chinese README in the GitHub repository and linked to it from the npm README

## 0.5.0-alpha.4

- added the Human Digest layer with `HUMAN.md` for plain-language project status, video structure, progress, next user decision, and technology explanation
- added `framepack workbench brief --project-dir <dir>` for user-facing progress recaps during agentic video production
- added human-readable structure summaries to `DIRECTION.md`, human explanations to `COMPOSITION.md`, and review-note guidance to `ITERATIONS.md`
- extended workbench validation to require human digest and structure-summary coverage
- updated Codex and Claude Code agent instructions to read `HUMAN.md` and use the brief command when users need a clearer recap

## 0.5.0-alpha.3

- added the first local Template Market index with built-in access, included license, free price metadata, tags, implementation routes, and asset needs
- added `framepack templates` and `framepack templates recommend` for agent-readable template discovery and recommendation
- routed Workbench Arsenal recommendations through the same template market data used by the CLI
- documented Template Market as the future ecosystem and paid-template foundation without adding remote download or payment code

## 0.5.0-alpha.2

- added npm postinstall agent setup for Codex and Claude Code, with `FRAMEPACK_SKIP_AGENT_INSTALL=1` opt-out
- changed `init-agent --target auto` to install Codex skill instructions, Claude Code instructions, and MCP config together
- slimmed `framepack create` output to five agent-readable workbench files plus hidden `.framepack/state.json`
- added the Workbench Arsenal template registry and Polish Arsenal recommender for translating fuzzy user taste into professional video direction
- updated workbench guidance around HyperFrames-safe GSAP rules, Remotion routes, templates, and polish recommendations

## 0.5.0-alpha.1

- reborn Framepack as a lightweight HyperFrames creative workbench for agents
- added `framepack create` for idea + asset folder -> asset library, creative brief, HyperFrames prompt, composition plan, and iteration log
- shifted public README and npm positioning away from the heavier 0.4 Agent Harness surface
- stopped packaging old architecture and agent-platform docs in the npm artifact; they remain in the repository as legacy learning material
- kept older compatibility commands available while the new workbench path matures

## 0.4.0-beta.2

- added the beta.2 Creative Harness composition proposal layer with `COMPOSITION_PROPOSAL.json`
- routed HyperFrames composition emission through proposal scene treatments, layouts, visual hierarchy, and motion recipes
- expanded creative package artifacts and quality checks for proposal scene coverage and motion variety
- improved generated compositions with visible proposal metadata, directed fallback cards, and treatment-specific scene content
- kept `latest` untouched and prepared beta distribution through the npm `beta` tag

## 0.4.0-beta.1

- promoted the 0.4 agent-platform line from alpha preparation to the first beta candidate
- upgraded the HyperFrames runtime dependency to `^0.6.40`
- added HyperFrames compatibility evidence for `runtime doctor`, `lint`, `inspect`, and `upgrade-check`
- added separate Codex and Claude Code beta onboarding trial evidence
- expanded the release scenario gate to four practical routes, including website-to-video
- kept `latest` untouched and prepared beta distribution through the npm `beta` tag

## 0.4.0-alpha.4

- packaged the one-prompt agent onboarding path for npm users
- added `Start With One Prompt` and `用一句话开始` README entries
- updated Codex, Claude Code, and install-with-agent docs to require `readiness`, `nextActionItems`, missing asset, and runtime gap reporting
- added regression coverage for the final onboarding copy

## 0.4.0-alpha.3

- corrected public npm alpha first-run commands to use `npx -y -p framepack@alpha framepack --version` and `npx -y -p framepack@alpha framepack --help`
- kept `npm exec --yes --package=framepack@alpha -- framepack mcp --describe` as the recommended MCP surface check
- updated CLI help, README, Chinese README, AGENTS, Codex, Claude Code, and install-with-agent docs with the same command set
- added regression coverage for the stable first-run command guidance

## 0.4.0-alpha.2

- added first-run CLI affordances for npm users with `framepack --version` and `framepack --help`
- normalized the npm `bin.framepack` path to `dist/cli.js` to avoid publish-time bin cleanup warnings
- documented the shortest alpha install check with `npm exec --package=framepack@alpha -- framepack mcp --describe`
- added v0.4.0-alpha.2 release-candidate notes while preserving the v0.4.0-alpha.1 architecture release notes

## 0.4.0-alpha.1

- aligned the Framepack 0.4 product thesis around a video production Agent Harness: sense filter, motor pathways, reflexes, memory encoding, and feedback loop
- added the Framepack MCP stdio server with project generation, status, validation, asset, runtime, resource, and prompt surfaces for coding agents
- added `framepack init-agent` for project-scoped Codex workflow files and Claude Code preview MCP configuration
- added Codex-first agent platform docs, templates, and README install guidance focused on natural language agent installation
- packaged agent-platform docs and templates for npm distribution
- added regression coverage for MCP surface discovery, Codex initialization, Claude Code MCP config, and packaged agent platform assets
- documented the long-term agent platform ecosystem, including workflow packs, creative direction, template packs, connectors, and community contribution paths
- added the first built-in workflow pack and creative direction pack registry, exposed through `framepack packs`, MCP tools, and MCP resources
- added workflow and creative direction pack selection during generation, with validation and durable `VIDEO_BRIEF.json` / `HANDOFF.md` output
- added pack recommendation through `framepack packs recommend` and MCP `recommendPacks`
- added one-step automatic pack recommendation during generation through CLI `--auto-pack` and MCP `autoRecommendPacks`
- added the agent-platform release smoke harness through CLI `release-smoke` and MCP `releaseSmoke`
- added `npm run release:smoke:install` for real npm tarball installation checks before publishing release candidates
- added `npm run release:gate` as the final release-candidate verification gate
- added release-candidate notes and the next architecture learning agenda for the Framepack 0.4 uplift
- added the Framepack 0.4 Capability Runtime Architecture proposal
- added capability graph summaries to package status and exposed the first Arsenal Exposure MCP surface with `exposeArsenal`, `getCapabilityGraph`, and `explainCapabilityGaps`
- added strict package validation for `CAPABILITY_GRAPH.json` and repair coverage for rebuilding invalid capability graphs
- added `RUNTIME_MANIFEST.json` as the first runtime manifest contract for HyperFrames entrypoints, commands, capabilities, and evidence paths
- upgraded `release-smoke` into a 0.4 alpha gate that verifies Arsenal Exposure, capability graph artifacts, runtime manifest artifacts, status, and validation
- added the first internal Animation Capability Atlas registry with programmatic animation, HyperFrames runtime, agent-sprite-forge, frontier video model watchlist, and recommended capability stacks
- exposed the Animation Capability Atlas through `framepack atlas`, MCP tools, and the `framepack://capabilities/atlas` resource
- persisted Atlas capability stack selections into generated `VIDEO_BRIEF.json` and `HANDOFF.md` when packages use workflow or creative direction packs
- added `npm run release:scenarios` and the v0.4 alpha real scenario test report for markdown, thread, and game-ad sprite-video package rehearsal

## 0.3.0-rc.1

- shipped the first agent-platform release candidate with MCP, Codex and Claude Code installation workflows, workflow pack recommendation, creative direction packs, backend-neutral 2D forge tasks, and release-grade smoke gates

## 0.2.0-rc.2

- fixed the published CLI bin entrypoint by preserving the Node shebang in `dist/cli.js`
- added release regression coverage to ensure the packaged CLI entrypoint remains directly executable
- verified clean tarball installation through `npx framepack`, markdown package generation, runtime checks, and game-ad forge package generation

## 0.2.0-rc.1

- added the Asset Forge Layer with backend-neutral forge execution kinds for sprite sheets, maps, FX, props, and character packs
- added the `--game-ad-description` demo route for game-style promotional video packages with sprite, map, and FX forge tasks
- added forge task contracts, `FORGE_TASKS.md`, richer `HANDOFF.md` guidance, and optional `agent-sprite-forge` backend recommendations without automatic skill installation
- added package readiness/status reporting with stable next-action IDs, forge breakdowns, and package command capability metadata
- upgraded the HyperFrames integration to 0.5.5 and added runtime `lint`, `inspect`, `snapshot`, and `upgrade-check` command flows
- expanded package protocol docs, agent workflow docs, repair behavior, and golden package regression coverage for the 0.2 package shape
- verified three real RC scenarios covering markdown, thread, website, and game-ad packages through status, validate, runtime checks, forge sync, snapshots, and draft render

## 0.1.0

- added markdown, website, and thread source compilers
- added package protocol files including `PACKAGE_MANIFEST.json`
- added source-aware asset execution planning and materialization
- added HyperFrames runtime detection, preview, and render command flows
