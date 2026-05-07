import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  AssetExecutionPlan,
  PackageManifest,
  SceneAssetMap,
  ScenePlan,
  SourceSceneMap,
  ValidationReport,
} from "../core/types.js";
import { formatValidationReportMarkdown } from "../video/validation/validation-report.js";
import {
  FRAMEPACK_PACKAGE_COMMANDS,
  FRAMEPACK_PACKAGE_PROTOCOL,
  FRAMEPACK_PACKAGE_PROTOCOL_VERSION,
  getRequiredPackageProtocolFiles,
} from "./package-protocol.js";

function readJsonFile<T>(projectDir: string, relativePath: string, issues: string[]): T | undefined {
  const targetPath = resolve(projectDir, relativePath);

  if (!existsSync(targetPath)) {
    issues.push(`Missing required package file: ${relativePath}`);
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(targetPath, "utf8")) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues.push(`Invalid JSON in ${relativePath}: ${message}`);
    return undefined;
  }
}

function validateManifest(input: {
  manifest?: PackageManifest;
  assetExecutionPlan?: AssetExecutionPlan;
  issues: string[];
}) {
  if (!input.manifest) {
    return;
  }

  if (input.manifest.protocol !== FRAMEPACK_PACKAGE_PROTOCOL) {
    input.issues.push(`PACKAGE_MANIFEST.json protocol must be ${FRAMEPACK_PACKAGE_PROTOCOL}.`);
  }

  if (input.manifest.protocolVersion !== FRAMEPACK_PACKAGE_PROTOCOL_VERSION) {
    input.issues.push(
      `PACKAGE_MANIFEST.json protocolVersion must be ${FRAMEPACK_PACKAGE_PROTOCOL_VERSION}.`,
    );
  }

  if (!input.assetExecutionPlan) {
    return;
  }

  const manifestExecutionKinds = new Set(input.manifest.capabilities.executionKinds);
  for (const item of input.assetExecutionPlan.items) {
    if (!manifestExecutionKinds.has(item.executionKind)) {
      input.issues.push(
        `PACKAGE_MANIFEST.json capabilities.executionKinds is missing ${item.executionKind} for ${item.suggestedAsset}.`,
      );
    }
  }

  const packageCommands = new Set(input.manifest.capabilities.packageCommands ?? []);
  for (const command of FRAMEPACK_PACKAGE_COMMANDS) {
    if (!packageCommands.has(command)) {
      input.issues.push(
        `PACKAGE_MANIFEST.json capabilities.packageCommands is missing ${command}.`,
      );
    }
  }
}

function validateSceneAssetMap(input: {
  scenePlan?: ScenePlan;
  sceneAssetMap?: SceneAssetMap;
  assetExecutionPlan?: AssetExecutionPlan;
  issues: string[];
}) {
  if (!input.sceneAssetMap) {
    return;
  }

  if (!Array.isArray(input.sceneAssetMap.assets)) {
    input.issues.push("SCENE_ASSET_MAP.json assets must be an array.");
    return;
  }

  if (!Array.isArray(input.sceneAssetMap.scenes)) {
    input.issues.push("SCENE_ASSET_MAP.json scenes must be an array.");
    return;
  }

  const topLevelAssets = new Map(input.sceneAssetMap.assets.map((asset) => [asset.suggestedAsset, asset]));

  if (input.assetExecutionPlan) {
    for (const item of input.assetExecutionPlan.items) {
      if (!topLevelAssets.has(item.suggestedAsset)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json assets is missing execution asset ${item.suggestedAsset}.`,
        );
      }
    }
  }

  const sceneIds = new Set(input.scenePlan?.scenes.map((scene) => scene.sceneId) ?? []);
  const mappedSceneAssets = new Map<string, Set<string>>();

  for (const scene of input.sceneAssetMap.scenes) {
    if (!Array.isArray(scene.recommendedAssets)) {
      input.issues.push(
        `SCENE_ASSET_MAP.json scene ${scene.sceneId} recommendedAssets must be an array.`,
      );
      continue;
    }

    if (sceneIds.size > 0 && !sceneIds.has(scene.sceneId)) {
      input.issues.push(`SCENE_ASSET_MAP.json references unknown scene ${scene.sceneId}.`);
    }

    const sceneAssetNames = new Set<string>();
    for (const asset of scene.recommendedAssets) {
      sceneAssetNames.add(asset.suggestedAsset);
      if (!topLevelAssets.has(asset.suggestedAsset)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json scene ${scene.sceneId} references missing top-level asset ${asset.suggestedAsset}.`,
        );
      }
    }
    mappedSceneAssets.set(scene.sceneId, sceneAssetNames);
  }

  for (const asset of input.sceneAssetMap.assets) {
    for (const sceneId of asset.recommendedSceneIds) {
      if (sceneIds.size > 0 && !sceneIds.has(sceneId)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json asset ${asset.suggestedAsset} recommends unknown scene ${sceneId}.`,
        );
        continue;
      }

      if (!mappedSceneAssets.get(sceneId)?.has(asset.suggestedAsset)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json scene ${sceneId} is missing recommended asset ${asset.suggestedAsset}.`,
        );
      }
    }
  }
}

function validateSourceSceneMap(input: {
  scenePlan?: ScenePlan;
  sourceSceneMap?: SourceSceneMap;
  sceneAssetMap?: SceneAssetMap;
  issues: string[];
}) {
  if (!input.sourceSceneMap) {
    return;
  }

  const sceneIds = new Set(input.scenePlan?.scenes.map((scene) => scene.sceneId) ?? []);
  const sceneAssetMapAssets = Array.isArray(input.sceneAssetMap?.assets)
    ? input.sceneAssetMap.assets
    : [];
  const assetNames = new Set(sceneAssetMapAssets.map((asset) => asset.suggestedAsset));

  for (const source of input.sourceSceneMap.sources) {
    if (assetNames.size > 0 && !assetNames.has(source.suggestedAsset)) {
      input.issues.push(
        `SOURCE_SCENE_MAP.json source ${source.sourceLabel} references asset ${source.suggestedAsset} missing from SCENE_ASSET_MAP.json.`,
      );
    }

    for (const sceneId of source.recommendedSceneIds) {
      if (sceneIds.size > 0 && !sceneIds.has(sceneId)) {
        input.issues.push(
          `SOURCE_SCENE_MAP.json source ${source.sourceLabel} recommends unknown scene ${sceneId}.`,
        );
      }
    }
  }
}

function validateAvailableOutputs(input: {
  projectDir: string;
  assetExecutionPlan?: AssetExecutionPlan;
  issues: string[];
}) {
  if (!input.assetExecutionPlan) {
    return;
  }

  for (const item of input.assetExecutionPlan.items) {
    if (item.status !== "available" && item.status !== "external") {
      continue;
    }

    const outputPath = resolve(input.projectDir, item.outputPath);
    if (!existsSync(outputPath)) {
      input.issues.push(
        `ASSET_EXECUTION_PLAN.json marks ${item.suggestedAsset} as ${item.status}, but ${item.outputPath} does not exist.`,
      );
    }
  }
}

export function validateProjectPackage(input: {
  projectDir: string;
  now?: Date;
}): ValidationReport {
  const issues: string[] = [];
  for (const path of getRequiredPackageProtocolFiles()) {
    const targetPath = resolve(input.projectDir, path);
    if (!existsSync(targetPath)) {
      issues.push(`Missing required package file: ${path}`);
    }
  }

  const manifest = existsSync(resolve(input.projectDir, "PACKAGE_MANIFEST.json"))
    ? readJsonFile<PackageManifest>(input.projectDir, "PACKAGE_MANIFEST.json", issues)
    : undefined;
  const scenePlan = existsSync(resolve(input.projectDir, "SCENE_PLAN.json"))
    ? readJsonFile<ScenePlan>(input.projectDir, "SCENE_PLAN.json", issues)
    : undefined;
  const assetExecutionPlan = existsSync(resolve(input.projectDir, "ASSET_EXECUTION_PLAN.json"))
    ? readJsonFile<AssetExecutionPlan>(
        input.projectDir,
        "ASSET_EXECUTION_PLAN.json",
        issues,
      )
    : undefined;
  const sceneAssetMap = existsSync(resolve(input.projectDir, "SCENE_ASSET_MAP.json"))
    ? readJsonFile<SceneAssetMap>(input.projectDir, "SCENE_ASSET_MAP.json", issues)
    : undefined;
  const sourceSceneMap = existsSync(resolve(input.projectDir, "SOURCE_SCENE_MAP.json"))
    ? readJsonFile<SourceSceneMap>(input.projectDir, "SOURCE_SCENE_MAP.json", issues)
    : undefined;

  validateManifest({ manifest, assetExecutionPlan, issues });
  validateSceneAssetMap({ scenePlan, sceneAssetMap, assetExecutionPlan, issues });
  validateSourceSceneMap({ scenePlan, sourceSceneMap, sceneAssetMap, issues });
  validateAvailableOutputs({ projectDir: input.projectDir, assetExecutionPlan, issues });

  return {
    projectName: manifest?.projectName ?? "unknown-project",
    status: issues.length === 0 ? "passed" : "failed",
    sceneCount: scenePlan?.scenes.length ?? 0,
    totalDurationSec: scenePlan?.totalDurationSec ?? 0,
    issues,
    generatedAt: (input.now ?? new Date()).toISOString(),
  };
}

export function writeProjectPackageValidationReport(input: {
  projectDir: string;
  report: ValidationReport;
}) {
  writeFileSync(
    resolve(input.projectDir, "VALIDATION_REPORT.json"),
    JSON.stringify(input.report, null, 2),
    "utf8",
  );
  writeFileSync(
    resolve(input.projectDir, "VALIDATION_REPORT.md"),
    formatValidationReportMarkdown(input.report),
    "utf8",
  );
}
