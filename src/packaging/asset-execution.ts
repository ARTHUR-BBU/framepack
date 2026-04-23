import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type {
  AssetExecutionPlan,
  AssetExecutionPlanItem,
  AssetPlan,
  SceneAssetMap,
  ScenePlan,
  SourceManifest,
  SourceSceneMap,
  ValidationReport,
  VideoBrief,
} from "../core/types.js";
import { detectHyperframesCapabilities } from "../runtime/hyperframes/adapter.js";
import { formatHandoffMarkdown } from "./documents.js";
import { buildSceneAssetMap } from "./scene-asset-map.js";
import { buildSourceSceneMap } from "./source-scene-map.js";

function createWebsiteOutputPath(suggestedAsset: string) {
  return join("assets", "captures", `${suggestedAsset}.png`);
}

function createWebsiteMetadataPath(suggestedAsset: string) {
  return join("assets", "captures", `${suggestedAsset}.json`);
}

function createThreadOutputPath(suggestedAsset: string) {
  return join("assets", "generated", `${suggestedAsset}.png`);
}

function createThreadMetadataPath(suggestedAsset: string) {
  return join("assets", "generated", `${suggestedAsset}.json`);
}

function readJsonFile<T>(projectDir: string, fileName: string): T {
  return JSON.parse(readFileSync(resolve(projectDir, fileName), "utf8")) as T;
}

export function buildAssetExecutionPlan(input: {
  assetPlan: AssetPlan;
  sourceManifest?: SourceManifest;
  sourceSceneMap?: SourceSceneMap;
  now?: () => string;
}): AssetExecutionPlan {
  const getStatus = (suggestedAsset: string): AssetExecutionPlanItem["status"] =>
    input.assetPlan.availableAssets.includes(suggestedAsset) ? "available" : "pending";
  const sourceEntriesByAsset = new Map(
    (input.sourceSceneMap?.sources ?? []).map((entry) => [entry.suggestedAsset, entry] as const),
  );

  const items =
    input.sourceManifest?.sourceType === "website"
      ? input.assetPlan.captureTargets.map((target) => ({
          suggestedAsset: target.suggestedAsset,
          sourceType: "website" as const,
          sourceLabel: target.sectionTitle,
          sourceText: target.sectionBody,
          sourceUrl: target.sourceUrl,
          purposeTag: target.purposeTag,
          executionKind: "capture-screenshot" as const,
          assetForm: target.assetForm,
          recommendedSceneIds: [...target.recommendedSceneIds],
          rationale: target.rationale,
          outputPath: createWebsiteOutputPath(target.suggestedAsset),
          metadataPath: createWebsiteMetadataPath(target.suggestedAsset),
          status: getStatus(target.suggestedAsset),
        }))
      : input.sourceManifest?.sourceType === "thread"
        ? input.sourceManifest.posts.map((post) => {
            const suggestedAsset = `post-${post.index}-card`;
            const sourceEntry = sourceEntriesByAsset.get(suggestedAsset);
            return {
              suggestedAsset,
              sourceType: "thread" as const,
              sourceLabel: `Post ${post.index}`,
              sourceText: post.text,
              executionKind: "compose-text-card" as const,
              assetForm: "text-card" as const,
              recommendedSceneIds: [...(sourceEntry?.recommendedSceneIds ?? [])],
              rationale: sourceEntry?.rationale,
              outputPath: createThreadOutputPath(suggestedAsset),
              metadataPath: createThreadMetadataPath(suggestedAsset),
              status: getStatus(suggestedAsset),
            };
          })
        : [];

  return {
    generatedAt: (input.now ?? (() => new Date().toISOString()))(),
    items,
  };
}

export function syncAssetExecutionProject(input: {
  projectDir: string;
  now?: () => string;
}) {
  const projectDir = resolve(input.projectDir);
  const assetPlan = readJsonFile<AssetPlan>(projectDir, "ASSET_PLAN.json");
  const scenePlan = readJsonFile<ScenePlan>(projectDir, "SCENE_PLAN.json");
  const brief = readJsonFile<VideoBrief>(projectDir, "VIDEO_BRIEF.json");
  const validationReport = readJsonFile<ValidationReport>(projectDir, "VALIDATION_REPORT.json");
  const sourceManifest = readJsonFile<SourceManifest>(projectDir, "SOURCE_MANIFEST.json");
  const previousAssetExecutionPlan = readJsonFile<AssetExecutionPlan>(projectDir, "ASSET_EXECUTION_PLAN.json");

  const availableAssets = previousAssetExecutionPlan.items
    .filter((item) => existsSync(resolve(projectDir, item.outputPath)))
    .map((item) => item.suggestedAsset);

  const nextMissingAssets =
    sourceManifest.sourceType === "website"
      ? assetPlan.captureTargets
          .filter((target) => !availableAssets.includes(target.suggestedAsset))
          .map((target) => `capture:${target.suggestedAsset}`)
      : sourceManifest.sourceType === "thread"
        ? sourceManifest.posts
            .map((post) => `post-${post.index}-card`)
            .filter((asset) => !availableAssets.includes(asset))
            .map((asset) => `compose:${asset}`)
        : [];

  const nextAssetPlan: AssetPlan = {
    ...assetPlan,
    availableAssets,
    missingAssets: nextMissingAssets,
  };

  const sceneAssetMap: SceneAssetMap = buildSceneAssetMap({
    scenePlan,
    assetPlan: nextAssetPlan,
  });
  const nextSourceSceneMap = buildSourceSceneMap({
    scenePlan,
    assetPlan: nextAssetPlan,
    sourceManifest,
  });
  const assetExecutionPlan = buildAssetExecutionPlan({
    assetPlan: nextAssetPlan,
    sourceManifest,
    sourceSceneMap: nextSourceSceneMap,
    now: input.now,
  });
  const capabilities = detectHyperframesCapabilities();

  writeFileSync(resolve(projectDir, "ASSET_PLAN.json"), JSON.stringify(nextAssetPlan, null, 2), "utf8");
  writeFileSync(resolve(projectDir, "SCENE_ASSET_MAP.json"), JSON.stringify(sceneAssetMap, null, 2), "utf8");
  writeFileSync(resolve(projectDir, "SOURCE_SCENE_MAP.json"), JSON.stringify(nextSourceSceneMap, null, 2), "utf8");
  writeFileSync(
    resolve(projectDir, "ASSET_EXECUTION_PLAN.json"),
    JSON.stringify(assetExecutionPlan, null, 2),
    "utf8",
  );
  writeFileSync(
    resolve(projectDir, "CAPTURE_EXECUTION_PLAN.json"),
    JSON.stringify(assetExecutionPlan, null, 2),
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
    pendingCount: assetExecutionPlan.items.filter((item) => item.status === "pending").length,
  };
}
