import type { AssetPlan, ScenePlan, SourceManifest } from "../../core/types.js";

function slugifyAssetName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "section";
}

function getRecommendedSceneIds(sectionIndex: number, sectionCount: number): string[] {
  if (sectionCount <= 1 || sectionIndex === 0) {
    return ["scene-1", "scene-2"];
  }

  if (sectionIndex >= sectionCount - 1) {
    return ["scene-3", "scene-4", "scene-5"];
  }

  return ["scene-2", "scene-3", "scene-4"];
}

function getCaptureRationale(sectionIndex: number, sectionCount: number): string {
  if (sectionCount <= 1 || sectionIndex === 0) {
    return "Use this capture for early story beats, especially the cover and problem setup.";
  }

  if (sectionIndex >= sectionCount - 1) {
    return "Use this capture for middle-to-late story beats, especially the solution and highlights.";
  }

  return "Use this capture for middle story beats where the workflow or core proof needs support.";
}

export function buildAssetPlan(input: {
  scenePlan: ScenePlan;
  sourceManifest?: SourceManifest;
}): AssetPlan {
  const captureTargets =
    input.sourceManifest?.sourceType === "website"
      ? input.sourceManifest.sections.map((section, index, sections) => ({
          sourceType: "website" as const,
          sourceUrl: input.sourceManifest!.url,
          sectionTitle: section.title,
          sectionBody: section.body,
          suggestedAsset: `${slugifyAssetName(section.title)}-capture`,
          recommendedSceneIds: getRecommendedSceneIds(index, sections.length),
          rationale: getCaptureRationale(index, sections.length),
        }))
      : [];

  return {
    availableAssets: [],
    placeholderAssets: input.scenePlan.scenes.map((scene) => `${scene.sceneId}-placeholder`),
    missingAssets: captureTargets.map((target) => `capture:${target.suggestedAsset}`),
    captureTargets,
  };
}
