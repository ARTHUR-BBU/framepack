# Framepack Director Authority Investigation — Evidence Report

> Date: 2026-07-03
> Status: Evidence gathering for PRD. Not a design doc.
> Triggered by: Moho 14.4 product-launch test (dev env + test env both bypassed Framepack)

---

## Executive Summary

Two independent test sessions (dev environment + clean test environment) both bypassed Framepack entirely when given a product URL. Root cause is NOT environment-specific — it is an architectural authority gap: Framepack has no interception point before the Agent enters a HyperFrames workflow skill's self-contained orchestrator loop.

---

## Evidence Chain

### E1: HyperFrames `/hyperframes` umbrella skill is a perfect intent router

File: `F:/Hermes_windows/skills/hyperframes/SKILL.md`

The umbrella skill's frontmatter says:
```
READ THIS FIRST for any request to make, create, edit, animate, or render a video...
```

It has a complete intent routing table:
```
/product-launch-video → "Selling a product (SaaS, app, company/product site)"
/website-to-video     → "Showing a site itself"
/faceless-explainer   → "Explaining a topic/concept from text"
...
```

This is a deterministic, low-latency intent matcher. Any URL + "video" request resolves to a specific workflow skill in <1 step.

### E2: Workflow skills are self-contained orchestrators

File: `F:/Hermes_windows/skills/product-launch-video/SKILL.md`

Line 12:
> **You are the orchestrator.** Run each step, verify its gate, and only then continue to the next step.

Line 14:
> You are the orchestrator. Work in `videos/<project>/`. Run steps in order...

The skill has its own complete pipeline:
```
Step 0: Setup → Step 1: Capture → Step 2: build-frame.mjs → Step 3: STORYBOARD.md + SCRIPT.md
→ Step 3.1: Audio → Step 4: Visual Design → Step 5: Build Frames (sub-agents) → Step 6: Render
```

It generates its own `frame.md` (via build-frame.mjs from presets), its own storyboard (STORYBOARD.md), its own script (SCRIPT.md). It does not need or reference Framepack's frame.md / expanded-prompt.md / Execution Manifest.

### E3: Framepack's hook trigger surface is entirely post-entry

File: `F:/hyperframes/framepack-plugin/hooks/on_post_tool_call.py` (lines 655-690)

Framepack's `_is_framepack_skill_name()` (line 556) only matches:
```python
{"framepack", "framepack:framepack-director", "framepack:framepack-gsap",
 "framepack:framepack-arsenal", "framepack-animation-library", "framepack-reference-miner"}
```

It does NOT match `product-launch-video`, `website-to-video`, `faceless-explainer`, or any other HyperFrames workflow skill.

The pre_tool_call hook (line 260) only fires on `tool_name == "terminal"` — it does not intercept `skill_view`.

**Result**: When Agent calls `skill_view('product-launch-video')`, no Framepack hook fires. The skill content reaches the Agent unimpeded. The "You are the orchestrator" directive takes over.

### E4: Framepack's intent_router exists but is orphaned code

File: `F:/hyperframes/framepack-plugin/core/intent_router.py`

This module has a complete `route_intent()` function that correctly classifies "product launch" → `product-launch-video` workflow. BUT: it is never called from any hook. It is only used in:
- `core/handoff_manifest.py` (builds a handoff manifest from a route)
- Tests

**No hook calls `route_intent()` when a user request arrives.** The router exists but has no entry point in the Agent's execution flow.

### E5: Two AGENTS.md blocks compete for "entry point"

File: `F:/Framepack-01-test/cases/moho-14-product-launch-30s/AGENTS.md`

**Upper block (HyperFrames init-generated, lines 1-88)**:
```
## Skills — USE THESE FIRST
Always invoke the relevant skill before writing or modifying compositions.
Doing anything with HyperFrames? Start at /hyperframes
```
→ Executable directive: "Start at /hyperframes"

**Lower block (Framepack managed block, lines 90-383)**:
```
Framepack 是导演，HyperFrames 是摄影棚。
导演的活是分镜和创意方向，不是操纵摄影机。
```
→ Principle declaration: "Framepack is the director"

**In Agent attention allocation, executable directives beat principle declarations.** The Agent follows "Start at /hyperframes" because it's an action instruction, not a principle.

### E6: guardrails.md lacks capability alignment rules

File: `F:/hyperframes/framepack-plugin/guardrails.md`

```
grep 'capture' guardrails.md     → 0 matches
grep 'capability' guardrails.md  → 0 matches
grep 'catalog' guardrails.md     → 1 generic mention
```

The guardrails that get injected into AGENTS.md managed blocks do NOT contain rules about:
- Running `npx hyperframes capture` for URL-based videos
- Checking `npx hyperframes catalog` before hand-coding components
- Loading workflow skills through Framepack's intent router first

### E7: Hermes `inject_message` mechanism

File: `F:/Hermes_windows/hermes-agent/hermes_cli/plugins.py` (line 409)

```python
def inject_message(self, content: str, role: str = "user") -> bool:
    if getattr(cli, "_agent_running", False):
        cli._interrupt_queue.put(msg)  # mid-turn interrupt
    else:
        cli._pending_input.put(msg)    # queued as next input
```

`inject_message` from `post_tool_call` hooks DOES reach the Agent. When the Agent is mid-turn, it goes to `_interrupt_queue` and is processed as an out-of-band user message. This means a `post_tool_call` hook on `skill_view` CAN inject a Framepack directive that the Agent will see.

### E8: Hermes supports plugin-registered CLI commands

File: `F:/Hermes_windows/hermes-agent/hermes_cli/plugins.py` (line 437)

```python
def register_cli_command(self, name, help, setup_fn, handler_fn, ...):
    self._manager._cli_commands[name] = {...}
```

Plugins can register `hermes <command>` subcommands. Framepack could register `hermes framepack update` or `hermes framepack hydrate` as a user-facing CLI command.

### E9: Framepack's existing upgrade modules are report-only

Files:
- `core/environment_doctor.py` — probes Node/npm/npx/HyperFrames CLI/skills; report-only
- `core/framepack_upgrade_report.py` — summarizes evidence; no install/upgrade actions
- `core/skill_install_manager.py` — has install logic but requires explicit approved sources
- `core/skill_overlay_manager.py` — manages Framepack-shipped hardening overlays
- `core/skill_upgrade_manager.py` — three-way merge decision (replace/auto_merge/manual_review)
- `scripts/framepack_doctor.py` — CLI entry for environment check
- `scripts/framepack_upgrade_report.py` — CLI entry for upgrade report

**Gap**: There is no `framepack hydrate` or `framepack update` CLI command that pushes the latest guardrails.md to all existing workbench projects. The hydrate logic exists (`core/context_hydrator.py → hydrate_context()`), but it only runs when triggered by a hook (skill_view, frame.md write, hyperframes command).

---

## Root Cause Analysis

```
User says "make a video about https://moho.lostmarble.com"
    ↓
Agent reads AGENTS.md → sees two competing entry points
    ↓
HyperFrames AGENTS.md says "Start at /hyperframes" (executable)
Framepack managed block says "Framepack is the director" (principle)
    ↓
Agent follows executable directive → loads /hyperframes routing table
    ↓
Routing table matches URL → /product-launch-video
    ↓
skill_view('product-launch-video') → skill says "You are the orchestrator"
    ↓
Agent enters Step 0-6 self-contained pipeline
    ↓
Framepack hooks never fire (no trigger point matches)
    ↓
Framepack is invisible for the entire session
```

**Root cause**: Framepack has no interception point between "Agent reads AGENTS.md" and "Agent enters workflow skill orchestrator". All Framepack triggers are downstream of the creative pipeline start.

---

## Feasibility Analysis of Proposed Directions

### Direction A: AGENTS.md managed block strengthening + hook on skill_view

**What**: Make managed block's first line an executable directive. Extend `_is_framepack_skill_name` to detect HyperFrames workflow skills. When `skill_view('product-launch-video')` fires, inject Framepack directive.

**Evidence supports**:
- E7 confirms `post_tool_call` inject_message reaches the Agent mid-turn
- The hook fires AFTER skill content is loaded — Agent sees both the skill and the Framepack injection

**Evidence challenges**:
- E2 confirms skill says "You are the orchestrator, run steps in order" — this is a strong lock-in directive
- The injected message would need to override or augment an already-loaded orchestrator
- AGENTS.md directive strength is unproven against skill-level orchestrator directives

**Verdict**: Feasible as a partial measure. The injection reaches the Agent, but the wording must be extremely precise to redirect an already-locked orchestrator without just being noise.

### Direction B: Framepack as workflow skill overlay

**What**: When Agent loads any workflow skill, Framepack hook injects a "co-direction" message establishing the creative authority split: "This skill handles production execution. Framepack handles creative direction. Use the skill's capture/build/render capabilities, but frame.md comes from Framepack, expanded-prompt.md replaces STORYBOARD.md, Execution Manifest constrains HTML."

**Evidence supports**:
- E7 confirms injection mechanism works
- Doesn't try to stop the skill — augments it with Framepack's creative constraints
- Aligns with the AGENTS.md managed block's existing "Framepack advises; user decides" principle

**Evidence challenges**:
- The skill's Step 2 (build-frame.mjs) generates its OWN frame.md from presets — Framepack's frame.md would conflict
- The skill's Step 3 writes STORYBOARD.md — Framepack's expanded-prompt.md is a different artifact
- Two frame.md files (skill's + Framepack's) is confusing

**Verdict**: Feasible but requires careful artifact mapping. Need to decide: does Framepack's frame.md replace the skill's build-frame.mjs output, or does Framepack's frame.md feed into build-frame.mjs as a custom preset?

### Direction C: Merge Framepack into workflow skill pipeline

**What**: Framepack Phase 0-2 becomes "Step -1" of the workflow skill.

**Evidence rejects**:
- E2 confirms workflow skills are upstream HeyGen-maintained files. Framepack cannot modify them.
- Skill overlays (E9: skill_overlay_manager) can add hardening, but cannot restructure the Step 0-6 pipeline.
- Every `npx hyperframes init` / `npx hyperframes skills update` would overwrite any modifications.

**Verdict**: Not feasible without upstream PR to HyperFrames.

### Direction D: Framepack hydrate CLI command

**What**: Register `hermes framepack hydrate <workbench>` via `register_cli_command`. Pushes latest guardrails.md to all AGENTS.md files in the workbench.

**Evidence supports**:
- E8 confirms Hermes supports plugin CLI command registration
- `hydrate_context()` already exists and works (core/context_hydrator.py)
- This would solve the "stale guardrails in existing projects" gap (E6)

**Evidence challenges**:
- Currently Framepack's `__init__.py` only registers hooks, not CLI commands
- Would need to add `register_cli_command` in plugin init
- Need to handle case where workbench has many cases, each with its own AGENTS.md

**Verdict**: Feasible and low-risk. This is plumbing, not architecture change.

### Direction E: Framepack update CLI command

**What**: Register `hermes framepack update` that simulates the full upgrade cycle:
1. Run doctor (environment check)
2. Check guardrails.md hash vs deployed version
3. Sync source → deployed plugin directory
4. Hydrate all workbench projects
5. Run smoke test
6. Report

**Evidence supports**:
- All component modules already exist (environment_doctor, skill_upgrade_manager, context_hydrator)
- E8 confirms CLI command registration is available
- The scripts already exist: `framepack_doctor.py`, `framepack_upgrade_report.py`

**Evidence challenges**:
- No existing end-to-end orchestrator that chains doctor → sync → hydrate → smoke
- Need to define "workbench discovery" (scan for AGENTS.md with FRAMEPACK MANAGED BLOCK?)

**Verdict**: Feasible. This is an orchestration task over existing modules.

---

## Open Questions for PRD

1. **Artifact mapping**: When Framepack co-exists with product-launch-video skill, who owns `frame.md`?
   - Option A: Framepack's frame.md replaces build-frame.mjs output
   - Option B: Framepack's frame.md feeds as a custom preset into build-frame.mjs
   - Option C: Skill's build-frame.mjs is waived; Framepack's frame.md is the sole source

2. **STORYBOARD.md vs expanded-prompt.md**: Are these the same thing with different names, or fundamentally different artifacts?
   - product-launch-video's STORYBOARD.md is a shot-by-shot production plan
   - Framepack's expanded-prompt.md is a Director Story Bible with Execution Manifest
   - Can one replace the other, or must they coexist?

3. **Injection message wording**: What exact wording would redirect an Agent that has already received "You are the orchestrator, run steps in order"?
   - Needs empirical testing across models

4. **Hook timing**: `post_tool_call` fires AFTER skill content is loaded. Is there a way to fire BEFORE (pre_tool_call on skill_view)?
   - Currently pre_tool_call only intercepts `terminal` commands (E3)

5. **Workbench discovery for hydrate**: How to find all projects that need guardrail updates?
   - Scan for FRAMEPACK MANAGED BLOCK in AGENTS.md files?
   - Maintain a registry?

6. **Guardrails content update**: What specific rules need to be added to guardrails.md?
   - Capability alignment (capture/catalog/skills-pack first)
   - Workflow skill co-existence rules
   - "Framepack frame.md is the creative source of truth" directive

---

## Proposed PRD Scope (for user review)

Based on evidence, the PRD should cover:

1. **Workflow skill interception hook** (Direction A+B hybrid)
   - Extend post_tool_call to detect HyperFrames workflow skill loads
   - Inject Framepack co-direction message
   - Establish creative authority split

2. **guardrails.md v0.17 content update**
   - Add capability alignment iron law
   - Add workflow skill co-existence rules
   - Add "Framepack frame.md is creative source of truth" directive

3. **`hermes framepack hydrate` CLI command** (Direction D)
   - Push latest guardrails to workbench projects
   - Report stale files

4. **`hermes framepack update` CLI command** (Direction E)
   - End-to-end upgrade orchestrator
   - doctor → sync → hydrate → smoke → report

5. **capability-alignment gate evidence checking**
   - `used: capture` → verify capture/ directory exists
   - `used: product-launch-video` → verify Framepack co-direction was injected
   - `waived: catalog` → require waive reason + catalog check evidence

---

## Phase 2 Evidence (supplementary investigation)

### E10: Injection timing confirmed — post_tool_call fires on ALL tools including skill_view

File: `F:/Hermes_windows/hermes-agent/model_tools.py` lines 1175-1186

```python
_emit_post_tool_call_hook(
    function_name=function_name,
    function_args=function_args,
    result=result,
    ...
)
```

This fires **after** every tool execution — including `skill_view`. The `_finish_agent_tool` wrapper at line 1776 confirms the same pattern for the other code path.

**Timing sequence for skill_view**:
```
Agent calls skill_view('product-launch-video')
    ↓
Hermes executes skill_view → returns skill content
    ↓
_emit_post_tool_call_hook fires → Framepack's on_post_tool_call receives it
    ↓
Framepack hook sees tool_name="skill_view", args.name="product-launch-video"
    ↓
Framepack calls ctx.inject_message() → goes to _interrupt_queue
    ↓
Agent receives BOTH: skill content (as tool result) + Framepack injection (as OOB user message)
```

**Key finding**: Framepack's injection arrives in the SAME LLM turn as the skill content. The Agent sees both simultaneously. This is the earliest possible interception point — but the skill content is already loaded.

**Implication for Direction B**: The overlay message doesn't need to PREVENT skill loading. It needs to ESTABLISH CREATIVE AUTHORITY over the skill's execution. The Agent already has the skill content; Framepack's message tells it "use this skill's capabilities, but Framepack owns the creative decisions."

### E11: Seven workflow skills use orchestrator language

```
product-launch-video: "You are the orchestrator"
faceless-explainer:   "You are the orchestrator"
pr-to-video:          "You are the orchestrator"
general-video:        "orchestrator"
motion-graphics:      "orchestrator"
music-to-video:       "orchestrator"
remotion-to-hyperframes: "orchestrator"
```

ALL seven workflow skills claim orchestrator authority. The overlay hook must detect ALL of them, not just product-launch-video.

**Proposed detection set** (`HYPERFRAMES_WORKFLOW_SKILLS`):
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

### E12: Artifact mapping — skill artifacts vs Framepack artifacts

| Skill artifact | Framepack equivalent | Relationship |
|---|---|---|
| `capture/extracted/tokens.json` | `.framepack/asset-intake.md` | **Feed**: capture output should populate asset-intake, not replace it |
| `frame.md` (from build-frame.mjs) | `frame.md` (from Framepack Phase 1) | **Conflict**: both produce frame.md. Resolution: Framepack's frame.md is the creative source of truth; skill's build-frame.mjs can remix it as a preset input, but cannot override creative decisions |
| `STORYBOARD.md` | `.hyperframes/expanded-prompt.md` | **Complement**: STORYBOARD.md is shot-level production plan; expanded-prompt.md is Director Story Bible with Execution Manifest. expanded-prompt.md should be written FIRST, then STORYBOARD.md derives from it |
| `SCRIPT.md` | (no equivalent) | **Skill-only**: narration script belongs to the skill |
| `audio_meta.json` | (no equivalent) | **Skill-only**: audio belongs to the skill |
| `compositions/frames/*.html` | (no equivalent) | **Skill-only**: HTML authoring belongs to the skill/HyperFrames |
| (no equivalent) | `.framepack/arsenal.json` | **Framepack-only**: weapon registry |
| (no equivalent) | `.framepack/handoff-manifest.md` | **Framepack-only**: handoff constraints |

**Key insight**: The conflict is ONLY on `frame.md`. Everything else is either feed-only (capture → asset-intake), complement (expanded-prompt → STORYBOARD), or non-overlapping.

**frame.md resolution proposal**:
1. Framepack Phase 1 produces frame.md FIRST (creative source of truth)
2. Skill's build-frame.mjs can be waived (skip Step 2 entirely)
3. OR skill's build-frame.mjs reads Framepack's frame.md as the "custom preset" (tokens come from Framepack, not from capture/tokens.json)

### E13: build-frame.mjs architecture — deterministic remix, not creative

File: `F:/Hermes_windows/skills/product-launch-video/scripts/build-frame.mjs`

The script:
1. Reads a named preset's FRAME.md (from hyperframes-creative/frame-presets/)
2. Reads brand tokens from `capture/extracted/tokens.json`
3. Remixes: preset color keys ← brand token roles (ink/canvas/accents)
4. Preserves: keys, structure, geometry, components
5. Output: `frame.md` + `.hyperframes/caption-skin.html`

**Critical**: build-frame.mjs does NOT make creative decisions. It's a deterministic color/font mapper. The "creative" input is only the preset name choice + captured brand tokens.

**Implication**: Framepack's frame.md (which comes from Visual Style matching + user co-creation + Control Profile weights) is strictly richer than build-frame.mjs output. The overlay message can safely say "skip build-frame.mjs; Framepack's frame.md is already the creative spec."

### E14: Framepack `__init__.py` — no CLI command registration

File: `F:/hyperframes/framepack-plugin/__init__.py`

Current `register()`:
```python
def register(ctx):
    _register_skills(ctx)
    register_post_hook(ctx)
    register_pre_hook(ctx)
```

No `ctx.register_cli_command(...)` call exists. The Hermes plugin API supports it (E8 from Phase 1), but Framepack hasn't used it.

**Gap**: Need to add CLI command registration for:
- `hermes framepack hydrate` → push guardrails to workbench projects
- `hermes framepack update` → end-to-end upgrade orchestrator

### E15: Upgrade chain modules — what exists, what's the gap

| Module | Purpose | Status |
|---|---|---|
| `core/environment_doctor.py` | Probe Node/npm/npx/HyperFrames CLI/skills | ✅ Report-only |
| `core/skill_install_manager.py` | Install official skill sources (atomic precheck) | ✅ Exists |
| `core/skill_overlay_manager.py` | Framepack hardening overlays onto local skills | ✅ Exists |
| `core/skill_overlay_planner.py` | Dry-run overlay planning | ✅ Exists |
| `core/skill_upgrade_manager.py` | Three-way merge (replace/auto_merge/manual_review) | ✅ Exists |
| `core/framepack_upgrade_report.py` | Summarize upgrade evidence | ✅ Exists |
| `core/context_hydrator.py` | Push guardrails to AGENTS.md | ✅ Exists |
| `core/hermes_adapter.py` | Hermes patch audit | ✅ Exists |
| `scripts/framepack_doctor.py` | CLI entry for doctor | ✅ Exists |
| `scripts/framepack_upgrade_report.py` | CLI entry for upgrade report | ✅ Exists |

**Gap**: No single command chains these together. `hermes framepack update` would be:

```
1. doctor → check environment
2. sync source → deployed plugin directory (md5 verify)
3. hydrate → push guardrails to all workbench projects
4. skill overlay → check if HyperFrames skill overlays need updating
5. smoke → run import + basic behavior test from deployed path
6. report → summarize what changed
```

All components exist. The missing piece is the orchestrator that chains them + the CLI registration in `__init__.py`.

### E16: Workbench discovery — how to find projects that need hydration

Current hydrate trigger scans:
- Workbench root `AGENTS.md`
- Workbench root `CLAUDE.md`
- Case-level `cases/*/AGENTS.md`
- Case-level `cases/*/CLAUDE.md`

This logic already exists in `core/context_hydrator.py → hydrate_context()`.

For `hermes framepack hydrate <workbench>`, the flow would be:
1. Accept workbench root path as argument
2. Call `hydrate_context(workbench_root, plugin_dir)`
3. Report which files were updated / stale / no-op

---

## Updated PRD Scope (final)

Based on all 16 evidence points:

### Feature 1: Workflow Skill Overlay Hook (Direction B)

**Trigger**: `post_tool_call` on `skill_view` where skill name ∈ HYPERFRAMES_WORKFLOW_SKILLS

**Injection**: Co-direction message establishing creative authority split

**Message template** (not final wording — needs empirical testing):
```
[Framepack Director Overlay]
You just loaded {skill_name}. This skill handles production execution (capture, build, render).
Framepack handles creative direction.

Rules:
1. frame.md already exists from Framepack Phase 1 — skip the skill's build-frame.mjs (Step 2)
2. expanded-prompt.md already exists from Framepack Phase 2 — STORYBOARD.md must derive from it, not replace it
3. Execution Manifest constrains HTML authoring — skill's frame-worker sub-agents must respect it
4. If Framepack's frame.md doesn't exist yet, run Framepack Phase 0-2 FIRST before continuing the skill
```

### Feature 2: guardrails.md v0.17 Content Update

Add to guardrails.md (flows into AGENTS.md managed block):
1. Capability alignment iron law (capture/catalog/skills-pack first)
2. Workflow skill co-existence rules (Framepack owns creative, skill owns production)
3. "frame.md from Framepack is the creative source of truth" directive

### Feature 3: `hermes framepack hydrate` CLI Command

**Registration**: `ctx.register_cli_command("framepack", ...)` in `__init__.py`

**Flow**: `hermes framepack hydrate <workbench>` → `hydrate_context(workbench_root, plugin_dir)` → report

### Feature 4: `hermes framepack update` CLI Command

**Registration**: Same as Feature 3

**Flow**: `hermes framepack update`:
1. doctor (environment check)
2. sync source → deployed (md5 verify)
3. hydrate all workbench projects
4. skill overlay check
5. smoke test (import + basic behavior)
6. report

### Feature 5: capability-alignment Gate Evidence Checking

Extend `core/gates/hyperframes_capability_alignment.py`:
- `used: capture` → verify `capture/` directory or asset files exist
- `used: product-launch-video` → verify overlay injection evidence
- `waived: catalog` → require waive reason text
