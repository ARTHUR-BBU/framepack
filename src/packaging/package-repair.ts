import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import type {
  AssetExecutionPlan,
  AssetPlan,
  PackageManifest,
  ScenePlan,
  SourceManifest,
  ValidationReport,
  VideoBrief,
} from "../core/types.js";
import { buildSceneAssetMap } from "./scene-asset-map.js";
import { buildSourceSceneMap } from "./source-scene-map.js";
import { buildPackageManifest } from "./package-manifest.js";
import {
  validateProjectPackage,
  writeProjectPackageValidationReport,
} from "./package-validation.js";

export interface PackageRepairResult {
  projectDir: string;
  repairedFiles: string[];
  beforeStatus: ValidationReport["status"];
  afterStatus: ValidationReport["status"];
  remainingIssues: string[];
}

function readRequiredJsonFile<T>(projectDir: string, relativePath: string): T {
  const targetPath = resolve(projectDir, relativePath);

  if (!existsSync(targetPath)) {
    throw new Error(`Cannot repair package because ${relativePath} is missing.`);
  }

  try {
    return JSON.parse(readFileSync(targetPath, "utf8")) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot repair package because ${relativePath} is invalid JSON: ${message}`);
  }
}

function readOptionalJsonFile<T>(projectDir: string, relativePath: string): T | undefined {
  const targetPath = resolve(projectDir, relativePath);

  if (!existsSync(targetPath)) {
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(targetPath, "utf8")) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Cannot repair package because ${relativePath} is invalid JSON: ${message}`);
  }
}

function writeJsonFile(projectDir: string, relativePath: string, value: unknown): boolean {
  const targetPath = resolve(projectDir, relativePath);
  const nextContent = `${JSON.stringify(value, null, 2)}\n`;
  const previousContent = existsSync(targetPath) ? readFileSync(targetPath, "utf8") : undefined;

  if (previousContent === nextContent) {
    return false;
  }

  writeFileSync(targetPath, nextContent, "utf8");
  return true;
}

export function repairProjectPackage(input: { projectDir: string }): PackageRepairResult {
  const projectDir = resolve(input.projectDir);
  const beforeReport = validateProjectPackage({ projectDir });
  const manifest = readOptionalJsonFile<PackageManifest>(projectDir, "PACKAGE_MANIFEST.json");
  const brief = readRequiredJsonFile<VideoBrief>(projectDir, "VIDEO_BRIEF.json");
  const scenePlan = readRequiredJsonFile<ScenePlan>(projectDir, "SCENE_PLAN.json");
  const assetPlan = readRequiredJsonFile<AssetPlan>(projectDir, "ASSET_PLAN.json");
  const sourceManifest = readOptionalJsonFile<SourceManifest>(projectDir, "SOURCE_MANIFEST.json");
  const assetExecutionPlan = readRequiredJsonFile<AssetExecutionPlan>(
    projectDir,
    "ASSET_EXECUTION_PLAN.json",
  );
  const projectName = manifest?.projectName ?? basename(projectDir);
  const repairedFiles: string[] = [];

  const sceneAssetMap = buildSceneAssetMap({
    scenePlan,
    assetPlan,
    sourceManifest,
  });
  if (writeJsonFile(projectDir, "SCENE_ASSET_MAP.json", sceneAssetMap)) {
    repairedFiles.push("SCENE_ASSET_MAP.json");
  }

  const sourceSceneMap = buildSourceSceneMap({
    scenePlan,
    assetPlan,
    sourceManifest,
  });
  if (writeJsonFile(projectDir, "SOURCE_SCENE_MAP.json", sourceSceneMap)) {
    repairedFiles.push("SOURCE_SCENE_MAP.json");
  }

  const packageManifest = buildPackageManifest({
    projectName,
    brief,
    sourceManifest,
    assetExecutionPlan,
    validationReport: beforeReport,
  });
  if (writeJsonFile(projectDir, "PACKAGE_MANIFEST.json", packageManifest)) {
    repairedFiles.push("PACKAGE_MANIFEST.json");
  }

  const afterReport = validateProjectPackage({ projectDir });
  writeProjectPackageValidationReport({
    projectDir,
    report: afterReport,
  });

  return {
    projectDir,
    repairedFiles,
    beforeStatus: beforeReport.status,
    afterStatus: afterReport.status,
    remainingIssues: afterReport.issues,
  };
}
