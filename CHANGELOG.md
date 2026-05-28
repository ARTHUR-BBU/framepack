# Changelog

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
