import type {
  AssetPlan,
  SceneAssetMap,
  SceneAssetMapAssetEntry,
  ScenePlan,
  SourceManifest,
} from "../core/types.js";
import { getThreadRecommendedSceneIds } from "./thread-scene-recommendations.js";

export function buildSceneAssetMap(input: {
  scenePlan: ScenePlan;
  assetPlan: AssetPlan;
  sourceManifest?: SourceManifest;
}): SceneAssetMap {
  const websiteAssets: SceneAssetMapAssetEntry[] = input.assetPlan.captureTargets.map((target) => ({
    suggestedAsset: target.suggestedAsset,
    sourceType: "website",
    sourceLabel: target.sectionTitle,
    assetForm: target.assetForm,
    executionKind: "capture-screenshot",
    recommendedSceneIds: [...target.recommendedSceneIds],
    rationale: target.rationale,
  }));

  const threadAssets: SceneAssetMapAssetEntry[] =
    input.sourceManifest?.sourceType === "thread"
      ? input.sourceManifest.posts.map((post, index, posts) => ({
          suggestedAsset: `post-${post.index}-card`,
          sourceType: "thread",
          sourceLabel: `Post ${post.index}`,
          assetForm: "text-card",
          executionKind: "compose-text-card",
          recommendedSceneIds: getThreadRecommendedSceneIds(index, posts.length),
          rationale:
            index === 0
              ? "Use this post for the opening problem or framing beats."
              : index >= posts.length - 1
                ? "Use this post for late proof, takeaway, or ending beats."
                : "Use this post for middle beats that explain the workflow or core argument.",
        }))
      : [];

  const forgeAssets: SceneAssetMapAssetEntry[] = (input.assetPlan.forgeTargets ?? []).map((target) => ({
    suggestedAsset: target.suggestedAsset,
    sourceType: "game-ad",
    sourceLabel: target.sourceLabel,
    assetForm: target.assetForm,
    executionKind: target.executionKind,
    recommendedSceneIds: [...target.recommendedSceneIds],
    rationale: target.rationale,
  }));

  const assets = [...websiteAssets, ...threadAssets, ...forgeAssets];

  const scenes = input.scenePlan.scenes.map((scene) => ({
    sceneId: scene.sceneId,
    recommendedCaptures: input.assetPlan.captureTargets
      .filter((target) => target.recommendedSceneIds.includes(scene.sceneId))
      .map((target) => ({
        suggestedAsset: target.suggestedAsset,
        purposeTag: target.purposeTag,
        assetForm: target.assetForm,
        sourceSectionTitle: target.sectionTitle,
        rationale: target.rationale,
      })),
    recommendedAssets: assets.filter((asset) => asset.recommendedSceneIds.includes(scene.sceneId)),
  }));

  const captures = input.assetPlan.captureTargets.map((target) => ({
    suggestedAsset: target.suggestedAsset,
    purposeTag: target.purposeTag,
    assetForm: target.assetForm,
    sourceSectionTitle: target.sectionTitle,
    recommendedSceneIds: [...target.recommendedSceneIds],
    rationale: target.rationale,
  }));

  return {
    scenes,
    captures,
    assets,
  };
}
