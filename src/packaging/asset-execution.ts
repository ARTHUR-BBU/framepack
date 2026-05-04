import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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

function createForgeOutputPath(suggestedAsset: string) {
  return join("assets", "forge", suggestedAsset);
}

function createForgeMetadataPath(suggestedAsset: string) {
  return join("assets", "forge", `${suggestedAsset}.json`);
}

function readJsonFile<T>(projectDir: string, fileName: string): T {
  return JSON.parse(readFileSync(resolve(projectDir, fileName), "utf8")) as T;
}

function isForgeExecutionKind(executionKind: AssetExecutionPlanItem["executionKind"]) {
  return executionKind.startsWith("forge-");
}

function isAssetExecutionStatus(value: unknown): value is AssetExecutionPlanItem["status"] {
  return (
    value === "pending" ||
    value === "available" ||
    value === "failed" ||
    value === "skipped" ||
    value === "external"
  );
}

function readForgeMetadataStatus(
  projectDir: string,
  item: AssetExecutionPlanItem,
): AssetExecutionPlanItem["status"] | undefined {
  if (!isForgeExecutionKind(item.executionKind)) {
    return undefined;
  }

  const metadataPath = resolve(projectDir, item.metadataPath);

  if (!existsSync(metadataPath)) {
    return undefined;
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as {
    status?: unknown;
  };

  return isAssetExecutionStatus(metadata.status) ? metadata.status : undefined;
}

function hasMaterializedOutput(projectDir: string, item: AssetExecutionPlanItem): boolean {
  const outputPath = resolve(projectDir, item.outputPath);

  if (!existsSync(outputPath)) {
    return false;
  }

  if (!isForgeExecutionKind(item.executionKind)) {
    return true;
  }

  const metadataPath = resolve(projectDir, item.metadataPath);

  if (!existsSync(metadataPath)) {
    return false;
  }

  const outputStat = statSync(outputPath);

  if (!outputStat.isDirectory()) {
    return outputStat.isFile();
  }

  return readdirSync(outputPath).length > 0;
}

function getSyncedAssetStatus(
  projectDir: string,
  item: AssetExecutionPlanItem,
): AssetExecutionPlanItem["status"] {
  const metadataStatus = readForgeMetadataStatus(projectDir, item);

  if (metadataStatus && metadataStatus !== "pending") {
    return metadataStatus;
  }

  return hasMaterializedOutput(projectDir, item) ? "available" : "pending";
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

  const sourceBoundItems =
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
  const forgeItems = (input.assetPlan.forgeTargets ?? []).map((target) => ({
    suggestedAsset: target.suggestedAsset,
    sourceType: "game-ad" as const,
    sourceLabel: target.sourceLabel,
    sourceText: target.sourceText,
    executionKind: target.executionKind,
    assetForm: target.assetForm,
    recommendedSceneIds: [...target.recommendedSceneIds],
    rationale: target.rationale,
    ...(target.forgeBackend ? { forgeBackend: target.forgeBackend } : {}),
    ...(target.requiredSkill ? { requiredSkill: target.requiredSkill } : {}),
    expectedOutputs: [...target.expectedOutputs],
    prompt: target.prompt,
    styleNotes: [...target.styleNotes],
    acceptanceCriteria: [...target.acceptanceCriteria],
    outputPath: createForgeOutputPath(target.suggestedAsset),
    metadataPath: createForgeMetadataPath(target.suggestedAsset),
    status: getStatus(target.suggestedAsset),
  }));

  return {
    generatedAt: (input.now ?? (() => new Date().toISOString()))(),
    items: [...sourceBoundItems, ...forgeItems],
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

  const assetStatuses = new Map(
    previousAssetExecutionPlan.items.map((item) => [item.suggestedAsset, getSyncedAssetStatus(projectDir, item)] as const),
  );
  const availableAssets = previousAssetExecutionPlan.items
    .filter((item) => assetStatuses.get(item.suggestedAsset) === "available")
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
        : sourceManifest.sourceType === "game-ad"
          ? (assetPlan.forgeTargets ?? [])
              .filter((target) => (assetStatuses.get(target.suggestedAsset) ?? "pending") === "pending")
              .map((target) => `${target.executionKind}:${target.suggestedAsset}`)
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
  const nextAssetExecutionPlan: AssetExecutionPlan = {
    ...assetExecutionPlan,
    items: assetExecutionPlan.items.map((item) => ({
      ...item,
      status: assetStatuses.get(item.suggestedAsset) ?? item.status,
    })),
  };
  const capabilities = detectHyperframesCapabilities();

  writeFileSync(resolve(projectDir, "ASSET_PLAN.json"), JSON.stringify(nextAssetPlan, null, 2), "utf8");
  writeFileSync(resolve(projectDir, "SCENE_ASSET_MAP.json"), JSON.stringify(sceneAssetMap, null, 2), "utf8");
  writeFileSync(resolve(projectDir, "SOURCE_SCENE_MAP.json"), JSON.stringify(nextSourceSceneMap, null, 2), "utf8");
  writeFileSync(
    resolve(projectDir, "ASSET_EXECUTION_PLAN.json"),
    JSON.stringify(nextAssetExecutionPlan, null, 2),
    "utf8",
  );
  writeFileSync(
    resolve(projectDir, "CAPTURE_EXECUTION_PLAN.json"),
    JSON.stringify(nextAssetExecutionPlan, null, 2),
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
    pendingCount: nextAssetExecutionPlan.items.filter((item) => item.status === "pending").length,
  };
}
