import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AssetExecutionPlan, PackageManifest } from "../core/types.js";
import { detectHyperframesCapabilities } from "../runtime/hyperframes/adapter.js";
import { validateProjectPackage } from "./package-validation.js";

interface StatusCounts {
  total: number;
  available: number;
  pending: number;
  failed: number;
  skipped: number;
  external: number;
}

export interface PackageStatusSummary {
  projectDir: string;
  projectName: string;
  protocolStatus: "passed" | "failed";
  issueCount: number;
  issues: string[];
  sourceType: string;
  outputType: string;
  assets: StatusCounts;
  forge: StatusCounts;
  runtimeAvailable: boolean;
  runtimeBinary: string;
  nextActions: string[];
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

function buildNextActions(input: {
  protocolStatus: "passed" | "failed";
  assets: StatusCounts;
  forge: StatusCounts;
  runtimeAvailable: boolean;
}): string[] {
  const actions: string[] = [];

  if (input.protocolStatus === "failed") {
    actions.push("run framepack repair --project-dir <path> when protocol drift is derivable");
    actions.push("run framepack validate --project-dir <path> after repair or manual fixes");
  }

  if (input.assets.pending > 0) {
    actions.push("run framepack sync-assets --project-dir <path> after materializing assets");
  }

  if (input.forge.pending > 0) {
    actions.push("produce pending forge assets manually or with the declared forge skill, then sync assets");
  }

  if (!input.runtimeAvailable) {
    actions.push("run framepack runtime doctor before preview or render");
  }

  if (actions.length === 0) {
    actions.push("package is ready for preview or render");
  }

  return actions;
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
  const assets = countItems(items);
  const forge = countItems(forgeItems);

  return {
    projectDir,
    projectName: manifest?.projectName ?? validationReport.projectName,
    protocolStatus: validationReport.status,
    issueCount: validationReport.issues.length,
    issues: validationReport.issues,
    sourceType: manifest?.sourceType ?? "unknown",
    outputType: manifest?.outputType ?? "unknown",
    assets,
    forge,
    runtimeAvailable: runtime.available,
    runtimeBinary: runtime.binary,
    nextActions: buildNextActions({
      protocolStatus: validationReport.status,
      assets,
      forge,
      runtimeAvailable: runtime.available,
    }),
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
    `sourceType: ${summary.sourceType}`,
    `outputType: ${summary.outputType}`,
    `protocol: ${summary.protocolStatus}`,
    `issues: ${summary.issueCount}`,
    `assets: ${formatCounts(summary.assets)}`,
    `forge: ${formatCounts(summary.forge)}`,
    `runtime: ${summary.runtimeAvailable ? "available" : "unavailable"}`,
    `runtimeBinary: ${summary.runtimeBinary}`,
    "next actions:",
    ...summary.nextActions.map((action) => `next: ${action}`),
  ].join("\n");
}
