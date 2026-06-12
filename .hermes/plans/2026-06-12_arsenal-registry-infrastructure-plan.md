# Framepack Arsenal Registry Infrastructure Implementation Plan

> **For Hermes:** Use test-driven-development + requesting-code-review when implementing this plan. This is a new infrastructure feature; do not skip RED/GREEN/REFACTOR.

**Goal:** Turn Framepack's weapon arsenal from a skill-level governance idea into a runtime-enforced project registry system.

**Architecture:** Guardrail Hydrator v0.9.2 manages Agent behavior rules (“管人”). Arsenal Registry v0.9.3/v0.10.0 will manage animation assets (“管物”). The project-local `.framepack/arsenal.json` becomes the source of truth for weapon availability, provenance, deduplication, manifest reconciliation, and lifecycle status. Existing `core/arsenal.py` and `core/trusted_sources.py` should be reused and upgraded, not duplicated.

**Tech Stack:** Python hooks, JSON registry, pytest, existing Framepack plugin layout.

---

## 0. Current Context

### Existing useful foundation

Files already present:

- `framepack-plugin/core/arsenal.py`
  - Contains dataclasses for `ArsenalSource` and `ArsenalItem`.
  - Contains `BUILT_IN_ARSENAL` and `recommend_arsenal()`.
  - Current role: recommendation/catalog brain.
  - Missing role: project registry CRUD / schema validation / manifest reconciliation.

- `framepack-plugin/core/trusted_sources.py`
  - Contains trusted source pattern registry and `is_trusted_url()`.
  - Current trusted list is GSAP/npm/CDN/framepack focused.
  - Needs alignment with Framepack guardrails whitelist:
    - `nexu.io`
    - `codepen.io/@gsap`
    - `github.com/hyperframes`
    - `framepack://`
    - approved runtime CDNs if needed.

- `framepack-plugin/skills/framepack-arsenal/SKILL.md`
  - Already describes the intended lifecycle:
    - FIND
    - REGISTER
    - DEDUPLICATE
    - USE
    - AUDIT
    - ARCHIVE

- `AGENTS.md` / `guardrails.md`
  - Describe `.framepack/arsenal.json` as weapon registry.
  - Mention `.framepack/state.json`, but state.json currently has no runtime consumer.

### Current problem

The arsenal registry design exists as policy, but not as runtime enforcement.

Right now Agent behavior depends on skill compliance:

```text
skill says: read/register/audit weapons
agent hopefully obeys
```

Target behavior:

```text
hook/core code initializes, validates, reconciles, and warns
agent gets deterministic registry state
```

### Product metaphor

- Guardrail Hydrator = 管人：Agent 行为纪律。
- Arsenal Registry = 管物：动画资产纪律。

Guardrail Hydrator prevents the Agent from ignoring process.
Arsenal Registry prevents project weapons from becoming an untracked junk drawer.

### Reference Miner lesson from GPT-5.5 test run

The Ederson/reference-copy test exposed a second infrastructure lesson: strong models can keep working even when the planned Reference Miner script pack is missing.

In the test run, `framepack:framepack-reference-miner` expected five Phase 0 scripts:

- `scene-detect.py`
- `motion-analyze.py`
- `color-extract.py`
- `audio-analyze.py`
- `content-decompose.py`

They were not available in the deployed plugin, so GPT-5.5 built an inline `ffmpeg + Python` fallback pipeline and continued the reverse-analysis task.

This changes the product framing:

```text
Wrong framing:
五件套 = 模型不会干活时的拐杖

Better framing:
五件套 = 标准量具 / 可复现实验仪器
```

A strong model is like a master craftsperson who can measure a room by eye and still build the cabinet. The script pack is the laser measure: not required for raw capability, but required for repeatability, testing, benchmarking, and cost control.

Implication for future Reference Miner design:

```text
Tier 0 — Adaptive Mode
  If scripts are unavailable, Agent may build an inline ffmpeg/Python pipeline.
  It MUST record commands, thresholds, sampling rate, and assumptions into reference-analysis.md.

Tier 1 — Scripted Mode
  If scripts are available, use the standard five scripts to produce reproducible JSON.
  Recommended for formal copy tasks, benchmark runs, regression tests, and multi-agent handoff.

Tier 2 — Vision/LLM Enrichment
  Model consumes JSON + keyframes to produce semantic scene understanding.

Tier 3 — Creative Reconstruction
  Framepack converts the analysis into frame.md + expanded-prompt.md + Execution Manifest.
```

Design rule:

- Do not make the five scripts a hard blocker.
- Do make the chosen analysis mode explicit in outputs.
- Do make Scripted Mode the preferred path when available.
- Do require Adaptive Mode to log enough detail that another run can reproduce or audit it.

This is adjacent to Arsenal Registry rather than the same subsystem:

- Reference Miner scripts standardize **how reference videos are measured**.
- Arsenal Registry standardizes **how selected animation weapons are registered and reused**.

Both are product-standardization layers, not model-capability crutches.

---

## 1. Non-goals

Do NOT implement these in the first pass:

- Do not build a full download manager.
- Do not auto-fetch arbitrary web snippets.
- Do not introduce `state.json` until it has a real consumer.
- Do not modify HyperFrames.
- Do not make arsenal validation block all work by default; start with warnings + deterministic repair where safe.
- Do not replace the creative director’s weapon choice logic; only govern the registry and lifecycle.

---

## 2. Versioning Decision

Separate plugin version from arsenal schema version.

### Plugin version

Stored in:

- `framepack-plugin/plugin.yaml`
- SKILL.md frontmatter
- docs/loggers

Example:

```yaml
version: 0.9.3
```

### Arsenal schema version

Stored inside `.framepack/arsenal.json`:

```json
{
  "schema_version": "1.0.0",
  "plugin_version_created": "0.9.3",
  "plugin_version_updated": "0.9.3"
}
```

Do not use the old top-level `version` field ambiguously.
If legacy arsenal has `version: "0.7.10"`, migrate it to:

```json
{
  "schema_version": "0.7.10",
  "migrated_from_version": "0.7.10"
}
```

Then normalize to `schema_version: "1.0.0"` after migration.

---

## 3. Target `.framepack/arsenal.json` Schema v1

Canonical shape:

```json
{
  "schema_version": "1.0.0",
  "project": "Framepack-01-test",
  "created_at": "2026-06-12T00:00:00Z",
  "updated_at": "2026-06-12T00:00:00Z",
  "plugin_version_created": "0.9.3",
  "plugin_version_updated": "0.9.3",
  "weapons": {
    "text-split-enter": {
      "id": "text-split-enter",
      "source": "builtin",
      "kind": "part",
      "skill": "framepack:framepack-animation-library",
      "file": "parts/text-split-enter.md",
      "code": "parts/references/text-split-enter.js",
      "hash": null,
      "used_by": ["scene_1"],
      "status": "active",
      "registered_at": "2026-06-12T00:00:00Z",
      "updated_at": "2026-06-12T00:00:00Z"
    },
    "nexu-marble-intro": {
      "id": "nexu-marble-intro",
      "source": "web",
      "kind": "block",
      "url": "https://nexu.io/snippets/marble-intro.js",
      "local_path": ".framepack/weapons/nexu-marble-intro.js",
      "hash": "sha256:...",
      "used_by": ["scene_2"],
      "status": "active",
      "downloaded_at": "2026-06-12T00:00:00Z",
      "registered_at": "2026-06-12T00:00:00Z",
      "updated_at": "2026-06-12T00:00:00Z"
    }
  },
  "download_rules": {
    "allowed_sources": [
      "framepack://",
      "nexu.io",
      "codepen.io/@gsap",
      "github.com/hyperframes",
      "cdnjs.cloudflare.com"
    ],
    "max_file_size_kb": 100,
    "require_hash": true
  }
}
```

---

## 4. Main Components

### Component A: Registry Core

Create:

- `framepack-plugin/core/arsenal_registry.py`

Responsibilities:

- Locate project `.framepack/arsenal.json`.
- Initialize missing registry.
- Load and validate JSON.
- Migrate legacy `version` field to `schema_version`.
- Register builtin weapons.
- Register local/web weapons.
- Deduplicate by hash.
- Mark unused weapons.
- Reconcile manifest weapons against registry.
- Produce warnings, not injected chaos.

Public API sketch:

```python
@dataclass
class ArsenalWarning:
    code: str
    message: str
    severity: str  # "info" | "warn" | "error"
    weapon_id: str | None = None

@dataclass
class ArsenalSyncResult:
    changed: bool
    action: str
    path: Path
    warnings: list[ArsenalWarning]
    error: str | None = None


def ensure_arsenal(project_dir: Path, plugin_dir: Path) -> ArsenalSyncResult: ...

def load_arsenal(path: Path) -> dict: ...

def validate_arsenal(data: dict, project_dir: Path) -> list[ArsenalWarning]: ...

def register_builtin_weapon(data: dict, weapon_id: str, used_by: list[str], plugin_dir: Path) -> bool: ...

def register_local_weapon(data: dict, weapon_id: str, local_path: str, used_by: list[str]) -> bool: ...

def register_web_weapon(data: dict, weapon_id: str, url: str, local_path: str, used_by: list[str]) -> bool: ...

def reconcile_manifest(data: dict, manifest_weapons: list[dict], plugin_dir: Path) -> tuple[dict, list[ArsenalWarning]]: ...
```

### Component B: Builtin Weapon Catalog Adapter

Problem:

`core/arsenal.py` currently has high-level recommendation IDs like:

- `motion.kinetic-captions`
- `rules.hyperframes-render-safe`

But `framepack-animation-library` uses concrete weapon IDs like:

- `text-split-enter`
- `caption-clip-wipe`
- `bg-blur-mask`

Need a bridge.

Create:

- `framepack-plugin/core/builtin_weapons.py`

Responsibilities:

- Expose canonical builtin weapon records from `framepack-arsenal` skill table.
- Map weapon ID → skill/file/code/kind/engine.
- Avoid parsing markdown at runtime if possible; keep a small Python dict as source of truth.

Initial dict:

```python
BUILTIN_WEAPONS = {
    "text-split-enter": {
        "source": "builtin",
        "kind": "part",
        "skill": "framepack:framepack-animation-library",
        "file": "parts/text-split-enter.md",
        "code": "parts/references/text-split-enter.js",
        "engine": "GSAP+CSS"
    },
    ...
}
```

This should be synced with `framepack-arsenal/SKILL.md`.

### Component C: Manifest Parser

Create:

- `framepack-plugin/core/execution_manifest.py`

Responsibilities:

- Extract the Execution Manifest section from `.hyperframes/expanded-prompt.md`.
- Support YAML-ish / markdown bullet formats leniently.
- Return normalized list of weapon refs.
- Recognize `HANDWRITE` entries and exclude them from registry requirements, but warn if too many.

API sketch:

```python
@dataclass
class ManifestWeapon:
    id: str
    source: str | None
    used_by: list[str]
    code: str | None = None
    handwrite: bool = False
    reason: str | None = None


def parse_execution_manifest(text: str) -> list[ManifestWeapon]: ...
```

### Component D: Hook Integration

Modify:

- `framepack-plugin/hooks/on_post_tool_call.py`
- optionally `framepack-plugin/hooks/on_pre_tool_call.py`

Trigger points:

1. When `expanded-prompt.md` is written:
   - Ensure `.framepack/arsenal.json` exists.
   - Parse Execution Manifest.
   - Register builtin weapons referenced by manifest.
   - Warn about unknown weapon IDs.
   - Warn about HANDWRITE entries if a builtin alternative probably exists.

2. Before HyperFrames HTML-making commands / or when `index.html` is written:
   - Reconcile manifest vs registry.
   - Mark weapons not in manifest as `unused`.
   - Inject concise warning if mismatch exists.

3. Do not run on `hyperframes init/help/version`.

### Component E: Documentation Cleanup

Modify:

- `AGENTS.md`
- `framepack-plugin/guardrails.md`
- `framepack-plugin/skills/framepack-arsenal/SKILL.md`
- `README.md`

Clarify:

- `.framepack/arsenal.json` is required/current.
- `.framepack/weapons/` is optional/current.
- `.framepack/state.json` is future/optional and should not be created as empty shell.
- `schema_version` is not plugin version.

---

## 5. TDD Task Plan

### Task 1: Create registry initialization tests

**Objective:** Missing `.framepack/arsenal.json` should be created safely.

**Files:**

- Create: `framepack-plugin/tests/test_arsenal_registry.py`
- Create: `framepack-plugin/core/arsenal_registry.py`

**Test cases:**

```python
def test_ensure_arsenal_creates_missing_registry(tmp_path): ...
def test_ensure_arsenal_preserves_existing_user_registry(tmp_path): ...
def test_ensure_arsenal_creates_weapons_dir(tmp_path): ...
```

**Expected RED:**

`ModuleNotFoundError: No module named 'core.arsenal_registry'`

**Implementation:**

- `ensure_arsenal(project_dir, plugin_dir)`
- create `.framepack/`
- create `.framepack/weapons/`
- create `.framepack/arsenal.json`
- use atomic write
- no `state.json`

**Verify:**

```bash
cd F:/hyperframes/framepack-plugin
python -m pytest tests/test_arsenal_registry.py -q -o "addopts="
```

---

### Task 2: Add schema validation and migration tests

**Objective:** Legacy registry versions should not confuse plugin version with arsenal schema version.

**Tests:**

```python
def test_migrates_legacy_version_to_schema_version(tmp_path): ...
def test_validate_warns_on_missing_weapons_object(tmp_path): ...
def test_validate_warns_on_invalid_weapon_status(tmp_path): ...
def test_validate_warns_on_web_weapon_without_hash(tmp_path): ...
```

**Implementation:**

- Add `load_arsenal()`.
- Add `validate_arsenal()`.
- Add migration from `version` → `migrated_from_version` + `schema_version`.

**Rules:**

- Builtin weapon may have `hash: null`.
- Web/local weapon must have sha256 hash.
- Unknown source/status should warn.

---

### Task 3: Add builtin weapon catalog adapter

**Objective:** Runtime code can resolve concrete builtin weapon IDs.

**Files:**

- Create: `framepack-plugin/core/builtin_weapons.py`
- Test: `framepack-plugin/tests/test_builtin_weapons.py`

**Tests:**

```python
def test_builtin_catalog_contains_text_split_enter(): ...
def test_builtin_catalog_contains_hyperframes_safe_rule(): ...
def test_resolve_unknown_builtin_returns_none(): ...
```

**Implementation:**

- Define `BUILTIN_WEAPONS` dict.
- Add `resolve_builtin_weapon(weapon_id)`.
- Add `list_builtin_weapon_ids()`.

**Important:**

Do not delete `core/arsenal.py`; that remains recommendation brain.
This new file is concrete registry catalog.

---

### Task 4: Register builtin weapons from manifest refs

**Objective:** If Execution Manifest references builtin weapons, registry gets deterministic entries.

**Tests:**

```python
def test_register_builtin_weapon_adds_entry(tmp_path): ...
def test_register_builtin_weapon_merges_used_by_without_duplicates(tmp_path): ...
def test_register_unknown_builtin_returns_warning(tmp_path): ...
```

**Implementation:**

- `register_builtin_weapon(data, weapon_id, used_by, plugin_dir)`
- source = `builtin`
- status = `active`
- merge `used_by`
- set `registered_at` and `updated_at`

---

### Task 5: Add trusted source alignment

**Objective:** Trusted source registry matches product guardrails.

**Files:**

- Modify: `framepack-plugin/core/trusted_sources.py`
- Test: `framepack-plugin/tests/test_trusted_sources.py`

**Tests:**

```python
def test_trusts_framepack_uri(): ...
def test_trusts_nexu_io(): ...
def test_trusts_codepen_gsap(): ...
def test_trusts_github_hyperframes(): ...
def test_rejects_random_github_repo(): ...
def test_rejects_unknown_cdn(): ...
```

**Implementation notes:**

Allowed:

- `framepack://...`
- `https://nexu.io/...`
- `https://codepen.io/@gsap/...`
- `https://github.com/hyperframes/...`
- possibly runtime library CDNs already present if needed.

Reject:

- arbitrary GitHub repos
- unknown CDNs

---

### Task 6: Add manifest parser

**Objective:** Parse Execution Manifest from expanded-prompt.md.

**Files:**

- Create: `framepack-plugin/core/execution_manifest.py`
- Test: `framepack-plugin/tests/test_execution_manifest.py`

**Tests:**

```python
def test_parse_manifest_yaml_weapon_list(): ...
def test_parse_manifest_markdown_bullets(): ...
def test_parse_handwrite_entry(): ...
def test_empty_manifest_returns_empty_list(): ...
```

**Accepted input examples:**

```markdown
## Execution Manifest

weapons:
  - id: text-split-enter
    source: builtin
    used_by: scene_1
  - id: HANDWRITE
    used_by: scene_4
    reason: custom tactical timeline
```

and:

```markdown
## Execution Manifest
- weapon: text-split-enter
  scene: scene_1
- HANDWRITE: scene_4, reason: custom timeline
```

**Implementation:**

- Start lenient; avoid new YAML dependency unless already present.
- Regex/manual parser is acceptable for v1.

---

### Task 7: Reconcile manifest vs registry

**Objective:** Registry reflects manifest usage, and mismatches are explicit.

**Tests:**

```python
def test_reconcile_registers_manifest_builtin_weapons(tmp_path): ...
def test_reconcile_marks_unreferenced_weapons_unused(tmp_path): ...
def test_reconcile_warns_on_unknown_manifest_weapon(tmp_path): ...
def test_reconcile_keeps_handwrite_out_of_registry_but_warns(tmp_path): ...
```

**Implementation:**

- `reconcile_manifest(data, manifest_weapons, plugin_dir)`
- For builtin known weapons: register/update active.
- For unknown non-HANDWRITE weapons: warning severity error/warn.
- For arsenal entries not in manifest: mark `unused` unless source is `library` or mandatory rule.
- Return updated data + warnings.

---

### Task 8: Hook integration after expanded-prompt write

**Objective:** Writing `.hyperframes/expanded-prompt.md` automatically updates registry.

**Files:**

- Modify: `framepack-plugin/hooks/on_post_tool_call.py`
- Test: `framepack-plugin/tests/test_storyboard_hook.py` or new `test_arsenal_hook.py`

**Tests:**

```python
def test_expanded_prompt_write_creates_arsenal_registry(tmp_path): ...
def test_expanded_prompt_write_registers_manifest_weapons(tmp_path): ...
def test_expanded_prompt_write_injects_warning_for_unknown_weapon(tmp_path): ...
def test_expanded_prompt_write_does_not_crash_on_bad_manifest(tmp_path): ...
```

**Implementation:**

- In `_handle_expanded_prompt()`, after quality review, call arsenal reconciliation.
- Inject short warnings only, not giant JSON.

Warning format:

```text
[Framepack Arsenal Warning]
- unknown_weapon: foo-bar is not registered or builtin.
- unused_weapon: bg-blur-mask exists in arsenal.json but is not referenced by Execution Manifest.
```

---

### Task 9: Pre-HyperFrames audit

**Objective:** Before HTML/render phase, warn if manifest and registry disagree.

**Files:**

- Modify: `framepack-plugin/hooks/on_pre_tool_call.py`
- Test: `framepack-plugin/tests/test_storyboard_hook.py` or new `test_arsenal_hook.py`

**Tests:**

```python
def test_hyperframes_command_warns_when_manifest_weapon_missing_from_registry(tmp_path): ...
def test_hyperframes_init_help_version_skip_arsenal_audit(tmp_path): ...
def test_hyperframes_command_noops_when_no_expanded_prompt(tmp_path): ...
```

**Implementation:**

- Reuse existing noop skip helper.
- If `.hyperframes/expanded-prompt.md` exists, parse + reconcile/audit.
- Do not block command in v1.

---

### Task 10: Reference Miner dual-mode packaging plan

**Objective:** Convert the GPT-5.5 fallback insight into a product contract: Reference Miner scripts are preferred standard instruments, not hard blockers.

**Files:**

- Modify: `framepack-plugin/skills/framepack-reference-miner/SKILL.md`
- Create later, if implementing Scripted Mode: `framepack-plugin/skills/framepack-reference-miner/scripts/scene-detect.py`
- Create later: `framepack-plugin/skills/framepack-reference-miner/scripts/motion-analyze.py`
- Create later: `framepack-plugin/skills/framepack-reference-miner/scripts/color-extract.py`
- Create later: `framepack-plugin/skills/framepack-reference-miner/scripts/audio-analyze.py`
- Create later: `framepack-plugin/skills/framepack-reference-miner/scripts/content-decompose.py`
- Test later: `framepack-plugin/tests/test_reference_miner_packaging.py`

**Tests:**

```python
def test_reference_miner_skill_documents_adaptive_mode(): ...
def test_reference_miner_skill_documents_scripted_mode(): ...
def test_reference_miner_adaptive_mode_requires_command_log(): ...
def test_reference_miner_scripts_are_not_hard_blockers(): ...
```

**Implementation notes:**

- Update the skill to say:
  - Scripted Mode is preferred when scripts are packaged and available.
  - Adaptive Mode is allowed when scripts are missing.
  - Adaptive Mode MUST write a reproducibility block into `reference-analysis.md`:
    - ffmpeg commands used
    - Python snippets or generated script paths
    - scene threshold
    - frame sampling rate
    - audio analysis method
    - assumptions and known weak spots
- If/when the five scripts are added, package them as linked skill files under `scripts/` and reference them via `skill_view(..., file_path='scripts/<name>.py')`, not by searching `$HOME/.hermes`.
- Do not hard-code Hermes home/profile paths.
- Do not block reverse-analysis just because scripts are unavailable.

**Acceptance:**

- A missing script pack produces Adaptive Mode, not failure.
- A present script pack produces reproducible JSON outputs.
- Both modes declare themselves in `reference-analysis.md`.
- The output explains that scripts are standard measuring instruments, not model-capability crutches.

---

### Task 11: Documentation cleanup

**Objective:** Remove state.json confusion and explain arsenal schema.

**Files:**

- Modify: `AGENTS.md`
- Modify: `framepack-plugin/guardrails.md`
- Modify: `README.md`
- Modify: `framepack-plugin/skills/framepack-arsenal/SKILL.md`

**Changes:**

1. Replace directory tree:

```text
.framepack/
├── arsenal.json
├── weapons/
└── state.json
```

with:

```text
.framepack/
├── arsenal.json    ← 当前必需：武器注册表
└── weapons/        ← 当前可选：下载/自建武器代码
```

2. Add Future note:

```text
Future: state.json may hold project-level runtime metadata, but it is not active in v0.9.x. Do not create empty state.json just to satisfy docs.
```

3. Explain:

```text
plugin.yaml version != arsenal.json schema_version
```

---

### Task 12: Version bump and deployment sync

**Objective:** Release as either v0.9.3 or v0.10.0.

Recommended:

- v0.9.3 if only registry init/validate/reconcile warnings.
- v0.10.0 if hook enforcement becomes strong enough to change user workflow.

Files to update:

- `framepack-plugin/plugin.yaml`
- `framepack-plugin/__init__.py`
- `framepack-plugin/hooks/on_pre_tool_call.py`
- `framepack-plugin/hooks/on_post_tool_call.py`
- all Framepack SKILL.md frontmatter
- `AGENTS.md`
- `README.md`

Run version drift search:

```bash
cd F:/hyperframes
python -m pytest framepack-plugin/tests/ -q -o "addopts="
grep -R "0.9.2" -n framepack-plugin AGENTS.md README.md
```

Then sync deployment:

```bash
cp F:/hyperframes/framepack-plugin/__init__.py F:/Hermes_windows/plugins/framepack/__init__.py
cp F:/hyperframes/framepack-plugin/plugin.yaml F:/Hermes_windows/plugins/framepack/plugin.yaml
cp F:/hyperframes/framepack-plugin/guardrails.md F:/Hermes_windows/plugins/framepack/guardrails.md
cp -r F:/hyperframes/framepack-plugin/hooks/* F:/Hermes_windows/plugins/framepack/hooks/
cp -r F:/hyperframes/framepack-plugin/core/* F:/Hermes_windows/plugins/framepack/core/
cp -r F:/hyperframes/framepack-plugin/skills/* F:/Hermes_windows/plugins/framepack/skills/
```

---

## 6. Acceptance Criteria

### Registry creation

- New project with no `.framepack/` gets `.framepack/arsenal.json` and `.framepack/weapons/` when Framepack writes expanded-prompt or enters HyperFrames phase.
- No empty `state.json` is created.

### Version clarity

- Plugin version and arsenal schema version are not confused.
- Legacy `version: 0.7.10` is migrated safely.

### Manifest reconciliation

- Manifest builtin weapons are registered.
- Unknown weapon IDs produce concise warning.
- HANDWRITE entries are allowed but visible.
- Unused registry entries are marked `unused`.

### Safety

- Unknown web source is rejected or warning-only; never auto-download.
- Web/local weapons require sha256 hash.

### Reference Miner mode clarity

- Reference Miner docs distinguish Scripted Mode from Adaptive Mode.
- Missing five-script pack is not a blocker; Adaptive Mode is allowed.
- Adaptive Mode outputs a reproducibility block with commands, thresholds, sampling, and assumptions.
- Scripted Mode remains the preferred path for benchmark/repeatability when scripts are available.
- Registry write is atomic and preserves user JSON fields where possible.

### Tests

- Full suite passes.
- New tests cover registry init, migration, validation, builtin resolution, manifest parse, reconciliation, hooks.

---

## 7. Open Questions for 老田

1. Release number:
   - Should this be v0.9.3 as “registry infrastructure hardening”?
   - Or v0.10.0 because this turns arsenal from policy into runtime behavior?

2. Enforcement level:
   - v1 warnings only?
   - Or should unknown manifest weapon block HyperFrames handoff?

3. Builtin catalog source of truth:
   - Keep a Python dict in `core/builtin_weapons.py`?
   - Or generate it from `framepack-arsenal/SKILL.md` / animation-library files later?

4. `state.json`:
   - Remove from current docs entirely?
   - Or keep as explicit Future section?

---

## 8. Suggested Implementation Order

Recommended commit sequence:

1. `test: add arsenal registry initialization specs`
2. `feat: initialize project arsenal registry`
3. `test: add arsenal schema migration specs`
4. `feat: validate and migrate arsenal schema`
5. `feat: add builtin weapon catalog adapter`
6. `feat: parse Execution Manifest weapons`
7. `feat: reconcile manifest weapons with arsenal registry`
8. `feat: hook arsenal reconciliation into expanded-prompt writes`
9. `feat: audit arsenal before HyperFrames handoff`
10. `docs: clarify arsenal schema and remove state.json ambiguity`
11. `chore: bump Framepack version and sync deployment`

---

## 9. Mental Model

Guardrail Hydrator:

```text
管人：Agent 必须遵守 Framepack/HyperFrames 纪律
```

Arsenal Registry:

```text
管物：项目里的动画武器必须有来源、有登记、有 hash、有状态、有清理路径
```

Together:

```text
Framepack stops being a “creative外挂” and becomes a reproducible video production workbench.
```
