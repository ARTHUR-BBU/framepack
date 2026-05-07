import type { PackageManifest } from "../core/types.js";

export const FRAMEPACK_PACKAGE_PROTOCOL = "framepack.project-package";
export const FRAMEPACK_PACKAGE_PROTOCOL_VERSION = 1;

export const FRAMEPACK_PACKAGE_PROTOCOL_V1: Pick<
  PackageManifest,
  "entrypoints" | "artifacts" | "compatibility"
> = {
  entrypoints: {
    rootComposition: "index.html",
    runtimeMeta: "meta.json",
    runtimeConfig: "hyperframes.json",
    handoff: "HANDOFF.md",
    commands: "COMMANDS.md",
  },
  artifacts: {
    source: [],
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
  compatibility: {
    legacyFiles: ["CAPTURE_EXECUTION_PLAN.json"],
  },
};

export function getPackageProtocolArtifacts(input?: {
  sourceFiles?: string[];
}): PackageManifest["artifacts"] {
  return {
    ...FRAMEPACK_PACKAGE_PROTOCOL_V1.artifacts,
    source: [...(input?.sourceFiles ?? [])],
  };
}

export function getRequiredPackageProtocolFiles(): string[] {
  return [
    "PACKAGE_MANIFEST.json",
    "SCENE_PLAN.json",
    "SCENE_ASSET_MAP.json",
    "SOURCE_SCENE_MAP.json",
    "ASSET_PLAN.json",
    "ASSET_EXECUTION_PLAN.json",
    "HANDOFF.md",
    "FORGE_TASKS.md",
  ];
}
