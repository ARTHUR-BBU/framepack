import type { AssetPlan, SceneAssetMap, ScenePlan } from "../core/types.js";

export function buildSceneAssetMap(input: {
  scenePlan: ScenePlan;
  assetPlan: AssetPlan;
}): SceneAssetMap {
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
  };
}
