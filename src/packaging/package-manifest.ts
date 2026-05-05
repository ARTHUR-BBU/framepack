import type {
  AssetExecutionPlan,
  PackageManifest,
  SourceManifest,
  ValidationReport,
  VideoBrief,
} from "../core/types.js";

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function buildPackageManifest(input: {
  projectName: string;
  brief: VideoBrief;
  sourceManifest?: SourceManifest;
  assetExecutionPlan: AssetExecutionPlan;
  validationReport: ValidationReport;
}): PackageManifest {
  const sourceFiles = input.sourceManifest ? ["SOURCE_MANIFEST.json"] : [];

  return {
    protocol: "framepack.project-package",
    protocolVersion: 1,
    projectName: input.projectName,
    generatedAt: input.validationReport.generatedAt,
    sourceType: input.sourceManifest?.sourceType ?? "none",
    outputType: input.brief.outputType,
    format: input.brief.format,
    entrypoints: {
      rootComposition: "index.html",
      runtimeMeta: "meta.json",
      runtimeConfig: "hyperframes.json",
      handoff: "HANDOFF.md",
      commands: "COMMANDS.md",
    },
    artifacts: {
      source: sourceFiles,
      planning: [
        "VIDEO_BRIEF.json",
        "SCENE_PLAN.json",
        "SCRIPT.md",
        "STORYBOARD.md",
        "SOURCE_SCENE_MAP.json",
        "SCENE_ASSET_MAP.json",
      ],
      assets: ["ASSET_PLAN.json", "assets/", "assets/captures/", "assets/generated/", "assets/forge/"],
      execution: ["ASSET_EXECUTION_PLAN.json", "CAPTURE_EXECUTION_PLAN.json"],
      validation: ["VALIDATION_REPORT.json", "VALIDATION_REPORT.md", "GUARDRAILS.md"],
      runtime: ["index.html", "meta.json", "hyperframes.json", "compositions/"],
      docs: ["HANDOFF.md", "FORGE_TASKS.md", "COMMANDS.md", "FLYWHEEL.md", "RETRO_LOG.md"],
    },
    capabilities: {
      sourceTypes: input.sourceManifest ? [input.sourceManifest.sourceType] : [],
      executionKinds: unique(input.assetExecutionPlan.items.map((item) => item.executionKind)),
      runtimeBackend: "hyperframes",
    },
    compatibility: {
      legacyFiles: ["CAPTURE_EXECUTION_PLAN.json"],
    },
  };
}
