import type { AssetPlan, ScenePlan } from "../../core/types.js";

export function buildAssetPlan(input: { scenePlan: ScenePlan }): AssetPlan {
  return {
    availableAssets: [],
    placeholderAssets: input.scenePlan.scenes.map((scene) => `${scene.sceneId}-placeholder`),
    missingAssets: [],
  };
}
