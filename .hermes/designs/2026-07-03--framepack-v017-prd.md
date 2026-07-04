# PRD: Framepack v0.17 — Director Authority & Upgrade Infrastructure

> Status: Ready for implementation
> Evidence base: `.hermes/designs/2026-07-03--framepack-director-authority-investigation.md` (16 evidence points)
> Triggered by: Moho 14.4 dual-environment test failure — Framepack completely bypassed in both dev and test sessions

---

## Problem Statement

Framepack was designed as the "director" sitting on top of HyperFrames. In practice, whenever a user request precisely matches a HyperFrames workflow skill (URL → product-launch-video, PR link → pr-to-video, etc.), the Agent enters the skill's self-contained orchestrator loop and Framepack becomes invisible.

Root cause (evidence-backed): Framepack has **no interception point** between "Agent reads AGENTS.md" and "Agent enters workflow skill orchestrator." All Framepack triggers are downstream of the creative pipeline start. The skill's "You are the orchestrator" directive takes over before any Framepack hook fires.

Secondary problems:
- guardrails.md lacks capability alignment rules (capture/catalog/skills-pack first)
- No CLI command to push guardrail updates to existing workbench projects
- No end-to-end upgrade orchestrator (all components exist, nothing chains them)
- capability-alignment gate only checks file existence, not evidence

---

## Scope: 5 Features

### Feature 1: Workflow Skill Overlay Hook

**Goal**: When Agent loads any HyperFrames workflow skill, Framepack injects a co-direction message establishing the creative authority split — without blocking the skill.

**Mechanism**:
- Extend `post_tool_call` hook in `on_post_tool_call.py`
- Detect `skill_view` where `args.name` ∈ `HYPERFRAMES_WORKFLOW_SKILLS`
- Call `ctx.inject_message()` with overlay directive

**Detection set** (`HYPERFRAMES_WORKFLOW_SKILLS`):
```python
{
    "product-launch-video",
    "website-to-video",
    "faceless-explainer",
    "pr-to-video",
    "embedded-captions",
    "talking-head-recut",
    "motion-graphics",
    "music-to-video",
    "slideshow",
    "general-video",
    "remotion-to-hyperframes",
}
```

**Injection timing** (confirmed by E10):
```
Agent calls skill_view('product-launch-video')
    ↓
Hermes returns skill content as tool result
    ↓
post_tool_call hook fires → Framepack receives
    ↓
Framepack inject_message() → _interrupt_queue
    ↓
Agent sees BOTH in same LLM turn: skill content + Framepack overlay
```

**Overlay message contract** (exact wording needs empirical testing across models, but the information contract is fixed):

The message must establish:
1. **Creative authority**: Framepack owns creative decisions (frame.md, expanded-prompt.md, Execution Manifest); skill owns production execution (capture, build, render)
2. **frame.md precedence**: If Framepack's frame.md exists, skip the skill's build-frame.mjs (Step 2). If it doesn't exist yet, run Framepack Phase 0-2 first
3. **expanded-prompt precedence**: If Framepack's expanded-prompt.md exists, STORYBOARD.md must derive from it, not replace it
4. **Execution Manifest constraint**: HTML authoring (including skill's frame-worker sub-agents) must respect the Execution Manifest
5. **Capability alignment**: Before hand-coding visuals, check if HyperFrames catalog/capture/skills-pack already provides the needed capability

**Overlay should NOT**:
- Block the skill from loading
- Prevent the skill's capture/build/render pipeline from running
- Override the skill's production decisions (timing, audio, encoding)

**Guard against re-injection**: Track which workflow skills have already been overlayed in the current session. Inject once per skill per session, not on every skill_view call.

**Test plan**:
- Unit test: hook fires on each of the 11 workflow skills, does NOT fire on Framepack skills or non-workflow skills
- Unit test: inject_message is called exactly once per skill
- Unit test: hook does not fire on second skill_view of same skill in same session
- Integration test: simulate skill_view('product-launch-video') → verify overlay message content
- Smoke test: deployed plugin, verify overlay fires in real runtime

---

### Feature 2: guardrails.md v0.17 Content Update

**Goal**: Add the rules that were missing — the ones that would have prevented the Moho bypass.

**Three additions to guardrails.md** (flows into all AGENTS.md managed blocks):

#### 2a: Capability Alignment Iron Law

```markdown
## ⚔️ 铁律：HyperFrames 能力优先

**遇到 URL / website / 产品发布 / 参考视频时，先查 HyperFrames 官方能力，别自己造。**

检查顺序：
1. `npx hyperframes capture <url>` — 抓取网站视觉 DNA（截图、配色、字体）
2. `npx hyperframes catalog --json` — 查 registry 有没有现成组件
3. HyperFrames workflow skill（product-launch-video / website-to-video 等）— 查官方工作流
4. Framepack arsenal — 查武器库
5. 最后才是 handwrite

跳过 1-3 直接 handwrite = 铁律违反。
```

#### 2b: Workflow Skill Co-existence Rule

```markdown
## HyperFrames Workflow Skill 共存规则

当 HyperFrames workflow skill 和 Framepack 工作台共存时：

| 阶段 | 谁负责 | 产出 |
|------|--------|------|
| 创意方向 | Framepack | frame.md（视觉身份 + 五行权重） |
| 分镜导演 | Framepack | expanded-prompt.md（Director Story Bible + Execution Manifest） |
| 素材抓取 | HyperFrames skill | capture/（截图、tokens.json） |
| HTML 制作 | HyperFrames skill | compositions/frames/*.html |
| 验证渲染 | HyperFrames skill | lint → validate → render |

**frame.md 归属**：Framepack 的 frame.md 是创意源头。skill 的 build-frame.mjs 是确定性颜色映射器，不做创意决策。如果 Framepack 的 frame.md 已存在，跳过 build-frame.mjs。

**STORYBOARD.md vs expanded-prompt.md**：expanded-prompt.md 先写（导演分镜），STORYBOARD.md 从中派生（制作分镜）。不是替代关系，是 enrich 关系。
```

#### 2c: Session Entry Directive

```markdown
## 工作台入口

**你在 Framepack 工作台。所有视频创意任务先经过 Framepack 分诊。**

当用户给出 URL / 产品 / 参考视频时：
1. 先判断：这是哪个意图？（product-launch / website-tour / explainer / PR / ...）
2. 先跑 Framepack Phase 0（素材收集）→ Phase 1（frame.md）→ Phase 2（expanded-prompt.md）
3. 然后才加载对应的 HyperFrames workflow skill 执行制作
4. 如果 Agent 已经先加载了 workflow skill，Framepack overlay 会注入创意约束——遵守它
```

**Implementation**: These three blocks are appended to the existing guardrails.md body. The FRAMEPACK MANAGED BLOCK hash changes, triggering hydrate on all projects.

**Test plan**:
- Version-sync test: guardrails.md hash changes → managed block version bumps
- Content test: grep for key phrases in generated managed block
- Hydrate test: stale AGENTS.md gets updated when hydrate runs

---

### Feature 3: `hermes framepack hydrate` CLI Command

**Goal**: One command to push latest guardrails to a workbench and all its cases.

**Registration**: Add to `__init__.py → register()`:
```python
ctx.register_cli_command(
    name="framepack-hydrate",
    help="Push latest Framepack guardrails to workbench AGENTS.md files",
    setup_fn=_setup_hydrate_command,
    handler_fn=_handle_hydrate_command,
    description="Sync guardrails.md to all AGENTS.md files in a workbench",
)
```

**CLI interface**:
```
hermes framepack-hydrate <workbench-path>
hermes framepack-hydrate --all          # auto-discover known workbenches
hermes framepack-hydrate <workbench> --dry-run   # report only, no writes
```

**Flow**:
```
1. Read deployed guardrails.md + compute hash
2. Scan workbench root + cases/*/AGENTS.md + CLAUDE.md
3. For each file: compare managed block hash vs deployed hash
4. Update stale files (backup → atomic write)
5. Write case-level context-sync.md receipts
6. Report: updated / stale / no-op / error per file
```

**Workbench discovery**: Scan for `FRAMEPACK MANAGED BLOCK` marker in AGENTS.md files. Walk `cases/*/` subdirectories. Future: optional registry file at workbench root listing all managed projects.

**Output format**:
```
Framepack Hydrate Report
========================
Workbench: F:/Framepack-01-test
Guardrails: v0.17.0 (sha256:abc123...)

Files:
  AGENTS.md                    → updated ✅
  cases/moho-launch/AGENTS.md  → updated ✅
  cases/ederson/AGENTS.md      → no-op (hash match)
  cases/old-case/AGENTS.md     → STALE (old version 0.14.0) → updated ✅

Summary: 3 updated, 1 no-op, 0 errors
```

**Test plan**:
- Unit test: hydrate on temp workbench with stale managed block → block updated
- Unit test: hydrate on workbench with no managed block → block inserted
- Unit test: hydrate on workbench with current hash → no-op
- Unit test: dry-run does not write files
- Unit test: case-level context-sync.md receipts written

---

### Feature 4: `hermes framepack update` CLI Command

**Goal**: One command for end-to-end upgrade from source to deployed to workbench.

**Registration**: Same pattern as Feature 3.

**CLI interface**:
```
hermes framepack update                    # full chain
hermes framepack update --skip-smoke       # skip smoke test
hermes framepack update --workbench <path> # also hydrate a specific workbench
hermes framepack update --report-only      # just check, don't change anything
```

**Flow** (NO git pull — source copy is authoritative as-is):
```
Step 1: doctor
  → environment_doctor.check_environment()
  → report Node/npm/npx/HyperFrames CLI/support window/missing skills

Step 2: source → deployed sync
  → md5 compare all files in framepack-plugin/ vs F:/Hermes_windows/plugins/framepack/
  → report drift
  → if --report-only: stop here
  → copy changed files (cp -a)
  → md5 re-verify after copy

Step 3: guardrails hydrate (optional, if --workbench specified)
  → run Feature 3 flow on specified workbench

Step 4: skill overlay check
  → skill_overlay_planner.plan_overlays()
  → report if any HyperFrames skill overlays are stale
  → do NOT auto-apply (dry-run by default; --apply-overlays to write)

Step 5: smoke test (unless --skip-smoke)
  → import deployed plugin from F:/Hermes_windows/plugins/framepack/
  → run 3-5 representative tests from deployed tests/
  → verify no import errors

Step 6: report
  → summarize all steps
  → flag any drift, failures, or manual actions needed
  → note if source copy has uncommitted changes (git status --porcelain)
  → note if source copy is ahead of origin/main (git rev-list --count)
```

**Critical safety rule**: `framepack update` NEVER runs `git pull`, `git push`, `git fetch`, or any remote git operation. Source copy is treated as authoritative. If the user wants to update from GitHub, they do `git pull` manually. The update command can **report** git state (ahead/behind/dirty) but never **modify** it.

**Output format**:
```
Framepack Update Report
=======================
Source:   F:/hyperframes/framepack-plugin/ (v0.17.0)
Deployed: F:/Hermes_windows/plugins/framepack/

Step 1 — Doctor:
  Node.js: v22.22.2 ✅
  HyperFrames CLI: 0.7.21 (supported) ✅
  Skills: all present ✅

Step 2 — Source → Deployed sync:
  8 files changed, 0 files unchanged
  md5 verify: ALL_OK ✅

Step 3 — Hydrate (F:/Framepack-01-test):
  3 files updated, 1 no-op

Step 4 — Skill overlays:
  No stale overlays

Step 5 — Smoke test:
  5/5 passed ✅

Step 6 — Git state:
  Source: main, ahead origin/main by 2 commits, working tree clean
  ⚠️ Consider pushing to GitHub when ready

Overall: UPDATE COMPLETE ✅
```

**Test plan**:
- Unit test: md5 drift detection (inject a change in deployed, verify it's detected)
- Unit test: sync copies changed files, md5 matches after
- Unit test: --report-only does not write
- Unit test: smoke test failure is reported, not swallowed
- Unit test: git state is reported but not modified

---

### Feature 5: capability-alignment Gate Evidence Checking

**Goal**: Make `used` / `waived` in capability-alignment.md mean something — not just "file exists."

**Current behavior**: Gate checks `.framepack/hyperframes-capability-alignment.md` exists → GREEN.

**New behavior**:

| Declaration | Evidence required | Check |
|---|---|---|
| `used: capture` | `capture/` directory exists OR asset-intake.md references captured assets | File existence check |
| `used: product-launch-video` | overlay injection evidence (session log or .framepack/overlay-receipt.md) | Receipt file check |
| `used: catalog` | catalog-decision.md exists with evaluated components | File existence check |
| `waived: capture` | waive reason text + "no URL" or "already extracted via web_extract" | Content check |
| `waived: catalog` | waive reason text + "pure CSS/SVG" or "no matching components" | Content check |

**Implementation**: Extend `core/gates/hyperframes_capability_alignment.py` to parse the markdown and check for evidence patterns.

**Overlay receipt**: When Feature 1 fires (overlay injection), write `.framepack/overlay-receipt.md` recording:
- timestamp
- skill name
- overlay message summary

This receipt becomes the evidence that capability alignment was enforced.

**Gate states**:
- GREEN: declaration has matching evidence
- YELLOW: declaration exists but evidence missing (e.g., "used: capture" but no capture/ directory)
- RED: no capability-alignment.md at all + project has URL/website signals

**Test plan**:
- Unit test: `used: capture` + capture/ exists → GREEN
- Unit test: `used: capture` + no capture/ → YELLOW
- Unit test: `waived: catalog` + reason text → GREEN
- Unit test: `waived: catalog` + no reason → YELLOW
- Unit test: no file + URL in handoff-manifest → RED

---

## Implementation Order

```
Phase 1: Foundation
  ├── Feature 2: guardrails.md v0.17 content update (rules source)
  └── Feature 1: Workflow Skill Overlay Hook (the core fix)

Phase 2: Infrastructure
  ├── Feature 3: framepack hydrate CLI
  └── Feature 4: framepack update CLI

Phase 3: Hardening
  └── Feature 5: capability-alignment gate evidence checking
```

Phase 1 first because it's the actual fix — without Feature 1, Framepack is still invisible when workflow skills load. Feature 2 feeds Feature 1's overlay content into the guardrails.

Phase 2 is infrastructure — it solves the "stale guardrails in existing projects" gap and provides the upgrade command.

Phase 3 is hardening — closes the "declaration ≠ execution" loop.

---

## Version Target

**v0.17.0** — Director Authority & Upgrade Infrastructure

All five features ship together. This is a minor version bump (not patch) because:
- New hook behavior (overlay injection)
- New CLI commands
- Breaking change to capability-alignment gate (stricter checking)
- guardrails.md content change triggers workbench hydrate

---

## Out of Scope

- Modifying HyperFrames workflow skills (upstream, not our code)
- Pre-skill-view interception (not possible with current Hermes hook architecture)
- Automatic git pull/push in update command (safety: never modify git state)
- frame.md auto-generation from capture tokens (build-frame.mjs replacement — future)
- STORYBOARD.md auto-derivation from expanded-prompt.md (future)
- Cross-model overlay message A/B testing (future — needs multi-model test harness)

---

## Risks

| Risk | Mitigation |
|---|---|
| Overlay message ignored by Agent | Empirical testing across models; iterate on wording; guardrails.md backs up the message |
| Overlay fires too often (every skill_view) | Session-level dedup: one overlay per skill per session |
| Hydrate overwrites user content in AGENTS.md | Only managed block is replaced; user content preserved (existing behavior) |
| Update command syncs wrong direction | md5 verify after copy; never git pull; source copy is authoritative |
| Gate evidence checking too strict | Start with file existence + content grep; don't require complex parsing |

---

## Success Criteria

1. **Overlay test**: In a clean Framepack workbench session, when Agent loads `skill_view('product-launch-video')`, Framepack overlay message is injected and Agent acknowledges Framepack's creative authority
2. **Hydrate test**: `hermes framepack-hydrate F:/Framepack-01-test` updates all stale AGENTS.md managed blocks
3. **Update test**: `hermes framepack update` detects source → deployed drift, syncs, md5 verifies, smoke passes
4. **Gate test**: `used: capture` without capture/ directory → YELLOW, not GREEN
5. **End-to-end test**: Moho URL scenario re-run in clean session → Framepack is not bypassed; capture runs, frame.md comes from Framepack, overlay message is acknowledged
