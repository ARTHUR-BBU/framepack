import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScenePlan, ValidationReport, VideoBrief } from "../types.js";
import { formatValidationReportMarkdown } from "../validation/validation-report.js";

export interface VideoProjectPackage {
  projectName: string;
  files: Record<string, string>;
}

function formatList(items: string[]): string {
  return items.length === 0 ? "- None" : items.map((item) => `- ${item}`).join("\n");
}

function formatGuardrailsMarkdown(input: {
  brief: VideoBrief;
  validationReport: ValidationReport;
}): string {
  return [
    "# Guardrails",
    "",
    `Max duration: ${input.brief.constraints.maxDurationSec}s`,
    "",
    "Required points:",
    formatList(input.brief.constraints.requiredPoints),
    "",
    "Banned terms:",
    formatList(input.brief.constraints.bannedTerms),
    "",
    `Latest validation: ${input.validationReport.status}`,
    "",
    "Latest issues:",
    formatList(input.validationReport.issues),
    "",
  ].join("\n");
}

export function createVideoProjectPackage(input: {
  projectName: string;
  brief: VideoBrief;
  scenePlan: ScenePlan;
  validationReport: ValidationReport;
  compositionHtml: string;
}): VideoProjectPackage {
  return {
    projectName: input.projectName,
    files: {
      "FLYWHEEL.md": "# Flywheel\n\nIntake -> Plan -> Review -> Compose -> Render -> Retro\n",
      "VIDEO_BRIEF.json": JSON.stringify(input.brief, null, 2),
      "SCENE_PLAN.json": JSON.stringify(input.scenePlan, null, 2),
      "COMMANDS.md":
        "npx hyperframes preview\nnpx hyperframes lint\nnpx hyperframes validate\nnpx hyperframes render\n",
      "GUARDRAILS.md": formatGuardrailsMarkdown(input),
      "VALIDATION_REPORT.json": JSON.stringify(input.validationReport, null, 2),
      "VALIDATION_REPORT.md": formatValidationReportMarkdown(input.validationReport),
      "RETRO_LOG.md": "# Retro Log\n\n- Initial generation\n",
      "composition.html": input.compositionHtml,
    },
  };
}

export function writeVideoProjectPackage(
  outputDir: string,
  projectPackage: VideoProjectPackage,
) {
  const targetDir = resolve(outputDir, projectPackage.projectName);

  mkdirSync(targetDir, { recursive: true });

  for (const [fileName, content] of Object.entries(projectPackage.files)) {
    writeFileSync(resolve(targetDir, fileName), content, "utf8");
  }

  return targetDir;
}
