# Framepack Active Intervention Layer Design

Date: 2026-06-01
Status: Draft for user review
Target: Framepack 0.6.x, with stage 5 deferred to 0.7.0

## Purpose

Framepack should not be only a toolbox that agents may remember to use. It should become the video-production workbench that actively guides Codex, Claude Code, and similar coding agents through the professional HyperFrames workflow.

The GBrain reference notes show the key product lesson: a Harness becomes powerful when it intervenes at the moments where an agent would otherwise forget context, bypass rules, produce weak artifacts, or lose learning from failure.

Framepack already has the right foundation: workbench files, audit gates, project skills, MCP, template/Catalog/design arsenals, build/preview/render commands, and sandbox benchmarking. The next step is an Active Intervention Layer that makes those pieces show up at the right time.

## Harness Control Theory

Framepack is an add-on Harness, not an infrastructure controller. It cannot physically force Codex or Claude Code to use its workflow: the host agent owns the terminal, filesystem, environment, and enough programming ability to write HTML, call HyperFrames, or build a video path by itself.

That boundary matters. Framepack should not copy proxy-style control models that work only when the Harness owns the network, container, credentials, or execution boundary. Framepack's control model is friction design:

```text
Framepack control = harness rules x low-friction path x visible feedback x project memory
```

The product goal is not "make the agent unable to leave". The goal is "make the Framepack route the cheapest, clearest, most professional route". Agents remain free, but the best path should be the Framepack path.

This turns the Active Intervention Layer into a friction-aware Harness:

- Skills define the tactical playbook before the agent starts improvising.
- CLI and MCP commands make the correct action faster than manual work.
- Intervention context gives the next best move without requiring the agent to search.
- Cost gates block only when continuing would likely create expensive rework.
- Friction logs turn bypasses and failures into future product evidence.

The tennis doubles metaphor is useful: Codex is the stronger technical player, Framepack is the tactical partner. Framepack does not own the court. It wins by being in the right place before the next shot.

## Design Principle

Use a balanced intervention model:

- P0 blockers stop unsafe or invalid progression by default.
- P1 and P2 findings warn loudly, explain the next action, and are recorded.
- `--force` can bypass a P0 only when the action is explicit and the bypass is written to durable project evidence.

This keeps Framepack firm enough to matter without becoming an obstructive black box.

## Non-Goals

This design does not add a global daemon, automatic skill rewriting, always-on chat monitoring, cross-project personal memory, or automatic template mutation. Those belong to stage 5 and are deferred to Framepack 0.7.0.

This design does not replace Codex or Claude Code. Framepack remains a domain Harness and workbench layered on top of general-purpose coding agents.

This design does not install external animation libraries, forge backends, or model services automatically.

## Stage 1: Low-Friction Intervention Context

Every important Framepack command should return a compact guidance block that tells the agent what it has just changed, what the project state is, what it should do next, and why that route is cheaper than improvising.

Initial command coverage:

- `create`
- `workbench brief`
- `workbench audit`
- `build`
- `preview`
- `render`
- `templates recommend`
- `catalog recommend`

The context block should include:

- current project phase
- required reading files
- recommended next command
- unresolved P0/P1 blockers
- relevant workbench files
- selected template/Catalog/design route when known
- skill reminders when the agent is likely to need `framepack-director`, `framepack-template-fuser`, `framepack-hyperframes-builder`, or `framepack-reference-miner`
- a short `why` field explaining the cost avoided by following the recommendation
- a `shortcut` field that makes the Framepack path feel easier than manual work

Human-readable CLI output should stay short. JSON output should include a structured `interventionContext` object.

Example shape:

```json
{
  "interventionContext": {
    "phase": "composition",
    "status": "needs-review",
    "requiredReads": ["HUMAN.md", "DIRECTION.md", "COMPOSITION.md"],
    "nextCommand": "npx framepack workbench audit --phase composition --project-dir <dir>",
    "why": "This catches missing design tokens and asset gaps before build, avoiding a failed HyperFrames preview.",
    "shortcut": "Run this before editing index.html manually.",
    "blockers": [],
    "warnings": ["Confirm asset gaps before build."],
    "skillHints": ["framepack-template-fuser"]
  }
}
```

## Stage 2: Lifecycle Cost Gates

Framepack should prevent agents from casually skipping critical production gates, but the product language should frame these as cost gates rather than authority gates. A gate blocks because continuing would likely create rework, not because Framepack wants to dominate the host agent.

Gate policy:

- `build` checks `preflight`, `design`, and `composition`.
- `preview` checks build output, runtime metadata, and preview readiness.
- `render` checks preview readiness and render safety.
- P0 blockers stop the command unless `--force` is provided.
- P1/P2 findings do not stop the command, but they appear in CLI output, JSON output, and intervention logs.
- each blocked command explains the avoided cost, such as repeated preview fixes, broken render metadata, or inconsistent typography

Required durable record:

- `.framepack/interventions.jsonl`
- `ITERATIONS.md` summary entry when `--force` is used

The first implementation should gate only Framepack-owned lifecycle commands. It should not attempt to intercept arbitrary agent file writes outside the CLI.

## Stage 3: Friction Capture

Every failed or bypassed production step should become useful evidence.

Add project-local files:

```text
.framepack/friction.jsonl
.framepack/interventions.jsonl
```

Capture events:

- command failure
- audit blocker
- repeated blocker
- `--force` bypass
- missing `meta.json`
- missing `data-width`, `data-height`, or `data-start`
- missing block HTML references
- timed video nested inside timed scene containers
- render output missing or suspiciously small
- bypass signals, such as manual HTML rewrites, direct render attempts without audit, or user/test feedback saying the workflow was skipped

Add commands:

```bash
npx framepack workbench friction --project-dir <dir>
npx framepack workbench learnings --project-dir <dir>
```

`friction` reports raw issues. `learnings` groups them into product-level improvement hints, such as "composition build contract drift" or "agent skipped design-token gate".

Friction capture should distinguish ordinary technical errors from attraction failures. An attraction failure means the agent or user chose to leave the Framepack path because it felt slower, unclear, weak, or unhelpful. These are the most important product signals.

Example:

```json
{
  "type": "bypass-signal",
  "where": "after-composition",
  "agentBehavior": "manual-html-rewrite",
  "likelyCause": "Framepack build output was not expressive enough",
  "suggestedDesignResponse": "Improve template-fuser guidance or build skeleton defaults"
}
```

## Stage 4: Project Field Preferences

Framepack should capture fuzzy user taste inside the project, not rely on the agent to remember it.

Initial scope is project-local only.

Inputs:

- `--idea`
- `--style`
- existing `STYLE.md`
- existing `DIRECTION.md`
- optionally `HUMAN.md` and `ITERATIONS.md`

Output:

```text
.framepack/preferences.json
```

Captured dimensions:

- tone: premium, playful, cinematic, editorial, technical, energetic
- pacing: fast, medium, slow, punchy, calm
- text treatment: large text, dense text, minimal text, subtitles
- motion language: kinetic, smooth, hard cuts, parallax, data motion
- reference style hints
- avoid list
- confidence: explicit, inferred, or weak
- field forces: weighted constraints that apply to composition, template selection, captions, pacing, and visual style

Preference capture should also update `STYLE.md` and `DIRECTION.md` when `create` runs. Later commands can read the preference file to improve recommendations.

Example:

```json
{
  "fieldForces": [
    {
      "id": "large-focal-text",
      "strength": "high",
      "source": "explicit-user-style",
      "appliesTo": ["composition", "template-selection", "caption-design"]
    }
  ]
}
```

## Stage 5: Field Maintenance Loop Deferred To 0.7.0

The GBrain-style long-loop mechanisms are valuable, but they should not ship in the 0.6 active intervention slice.

Deferred to 0.7.0:

- cross-project preference memory
- local daemon or scheduled maintenance
- template usage mining
- automatic template deprecation suggestions
- skill benchmark scoring
- skill improvement proposals
- friction-driven template updates
- calibration profiles across projects
- attraction analysis: which steps agents bypass and why
- field-strength analysis: which project preferences are repeatedly ignored or mistranslated

0.6 should prepare data for this future by writing clean `friction.jsonl`, `interventions.jsonl`, and `preferences.json`. It should not yet try to evolve itself automatically.

## Architecture

Add a focused intervention module rather than spreading logic across command handlers.

Proposed modules:

```text
src/workbench/intervention-context.ts
src/workbench/lifecycle-gates.ts
src/workbench/friction-log.ts
src/workbench/preferences.ts
src/workbench/field-forces.ts
```

The CLI layer calls these modules after existing workbench/build/audit logic. The MCP layer can expose the same structured data later, but CLI behavior is the first priority.

Data flow:

```text
command input
  -> existing command handler
  -> intervention context builder
  -> lifecycle gate evaluator when applicable
  -> friction/intervention event writer
  -> CLI text or JSON output
```

## CLI Behavior

Default text output should remain readable:

```text
Framepack intervention:
- Phase: design
- Next: run workbench audit --phase design
- Read: DESIGN.md, DESIGN_TOKENS.md, ASSET_GAPS.md
- Blockers: none
```

JSON output should be machine-friendly:

```json
{
  "ok": true,
  "interventionContext": {},
  "interventionEvents": []
}
```

When a P0 blocks a command:

```text
Framepack blocked build because design-token-contract failed.
Fix: regenerate or repair DESIGN_TOKENS.md, then run workbench audit --phase design.
Use --force only if you intentionally want to bypass this gate.
```

## Testing

Add or update tests for:

- command output includes `interventionContext` in JSON mode
- `build` blocks on P0 design/composition audit failures
- `build --force` records an intervention event
- `preview` and `render` evaluate lifecycle gates
- friction events are written for command failures and P0 blockers
- `workbench friction` summarizes project events
- `workbench learnings` groups recurring issues
- preference capture writes `.framepack/preferences.json`
- template/Catalog recommendations can use captured preferences
- sandbox benchmark includes active intervention scoring

Required verification:

```bash
npm run typecheck
npm test
npm run build
npm run sandbox:benchmark
npm pack --dry-run --json
```

## Documentation Updates

Update:

- `README.md`
- `docs/README.zh-CN.md`
- `AGENTS.md`
- `templates/agent/codex/SKILL.md`
- `templates/agent/claude-code/CLAUDE.md`
- `docs/agent-platform/codex.md`
- `docs/agent-platform/claude-code.md`
- `CHANGELOG.md`

Docs should explain the idea in simple language:

Framepack now does more than create files. It watches the production stages, reminds the agent what matters, blocks unsafe jumps, records failures, and keeps the user-facing video plan understandable.

## Risks

The main risk is over-intervention. If every warning blocks progress, agents will route around Framepack. That is why only P0 blocks by default.

The second risk is noisy output. Intervention context must be compact in normal CLI output and detailed only in JSON.

The third risk is pretending to have memory we do not have. Stage 4 is project-local; global preference memory is explicitly deferred.

The fourth risk is misunderstanding the host/add-on boundary. Framepack cannot force arbitrary agent behavior outside its own CLI/MCP/skill surfaces. The design must keep improving the attractiveness of the Framepack route rather than pretending to own the whole environment.

## Acceptance Criteria

The feature is ready when:

- main lifecycle commands expose intervention context
- P0 lifecycle gates block by default
- `--force` bypasses are durable and visible
- project friction and intervention logs exist
- project preferences are captured from user intent
- sandbox benchmark scores the intervention layer
- documentation teaches agents and humans how the active layer works

## Xiaobai Summary

以前 Framepack 更像一个工具箱：Agent 记得用就用，不记得就绕过去。

这次升级要让 Framepack 更像一个视频项目的现场导演和质检员。每一步它都会提醒 Agent：现在到了哪一步、该看哪些文件、下一步该做什么、哪里不能跳过。如果 Agent 想硬闯，也可以，但必须留下记录。

这样用户不需要懂技术，也能让 Agent 在一个更专业的视频制作流程里工作。
