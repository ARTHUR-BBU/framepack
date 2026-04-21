import type { ScenePlan, Script } from "../../core/types.js";

export function buildScript(input: { scenePlan: ScenePlan }): Script {
  return {
    scenes: input.scenePlan.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      voiceoverLines: [scene.narration],
      captionLines: [...scene.onScreenText],
    })),
  };
}
