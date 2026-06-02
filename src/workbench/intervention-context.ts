export type WorkbenchInterventionCommand =
  | "create"
  | "check"
  | "audit"
  | "brief"
  | "build"
  | "preview"
  | "render"
  | "template-recommend"
  | "prompt-template-recommend"
  | "catalog-recommend";

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
  if (command === "build" || command === "preview") return "preview";
  if (command === "render") return "render";
  if (command === "template-recommend" || command === "prompt-template-recommend" || command === "catalog-recommend") return "composition";
  return "preflight";
}

function resolveStatus(
  command: WorkbenchInterventionCommand,
  report: ReportLike | undefined,
  blockers: string[],
): WorkbenchInterventionStatus {
  if (blockers.length > 0) return "blocked";
  if (report?.status === "failed") return "needs-review";
  if (
    command === "create" ||
    command === "brief" ||
    command === "template-recommend" ||
    command === "prompt-template-recommend" ||
    command === "catalog-recommend"
  ) {
    return "needs-review";
  }
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
  if (command === "template-recommend" || command === "prompt-template-recommend" || command === "catalog-recommend") {
    return ["HUMAN.md", "STYLE.md", "DESIGN_TOKENS.md", "DIRECTION.md", "COMPOSITION.md"];
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
  if (command === "template-recommend") return `Use the selected template route in COMPOSITION.md, then run: npx framepack workbench audit --phase composition --project-dir "${projectDir}" --json`;
  if (command === "prompt-template-recommend") return "Fuse the prompt-template scene shape into COMPOSITION.md, then run catalog recommend for polish parts.";
  if (command === "catalog-recommend") return `Reference the selected Catalog prefabs in COMPOSITION.md, then run: npx framepack build --project-dir "${projectDir}" --json`;
  if (command === "build" || phase === "preview") return `npx framepack preview --project-dir "${projectDir}" --open`;
  if (phase === "design") return `npx framepack workbench audit --phase composition --project-dir "${projectDir}" --json`;
  if (phase === "composition") return `npx framepack build --project-dir "${projectDir}" --json`;
  if (phase === "render") return "Review HUMAN.md and ITERATIONS.md, then collect the next user correction.";
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
  if (command === "preview") return "Preview is where the agent checks visible evidence before spending time on render or polish.";
  if (command === "render") return "Render is the delivery checkpoint; the next useful action is user feedback and iteration capture.";
  if (command === "template-recommend") return "Template choice narrows the creative route before the agent writes a custom composition.";
  if (command === "prompt-template-recommend") return "Prompt-template choice gives HyperFrames a familiar scene grammar before custom details are added.";
  if (command === "catalog-recommend") return "Catalog prefabs add proven polish blocks without asking the agent to invent every motion detail.";
  if (phase === "design") return "Design tokens are the creative contract. They keep later animation and template choices consistent.";
  if (phase === "composition") return "Composition is the handoff between creative direction and HyperFrames-safe production.";
  return "This context keeps the agent inside the Framepack workflow instead of jumping straight to ad hoc implementation.";
}

function shortcutFor(
  command: WorkbenchInterventionCommand,
  phase: WorkbenchInterventionPhase,
  status: WorkbenchInterventionStatus,
): string {
  if (status === "blocked") return "Xiaobai: fix the red-light issue first, then continue the video.";
  if (command === "create") return "Xiaobai: the project shell is ready; first read the plain-language plan.";
  if (command === "build" || command === "preview" || phase === "preview") return "Xiaobai: the HTML is ready; next check the preview before rendering.";
  if (command === "render" || phase === "render") return "Xiaobai: the video is being delivered; next collect feedback and iterate.";
  if (command === "template-recommend") return "Xiaobai: pick the video route first, then write the detailed choreography.";
  if (command === "prompt-template-recommend") return "Xiaobai: use a proven scene pattern so the video does not start from a blank page.";
  if (command === "catalog-recommend") return "Xiaobai: add proven animation parts to make the video look more polished.";
  if (phase === "composition") return "Xiaobai: this decides how the video performs, moves, and cuts.";
  return "Xiaobai: check each stage before moving on to avoid rework.";
}

function skillHintsFor(command: WorkbenchInterventionCommand, phase: WorkbenchInterventionPhase): string[] {
  if (command === "build" || command === "preview" || phase === "preview" || phase === "render") return ["framepack-hyperframes-builder"];
  if (command === "template-recommend" || command === "prompt-template-recommend" || command === "catalog-recommend") return ["framepack-template-fuser", "framepack-director"];
  if (phase === "composition") return ["framepack-template-fuser", "framepack-director"];
  if (phase === "design") return ["framepack-director"];
  return ["framepack-director", "framepack-template-fuser"];
}
