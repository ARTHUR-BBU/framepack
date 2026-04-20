import { CASE_EXPLAINER_SCENE_SEQUENCE } from "../templates/case-explainer.js";
import type { Scene, ScenePlan, SceneVisualType, VideoBrief } from "../types.js";

export function planCaseExplainerScenes(brief: VideoBrief): ScenePlan {
  if (brief.outputType !== "case-explainer") {
    throw new Error("planCaseExplainerScenes only supports case-explainer briefs");
  }

  const durationPerScene = Math.floor(
    brief.constraints.maxDurationSec / CASE_EXPLAINER_SCENE_SEQUENCE.length,
  );

  if (durationPerScene < 1) {
    throw new Error("case explainer scene plan requires at least 1 second per scene");
  }

  const scenes = CASE_EXPLAINER_SCENE_SEQUENCE.map((visualType: SceneVisualType, index: number): Scene => ({
      sceneId: `scene-${index + 1}`,
      purpose: visualType,
      startTimeSec: index * durationPerScene,
    durationSec: durationPerScene,
    narration: `${brief.goal} - ${visualType}`,
    onScreenText: [brief.goal, visualType],
    visualType,
    assets: [],
    transition: "fade",
    validationNotes: [],
  }));

  return {
    totalDurationSec: durationPerScene * CASE_EXPLAINER_SCENE_SEQUENCE.length,
    scenes,
  };
}
