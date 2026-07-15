# Changelog

## 0.2.0 — Immutable Build Studio (2026-07-15)

Framepack now owns the creative build, evidence, and human decision loop before HyperFrames receives a frozen production handoff.

### Build Studio

- **Immutable build packages** — every build is written to `.framepack/builds/<build-id>/` with its HTML, assets, storyboard, manifests, receipts, snapshots, and audit evidence. `.framepack/current-build.json` makes the reviewed version explicit; root `index.html` is no longer the authoritative preview artifact.
- **Codex-continuous review desk** — the browser Studio is simplified into Builds, Preview, and Judgment. Codex remains the creative surface; Studio concentrates on version inspection, moving preview, evidence, and explicit human decisions.
- **Frozen handoff** — approval and handoff bind to the selected build entry, preventing a later revision from changing the sample that was approved.

### Creative Production Controls

- **Skill classification ledger** — routed skills are recorded as director, producer, or technical-support roles together with their affected artifacts and hashes.
- **Multi-action weapon choreography** — scenes can schedule several proven motion actions across entrance, emphasis, and exit instead of relying on a single effect.
- **Motion coverage evidence** — each build reports active motion ratio and quiet gaps; insufficient coverage becomes a taste-review issue before approval.

### Compatibility and verification

- **HyperFrames handoff** — HyperFrames remains responsible for technical compatibility, lint/check/render, audio, captions, media QA, export, and publish.
- **Line-ending-stable evidence hashes** — textual receipt validation normalizes Windows and Unix line endings before verifying registered source hashes.
- Added contract, engine, runtime, audit, server, workbench-copy, and motion-coverage regression coverage for the Build Studio flow.

## 0.15.0 — HyperFrames 0.7.3 Director Workbench (2026-06-23)

Framepack fully pivots to HyperFrames 0.7.3 as the supported production target.

### Director Workbench

- **Intent Router** — routes fuzzy requests into HyperFrames 0.7.3 workflow families such as product launch, website-to-video, faceless explainer, PR-to-video, captions, graphic overlays, motion graphics, template reuse, reference extraction, and general video.
- **Asset-first co-creation** — Framepack now explicitly asks for useful assets before creative expansion: logo, screenshots, BGM, source video, DESIGN.md, mood board, reference video, animation snippets, and proof points.
- **Director Story Bible** — `expanded-prompt.md` is treated as the rich creative source of truth, while HyperFrames owns the production storyboard and HTML composition.
- **Handoff Manifest** — captures workflow, creative constraints, missing assets, catalog/arsenal candidates, QA red lines, and user decision points for HyperFrames 0.7.3.
- **Pre-render Taste Audit** — preview/render/publish/cloud surfaces get a non-blocking taste/product audit. Framepack advises; user decides.

### Compatibility

- **HyperFrames 0.7.3** — official supported and highest-tested target.
- HyperFrames 0.6.x is no longer the active support target for v0.15.0.

### Tests

- Added Intent Router, Handoff Manifest, Pre-render Audit, pre-tool-call integration, and skill/guardrail contract tests.

## 0.12.0 — Five Directions Release (2026-06-18)

Five development directions completed, tested end-to-end, and validated by independent test team.

### Direction 1 — Asset Intake (Phase 0)

- **Asset detection before creative work** — before Phase 1, Framepack asks what assets the user already has. Detects video type (brand_product_launch / educational / social_teaser / kinetic_type), collects assets conditionally (not every video needs all 6 categories), and detects image transparency (SVG/PNG-alpha/JPG).
- **Transparency detection** — `core/asset_detector.py` checks pixel alpha; suggests `npx hyperframes remove-background` for opaque assets. Framepack detects and suggests, never auto-processes.
- **Asset manifest** — writes `.framepack/asset-intake.md` from template; shows user a compact summary, not raw YAML.

### Direction 2 — Arsenal Registry Alignment

- **Weapon registration fixes** — 3 WIP weapons had function-name mismatches, wrong engine tags, or anime.js blind spots. All fixed; registry now matches actual `.js` implementations.
- **Registry drift repair** — 4 orphan weapons registered; `card-cascade-reveal` path corrected from `_part()` to `_block()`.
- **Short-name disambiguation** — 7 framepack skills had duplicate copies causing ambiguous lookups; merged and de-duplicated.

### Direction 3 — Taste Audit Style Awareness

- **Style-aware auditing** — `core/taste_audit.py` no longer overfits to the luxury-pearl specimen. Audit now respects the project's `reference_dna` and scales expectations per style (emerging/editorial styles get different thresholds).
- **Kinetic taste fixes** — fade-stack monotony, surprise operator density, kinetic grammar coherence, and manifest surprise semantics all corrected for cross-style fairness.

### Direction 4 — Parameter Drift Guard

- **Parameter reference card** — `core/param_guard.py` generates a pre-write parameter reference from weapon SKILL.md specs, so the HTML-writing Agent has exact defaults before touching code.
- **P1 canonical snippet** — weapons emit canonical usage snippets that reduce inline GSAP/anime.js rewriting (the "Agent doesn't call canonical" problem — partial mitigation; full resolution tracked for v0.13.0).

### Direction 5 — Upstream Warning Bridge

- **HyperFrames lint warning classification** — `core/warning_classifier.py` with a data-driven category table classifies upstream warnings (`gsap_studio_edit_blocked` → upstream_limit, `overlapping_gsap_tweens` → quality_issue, unknown → safe fallback).
- **Quality Audit integration** — lint findings cached to `.framepack/hyperframes-findings.json`, classified, and surfaced in the Quality Audit summary alongside arsenal/manifest checks.
- **Hook integration** — pre-tool-call reminds Agent to use `--json` for structured lint output; post-tool-call detects lint completion and triggers cache + classify.
- **Hermes patch tracking** — `core/hermes_adapter.py` tracks local patches (marker-based drift detection) and warns when Hermes updates overwrite them. Upstream PR [#48141](https://github.com/NousResearch/hermes-agent/pull/48141) submitted for the underlying `skill_view file_path` bug.

### Cleanup (simplify pass)

- **Dead code removal** — `core/arsenal.py` (258 lines, zero references) + `save_arsenal()` + `load_lint_output()` deleted. Net -276 lines.
- **Shared workdir parser** — `core/shell_utils.py` extracted to break pre↔post hook circular dependency; fixed weak `cd "path with spaces" && cmd` parsing.
- **Dedup** — three inline `WarningLike` stubs → `ArsenalWarning.from_error()` classmethod.
- **Test-team script relocation** — moved from repo root into `framepack-plugin/scripts/` to eliminate deploy-sync blind spot that caused version drift.

### Compatibility

- **HyperFrames 0.6.99+** — validated compatible.
- **Hermes Agent** — local patch for `skills_tool.py` file_path bug; upstream PR pending.

### Tests

- **390 passed, 1 skipped, 0 failed** (source + deploy dual-green).
- Independent test-team validation: pytest 390/0, lint 0 errors, snapshot 10/10 zero black frames, render 6.1 MB 35s 1080p.
- New tests: warning_classifier (26), quality_audit lint bridge (8), lint bridge hooks (9), hermes_adapter upstream_features (17), param guard, taste style-awareness.

### Known Limitations (tracked for v0.13.0)

- **taste vocabulary not wired** — `taste_grammar.py` + `taste_specimens.py` + ManifestWeapon taste fields are designed but not yet consumed by `taste_audit.py` (which uses a hardcoded vocabulary). Wiring eliminates hardcoding but carries false-positive risk; deferred to a dedicated direction.
- **Parameter drift detection is partial** — detects drift but doesn't enforce canonical weapon usage. Full resolution is the v0.13.0 direction 4 goal.

## 0.11.0 — Kinetic Taste Engine (2026-06-17)

### Taste Engine

- **Kinetic Taste Engine** — semantic taste audit (`core/taste_audit.py`) that checks fade-stack monotony, surprise operator density, kinetic grammar coherence, and manifest surprise semantics. Curated taste specimens (`core/taste_specimens.py`) provide reference calibration for luxury/emerging/editorial styles.
- **Director taste references** — `kinetic-taste-engine.md`, `surprise-operators.md`, `taste-moves.md`, `kinetic-grammar.md` give the Director a taste vocabulary for scene design.
- **Empty surprise marker fix** — Execution Manifest entries `surprise: none` no longer count as controlled surprises in the audit.

### Compatibility

- **HyperFrames 0.6.104** — validated compatible (blank smoke + golden case lint/validate/inspect/render/ffprobe). Support window raised from 0.6.97 to 0.6.104.
- **Environment doctor cwd fix** — project-local HyperFrames detection now runs in `project_dir` cwd, preventing false version readings from caller-cwd node_modules.

### Tests

- Added taste audit regression tests (surprise counting, fade-stack detection, manifest semantics).
- Bumped release-surface synchronization tests to 0.11.0.
- Full suite: 284+ passed.

## 0.10.6 — Production Hardening Patch (2026-06-16)

### Hardening

- **Font locality audit** — Quality Audit now reports live Google Fonts runtime dependencies and missing project-local `@font-face` assets. Proxy/VPN remains the acquisition water pipe; `assets/fonts/` is the production warehouse.
- **Visibility risk audit** — detects dark-background + brightness/veil combinations that can pass lint while rendering too dim for viewers.
- **Finite-number guards** — rejects NaN/Infinity in arsenal durations, timeline scenes, proof times, and audited numeric fields.
- **Proof path locality** — proof directories/contact sheets must remain project-local; out-of-project paths now report `proof_path_outside_project`.
- **Release-prep test-team runner** — bumps the acceptance runner and instructions to v0.10.6.

### Tests

- Added regressions for external fonts, local font assets, low visibility, finite numeric validation, project-local proof paths, and v0.10.6 release-surface synchronization.

## 0.10.5 — Production Quality Layer (2026-06-15)

### Production QA

- **Timeline Manifest** — adds `core/timeline_manifest.py`, `scripts/framepack_timeline_manifest.py`, and `.framepack/timeline-manifest.json` sync/validation from HyperFrames Time Windows or `index.html` clip metadata, preserving locked scenes.
- **Production Quality Audit** — extends Quality Audit with timeline/proof issues such as `timeline_manifest_missing`, `timeline_duration_mismatch`, `timeline_scene_overlap`, `proof_missing`, `boundary_proof_missing`, and `contact_sheet_missing`, plus `--sync-timeline` and `--fail-on P0|P1|P2|P3`.
- **Proof workflow** — adds media probing, proof-frame extraction, contact-sheet generation, scene spec and timeline manifest templates, and the `framepack-production-quality` skill.
- **Hook sync** — HyperFrames production commands can trigger lightweight, non-blocking timeline ledger sync; discovery/init/help/version commands stay side-effect free.

### Tests

- Added timeline manifest, proof audit, production quality audit, hook no-op/sync, malformed numeric, and test-team auto-script regressions.

## 0.10.4 — Arsenal Binding Contract (2026-06-15)

### Arsenal Binding

- **Auto-created arsenal ledger** — `.framepack/arsenal.json` can be created/synced for projects that have not yet initialized the weapon registry.
- **Canonical weapon functions** — builtin weapon metadata now carries the callable function name, removing the drifting `WEAPON_TO_FUNCTION` map.
- **Actionable audit hints** — `manifest_weapon_not_called` includes canonical function and inline GSAP guidance so declared weapons are bound instead of silently hand-written.

### Tests

- Added arsenal creation, builtin function metadata, and manifest weapon binding regressions.

## 0.10.3 — Quality Beyond Lint (2026-06-15)

### Semantic Quality Audit

- **Framepack Quality Audit** — adds `core/quality_audit.py` plus `scripts/framepack_quality_audit.py` to emit JSON/Markdown reports for quality-beyond-lint failures: stale `.framepack/arsenal.json`, Manifest weapon registration gaps, manual `data-hf-id`, weapon parameter drift, and undeclared card-cascade implementations.
- **Report-first hook integration** — handoff-consuming HyperFrames commands now surface a non-blocking Quality Audit summary when `index.html` exists. This does not replace `npx hyperframes lint`, validate, snapshot, or render; it is the semantic 安检票 for issues lint cannot see.
- **Execution Manifest parser hardening** — scene-keyed YAML blocks with `params:` are now parsed, so real v0.10.x manifests reconcile correctly instead of silently producing an empty weapon list.
- **Builtin weapon catalog coverage** — registers the v0.10.3 Digital Soliloquy weapon set, including `typewriter-cursor`, `glitch-flicker`, `light-leak-cinema`, `elastic-scale-enter`, `gradient-shift`, `splittext-stagger-chars`, `float-3d-card`, and `card-cascade-reveal`.

### Tests

- Added quality-audit core, CLI, hook integration, manifest scene-block parser, and builtin catalog regression tests.

## 0.10.2 — Environment & Upgrade Manager groundwork (2026-06-14)

### Compatibility Lifecycle

- **Skill Install Manager** — adds source-driven official skill install planning with backup support, SHA-256 install manifests, atomic missing-source preflight, and post-install Framepack overlay application. It never fetches packages; callers must provide approved official skill sources.
- **Skill Upgrade Manager** — adds three-way upgrade decisions for official-old / official-new / local-current skills: replace, auto-merge user-local blocks, upstream-absorbed overlays, or manual-review on unproven edits/malformed markers.
- **Framepack Upgrade Report** — adds `scripts/framepack_upgrade_report.py` to combine doctor, install, skill-upgrade, and smoke JSON evidence into one report for Agent-managed upgrades.
- **Skill Overlay Apply Planner** — adds a report-first planner and dry-run-by-default CLI for applying Framepack hardening overlays to existing local HyperFrames skills. It never downloads skills, never calls package managers, preserves user-local hardening blocks, and blocks malformed managed markers for manual review.
- **Environment Doctor** — adds report-only first-run checks for Node/npm/npx, installed/project-local HyperFrames CLI presence, required local HyperFrames skills, and support-window status. The `scripts/framepack_doctor.py` wrapper emits JSON for Agent-managed install/upgrade decisions without mutating the user environment; it uses installed `hyperframes --version` plus `npx --no-install` fallback, never `npx --yes hyperframes@latest` during doctor checks.
- **HyperFrames support window policy** — adds pure support-window classification for supported, too-old, hard-too-old, newer-same-band, unknown-newer, and prerelease HyperFrames versions.
- **Guarded newer-version mode** — newer HyperFrames versions outside the tested window require capability probes and isolated `blank` smoke before Framepack handoff.
- **Skill overlay manager** — adds provenance-marked Framepack hardening blocks that can be inserted/updated idempotently while preserving user-local hardening notes.
- **Machine-readable support matrix** — adds `compat/hyperframes-support.json` as the first support-window metadata file.

### Tests

- Added Environment Doctor, Skill Overlay Planner, Skill Install Manager, Skill Upgrade Manager, upgrade report, support-window, and skill-overlay tests plus security regressions for tar extraction, proxy credential redaction, quoted-shell command detection, malformed managed marker blocking, atomic missing-source install preflight, and prerelease version handling. Full plugin suite: 182 passed.

## 0.10.1 — HyperFrames Compatibility Adapter (2026-06-13)

### Upstream Adaptation

- **HyperFrames Compatibility Adapter** — centralizes CLI command classification so Framepack distinguishes handoff-consuming commands from discovery, registry, media, and cloud commands.
- **Capability snapshots** — adds `.framepack/hyperframes-capabilities.json` support with version, command, flag, registry, and offline-baseline metadata.
- **Registry fallback policy** — treats official `catalog/add` as opportunistic and keeps `blank` as the verified offline-safe baseline instead of hardcoding richer examples that may timeout or be unavailable.
- **China/VPN-aware proxy retry** — when official registry calls fail or return empty, Framepack probes env/npm/git/Windows proxy settings, retries once with proxy environment variables, redacts credentials in reports, then degrades gracefully to `blank` + local arsenal if still unavailable.
- **Official skill diff reports** — compares npm-packaged HyperFrames skills against local patched skills and reports merge candidates without blindly overwriting local hardening rules.
- **Upstream watcher script** — adds `framepack-plugin/scripts/hyperframes_upstream_report.py` to generate capability + skill-diff reports for cron/manual review.

### Hook Hardening

- `npm view hyperframes ...` no longer triggers HyperFrames handoff warnings.
- `info/doctor/upgrade/browser/docs/compositions/benchmark/help/version/init/catalog/add/capture/tts/transcribe/remove-background` no longer require `frame.md`.
- Unknown new HyperFrames commands default conservative (`requires_handoff`) until the adapter classification table is updated.

### Tests

- Added adapter tests for command-position parsing, command categories, help/flag parsing, capability snapshots, registry failure/proxy-retry fallback, proxy credential redaction, and skill diff reporting.

## 0.10.0 — Arsenal Registry Runtime (2026-06-12)

### Arsenal Registry

- **Project-local registry runtime** — creates and preserves `.framepack/arsenal.json` plus `.framepack/weapons/` without creating placeholder `state.json`.
- **Execution Manifest reconciliation** — parses manifest weapon references, registers known builtin weapons, marks unreferenced active weapons as `unused`, and reports unknown/HANDWRITE entries as non-blocking warnings.
- **Builtin weapon catalog** — adds a concrete runtime catalog for canonical weapons such as `text-split-enter`, `caption-clip-wipe`, `bg-blur-mask`, and `rules.hyperframes-render-safe`.
- **Trusted-source whitelist** — aligns download governance around `framepack://`, `nexu.io`, `codepen.io/@gsap`, and `github.com/hyperframes`, while rejecting random GitHub/CDN sources.
- **Hook integration** — expanded-prompt writes now create/reconcile Arsenal automatically; HyperFrames commands run a non-blocking Arsenal preflight before lint/preview/render.

### Reference Miner / Replica Mode

- **Scripted + Adaptive modes documented** — five scripts are standard measuring instruments, not a hard blocker; Adaptive Mode must record ffmpeg commands, scene threshold, frame sampling rate, audio method, assumptions, and weak spots.
- **Replica visual QA loop** — snapshot contact sheet → visual issue list → targeted fixes → second snapshot → `data-hf-id count = 0` before final render.
- **P2 warning classification** — `timeline_track_too_dense`, `overlapping_gsap_tweens`, and `gsap_studio_edit_blocked` are tracked as engineering hygiene warnings, not draft-render blockers.

### Tests

- Added Arsenal Registry, builtin catalog, Execution Manifest parser, trusted-source, hook integration, and Reference Miner contract tests.

## 0.9.4 — Replica Mode Render Integrity (2026-06-12)

### Replica Mode

- **Replica Mode deliverables formalized** — reverse-copy work must produce `VIDEO_DNA.md`, `.hermes/content_decomposition.md`, and `TEMPLATE_BLUEPRINT.md` before HTML implementation.
- **Blueprint as source of truth** — HyperFrames HTML must implement from `TEMPLATE_BLUEPRINT.md`, not freeform imagination.
- **Ambiguity ban** — Replica handoff docs must not leave `if strict`, `maybe`, `optionally`, `merge if needed`, or `no outgoing transition`; convert them into locked decisions or explicit approved exceptions.

### HyperFrames Render Integrity

- **Root composition duration guardrail** — root composition must declare explicit `data-duration="TOTAL_SECONDS"`; do not rely on GSAP timeline inference, because final holds/outros can be trimmed while render still exits successfully.

### Engineering

- Regression tests added for root `data-duration`, Replica Mode deliverables, and Replica ambiguity ban.

## 0.9.3 — Ederson Test-Team Hardening (2026-06-12)

### HyperFrames Safety

- **Clip root animation ban clarified** — `class="clip"` elements are HyperFrames timing shells; opacity/filter/transform transitions must target `.scene-inner` / `#sN-inner` wrappers.
- **Director checklist hardened** — expanded-prompt now requires an inner visual wrapper per clip before the Execution Manifest.
- **Guardrails updated** — project AGENTS.md managed block now carries the inner-wrapper rule via Guardrail Hydrator.

### Weapon Library

- **text-split-enter CSS contract fixed** — `.split-left` and `.split-right` must contain identical text; `.split-right` is absolutely positioned over `.split-left` and both halves are clipped with complementary `clip-path` rules.

### Workbench Docs

- **`.framepack/state.json` de-ghosted** — clarified as future project metadata, not a v0.9.x required file. Do not create empty placeholder state files.

### Engineering

- Regression tests added for clip-root guardrails and text-split CSS contract.
- 54/54 plugin tests pass.

## 0.7.10 — Workbench Readiness Gate + DESIGN/TOKENS Hooks (2026-06-09)

### Core

- **Two-layer gate in pre_tool_call** — before any `index.html` write, the Plugin now checks:
  - **Gate 1: Workbench Readiness** — verifies STORYBOARD.md, COMPOSITION.md, DESIGN.md, DESIGN_TOKENS.md exist
  - **Gate 2: HTML Contract Audit** — existing data-width/height/start, Math.random, ScrollTrigger regex checks
  - Both gates are "warn, don't block" — agent can proceed but sees severity-ranked feedback
  - Missing critical docs → 🚨 STOP injection; missing recommended docs → 💡 nudge

### New Hooks

- **DESIGN.md LLM analysis** (post_tool_call) — reviews typography hierarchy, color intent, visual language quality
- **DESIGN_TOKENS.md structural validation** (post_tool_call) — checks all token categories present (color, font, spacing, animation, effects, timing, beat markers)

### Engineering

- 158/158 tests pass (up from 127)
- `plugin.yaml` now declares both `pre_tool_call` and `post_tool_call` hooks
- Homepage URL corrected to `https://github.com/ARTHUR-BBU/framepack`

## 0.7.6 — Injection Safety + Skill Caching (2026-06-08)

### Safety

- **Prompt injection sanitization**: `_sanitize_message()` strips 6 dangerous instruction patterns from LLM output before injection
- **`_safe_inject()` wrapper**: all 10 `inject_message` calls wrapped in try/except, failures logged not propagated
- `max_tokens` bumped from 512 → 1024 to prevent JSON truncation from silent analysis drops

### Bug Fixes

- Issue count bug fixed: section headers no longer counted as real issues in message builders
- `Math.random` detection now case-insensitive (`scrollTrigger` caught, not just `ScrollTrigger`)
- `FLIP` detection now case-insensitive

### Engineering

- Skill file loading cached at module level (one disk read per session, not per trigger)
- `core/arsenal.py` and `core/trusted_sources.py` wired into hooks via dual-path import
- `_VALID_WEAPON_IDS` dynamically derived from `BUILT_IN_ARSENAL` (single source of truth)

## 0.7.5 — VIDEO_DNA + TEMPLATE_BLUEPRINT Structural Validation (2026-06-08)

### New Hooks

- **VIDEO_DNA.md structural validation** — checks 7 DNA dimensions present (rhythm, scene roles, visual grammar, motion grammar, asset requirements, reusable slots, HyperFrames constraints)
- **TEMPLATE_BLUEPRINT.md structural validation** — checks 3 blueprint sections present (template metadata, scene slots, weapon assignments)
- Both use zero-token structural analysis (pure Python section-header checks), no LLM cost

## 0.7.4 — Arsenal Validation + framepack-gsap Skill (2026-06-08)

### New Hooks

- **arsenal.json validation** (post_tool_call) — validates weapon IDs against known catalog, flags unknown IDs as potential injection, warns on missing mandatory weapons, nudges on missing recommended weapons
- Zero tokens: pure JSON validation, no LLM
- Clean arsenal → NO injection (silence is the best feedback)

### New Skills

- `framepack-gsap` — GSAP API reference, HyperFrames safety rules, 6 animation recipes (8.9KB)

## 0.7.3 — pre_tool_call Gate (2026-06-08)

### New Hooks

- **pre_tool_call** — scans `write_file` args for HyperFrames violations BEFORE writing
  - 3 P0 violations (missing data-width/height/start) → 🚨 STOP injection
  - 3+ P1 violations (Math.random, repeat:-1, ScrollTrigger) → ⚠️ WARNING
  - Zero token cost: 8 pure regex checks
- Case-insensitive code matching for all checks

## 0.7.2 — HTML Regex Audit (2026-06-08)

### New Hooks

- **index.html regex audit** (post_tool_call) — 8 deterministic checks: data-width, data-height, data-start, Math.random, repeat:-1, ScrollTrigger, FLIP, window.__timelines
- Zero token cost: pure regex, no LLM
- Runs every time index.html is written

## 0.7.1 — COMPOSITION.md LLM Analysis (2026-06-08)

### New Hooks

- **COMPOSITION.md LLM analysis** (post_tool_call) — reviews template coverage, weapon assignment appropriateness, transition design, HyperFrames compatibility
- Uses `ctx.llm.complete()` with `framepack-template-fuser` skill content injected into system prompt
- JSON output parsed for structured feedback injection

## 0.7.0 — Hermes Agent Plugin (2026-06-08)

### Architecture Shift

- **Complete paradigm shift: from CLI/MCP tool to Hermes Agent Plugin.**
  - v0.6: agent calls Framepack like a tool (CLI + MCP)
  - v0.7: Framepack lives inside the agent loop, hooks into tool calls, and proactively injects advice
  - MCP officially retired (code preserved for reference, not maintained)
  - CLI demoted to Plugin's underlying engine; Plugin is the primary interface

### Plugin Core

- `plugin.yaml` — Hermes Plugin manifest with metadata, hooks declaration, and skill registration
- `__init__.py` — `register(ctx)` entry point, registers 6 skills and 2 hooks
- `core/arsenal.py` — weapon recommendation engine (259 lines, translated from v0.6 TypeScript)
- `core/trusted_sources.py` — security gate for weapon source URLs (76 lines)

### Hooks (6 triggers, 2 hooks)

- **pre_tool_call** 🚨 — scans `write_file` args for HyperFrames violations BEFORE writing
  - 3 P0 violations → 🚨 STOP injection
  - 3+ P1 violations → ⚠️ WARNING
  - Zero token cost, pure regex (8 checks)

- **post_tool_call** — 5 file-type triggers:
  - 📋 `STORYBOARD.md` → LLM analysis (project type, structure, HyperFrames issues, weapon recommendations)
  - 🎬 `COMPOSITION.md` → LLM template-fit review (coverage, template appropriateness, HyperFrames compatibility)
  - 🔍 `index.html` → regex audit (8 checks: data-width/height/start, Math.random, repeat:-1, ScrollTrigger, FLIP, window.__timelines)
  - 🔫 `arsenal.json` → weapon validation (known IDs, mandatory weapons, recommended weapons)
  - 🧬 `VIDEO_DNA.md` / `TEMPLATE_BLUEPRINT.md` → structural completeness check (7 DNA dimensions, 3 blueprint sections)

### Skills (6 production skills)

- `framepack-director` — storyboard structure, 10 project types, 8 HyperFrames rules, weapon mapping
- `framepack-template-fuser` — scene-to-template matching rules, coverage requirements
- `framepack-hyperframes-builder` — P0/P1/P2 render safety constraints, scene lifecycle
- `framepack-arsenal` — 9 built-in weapons, recommendation rules, trusted source whitelist
- `framepack-gsap` — GSAP API reference, HyperFrames safety rules, 6 animation recipes (8.9KB)
- `framepack-reference-miner` — 7-dimension video DNA methodology, structured templates (7.2KB)

### Safety

- Prompt injection sanitization: `_sanitize_message()` strips 6 dangerous instruction patterns from LLM output before injection
- `_safe_inject()` wrapper: all 10 `inject_message` calls wrapped in try/except, failures logged not propagated
- `max_tokens` bumped from 512 → 1024 to prevent JSON truncation
- Issue count bug fixed: header strings no longer counted as real issues
- `Math.random` detection now case-insensitive
- Skill file loading cached at module level (one read per session)

### Engineering

- **127/127 tests pass** (pytest, 0.53s)
- Hook file: 1130 lines (up from 845)
- Legacy v0.6 CLI: 221/221 tests pass
- `core/arsenal.py` and `core/trusted_sources.py` wired into hooks (no more dead code)
- `_VALID_WEAPON_IDS` dynamically derived from `BUILT_IN_ARSENAL` (single source of truth)

## 0.6.0-alpha.4

- align the public naming with the chosen product phrase
  - Framepack now serves HyperFrames programmatic commercial video ideation and composition
  - README, Chinese README, package metadata, AGENTS, and agent templates now reflect `面向 HyperFrames 程式化商业视频创意与编排`
- reposition Framepack around the agent arsenal model
  - Framepack is now documented and wired as the agent's advisor, producer, arsenal manager, and HyperFrames quality gate rather than the creative director
  - workbenches now include `STORYBOARD.md` and `.framepack/arsenal.json` as first-class context files
  - `framepack arsenal list|recommend|add|save|cache` manages reusable weapons, trusted cached resources, project remixes, and saved template combinations
  - `framepack reference mine --project-dir <dir> --video <file>` creates `VIDEO_DNA.md`, refreshes `STORYBOARD.md`, and writes `TEMPLATE_BLUEPRINT.md`
  - added `event-promo`, `sports-highlight`, `transfer-announcement`, and `player-tribute` workflow routes, with event promos treated as a primary video category
  - workbench validation and audit now detect missing storyboard and project arsenal manifests
  - README, Chinese README, AGENTS, package metadata, and tests now protect the arsenal-first positioning
  - 221/221 tests pass; sandbox benchmark remains 100/100; `npm pack --dry-run --json` succeeds
- add semantic content materialization for workbench builds
  - `framepack build` now preserves `idea` in machine state and uses it with `COMPOSITION.md`, assets, and scene descriptions to fill visible scene copy
  - sports/player-style tests verify real subject text such as Ederson and Manchester United appears in generated HTML
  - build output is guarded against generic placeholder leakage such as `Your Brand`, `Coming Soon`, `Showcase the key feature`, and `Key Metric`
- add project content graph and terminal director board
  - build writes `.framepack/content-graph.json`
  - `framepack workbench graph --project-dir <dir>` shows scene timing, title, subtitle, template, asset, and risk flags for humans and agents
  - `framepack workbench graph --json` exposes the same graph for automation
- add YAML scene template contracts
  - 20 built-in scene templates now include `.template.yaml` metadata for best use, required slots, visual signature, content rules, fallback policy, license, and provenance
  - template loading prefers YAML contracts while keeping existing JSON template metadata compatible
- improve idea entity extraction for multi-word names and roles
- update README and tests for content graph, semantic build, and YAML template contracts
- 218/218 tests pass

## 0.6.0-alpha.3

- add GSAP Motion Skill Registry as a template-attached motion layer
  - first batch includes 12 internal motion recipes across Hero, Text, Product, Data, Layout, Scroll Story, FLIP, and Scrubbed Sequence
  - `recommendPolishArsenal`, `templates recommend`, and `catalog recommend` now expose GSAP motion recommendations
  - `COMPOSITION.md`, `.framepack/state.json`, and `HUMAN.md` record selected motion skills for agent handoff
  - `framepack build` converts selected motion skills into HyperFrames-safe GSAP timeline code
  - ScrollTrigger, FLIP, and scrubbed walkthrough intent is translated into render-safe timeline beats by default
- add active intervention context across the workbench lifecycle and recommendation commands
  - `create`, `workbench brief/check/audit`, `build`, `preview`, `render`, `templates recommend`, `templates prompt recommend`, and `catalog recommend` expose `interventionContext` in JSON output
  - shortcut text now uses stable Xiaobai wording to avoid Windows terminal encoding corruption
- add lifecycle cost gates for 0.6 workbench projects
  - `build`, `preview`, and `render` stop on P0 blockers by default
  - `--force` records bypass evidence in `.framepack/interventions.jsonl` and `ITERATIONS.md`
- add project supervision surfaces
  - `.framepack/preferences.json`
  - `framepack workbench preferences`
  - `framepack workbench friction`
  - `framepack workbench learnings`
- add recurring friction risk detection
  - repeated friction categories now appear as P1 `recurringRisks`
  - preview/render command failures and manual bypass signals are captured in `.framepack/friction.jsonl`
- add 0.6 workbench beta-test evidence
  - Chinese manual test guide: `docs/agent-platform/manual-beta-test-guide-v0.6.zh-CN.md`
  - three customer-style workbench trials: SaaS launch, course promo, and data/news explainer
  - `npm run workbench:trials` produces `out/workbench-trials-v0.6/latest/WORKBENCH_TRIAL_REPORT.md`
- update README, Chinese README, AGENTS, Codex skill, Claude Code instructions, tests, and sandbox benchmark for the active-intervention and GSAP motion workflow
- 215/215 tests pass; sandbox benchmark remains 100/100; workbench trials pass 3/3

## 0.6.0-alpha.2

- restore the `create -> build -> preview/render` runtime contract after the 0.6.0-alpha.1 regression
  - `create` and `build` now produce `meta.json` for HyperFrames runtime commands
  - `build` preserves `data-start`, `data-width`, and `data-height` on the composition root
  - `build` no longer emits missing `compositions/blocks/*.html` references when block templates are not installed
  - timed `<video>` elements are kept out of timed scene containers to avoid frozen renders
- update CLI help to list `build`, `preview`, `render`, and the full `scene-templates` surface
- infer useful categories for GSAP/Remotion community registry results instead of falling everything back to `opening`
- add regression coverage for the runtime contract, block-reference safety, video nesting, CLI help, and external registry categorization
- add product-level sandbox benchmark coverage for create, workbench check, brief, build, phase audits, templates, Catalog, MCP SDK, and HyperFrames lint
- add lifecycle audit gates: `preflight`, `design`, `composition`, `preview`, `render`, and `all`
- update public README, Chinese README, AGENTS, and agent templates to match the 0.6 workbench/audit workflow
- 206/206 tests pass

## 0.6.0-alpha.1

- add external template registry support
  - `framepack scene-templates registries` — list available registries (HyperFrames blocks, GSAP community, Remotion community)
  - `framepack scene-templates search --registry <id>` — search external templates
  - `framepack scene-templates install --id <template-id> --registry <id>` — download and install external template
  - `fetchRegistryIndex()` — fetch with 1-hour local cache, offline fallback
  - `installExternalTemplate()` — download HTML and save as local template
- `listRegistries()` — list default template registries
- 200/198 tests pass (2 new: registry listing, registries CLI)

## 0.5.0-beta.1

Beta milestone — all P0+P1 issues from alpha.20 test report resolved.

### P0 Issues (all cleared)
- overlay z-index blocking scene content → fixed
- `:first-child` / `:first-of-type` not matching scenes → explicit `#scene-0 { opacity: 1 }` ID selector
- All scenes initial opacity:0 with no recovery → explicit ID-based CSS + GSAP

### P1 Issues (all resolved)
- video as composition root child causing black frame → video inside scene div + GSAP opacity control
- Asset files not auto-copied → `createWorkbenchProject` copies assets to project dir
- HyperFrames render --audio not working → `framepack render --with-audio` wraps hyperframes + ffmpeg

### New since alpha.20
- 20 built-in scene templates (6 categories: opening/name-reveal/stats/footage/cta/transition)
- Entity extraction from idea text (names, numbers, actions, style, duration)
- Scene template matching in skeleton + build
- `framepack build` one-click compilation from planning files to HTML
- `framepack preview --open` auto-opens browser
- `framepack render --with-audio` ffmpeg audio merge
- `framepack template save` agent template persistence
- 3 MCP knowledge query tools (querySceneTemplate, recommendAnimation, getComponentCode)
- MCP knowledge resources (video design best practices, HyperFrames rules, scene template index)
- External template registry interface
- 198 tests passing

## 0.5.0-alpha.26

- add `framepack build` command — one-click compilation from planning files to previewable HTML
  - reads COMPOSITION.md + DESIGN_TOKENS.md + ASSETS.md + .framepack/state.json
  - parses Scene Shape descriptions for richer scene context
  - extracts Code Templates from COMPOSITION.md for enhanced GSAP transitions
  - matches scene templates per role with entity filling
  - generates complete index.html with GSAP timeline
- `buildWorkbenchProject()` core function in workbench module
- 198/195 tests pass (3 new: build generates HTML, build fails without state, build CLI flag)

## 0.5.0-alpha.25

- add `framepack preview --open` — wraps hyperframes preview + auto-opens browser (start/open/xdg-open)
- add `framepack template save` — save agent-created scenes as reusable templates
  - `--name`, `--category`, `--tags` required; `--html-file` optional; `--project-dir` for project-scoped save
  - saved templates auto-indexed by matching engine and returned by scene-templates list + MCP
- all 17 scene roles now match to built-in scene templates (verified)
- 195/193 tests pass (2 new: preview --open, template save round-trip)

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
