import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  AssetPlan,
  ScenePlan,
  SourceManifest,
  Script,
  Storyboard,
  ValidationReport,
  VideoBrief,
} from "../types.js";
import {
  formatGuardrailsMarkdown,
  formatForgeTasksMarkdown,
  formatHandoffMarkdown,
  formatRuntimeCommandsMarkdown,
  formatScriptMarkdown,
  formatStoryboardMarkdown,
} from "../../packaging/documents.js";
import { buildAssetExecutionPlan } from "../../packaging/asset-execution.js";
import { buildPackageManifest } from "../../packaging/package-manifest.js";
import { buildSceneAssetMap } from "../../packaging/scene-asset-map.js";
import { buildSourceSceneMap } from "../../packaging/source-scene-map.js";
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
  sourceManifest?: SourceManifest;
}): VideoProjectPackage {
  const capabilities = detectHyperframesCapabilities();
  const runtimeAdapter = createHyperframesRuntimeAdapter();
  const sceneAssetMap = buildSceneAssetMap({
    scenePlan: input.scenePlan,
    assetPlan: input.assetPlan,
    sourceManifest: input.sourceManifest,
  });
  const sourceSceneMap = buildSourceSceneMap({
    scenePlan: input.scenePlan,
    assetPlan: input.assetPlan,
    sourceManifest: input.sourceManifest,
  });
  const assetExecutionPlan = buildAssetExecutionPlan({
    assetPlan: input.assetPlan,
    sourceManifest: input.sourceManifest,
    sourceSceneMap,
  });
  const packageManifest = buildPackageManifest({
    projectName: input.projectName,
    brief: input.brief,
    sourceManifest: input.sourceManifest,
    assetExecutionPlan,
    validationReport: input.validationReport,
  });
  const runtimeInfo = runtimeAdapter.describePackage({
    projectName: input.projectName,
  });
  const packageDirectory = input.projectName;
  const runtimeCommands = capabilities.supportedCommands.map((action) =>
    runtimeAdapter.buildCommand({
      action: action as "preview" | "lint" | "validate" | "render",
      packageDirectory,
      packageRuntimeInfo: runtimeInfo,
      capabilities,
    }),
  );

  return {
    directories: ["assets", "assets/captures", "assets/generated", "assets/forge", "compositions"],
    projectName: input.projectName,
    files: {
      ...(input.sourceManifest
        ? {
            "SOURCE_MANIFEST.json": JSON.stringify(input.sourceManifest, null, 2),
          }
        : {}),
      "ASSET_PLAN.json": JSON.stringify(input.assetPlan, null, 2),
      "ASSET_EXECUTION_PLAN.json": JSON.stringify(assetExecutionPlan, null, 2),
      "CAPTURE_EXECUTION_PLAN.json": JSON.stringify(assetExecutionPlan, null, 2),
      "PACKAGE_MANIFEST.json": JSON.stringify(packageManifest, null, 2),
      "SCENE_ASSET_MAP.json": JSON.stringify(sceneAssetMap, null, 2),
      "SOURCE_SCENE_MAP.json": JSON.stringify(sourceSceneMap, null, 2),
      "FLYWHEEL.md": "# Flywheel\n\nIntake -> Plan -> Review -> Compose -> Render -> Retro\n",
      "FORGE_TASKS.md": formatForgeTasksMarkdown(input.assetPlan),
      "hyperframes.json": JSON.stringify(
        {
          $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
          registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
          paths: {
            blocks: "compositions",
            components: "compositions/components",
            assets: "assets",
          },
        },
        null,
        2,
      ),
      "VIDEO_BRIEF.json": JSON.stringify(input.brief, null, 2),
      "SCENE_PLAN.json": JSON.stringify(input.scenePlan, null, 2),
      "SCRIPT.md": formatScriptMarkdown(input.script),
      "STORYBOARD.md": formatStoryboardMarkdown(input.storyboard),
      "HANDOFF.md": formatHandoffMarkdown({
        ...input,
        runtimeAvailable: capabilities.available,
        runtimeBinary: capabilities.binary,
        runtimeFallbackNotes: capabilities.fallbackNotes,
      }),
      "meta.json": JSON.stringify(
        {
          rootEntry: runtimeInfo.rootEntry,
          runtime: "hyperframes",
          available: capabilities.available,
          binary: capabilities.binary,
          detectedAt: capabilities.detectedAt,
          version: capabilities.version,
          compositionDirectory: runtimeInfo.compositionDirectory,
          assetDirectory: runtimeInfo.assetDirectory,
          supportedCommands: capabilities.supportedCommands,
          fallbackNotes: capabilities.fallbackNotes,
          commands: runtimeCommands,
        },
        null,
        2,
      ),
      "COMMANDS.md": formatRuntimeCommandsMarkdown({
        capabilities,
        commands: runtimeCommands,
      }),
      "GUARDRAILS.md": formatGuardrailsMarkdown(input),
      "VALIDATION_REPORT.json": JSON.stringify(input.validationReport, null, 2),
      "VALIDATION_REPORT.md": formatValidationReportMarkdown(input.validationReport),
      "RETRO_LOG.md": "# Retro Log\n\n- Initial generation\n",
      "index.html": input.compositionHtml,
      "compositions/scene-root.html": [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '  <meta charset="UTF-8" />',
        '  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>',
        "</head>",
        "<body>",
        '  <div data-composition-id="scene-root" data-start="0" data-duration="1" data-width="1920" data-height="1080"></div>',
        "  <script>",
        "    window.__timelines = window.__timelines || {};",
        "    const tl = gsap.timeline({ paused: true });",
        '    window.__timelines["scene-root"] = tl;',
        "  </script>",
        "</body>",
        "</html>",
        "",
      ].join("\n"),
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
