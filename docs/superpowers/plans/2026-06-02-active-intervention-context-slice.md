# Active Intervention Context Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first Framepack active-intervention slice: structured low-friction `interventionContext` output for the workbench lifecycle commands.

**Architecture:** Add a focused `src/workbench/intervention-context.ts` module that builds compact next-action guidance from a workbench project directory and optional audit phase/report. CLI commands call it after their existing behavior and include it in JSON output. Text output gets a short "Framepack intervention" block only for workbench lifecycle commands where it will not break existing tests.

**Tech Stack:** TypeScript, existing Framepack CLI, existing workbench audit/check/build functions, current script-based test runner.

---

### Task 1: Add Intervention Context Module

**Files:**
- Create: `src/workbench/intervention-context.ts`
- Modify: `src/workbench/index.ts`

- [ ] Define `WorkbenchInterventionContext` with `phase`, `status`, `requiredReads`, `nextCommand`, `why`, `shortcut`, `blockers`, `warnings`, and `skillHints`.
- [ ] Implement `buildWorkbenchInterventionContext(input)` with deterministic guidance for `create`, `check`, `audit`, `brief`, and `build`.
- [ ] Export the new API from `src/workbench/index.ts`.

### Task 2: Wire CLI JSON Output

**Files:**
- Modify: `src/interfaces/cli/index.ts`
- Test: `scripts/run-tests.mjs`

- [ ] Add `interventionContext` to `create --json` output.
- [ ] Add `interventionContext` to `workbench check --json` output.
- [ ] Add `interventionContext` to `workbench audit --json` output.
- [ ] Add `interventionContext` to `build --json` output.
- [ ] Keep existing non-JSON output stable except for concise workbench intervention text if needed.

### Task 3: Add Regression Tests

**Files:**
- Modify: `scripts/run-tests.mjs`

- [ ] Add a test proving `workbench audit --json` includes `interventionContext.nextCommand`, `why`, and `shortcut`.
- [ ] Add a test proving `build --json` includes a preview-oriented `interventionContext`.
- [ ] Add a test proving `create --json` includes the required first-read guidance.

### Task 4: Verify

**Commands:**
- `npm run typecheck`
- `npm test`
- `npm run build`

### Task 5: Commit

**Commit message:**

```bash
git commit -m "feat: add workbench intervention context"
```
