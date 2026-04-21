import type { ScenePlan, Storyboard } from "../../core/types.js";

export function buildStoryboard(input: { scenePlan: ScenePlan }): Storyboard {
  return {
    scenes: input.scenePlan.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      visualIntent: scene.visualType,
      motionNote: `Hold ${scene.visualType} frame`,
      transitionNote: scene.transition,
    })),
  };
}
