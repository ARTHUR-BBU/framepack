import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type {
  AssetPlan,
  CaptureExecutionPlan,
  SceneAssetMap,
  ScenePlan,
  ValidationReport,
  VideoBrief,
} from "../core/types.js";
import { detectHyperframesCapabilities } from "../runtime/hyperframes/adapter.js";
import { formatHandoffMarkdown } from "./documents.js";
import { buildSceneAssetMap } from "./scene-asset-map.js";

function createCaptureOutputPath(suggestedAsset: string) {
  return join("assets", "captures", `${suggestedAsset}.png`);
}

function createCaptureMetadataPath(suggestedAsset: string) {
  return join("assets", "captures", `${suggestedAsset}.json`);
}

export function buildCaptureExecutionPlan(input: {
  assetPlan: AssetPlan;
  now?: () => string;
}): CaptureExecutionPlan {
  return {
    generatedAt: (input.now ?? (() => new Date().toISOString()))(),
    items: input.assetPlan.captureTargets.map((target) => ({
      suggestedAsset: target.suggestedAsset,
      sourceUrl: target.sourceUrl,
      sectionTitle: target.sectionTitle,
      sectionBody: target.sectionBody,
      purposeTag: target.purposeTag,
      assetForm: target.assetForm,
      recommendedSceneIds: [...target.recommendedSceneIds],
      outputPath: createCaptureOutputPath(target.suggestedAsset),
      metadataPath: createCaptureMetadataPath(target.suggestedAsset),
      status: input.assetPlan.availableAssets.includes(target.suggestedAsset) ? "available" : "pending",
    })),
  };
}

function readJsonFile<T>(projectDir: string, fileName: string): T {
  return JSON.parse(readFileSync(resolve(projectDir, fileName), "utf8")) as T;
}

export function syncCaptureExecutionProject(input: {
  projectDir: string;
  now?: () => string;
}) {
  const projectDir = resolve(input.projectDir);
  const assetPlan = readJsonFile<AssetPlan>(projectDir, "ASSET_PLAN.json");
  const scenePlan = readJsonFile<ScenePlan>(projectDir, "SCENE_PLAN.json");
  const brief = readJsonFile<VideoBrief>(projectDir, "VIDEO_BRIEF.json");
  const validationReport = readJsonFile<ValidationReport>(projectDir, "VALIDATION_REPORT.json");

  const availableAssets = assetPlan.captureTargets
    .filter((target) => existsSync(resolve(projectDir, createCaptureOutputPath(target.suggestedAsset))))
    .map((target) => target.suggestedAsset);

  const nextAssetPlan: AssetPlan = {
    ...assetPlan,
    availableAssets,
    missingAssets: assetPlan.captureTargets
      .filter((target) => !availableAssets.includes(target.suggestedAsset))
      .map((target) => `capture:${target.suggestedAsset}`),
  };

  const sceneAssetMap: SceneAssetMap = buildSceneAssetMap({
    scenePlan,
    assetPlan: nextAssetPlan,
  });
  const captureExecutionPlan = buildCaptureExecutionPlan({
    assetPlan: nextAssetPlan,
    now: input.now,
  });
  const capabilities = detectHyperframesCapabilities();

  writeFileSync(resolve(projectDir, "ASSET_PLAN.json"), JSON.stringify(nextAssetPlan, null, 2), "utf8");
  writeFileSync(resolve(projectDir, "SCENE_ASSET_MAP.json"), JSON.stringify(sceneAssetMap, null, 2), "utf8");
  writeFileSync(
    resolve(projectDir, "CAPTURE_EXECUTION_PLAN.json"),
    JSON.stringify(captureExecutionPlan, null, 2),
    "utf8",
  );
  writeFileSync(
    resolve(projectDir, "HANDOFF.md"),
    formatHandoffMarkdown({
      brief,
      validationReport,
      assetPlan: nextAssetPlan,
      runtimeAvailable: capabilities.available,
      runtimeBinary: capabilities.binary,
      runtimeFallbackNotes: capabilities.fallbackNotes,
    }),
    "utf8",
  );

  return {
    projectDir,
    availableCount: nextAssetPlan.availableAssets.length,
    pendingCount: nextAssetPlan.captureTargets.length - nextAssetPlan.availableAssets.length,
  };
}
