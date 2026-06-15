# Framepack v0.10.6 Hardening Design

> Status: draft for 老田 review. No implementation until approved.

## Goal

Ship v0.10.6 as a focused hardening release after v0.10.5: close the test-team gaps that make agents rely on "悟性" instead of machine-checkable contracts.

一句话：v0.10.5 是“有安检员了”，v0.10.6 要让安检员不只会看票，还会看人是不是拿错道具、穿错鞋、灯是不是黑到观众看不见。

## Inputs

- v0.10.5 test report: `C:/Users/LENOVO/Documents/AI-Coach-Vault/Windows/2026-06-15-Framepack-v0.10.5-测试报告.md`
- Current handoff: `F:/hyperframes/.hermes/CONTEXT.md`
- Current source modules:
  - `framepack-plugin/core/quality_audit.py`
  - `framepack-plugin/core/arsenal_registry.py`
  - `framepack-plugin/core/proof_audit.py`
  - `framepack-plugin/scripts/framepack_quality_audit.py`
  - `framepack-plugin/tests/`

## Non-goals

- Do not turn Framepack into an HTML writer.
- Do not patch/render user HTML automatically.
- Do not replace HyperFrames lint/snapshot/render.
- Do not build the v0.11 Taste/Benchmark system in this release.

## Proposed scope

### 1. Weapon Binding Audit — Manifest 到 HTML 的“道具验票”

Problem:
Execution Manifest says `weapon: text-split-enter` + `code: references/text-split-enter.js`, but the generated HTML may handwrite a lookalike GSAP implementation instead of calling the canonical function. Current audit can catch parameter drift when canonical calls exist, but does not strongly detect “weapon declared but canonical function absent”.

Design:
- Extend `quality_audit.py` with a dedicated weapon binding audit.
- For each non-HANDWRITE manifest weapon:
  - resolve canonical weapon metadata from `builtin_weapons.py` / arsenal.
  - require the canonical function name to appear in `index.html` when known.
  - if missing but inline GSAP lookalike signals exist, emit P1 `manifest_weapon_not_called` with explicit action item.
  - if missing and no lookalike signals, emit P1/P2 depending on weapon criticality.
- Keep report-first behavior.

Acceptance:
- Test fixture with manifest declaring `text-split-enter` and HTML using inline `gsap.fromTo(...)` should emit `manifest_weapon_not_called`.
- Test fixture with canonical `textSplitEnter(...)` call should not emit it.

### 2. Font Locality / Network Dependency Audit — 字体别走 Google 远水；有 VPN 就走代理水管

Problem:
Google Fonts is unreliable when direct access is blocked, but many domestic users run a local VPN/proxy. The correct product behavior is not “external access impossible”; it is “detect local proxy/VPN and use the same proxy-aware access pattern already solved for HyperFrames catalog.” Current Framepack/HyperFrames guidance does not clearly distinguish runtime video portability from proxy-assisted acquisition.

Design:
- Add a static CSS/HTML audit in `quality_audit.py`:
  - detect `fonts.googleapis.com`, `fonts.gstatic.com`, `@import url(...)` font imports.
  - detect font-family names used without local `@font-face` for common CJK/project fonts when assets are missing.
  - produce P1 `external_font_dependency` when final HTML depends on live Google Fonts at render/playback time.
  - produce P2 `font_face_missing_local_asset` when `@font-face` exists but local asset path does not exist.
- Add proxy-aware acquisition guidance:
  - before downloading/visiting catalog/registry/font resources, detect `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, and common local proxy ports.
  - if a proxy is available, use it for acquisition instead of declaring the resource unavailable.
  - after acquisition, prefer project-local `assets/fonts/` so renders are portable and do not depend on live external URLs.
- Add Framepack Director / guardrail doc note: prefer local font assets in `assets/fonts/`, especially for CJK; proxy is for acquisition, local assets are for production portability.

Acceptance:
- Fixture with Google Fonts link emits P1.
- Fixture with `@font-face src: url('assets/fonts/NotoSansSC-VF.ttf')` and file present emits no issue.
- Fixture with local `@font-face` but missing file emits P2.

### 3. Visual Visibility Audit — 黑屏不是风格，是事故

Problem:
Dark background + low brightness/filter/veil can pass lint while snapshots are visually too dark. The v0.10.5 test caught S1 p95 black-screen risk manually.

Design:
- Start with a static heuristic, not full image analysis:
  - parse `frame.md` colors for background/accent/primary luminance.
  - parse `index.html` for `brightness(<0.5)`, black overlays with high opacity, and foreground/accent colors near background luminance.
  - emit P2 `low_visibility_risk` with scene/context details.
- Optional future v0.11: image-based proof-frame luminance audit.

Acceptance:
- Fixture with `#0a0a0c` background + `filter: brightness(0.3)` emits P2.
- Fixture using dark veil overlay but readable foreground should avoid false P1/P0; may emit no issue or P3 informational depending heuristic.

### 4. Numeric Hardening — NaN/Infinity 是账本里的蟑螂

Problem:
`float('nan')` and `float('inf')` can sneak through coercion in duration/proof/timeline fields. They are numbers to Python but poison to JSON/timelines.

Design:
- Centralize finite-number validation helper, likely in quality/timeline/proof modules or small utility.
- Reject NaN/Infinity in:
  - arsenal duration
  - timeline scene start/duration
  - proof times
  - manifest numeric params where audited
- Emit P0/P1 depending field criticality.

Acceptance:
- Tests cover `NaN`, `Infinity`, `-Infinity`, string variants, and normal finite numbers.

### 5. Proof Path Project-local Audit — 证据不能写到隔壁工地

Problem:
Proof paths should be project-local, or at minimum produce a warning when absolute/out-of-project paths are used.

Design:
- Extend `proof_audit.py`:
  - resolve `proofs.directory`, `proofs.contact_sheet`, and proof file paths if any.
  - if path escapes `project_dir`, emit P1 `proof_path_outside_project`.
  - if absolute path is inside project, allow but suggest relative path as P3.

Acceptance:
- `../outside/proofs` emits P1.
- `C:/tmp/proofs` emits P1.
- `.framepack/proofs` emits no issue.

### 6. Timeline Manifest Structure Guidance — 场记账本要更显眼

Problem:
The test report says timeline info lives too much in prose; v0.10.5 claim is less visible from `frame.md` / `expanded-prompt.md`.

Design:
- Do not duplicate full timeline in `frame.md` unless product direction changes.
- Instead add an explicit `Timeline Manifest` handoff block in expanded-prompt template / Director guidance:
  - total duration
  - scene id/start/duration
  - proof frame labels/times
  - continuity / carryover notes
- Ensure `timeline_manifest.py` can parse or sync from that block consistently.

Acceptance:
- Director skill/template includes visible structured timeline block.
- Existing parser tests prove it syncs to `.framepack/timeline-manifest.json`.

## Version positioning

Recommendation: v0.10.6 = “Production Hardening Patch”.

Why not v0.11:
- The work is important but still follows v0.10.x architecture.
- It closes release-report holes rather than introducing the new Taste/Benchmark product axis.
- v0.11 should stay reserved for Aesthetic Benchmark / Director Taste System.

## Alternative approaches considered

### Option A — Small patch only
Fix only NaN/proof path and documentation.

Pros: fast.
Cons: leaves the big “weapon contract not enforced” problem alive.

### Option B — Full v0.11 taste system now
Jump directly into aesthetic benchmark and external template comparison.

Pros: exciting and strategically important.
Cons: builds a new roof while the v0.10 foundation still has water leaks.

### Option C — Recommended: v0.10.6 hardening bundle
Close the release-report gaps with tests and audit extensions, then open v0.11 cleanly.

Pros: focused, testable, lowers future agent mistakes.
Cons: less glamorous than v0.11, but much better engineering hygiene.

## Test strategy

All implementation must use TDD.

Expected test targets:
- `framepack-plugin/tests/test_quality_audit.py`
- `framepack-plugin/tests/test_proof_audit.py`
- `framepack-plugin/tests/test_storyboard_hook.py` if template/hook behavior changes
- `framepack-plugin/tests/test_deploy_manifest.py` if version surfaces bump to 0.10.6

Release verification after implementation:
- `cd framepack-plugin && python -m pytest tests/ -q -o "addopts="`
- `python scripts/test_team_v0105_auto_test.py ...` should be duplicated or bumped to v0106 when version bump happens.
- Deployed plugin sync + smoke test.
- Security scan before commit/release.

## Risks

- Static visibility audit can false-positive. Keep it P2/P3 until image-based proof audit exists.
- Weapon binding audit depends on canonical function metadata being complete. Missing metadata should become a clear `weapon_binding_metadata_missing` warning, not a crash.
- Font audit overlaps with HyperFrames warnings. Framepack should frame it as production-environment guidance, not claim ownership of font loading.

## Open questions for 老田

1. Should v0.10.6 include the actual version bump in the first implementation pass, or do hardening first under unreleased HEAD and bump at release-prep time?
2. Should `manifest_weapon_not_called` be P1 always, or P0 when the weapon is non-HANDWRITE and has a canonical function?
3. For visual visibility audit, do we accept static heuristics now, or require screenshot/pixel analysis immediately?

## Recommended decision

Proceed with v0.10.6 hardening under unreleased HEAD first, no version bump until the feature set is green. Treat `manifest_weapon_not_called` as P1 for now, with a future option to escalate selected critical weapons to P0. Start visibility audit as static P2 heuristic, then graduate to proof-frame image analysis in v0.11.
