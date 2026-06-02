import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { auditWorkbenchProject, type WorkbenchAuditPhase, type WorkbenchAuditReport } from "./index.js";

export type WorkbenchLifecycleAction = "build" | "preview" | "render";

export interface WorkbenchInterventionEvent {
  version: "framepack.intervention-event.v1";
  timestamp: string;
  projectDir: string;
  action: WorkbenchLifecycleAction | "audit";
  phase: WorkbenchAuditPhase;
  status: "allowed" | "blocked" | "forced" | "warning";
  blockers: string[];
  warnings: string[];
  message: string;
}

export interface WorkbenchGateResult {
  status: "allowed" | "blocked" | "forced";
  reports: WorkbenchAuditReport[];
  blockers: string[];
  warnings: string[];
  message: string;
}

const ACTION_PHASES: Record<WorkbenchLifecycleAction, WorkbenchAuditPhase[]> = {
  build: ["preflight", "design", "composition"],
  preview: ["preview"],
  render: ["preview", "render"],
};

export function checkWorkbenchLifecycleGate(input: {
  projectDir: string;
  action: WorkbenchLifecycleAction;
  force?: boolean;
}): WorkbenchGateResult {
  const projectDir = resolve(input.projectDir);
  if (!isWorkbenchProject(projectDir)) {
    return {
      status: "allowed",
      reports: [],
      blockers: [],
      warnings: [],
      message: "Framepack lifecycle gate skipped because this is not a 0.6 workbench project.",
    };
  }

  const reports = ACTION_PHASES[input.action].map((phase) => auditWorkbenchProject(projectDir, phase));
  const blockers = reports.flatMap((report) => report.priorityBlockers
    .filter((check) => check.priority === "P0")
    .map((check) => `${check.priority} ${check.id}: ${check.correction}`));
  const warnings = reports.flatMap((report) => [
    ...report.priorityBlockers
      .filter((check) => check.priority !== "P0")
      .map((check) => `${check.priority} ${check.id}: ${check.correction}`),
    ...report.findings,
  ]).slice(0, 10);

  if (blockers.length > 0 && input.force) {
    return {
      status: "forced",
      reports,
      blockers,
      warnings,
      message: "P0 blockers were bypassed with --force. Record this decision and verify the preview carefully.",
    };
  }

  if (blockers.length > 0) {
    return {
      status: "blocked",
      reports,
      blockers,
      warnings,
      message: "Framepack blocked this step because continuing would create high rework cost.",
    };
  }

  return {
    status: "allowed",
    reports,
    blockers,
    warnings,
    message: warnings.length > 0
      ? "Framepack allowed this step with warnings. Review them before polishing."
      : "Framepack allowed this step.",
  };
}

function isWorkbenchProject(projectDir: string): boolean {
  if (!existsSync(join(projectDir, "FRAMEPACK.md")) || !existsSync(join(projectDir, ".framepack", "state.json"))) {
    return false;
  }
  try {
    const state = JSON.parse(readFileSync(join(projectDir, ".framepack", "state.json"), "utf8")) as { version?: string };
    return state.version === "framepack.workbench.v1";
  } catch {
    return false;
  }
}

export function recordWorkbenchIntervention(event: WorkbenchInterventionEvent): void {
  const framepackDir = join(event.projectDir, ".framepack");
  mkdirSync(framepackDir, { recursive: true });
  appendFileSync(join(framepackDir, "interventions.jsonl"), `${JSON.stringify(event)}\n`, "utf8");
}

export function recordGateResult(input: {
  projectDir: string;
  action: WorkbenchLifecycleAction;
  gate: WorkbenchGateResult;
}): void {
  if (input.gate.reports.length === 0) return;
  const phase = ACTION_PHASES[input.action].at(-1) ?? "all";
  recordWorkbenchIntervention({
    version: "framepack.intervention-event.v1",
    timestamp: new Date().toISOString(),
    projectDir: resolve(input.projectDir),
    action: input.action,
    phase,
    status: input.gate.status,
    blockers: input.gate.blockers,
    warnings: input.gate.warnings,
    message: input.gate.message,
  });
}

export function appendForceSummary(input: {
  projectDir: string;
  action: WorkbenchLifecycleAction;
  gate: WorkbenchGateResult;
}): void {
  if (input.gate.status !== "forced") return;
  const iterationsPath = join(resolve(input.projectDir), "ITERATIONS.md");
  const existing = existsSync(iterationsPath) ? readFileSync(iterationsPath, "utf8") : "# Iterations\n";
  const entry = [
    "",
    "## Framepack Force Bypass",
    "",
    `- Time: ${new Date().toISOString()}`,
    `- Action: ${input.action}`,
    `- Reason: ${input.gate.message}`,
    `- Blockers: ${input.gate.blockers.join(" | ") || "none"}`,
    "",
  ].join("\n");
  writeFileSync(iterationsPath, `${existing.trimEnd()}\n${entry}`, "utf8");
}

export function readWorkbenchInterventions(projectDir: string): WorkbenchInterventionEvent[] {
  const logPath = join(resolve(projectDir), ".framepack", "interventions.jsonl");
  if (!existsSync(logPath)) return [];
  return readFileSync(logPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as WorkbenchInterventionEvent);
}
