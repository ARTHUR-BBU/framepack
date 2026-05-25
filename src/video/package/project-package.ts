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
import { buildCapabilityGraph } from "../../capabilities/capability-graph.js";
import { recommendCapabilityStack } from "../../capabilities/atlas.js";
import { buildPackageManifest } from "../../packaging/package-manifest.js";
import { buildSceneAssetMap } from "../../packaging/scene-asset-map.js";
import { buildSourceSceneMap } from "../../packaging/source-scene-map.js";
import {
  createHyperframesRuntimeAdapter,
  detectHyperframesCapabilities,
} from "../../runtime/hyperframes/adapter.js";
import {
  buildRuntimeManifest,
  isRuntimeActionSupported,
  PACKAGE_RUNTIME_ACTIONS,
} from "../../runtime/manifest.js";
import { formatValidationReportMarkdown } from "../validation/validation-report.js";
import { buildCompositionProposal, type CompositionProposal } from "../../creative/composition-proposal.js";
import {
  buildCreativeHarnessArtifacts,
  buildCreativePlanningArtifacts,
} from "../../creative/harness.js";

export interface VideoProjectPackage {
  directories: string[];
  projectName: string;
  files: Record<string, string>;
}

function enrichBriefWithCapabilityStack(brief: VideoBrief): VideoBrief {
  if (brief.capabilityStackSelection) {
    return brief;
  }

  if (!brief.packSelection?.workflowPackId && !brief.packSelection?.creativeDirectionPackId) {
    return brief;
  }

  const stack = recommendCapabilityStack({
    workflowPackId: brief.packSelection?.workflowPackId,
    creativeDirectionPackId: brief.packSelection?.creativeDirectionPackId,
    outputType: brief.outputType,
    format: brief.format,
    goal: brief.goal,
  });

  if (!stack) {
    return brief;
  }

  return {
    ...brief,
    capabilityStackSelection: {
      id: stack.id,
      name: stack.name,
      nodes: stack.nodes.map((node) => ({
        ...node,
        alternatives: [...node.alternatives],
      })),
      rationale: [...stack.rationale],
      acceptanceCriteria: [...stack.acceptanceCriteria],
      riskNotes: [...stack.riskNotes],
    },
  };
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
  compositionProposal?: CompositionProposal;
  sourceManifest?: SourceManifest;
}): VideoProjectPackage {
  const brief = enrichBriefWithCapabilityStack(input.brief);
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
    brief,
    sourceManifest: input.sourceManifest,
    assetExecutionPlan,
    validationReport: input.validationReport,
  });
  const capabilityGraph = buildCapabilityGraph({
    sourceType: packageManifest.sourceType,
    outputType: brief.outputType,
    executionKinds: [...new Set(assetExecutionPlan.items.map((item) => item.executionKind))],
    forgeBackends: [
      ...new Set(
        assetExecutionPlan.items
          .map((item) => item.forgeBackend)
          .filter((backend): backend is string => Boolean(backend)),
      ),
    ],
    requiredSkills: [
      ...new Set(
        assetExecutionPlan.items
          .map((item) => item.requiredSkill)
          .filter((skill): skill is string => Boolean(skill)),
      ),
    ],
    runtimeBackend: "hyperframes",
    runtimeStatus: capabilities.available ? "available" : "not-detected",
    packageCommands: packageManifest.capabilities.packageCommands,
  });
  const runtimeInfo = runtimeAdapter.describePackage({
    projectName: input.projectName,
  });
  const packageDirectory = input.projectName;
  const runtimeCommands = PACKAGE_RUNTIME_ACTIONS
    .filter((action) => isRuntimeActionSupported(action, capabilities.supportedCommands))
    .map((action) =>
      runtimeAdapter.buildCommand({
        action,
        packageDirectory,
        packageRuntimeInfo: runtimeInfo,
        capabilities,
      }),
    );
  const runtimeManifest = buildRuntimeManifest({
    backend: "hyperframes",
    runtimeInfo,
    capabilities,
    commands: runtimeCommands,
  });
  const creativePlanningArtifacts = buildCreativePlanningArtifacts({
    brief,
    scenePlan: input.scenePlan,
  });
  const compositionProposal =
    input.compositionProposal ??
    buildCompositionProposal({
      ...creativePlanningArtifacts,
      scenePlan: input.scenePlan,
    });
  const creativeArtifacts = buildCreativeHarnessArtifacts({
    brief,
    scenePlan: input.scenePlan,
    script: input.script,
    storyboard: input.storyboard,
    compositionHtml: input.compositionHtml,
    compositionProposal,
  });

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
      "CAPABILITY_GRAPH.json": JSON.stringify(capabilityGraph, null, 2),
      "RUNTIME_MANIFEST.json": JSON.stringify(runtimeManifest, null, 2),
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
      "VIDEO_BRIEF.json": JSON.stringify(brief, null, 2),
      "CREATIVE_BRIEF.json": JSON.stringify(creativeArtifacts.creativeBrief, null, 2),
      "NARRATIVE_ARC.json": JSON.stringify(creativeArtifacts.narrativeArc, null, 2),
      "VISUAL_DIRECTION.json": JSON.stringify(creativeArtifacts.visualDirection, null, 2),
      "MOTION_PLAN.json": JSON.stringify(creativeArtifacts.motionPlan, null, 2),
      "COMPOSITION_PROPOSAL.json": JSON.stringify(compositionProposal, null, 2),
      "QUALITY_REPORT.json": JSON.stringify(creativeArtifacts.qualityReport, null, 2),
      "SCENE_PLAN.json": JSON.stringify(input.scenePlan, null, 2),
      "SCRIPT.md": formatScriptMarkdown(input.script),
      "STORYBOARD.md": formatStoryboardMarkdown(input.storyboard),
      "HANDOFF.md": formatHandoffMarkdown({
        ...input,
        brief,
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
