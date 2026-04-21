import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScenePlan, ValidationReport } from "../types.js";

export function createValidationReport(input: {
  projectName: string;
  scenePlan: ScenePlan;
  issues: string[];
}): ValidationReport {
  return {
    projectName: input.projectName,
    status: input.issues.length === 0 ? "passed" : "failed",
    sceneCount: input.scenePlan.scenes.length,
    totalDurationSec: input.scenePlan.totalDurationSec,
    issues: input.issues,
    generatedAt: new Date().toISOString(),
  };
}

export function formatValidationReportMarkdown(report: ValidationReport): string {
  const issueLines =
    report.issues.length === 0
      ? "- None\n"
      : `${report.issues.map((issue) => `- ${issue}`).join("\n")}\n`;

  return [
    "# Validation Report",
    "",
    `Validation ${report.status} for ${report.projectName}.`,
    "",
    `- Status: ${report.status}`,
    `- Scene count: ${report.sceneCount}`,
    `- Total duration: ${report.totalDurationSec}s`,
    `- Generated at: ${report.generatedAt}`,
    "",
    "## Issues",
    "",
    issueLines.trimEnd(),
    "",
  ].join("\n");
}

export function writeValidationReport(
  outputDir: string,
  report: ValidationReport,
): string {
  const targetDir = resolve(outputDir, report.projectName);

  mkdirSync(targetDir, { recursive: true });
  writeFileSync(resolve(targetDir, "VALIDATION_REPORT.json"), JSON.stringify(report, null, 2), "utf8");
  writeFileSync(resolve(targetDir, "VALIDATION_REPORT.md"), formatValidationReportMarkdown(report), "utf8");

  return targetDir;
}
