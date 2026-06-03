import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isWorkbenchProject, readWorkbenchInterventions } from "./interventions.js";

export interface WorkbenchFrictionEvent {
  version: "framepack.friction-event.v1";
  timestamp: string;
  projectDir: string;
  type: "audit-blocker" | "command-failure" | "force-bypass" | "runtime-structure" | "agent-bypass-signal";
  category: string;
  summary: string;
  evidence: string[];
}

export interface WorkbenchLearning {
  category: string;
  count: number;
  recommendation: string;
}

export function recordWorkbenchFriction(event: WorkbenchFrictionEvent): void {
  const framepackDir = join(event.projectDir, ".framepack");
  mkdirSync(framepackDir, { recursive: true });
  appendFileSync(join(framepackDir, "friction.jsonl"), `${JSON.stringify(event)}\n`, "utf8");
}

export function recordWorkbenchCommandFailure(input: {
  projectDir: string;
  action: string;
  summary: string;
  evidence?: string[];
}): void {
  const projectDir = resolve(input.projectDir);
  if (!isWorkbenchProject(projectDir)) return;
  recordWorkbenchFriction({
    version: "framepack.friction-event.v1",
    timestamp: new Date().toISOString(),
    projectDir,
    type: "command-failure",
    category: classifyFriction(`${input.action} ${input.summary} ${(input.evidence ?? []).join(" ")}`),
    summary: `${input.action} failed: ${input.summary}`,
    evidence: input.evidence ?? [],
  });
}

export function recordWorkbenchBypassSignal(input: {
  projectDir: string;
  summary: string;
  evidence?: string[];
}): WorkbenchFrictionEvent {
  const projectDir = resolve(input.projectDir);
  const event: WorkbenchFrictionEvent = {
    version: "framepack.friction-event.v1",
    timestamp: new Date().toISOString(),
    projectDir,
    type: "agent-bypass-signal",
    category: classifyFriction(input.summary),
    summary: input.summary,
    evidence: input.evidence ?? [],
  };
  recordWorkbenchFriction(event);
  return event;
}

export function readWorkbenchFriction(projectDir: string): WorkbenchFrictionEvent[] {
  const logPath = join(resolve(projectDir), ".framepack", "friction.jsonl");
  const directEvents = existsSync(logPath)
    ? readFileSync(logPath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as WorkbenchFrictionEvent)
    : [];

  const interventionEvents = readWorkbenchInterventions(projectDir)
    .filter((event) => event.status === "blocked" || event.status === "forced")
    .map((event): WorkbenchFrictionEvent => ({
      version: "framepack.friction-event.v1",
      timestamp: event.timestamp,
      projectDir: event.projectDir,
      type: event.status === "forced" ? "force-bypass" : "audit-blocker",
      category: classifyFriction(event.blockers.join(" ") || event.message),
      summary: event.message,
      evidence: event.blockers.length > 0 ? event.blockers : event.warnings,
    }));

  return [...directEvents, ...interventionEvents];
}

export function summarizeWorkbenchLearnings(projectDir: string): WorkbenchLearning[] {
  const counts = new Map<string, number>();
  for (const event of readWorkbenchFriction(projectDir)) {
    counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
  }

  return [...counts.entries()].map(([category, count]) => ({
    category,
    count,
    recommendation: recommendationFor(category),
  }));
}

export function formatWorkbenchFriction(projectDir: string): string {
  const events = readWorkbenchFriction(projectDir);
  return [
    "Framepack friction log",
    `projectDir: ${resolve(projectDir)}`,
    "",
    ...(events.length === 0
      ? ["No friction event recorded yet."]
      : events.map((event) => `- ${event.type}/${event.category}: ${event.summary}`)),
  ].join("\n");
}

export function createWorkbenchFrictionPayload(projectDir: string): {
  projectDir: string;
  events: WorkbenchFrictionEvent[];
  learnings: WorkbenchLearning[];
} {
  return {
    projectDir: resolve(projectDir),
    events: readWorkbenchFriction(projectDir),
    learnings: summarizeWorkbenchLearnings(projectDir),
  };
}

export function formatWorkbenchLearnings(projectDir: string): string {
  const learnings = summarizeWorkbenchLearnings(projectDir);
  return [
    "Framepack learnings",
    `projectDir: ${resolve(projectDir)}`,
    "",
    ...(learnings.length === 0
      ? ["No learning yet. Run audits, preview, render, and feedback loops first."]
      : learnings.map((item) => `- ${item.category} (${item.count}): ${item.recommendation}`)),
  ].join("\n");
}

function classifyFriction(text: string): string {
  const value = text.toLowerCase();
  if (value.includes("design-token") || value.includes("design_tokens")) return "design-token-missing";
  if (value.includes("asset")) return "asset-gap-unresolved";
  if (value.includes("composition")) return "composition-contract-drift";
  if (value.includes("meta.json") || value.includes("data-width") || value.includes("data-height") || value.includes("data-start")) return "hyperframes-runtime-structure";
  if (value.includes("human") || value.includes("hitl")) return "human-loop-unclear";
  if (value.includes("force")) return "forced-bypass";
  return "workflow-friction";
}

function recommendationFor(category: string): string {
  switch (category) {
    case "design-token-missing":
      return "Regenerate DESIGN.md and DESIGN_TOKENS.md before composition or build.";
    case "asset-gap-unresolved":
      return "Update ASSET_GAPS.md and ask the user whether gaps are blocking or optional.";
    case "composition-contract-drift":
      return "Rewrite COMPOSITION.md with template, Catalog, timing, and scene evidence before build.";
    case "hyperframes-runtime-structure":
      return "Repair index.html and meta.json before preview/render.";
    case "human-loop-unclear":
      return "Update HUMAN.md with a plain-language checkpoint before continuing.";
    case "forced-bypass":
      return "Review ITERATIONS.md and verify the forced step with preview evidence.";
    default:
      return "Run workbench audit and capture the next correction in ITERATIONS.md.";
  }
}
