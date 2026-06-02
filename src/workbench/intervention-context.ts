export type WorkbenchInterventionCommand = "create" | "check" | "audit" | "brief" | "build";
export type WorkbenchInterventionPhase = "preflight" | "design" | "composition" | "preview" | "render";
export type WorkbenchInterventionStatus = "ready" | "needs-review" | "blocked";

interface ReportCheckLike {
  id: string;
  status: "passed" | "failed";
  summary: string;
  priority?: "P0" | "P1" | "P2";
  correction?: string;
}

interface ReportLike {
  status: "passed" | "failed";
  phase?: string;
  checks?: ReportCheckLike[];
  priorityBlockers?: ReportCheckLike[];
  findings?: string[];
  corrections?: string[];
}

export interface WorkbenchInterventionContext {
  version: "framepack.intervention-context.v1";
  command: WorkbenchInterventionCommand;
  phase: WorkbenchInterventionPhase;
  status: WorkbenchInterventionStatus;
  projectDir: string;
  requiredReads: string[];
  nextCommand: string;
  why: string;
  shortcut: string;
  blockers: string[];
  warnings: string[];
  skillHints: string[];
}

export function buildWorkbenchInterventionContext(input: {
  command: WorkbenchInterventionCommand;
  projectDir: string;
  phase?: string;
  report?: ReportLike;
}): WorkbenchInterventionContext {
  const phase = normalizePhase(input.command, input.phase);
  const blockers = collectBlockers(input.report);
  const warnings = collectWarnings(input.report);
  const status = resolveStatus(input.command, input.report, blockers);

  return {
    version: "framepack.intervention-context.v1",
    command: input.command,
    phase,
    status,
    projectDir: input.projectDir,
    requiredReads: requiredReadsFor(input.command, phase),
    nextCommand: nextCommandFor(input.command, phase, input.projectDir, status),
    why: whyFor(input.command, phase, status),
    shortcut: shortcutFor(input.command, phase, status),
    blockers,
    warnings,
    skillHints: skillHintsFor(input.command, phase),
  };
}

function normalizePhase(command: WorkbenchInterventionCommand, phase?: string): WorkbenchInterventionPhase {
  if (phase === "design" || phase === "composition" || phase === "preview" || phase === "render") return phase;
  if (command === "build") return "preview";
  return "preflight";
}

function resolveStatus(
  command: WorkbenchInterventionCommand,
  report: ReportLike | undefined,
  blockers: string[],
): WorkbenchInterventionStatus {
  if (blockers.length > 0) return "blocked";
  if (report?.status === "failed") return "needs-review";
  if (command === "create" || command === "brief") return "needs-review";
  return "ready";
}

function collectBlockers(report?: ReportLike): string[] {
  const priorityBlockers = report?.priorityBlockers ?? [];
  const failedChecks = report?.checks?.filter((check) => check.status === "failed" && (!check.priority || check.priority === "P0" || check.priority === "P1")) ?? [];
  return [...priorityBlockers, ...failedChecks]
    .filter((check, index, all) => all.findIndex((item) => item.id === check.id) === index)
    .map((check) => `${check.priority ? `${check.priority} ` : ""}${check.id}: ${check.correction ?? check.summary}`);
}

function collectWarnings(report?: ReportLike): string[] {
  const findings = report?.findings ?? [];
  const lowPriorityFailures = report?.checks
    ?.filter((check) => check.status === "failed" && check.priority === "P2")
    .map((check) => `${check.id}: ${check.summary}`) ?? [];
  return [...findings, ...lowPriorityFailures].slice(0, 5);
}

function requiredReadsFor(command: WorkbenchInterventionCommand, phase: WorkbenchInterventionPhase): string[] {
  if (command === "build" || phase === "preview" || phase === "render") {
    return ["COMPOSITION.md", "DESIGN_TOKENS.md", "index.html", "meta.json", "ITERATIONS.md"];
  }
  if (phase === "design") return ["HUMAN.md", "STYLE.md", "DESIGN.md", "DESIGN_TOKENS.md"];
  if (phase === "composition") return ["ASSETS.md", "ASSET_GAPS.md", "DESIGN_TOKENS.md", "DIRECTION.md", "COMPOSITION.md"];
  return ["FRAMEPACK.md", "HUMAN.md", "ASSETS.md", "ASSET_GAPS.md", "DIRECTION.md", "COMPOSITION.md"];
}

function nextCommandFor(
  command: WorkbenchInterventionCommand,
  phase: WorkbenchInterventionPhase,
  projectDir: string,
  status: WorkbenchInterventionStatus,
): string {
  if (status === "blocked") {
    return `Fix blockers, then rerun: npx framepack workbench audit --phase ${phase} --project-dir "${projectDir}" --json`;
  }
  if (command === "create") return `npx framepack workbench brief --project-dir "${projectDir}"`;
  if (command === "brief") return `npx framepack workbench audit --phase preflight --project-dir "${projectDir}"`;
  if (command === "build" || phase === "preview") return `npx framepack preview --project-dir "${projectDir}" --open`;
  if (phase === "design") return `npx framepack workbench audit --phase composition --project-dir "${projectDir}" --json`;
  if (phase === "composition") return `npx framepack build --project-dir "${projectDir}" --json`;
  if (phase === "render") return `Review HUMAN.md and ITERATIONS.md, then collect the next user correction.`;
  return `npx framepack workbench audit --phase design --project-dir "${projectDir}" --json`;
}

function whyFor(
  command: WorkbenchInterventionCommand,
  phase: WorkbenchInterventionPhase,
  status: WorkbenchInterventionStatus,
): string {
  if (status === "blocked") return "Framepack found production blockers. The agent should stop, fix them, or ask the user before moving forward.";
  if (command === "create") return "The workbench is ready, but the agent should first explain the plan in plain language before editing code.";
  if (command === "build") return "The HTML skeleton exists; preview is the next evidence point before render or user review.";
  if (phase === "design") return "Design tokens are the creative contract. They keep later animation and template choices consistent.";
  if (phase === "composition") return "Composition is the handoff between creative direction and HyperFrames-safe production.";
  return "This context keeps the agent inside the Framepack workflow instead of jumping straight to ad hoc implementation.";
}

function shortcutFor(
  command: WorkbenchInterventionCommand,
  phase: WorkbenchInterventionPhase,
  status: WorkbenchInterventionStatus,
): string {
  if (status === "blocked") return "小白版：先补齐红灯问题，再继续做视频。";
  if (command === "create") return "小白版：项目骨架已生成，下一步先看懂方案。";
  if (command === "build" || phase === "preview") return "小白版：代码已经搭好，下一步看预览画面是否靠谱。";
  if (phase === "composition") return "小白版：这里决定视频怎么演、怎么动、怎么衔接。";
  return "小白版：每过一关都先检查，避免后面返工。";
}

function skillHintsFor(command: WorkbenchInterventionCommand, phase: WorkbenchInterventionPhase): string[] {
  if (command === "build" || phase === "preview" || phase === "render") return ["framepack-hyperframes-builder"];
  if (phase === "composition") return ["framepack-template-fuser", "framepack-director"];
  if (phase === "design") return ["framepack-director"];
  return ["framepack-director", "framepack-template-fuser"];
}
