# Weapon Matching Pass Implementation Plan

> **For Hermes:** Use test-driven-development for Python changes and verification-before-completion before claiming done.

**Goal:** Add a mandatory Weapon Matching Pass between expanded-prompt/story script and HTML authoring, producing a load plan even when no weapon matches.

**Architecture:** Treat the pass as the kitchen prep table. It reads the director script (`.hyperframes/expanded-prompt.md` first), inventories weapon sources, matches scene needs against official HyperFrames capabilities, Framepack executable arsenal, specialist skills, and project-local weapons, then writes `.framepack/weapon-load-plan.json` and `.framepack/weapon-load-plan.md`. Hooks enforce the existence of the receipt before `index.html` writing; quality audit validates the plan after HTML exists.

**Tech Stack:** Python stdlib, existing Framepack plugin modules/hooks/tests, pytest.

---

## Non-negotiable product rules

1. The pass always runs or produces a failure receipt. “No match” is a valid output only if checked sources and rejected candidates are recorded.
2. The pass is not only Framepack JS weapons. It must model:
   - HyperFrames official catalog/references/workflow capabilities
   - Framepack executable arsenal (`core/builtin_weapons.py` + project `.framepack/arsenal.json`)
   - specialist skills as weapons (`gsap`, `hyperframes` references, media/caption/reference-miner/sprite skills)
   - project-local weapons/templates/components
   - HANDWRITE waivers
3. `transitions-pack` remains deprecated and must not be force-selected.
4. The HTML authoring phase receives a short load list, not a giant weapon-library dump.
5. Initial enforcement should be a strong soft gate: inject warning/receipt requirements before `index.html` writes. Keep hard-block mode as a future config flag after dogfood.

---

## Task 1: Add Weapon Load Plan schema

**Objective:** Introduce typed dataclasses and JSON/Markdown serialization for the new receipt.

**Files:**
- Create: `framepack-plugin/core/weapon_load_plan.py`
- Test: `framepack-plugin/tests/test_weapon_load_plan.py`

**Step 1: Write failing tests**

Create tests that assert:

```python
def test_weapon_load_plan_round_trips_json(tmp_path):
    from core.weapon_load_plan import (
        WeaponLoadPlan,
        SceneWeaponPlan,
        WeaponMatch,
        SkillLoad,
        write_weapon_load_plan,
        load_weapon_load_plan,
    )

    plan = WeaponLoadPlan(
        version="0.1",
        source_prompt=".hyperframes/expanded-prompt.md",
        scenes=[
            SceneWeaponPlan(
                scene="scene_3",
                need="120+ numeric impact",
                matches=[
                    WeaponMatch(
                        source="framepack_builtin",
                        id="number-count-up",
                        confidence="high",
                        reuse_mode="full",
                        load={"skill": "framepack-animation-library", "file_path": "parts/references/number-count-up.js"},
                        params_hint={"targetValue": 120, "suffix": "+"},
                    )
                ],
                selected="number-count-up",
                handwrite=False,
            )
        ],
        required_skill_loads=[SkillLoad(name="hyperframes", reason="composition contract")],
        handwrite_waivers=[],
    )

    write_weapon_load_plan(tmp_path, plan)
    loaded = load_weapon_load_plan(tmp_path)
    assert loaded.scenes[0].selected == "number-count-up"
    assert (tmp_path / ".framepack" / "weapon-load-plan.json").exists()
    assert (tmp_path / ".framepack" / "weapon-load-plan.md").exists()
```

Also test that an empty/no-match scene still serializes with `handwrite=True` and waiver details.

**Step 2: Run tests and verify failure**

Run:

```bash
python -m pytest framepack-plugin/tests/test_weapon_load_plan.py -q -o "addopts="
```

Expected: import/module not found.

**Step 3: Implement dataclasses**

In `core/weapon_load_plan.py` add:

- `WeaponMatch`
- `SkillLoad`
- `HandwriteWaiver`
- `SceneWeaponPlan`
- `WeaponLoadPlan`
- `write_weapon_load_plan(project_dir, plan)`
- `load_weapon_load_plan(project_dir)`
- `render_weapon_load_plan_markdown(plan)`

Use only stdlib `dataclasses`, `json`, `pathlib`, `typing`.

**Step 4: Run tests**

Expected: tests pass.

---

## Task 2: Add weapon source inventory layer

**Objective:** Create a source inventory module that exposes all matchable weapon layers without dumping huge skills into context.

**Files:**
- Create: `framepack-plugin/core/weapon_sources.py`
- Test: `framepack-plugin/tests/test_weapon_sources.py`

**Step 1: Write failing tests**

Test expected inventory:

```python
def test_framepack_builtin_sources_exclude_deprecated_transitions_pack():
    from core.weapon_sources import list_framepack_builtin_sources

    ids = {source.id for source in list_framepack_builtin_sources()}
    assert "number-count-up" in ids
    assert "data-chart-editorial" in ids
    assert "transitions-pack" not in ids
```

Test specialist skill sources:

```python
def test_specialist_skill_sources_include_gsap_and_hyperframes_refs():
    from core.weapon_sources import list_specialist_skill_sources

    sources = list_specialist_skill_sources()
    names = {s.id for s in sources}
    assert "skill:gsap" in names
    assert "skill:hyperframes:captions" in names
    assert "skill:hyperframes:transitions" in names
```

Test project-local source loading from `.framepack/arsenal.json`.

**Step 2: Implement `WeaponSource` dataclass**

Fields:

- `id`
- `source_type`: `hyperframes_official | framepack_builtin | specialist_skill | project_local`
- `kind`: `part | block | template | reference | skill | media_command | local`
- `status`: `executable | reference | deprecated | planned`
- `load`: dict
- `keywords`: tuple/list of regex strings
- `notes`

**Step 3: Populate sources**

- Framepack builtin: derive from `core.builtin_weapons.BUILTIN_WEAPONS`, excluding `rules.*` and deprecated `transitions-pack`.
- Specialist skills: hardcode small curated list first:
  - `skill:gsap`
  - `skill:hyperframes:captions`
  - `skill:hyperframes:transitions`
  - `skill:hyperframes:audio-reactive`
  - `skill:hyperframes:css-patterns`
  - `skill:framepack-reference-miner`
  - `skill:sprite-to-hyperframes`
  - `skill:media-use`
- HyperFrames official/catalog layer: initially model as reference/capability sources in unit tests. In real runs, if probing official catalog/registry/remote weapon sources hits timeout, registry skip, or wall-like failure, first detect current device proxy (`HTTP_PROXY`/`HTTPS_PROXY`/`ALL_PROXY`, npm proxy, git proxy, Windows proxy; local default often `127.0.0.1:59527`) and retry through proxy. Do not downgrade to “no official weapon” until proxy retry also fails.
- Project-local: read `.framepack/arsenal.json` if present.

**Step 4: Run tests**

Expected: inventory tests pass.

---

## Task 3: Build scene extraction and matching engine

**Objective:** Parse expanded-prompt scenes and match them to source candidates.

**Files:**
- Create: `framepack-plugin/core/weapon_matcher.py`
- Test: `framepack-plugin/tests/test_weapon_matcher.py`

**Step 1: Write failing tests**

Positive matches:

```python
def test_match_numeric_scene_selects_number_count_up():
    from core.weapon_matcher import match_weapons_for_prompt

    prompt = """
## Scene 3 — 120+ 数据冲击
The KPI number 120+ should count up with snap.
"""
    plan = match_weapons_for_prompt(prompt)
    scene = plan.scenes[0]
    assert scene.selected == "number-count-up"
    assert scene.handwrite is False
```

Specialist skill match:

```python
def test_match_word_synced_caption_selects_hyperframes_caption_reference():
    prompt = """
## Scene 2 — captions
Voiceover needs word-synced captions with karaoke highlight.
"""
    plan = match_weapons_for_prompt(prompt)
    assert any(load.name == "software-development/hyperframes" or load.name == "hyperframes" for load in plan.required_skill_loads)
    assert any("captions" in (m.id or "") for s in plan.scenes for m in s.matches)
```

No match still emits waiver:

```python
def test_no_match_still_emits_handwrite_waiver():
    prompt = """
## Scene 9 — custom shader
Bespoke WebGL pearl refraction shader over product photography.
"""
    plan = match_weapons_for_prompt(prompt)
    assert plan.scenes[0].handwrite is True
    assert plan.handwrite_waivers
    assert plan.handwrite_waivers[0].checked_sources
```

**Step 2: Implement scene parser**

Add:

- `extract_scene_blocks(prompt: str) -> list[SceneBlock]`
- scene headings support `## Scene N`, `## S1`, `## 场景 N`, and existing `scene_1:` style blocks.

**Step 3: Implement scorer**

Basic scoring:

- keyword regex hits
- source priority: HyperFrames official > Framepack builtin > specialist skill > project local > waiver, unless project-local has exact id match
- reuse mode:
  - `full` for clear direct primitive/block match
  - `partial` for text/card variants
  - `structural` for layout/choreography blocks
  - `specialist-skill` for skills/references
  - `waiver` for no match

**Step 4: Integrate existing HANDWRITE truthfulness keyword table**

Avoid duplicating two divergent tables. Either:

- move `_HANDWRITE_WEAPON_RULES` from `quality_audit.py` into `weapon_sources.py` as reusable source keywords, or
- add a helper that both modules import.

Preferred: `weapon_sources.py` owns keywords; `quality_audit.py` calls `match_obvious_builtin_weapon(context)`.

**Step 5: Run tests**

Expected: matcher tests pass.

---

## Task 4: Add CLI script `framepack_match_weapons.py`

**Objective:** Allow humans/hooks to run the pass manually and inspect the receipt.

**Files:**
- Create: `framepack-plugin/scripts/framepack_match_weapons.py`
- Test: `framepack-plugin/tests/test_framepack_match_weapons_cli.py`

**Step 1: Write failing CLI tests**

Use subprocess to run:

```bash
python scripts/framepack_match_weapons.py <tmp_project> --format json
```

Expected:

- writes `.framepack/weapon-load-plan.json`
- stdout contains `kind: framepack_weapon_load_plan` or valid JSON
- exits 0 even when no match, as long as receipt is written

**Step 2: Implement CLI**

Flags:

- positional `project`
- `--prompt PATH` optional; default `.hyperframes/expanded-prompt.md`
- `--format json|markdown|text`
- `--dry-run` prints without writing

The script must self-bootstrap plugin root into `sys.path` like `framepack_hydrate.py`.

**Step 3: Run tests**

Expected: pass.

---

## Task 5: Hook after expanded-prompt writes

**Objective:** Automatically generate the Weapon Load Plan when expanded-prompt/story bible is written.

**Files:**
- Modify: `framepack-plugin/hooks/on_post_tool_call.py`
- Test: existing post hook tests or create `framepack-plugin/tests/test_weapon_matching_hook.py`

**Step 1: Write failing test**

Simulate a `write_file` tool call to `.hyperframes/expanded-prompt.md` with a numeric scene. Assert:

- `.framepack/weapon-load-plan.json` exists
- plan selected `number-count-up`
- hook injects a compact summary such as:

```text
Weapon Matching Pass complete: 1 scene matched, 0 waivers.
Before HTML, load: framepack-animation-library parts/references/number-count-up.js
```

**Step 2: Implement hook integration**

- Detect writes/patches to `.hyperframes/expanded-prompt.md`.
- Call `match_weapons_for_project(project_dir)`.
- Write plan.
- Inject compact summary.
- Never dump all weapon docs into context.
- On error, write `.framepack/weapon-load-plan-error.json` or inject clear failure; do not pretend it ran.

**Step 3: Run hook tests**

Expected: pass.

---

## Task 6: Add pre-HTML soft gate

**Objective:** Make the node “坚决执行”: before writing `index.html`, check for a plan receipt. If absent, inject a strong warning and ideally generate one if expanded-prompt exists.

**Files:**
- Modify: `framepack-plugin/hooks/on_pre_tool_call.py`
- Test: `framepack-plugin/tests/test_weapon_matching_pre_html_gate.py`

**Step 1: Write failing tests**

Cases:

1. `write_file(index.html)` with no plan but expanded-prompt exists → hook writes or requests plan and injects warning.
2. `write_file(index.html)` with plan exists → no warning.
3. `write_file(non-html)` → no warning.

**Step 2: Implement soft gate**

Behavior:

- If `index.html` target and no `.framepack/weapon-load-plan.json`:
  - if `.hyperframes/expanded-prompt.md` exists, run matcher and inject summary.
  - if prompt missing, inject “Weapon Matching Pass could not run: missing expanded-prompt.md; HANDWRITE waivers will be invalid until a plan exists.”
- Do not kill terminal commands. Be careful with previous pre_tool_call SIGINT pitfall.

**Step 3: Add future hard-mode config placeholder**

Do not enable hard block yet. Add internal constant or TODO:

```python
WEAPON_MATCHING_HARD_GATE = False
```

---

## Task 7: Wire quality audit to weapon-load-plan

**Objective:** Make post-HTML audit validate plan vs implementation, not only manifest vs implementation.

**Files:**
- Modify: `framepack-plugin/core/quality_audit.py`
- Test: `framepack-plugin/tests/test_weapon_load_plan_quality_audit.py`

**Step 1: Tests**

1. Plan selects `number-count-up`, HTML lacks `numberCountUp()` → issue `weapon_load_plan_not_implemented` P0/P1.
2. Plan contains specialist skill `hyperframes:captions` → no canonical function expected, but issue if HTML contains no caption-like elements and no waiver.
3. Plan has handwrite waiver → no mismatch if waiver is specific.

**Step 2: Implement audit**

Add `_audit_weapon_load_plan(project_dir, html)`:

- load plan if exists
- for `framepack_builtin` selected matches, resolve canonical function via `resolve_builtin_weapon()` and check function call
- for `specialist_skill`, check only documentation/plan presence in first version; avoid fragile HTML heuristics except for obvious captions
- report missing plan as P2 only when `index.html` and expanded-prompt both exist

**Step 3: Run tests**

Expected: pass.

---

## Task 8: Register optional Hermes CLI command

**Objective:** Expose `hermes framepack-match-weapons <project>` like update/hydrate.

**Files:**
- Modify: `framepack-plugin/__init__.py`
- Test: CLI registration tests if available; otherwise subprocess help smoke.

**Step 1: Add command**

Use current known CLI pitfall:

- handler receives argparse `Namespace`, not raw string
- handler must `print(output)`, not return it
- subprocess must use `encoding="utf-8", errors="replace"`

**Step 2: Test command**

Run:

```bash
hermes framepack-match-weapons F:/Framepack-01-test --format text
```

Expected: readable summary or clear missing prompt message.

---

## Task 9: Documentation and skill updates

**Objective:** Make the node visible in Framepack process docs.

**Files:**
- Modify: `framepack-plugin/skills/framepack/SKILL.md`
- Modify: `AGENTS.md` managed/source content if needed
- Create or modify reference: `framepack-plugin/skills/framepack/references/weapon-matching-pass.md`

**Docs must say:**

- expanded-prompt/story script done → Weapon Matching Pass → HTML
- plan is mandatory even when no match
- selected resources must be loaded before HTML
- no giant library dump
- HANDWRITE waiver format

---

## Task 10: Full verification and deployment sync

**Objective:** Prove the feature works in source and deployed Hermes plugin.

**Commands:**

```bash
cd /f/hyperframes
python -m pytest framepack-plugin/tests/test_weapon_load_plan.py -q -o "addopts="
python -m pytest framepack-plugin/tests/test_weapon_sources.py -q -o "addopts="
python -m pytest framepack-plugin/tests/test_weapon_matcher.py -q -o "addopts="
python -m pytest framepack-plugin/tests/test_framepack_match_weapons_cli.py -q -o "addopts="
python -m pytest framepack-plugin/tests -q -o "addopts="
```

Sync deployment:

```bash
cp -a framepack-plugin/. /f/Hermes_windows/plugins/framepack/
cp -f framepack-plugin/skills/framepack/SKILL.md /f/Hermes_windows/skills/software-development/framepack/SKILL.md
```

Run deployed tests:

```bash
python -m pytest F:/Hermes_windows/plugins/framepack/tests -q -o "addopts="
```

Run smoke project:

1. Create temp project with expanded-prompt numeric scene.
2. Run deployed `framepack_match_weapons.py`.
3. Assert `.framepack/weapon-load-plan.json` selects `number-count-up`.
4. Run `hermes framepack-update` from `F:/Framepack-01-test`.

MD5 sync check:

- `core/weapon_load_plan.py`
- `core/weapon_sources.py`
- `core/weapon_matcher.py`
- `scripts/framepack_match_weapons.py`
- touched hook files
- touched skill/reference docs

Commit:

```bash
git add framepack-plugin/core/weapon_load_plan.py \
        framepack-plugin/core/weapon_sources.py \
        framepack-plugin/core/weapon_matcher.py \
        framepack-plugin/scripts/framepack_match_weapons.py \
        framepack-plugin/hooks/on_post_tool_call.py \
        framepack-plugin/hooks/on_pre_tool_call.py \
        framepack-plugin/core/quality_audit.py \
        framepack-plugin/__init__.py \
        framepack-plugin/skills/framepack/SKILL.md \
        framepack-plugin/skills/framepack/references/weapon-matching-pass.md \
        framepack-plugin/tests/test_weapon_*.py \
        framepack-plugin/tests/test_framepack_match_weapons_cli.py

git commit -m "feat: add mandatory weapon matching pass before HTML authoring"
```

---

## Acceptance criteria

- A project with expanded-prompt but no HTML gets `.framepack/weapon-load-plan.json` and `.md`.
- A project with no matching weapon still gets a waiver receipt.
- Before writing `index.html`, missing plan is noticed and corrected or loudly warned.
- Agent receives a compact load list, not entire library dump.
- Quality audit can validate selected Framepack builtin weapons against HTML calls.
- `transitions-pack` is not forced.
- Source/deployed tests pass.
- Deployment md5 checks pass.

## Risks / tradeoffs

- HyperFrames official catalog/registry may require network and proxy. Unit tests should model official references locally, but real catalog probes must implement proxy discovery + proxy retry before any fallback. A wall/timeout is not evidence that no official weapon exists.
- Skill-as-weapon validation cannot be as strict as JS function validation. Treat it as load-plan enforcement first, implementation heuristics later.
- A hard pre-write block can interrupt Hermes tool calls. Start soft but unmistakable; dogfood before hard-block config.
