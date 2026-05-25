import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  summarizeCapabilityGraphFile,
  type CapabilityGraphSummary,
} from "../capabilities/arsenal.js";
import type { AssetExecutionPlan, PackageManifest } from "../core/types.js";
import { detectHyperframesCapabilities } from "../runtime/hyperframes/adapter.js";
import { validateProjectPackage } from "./package-validation.js";

export interface StatusCounts {
  total: number;
  available: number;
  pending: number;
  failed: number;
  skipped: number;
  external: number;
}

export interface StatusBreakdownEntry extends StatusCounts {
  key: string;
}

export interface ForgeStatusBreakdown {
  byExecutionKind: StatusBreakdownEntry[];
  byBackend: StatusBreakdownEntry[];
  byRequiredSkill: StatusBreakdownEntry[];
}

export interface PackageStatusNextAction {
  id:
    | "repair-protocol"
    | "review-creative-quality"
    | "validate-protocol"
    | "inspect-failed-assets"
    | "sync-assets"
    | "inspect-failed-forge-assets"
    | "produce-forge-assets"
    | "runtime-doctor"
    | "preview";
  category: "protocol" | "assets" | "forge" | "runtime" | "ready";
  command: string;
  reason: string;
}

export type PackageReadiness = "blocked" | "needs-assets" | "needs-runtime" | "ready";

export interface PackageStatusSummary {
  projectDir: string;
  projectName: string;
  readiness: PackageReadiness;
  protocolStatus: "passed" | "failed";
  quality: {
    present: boolean;
    status: "passed" | "failed" | "unknown";
    checkIds: string[];
    failedChecks: number;
    findings: string[];
  };
  issueCount: number;
  issues: string[];
  sourceType: string;
  outputType: string;
  assets: StatusCounts;
  forge: StatusCounts;
  forgeBreakdown: ForgeStatusBreakdown;
  capabilityGraph: CapabilityGraphSummary;
  runtimeAvailable: boolean;
  runtimeBinary: string;
  nextActionItems: PackageStatusNextAction[];
  nextActions: string[];
}

export interface PackageStatusDecision {
  readiness: PackageReadiness;
  nextActionItems: PackageStatusNextAction[];
}

function readOptionalJsonFile<T>(projectDir: string, relativePath: string): T | undefined {
  const targetPath = resolve(projectDir, relativePath);

  if (!existsSync(targetPath)) {
    return undefined;
  }

  return JSON.parse(readFileSync(targetPath, "utf8")) as T;
}

function createEmptyCounts(): StatusCounts {
  return {
    total: 0,
    available: 0,
    pending: 0,
    failed: 0,
    skipped: 0,
    external: 0,
  };
}

function countItems(items: AssetExecutionPlan["items"]): StatusCounts {
  const counts = createEmptyCounts();
  counts.total = items.length;

  for (const item of items) {
    counts[item.status] += 1;
  }

  return counts;
}

function buildBreakdown(
  items: AssetExecutionPlan["items"],
  getKey: (item: AssetExecutionPlan["items"][number]) => string | undefined,
): StatusBreakdownEntry[] {
  const groups = new Map<string, StatusBreakdownEntry>();

  for (const item of items) {
    const key = getKey(item) ?? "unspecified";
    const counts = groups.get(key) ?? { key, ...createEmptyCounts() };
    counts.total += 1;
    counts[item.status] += 1;
    groups.set(key, counts);
  }

  return [...groups.values()].sort((left, right) => left.key.localeCompare(right.key));
}

function buildForgeBreakdown(items: AssetExecutionPlan["items"]): ForgeStatusBreakdown {
  return {
    byExecutionKind: buildBreakdown(items, (item) => item.executionKind),
    byBackend: buildBreakdown(items, (item) => item.forgeBackend),
    byRequiredSkill: buildBreakdown(items, (item) => item.requiredSkill),
  };
}

function buildNextActionItems(input: {
  protocolStatus: "passed" | "failed";
  qualityStatus?: "passed" | "failed" | "unknown";
  assets: StatusCounts;
  forge: StatusCounts;
  runtimeAvailable: boolean;
}): PackageStatusNextAction[] {
  const actions: PackageStatusNextAction[] = [];

  if (input.protocolStatus === "failed") {
    actions.push({
      id: "repair-protocol",
      category: "protocol",
      command: "framepack repair --project-dir <path>",
      reason: "Package protocol validation failed and may have derivable drift.",
    });
    actions.push({
      id: "validate-protocol",
      category: "protocol",
      command: "framepack validate --project-dir <path>",
      reason: "Re-run validation after repair or manual protocol fixes.",
    });
  }

  if (input.qualityStatus === "failed") {
    actions.push({
      id: "review-creative-quality",
      category: "protocol",
      command: "review QUALITY_REPORT.json",
      reason: "Creative Harness quality checks failed and should be revised before preview/render.",
    });
  }

  if (input.assets.failed > 0) {
    actions.push({
      id: "inspect-failed-assets",
      category: "assets",
      command: "inspect-failed-assets",
      reason: `${input.assets.failed} asset execution items failed and need manual inspection before preview/render.`,
    });
  }

  if (input.assets.pending > 0) {
    actions.push({
      id: "sync-assets",
      category: "assets",
      command: "framepack sync-assets --project-dir <path>",
      reason: `${input.assets.pending} asset execution items are still pending after materialization work.`,
    });
  }

  if (input.forge.failed > 0) {
    actions.push({
      id: "inspect-failed-forge-assets",
      category: "forge",
      command: "inspect-failed-forge-assets",
      reason: `${input.forge.failed} forge tasks failed and need manual, custom, or skill-backed recovery.`,
    });
  }

  if (input.forge.pending > 0) {
    actions.push({
      id: "produce-forge-assets",
      category: "forge",
      command: "produce-forge-assets",
      reason: `${input.forge.pending} forge tasks are pending and need manual, custom, or skill-backed production.`,
    });
  }

  if (!input.runtimeAvailable) {
    actions.push({
      id: "runtime-doctor",
      category: "runtime",
      command: "framepack runtime doctor --project-dir <path>",
      reason: "HyperFrames runtime is unavailable or not confirmed for preview/render.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "preview",
      category: "ready",
      command: "framepack preview --project-dir <path>",
      reason: "Package has no pending status blockers and can move to preview or render.",
    });
  }

  return actions;
}

function formatNextAction(action: PackageStatusNextAction): string {
  if (action.id === "review-creative-quality") {
    return "review QUALITY_REPORT.json before preview or render";
  }

  if (action.id === "inspect-failed-assets") {
    return "inspect failed asset execution items before preview or render";
  }

  if (action.id === "inspect-failed-forge-assets") {
    return "inspect failed forge tasks before preview or render";
  }

  if (action.category === "assets") {
    return "run framepack sync-assets --project-dir <path> after materializing assets";
  }

  if (action.category === "forge") {
    return "produce pending forge assets manually or with the declared forge skill, then sync assets";
  }

  if (action.category === "protocol" && action.command.includes("repair")) {
    return "run framepack repair --project-dir <path> when protocol drift is derivable";
  }

  if (action.category === "protocol") {
    return "run framepack validate --project-dir <path> after repair or manual fixes";
  }

  if (action.category === "runtime") {
    return "run framepack runtime doctor before preview or render";
  }

  return "package is ready for preview or render";
}

function determineReadiness(input: {
  protocolStatus: "passed" | "failed";
  qualityStatus?: "passed" | "failed" | "unknown";
  assets: StatusCounts;
  forge: StatusCounts;
  runtimeAvailable: boolean;
}): PackageReadiness {
  if (input.protocolStatus === "failed") {
    return "blocked";
  }

  if (input.qualityStatus === "failed") {
    return "blocked";
  }

  if (input.assets.failed > 0 || input.forge.failed > 0) {
    return "blocked";
  }

  if (input.assets.pending > 0 || input.forge.pending > 0) {
    return "needs-assets";
  }

  if (!input.runtimeAvailable) {
    return "needs-runtime";
  }

  return "ready";
}

export function createPackageStatusDecision(input: {
  protocolStatus: "passed" | "failed";
  qualityStatus?: "passed" | "failed" | "unknown";
  assets: StatusCounts;
  forge: StatusCounts;
  runtimeAvailable: boolean;
}): PackageStatusDecision {
  return {
    readiness: determineReadiness(input),
    nextActionItems: buildNextActionItems(input),
  };
}

function readQualitySummary(projectDir: string): PackageStatusSummary["quality"] {
  const report = readOptionalJsonFile<{
    status?: string;
    checks?: Array<{ id?: string; status?: string }>;
    findings?: string[];
  }>(projectDir, "QUALITY_REPORT.json");

  if (!report) {
    return {
      present: false,
      status: "unknown",
      checkIds: [],
      failedChecks: 0,
      findings: [],
    };
  }

  const checks = Array.isArray(report.checks) ? report.checks : [];

  return {
    present: true,
    status: report.status === "passed" || report.status === "failed" ? report.status : "unknown",
    checkIds: checks.map((check) => check.id).filter((id): id is string => Boolean(id)),
    failedChecks: checks.filter((check) => check.status === "failed").length,
    findings: Array.isArray(report.findings) ? report.findings : [],
  };
}

export function getProjectPackageStatus(input: { projectDir: string }): PackageStatusSummary {
  const projectDir = resolve(input.projectDir);
  const validationReport = validateProjectPackage({ projectDir });
  const manifest = readOptionalJsonFile<PackageManifest>(projectDir, "PACKAGE_MANIFEST.json");
  const assetExecutionPlan = readOptionalJsonFile<AssetExecutionPlan>(
    projectDir,
    "ASSET_EXECUTION_PLAN.json",
  );
  const items = assetExecutionPlan?.items ?? [];
  const forgeItems = items.filter((item) => item.executionKind.startsWith("forge-"));
  const runtime = detectHyperframesCapabilities();
  const quality = readQualitySummary(projectDir);
  const assets = countItems(items);
  const forge = countItems(forgeItems);
  const forgeBreakdown = buildForgeBreakdown(forgeItems);
  const decision = createPackageStatusDecision({
    protocolStatus: validationReport.status,
    qualityStatus: quality.status,
    assets,
    forge,
    runtimeAvailable: runtime.available,
  });

  return {
    projectDir,
    projectName: manifest?.projectName ?? validationReport.projectName,
    readiness: decision.readiness,
    protocolStatus: validationReport.status,
    quality,
    issueCount: validationReport.issues.length,
    issues: validationReport.issues,
    sourceType: manifest?.sourceType ?? "unknown",
    outputType: manifest?.outputType ?? "unknown",
    assets,
    forge,
    forgeBreakdown,
    capabilityGraph: summarizeCapabilityGraphFile(projectDir),
    runtimeAvailable: runtime.available,
    runtimeBinary: runtime.binary,
    nextActionItems: decision.nextActionItems,
    nextActions: decision.nextActionItems.map(formatNextAction),
  };
}

function formatCounts(counts: StatusCounts): string {
  return `${counts.available} available, ${counts.pending} pending, ${counts.total} total`;
}

export function formatProjectPackageStatus(summary: PackageStatusSummary): string {
  return [
    "Package status",
    `project: ${summary.projectName}`,
    `projectDir: ${summary.projectDir}`,
    `readiness: ${summary.readiness}`,
    `sourceType: ${summary.sourceType}`,
    `outputType: ${summary.outputType}`,
    `protocol: ${summary.protocolStatus}`,
    `quality: ${summary.quality.status}`,
    `issues: ${summary.issueCount}`,
    `assets: ${formatCounts(summary.assets)}`,
    `forge: ${formatCounts(summary.forge)}`,
    `capabilities: ${summary.capabilityGraph.totalNodes} nodes, ${summary.capabilityGraph.gapNodeIds.length} gaps`,
    `runtime: ${summary.runtimeAvailable ? "available" : "unavailable"}`,
    `runtimeBinary: ${summary.runtimeBinary}`,
    "next actions:",
    ...summary.nextActions.map((action) => `next: ${action}`),
  ].join("\n");
}
