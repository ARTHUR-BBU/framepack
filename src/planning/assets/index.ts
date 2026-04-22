import type { AssetPlan, ScenePlan, SourceManifest } from "../../core/types.js";

function slugifyAssetName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "section";
}

export function buildAssetPlan(input: {
  scenePlan: ScenePlan;
  sourceManifest?: SourceManifest;
}): AssetPlan {
  const captureTargets =
    input.sourceManifest?.sourceType === "website"
      ? input.sourceManifest.sections.map((section) => ({
          sourceType: "website" as const,
          sourceUrl: input.sourceManifest!.url,
          sectionTitle: section.title,
          sectionBody: section.body,
          suggestedAsset: `${slugifyAssetName(section.title)}-capture`,
        }))
      : [];

  return {
    availableAssets: [],
    placeholderAssets: input.scenePlan.scenes.map((scene) => `${scene.sceneId}-placeholder`),
    missingAssets: captureTargets.map((target) => `capture:${target.suggestedAsset}`),
    captureTargets,
  };
}
