import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  AssetPlan,
  ScenePlan,
  Script,
  Storyboard,
  ValidationReport,
  VideoBrief,
} from "../types.js";
import {
  formatGuardrailsMarkdown,
  formatHandoffMarkdown,
  formatScriptMarkdown,
  formatStoryboardMarkdown,
} from "../../packaging/documents.js";
import {
  createHyperframesRuntimeAdapter,
  detectHyperframesCapabilities,
} from "../../runtime/hyperframes/adapter.js";
import { formatValidationReportMarkdown } from "../validation/validation-report.js";

export interface VideoProjectPackage {
  directories: string[];
  projectName: string;
  files: Record<string, string>;
}

export function createVideoProjectPackage(input: {
  projectName: string;
  brief: VideoBrief;
  scenePlan: ScenePlan;
  script: Script;
  storyboard: Storyboard;
  assetPlan: AssetPlan;
  validationReport: ValidationReport;
  compositionHtml: string;
}): VideoProjectPackage {
  const capabilities = detectHyperframesCapabilities();
  const runtimeAdapter = createHyperframesRuntimeAdapter();
  const runtimeInfo = runtimeAdapter.describePackage({
    projectName: input.projectName,
  });

  return {
    directories: ["assets", "compositions"],
    projectName: input.projectName,
    files: {
      "ASSET_PLAN.json": JSON.stringify(input.assetPlan, null, 2),
      "FLYWHEEL.md": "# Flywheel\n\nIntake -> Plan -> Review -> Compose -> Render -> Retro\n",
      "VIDEO_BRIEF.json": JSON.stringify(input.brief, null, 2),
      "SCENE_PLAN.json": JSON.stringify(input.scenePlan, null, 2),
      "SCRIPT.md": formatScriptMarkdown(input.script),
      "STORYBOARD.md": formatStoryboardMarkdown(input.storyboard),
      "HANDOFF.md": formatHandoffMarkdown(input),
      "meta.json": JSON.stringify(
        {
          rootEntry: runtimeInfo.rootEntry,
          runtime: "hyperframes",
          compositionDirectory: runtimeInfo.compositionDirectory,
          assetDirectory: runtimeInfo.assetDirectory,
          supportedCommands: capabilities.supportedCommands,
          fallbackNotes: capabilities.fallbackNotes,
        },
        null,
        2,
      ),
      "COMMANDS.md":
        "npx hyperframes preview\nnpx hyperframes lint\nnpx hyperframes validate\nnpx hyperframes render\n",
      "GUARDRAILS.md": formatGuardrailsMarkdown(input),
      "VALIDATION_REPORT.json": JSON.stringify(input.validationReport, null, 2),
      "VALIDATION_REPORT.md": formatValidationReportMarkdown(input.validationReport),
      "RETRO_LOG.md": "# Retro Log\n\n- Initial generation\n",
      "index.html": input.compositionHtml,
      "compositions/scene-root.html": "<div data-subcomposition-id=\"scene-root\"></div>\n",
    },
  };
}

export function writeVideoProjectPackage(
  outputDir: string,
  projectPackage: VideoProjectPackage,
) {
  const targetDir = resolve(outputDir, projectPackage.projectName);

  mkdirSync(targetDir, { recursive: true });
  for (const directory of projectPackage.directories) {
    mkdirSync(resolve(targetDir, directory), { recursive: true });
  }

  for (const [fileName, content] of Object.entries(projectPackage.files)) {
    writeFileSync(resolve(targetDir, fileName), content, "utf8");
  }

  return targetDir;
}
