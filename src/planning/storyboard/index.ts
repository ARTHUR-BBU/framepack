import type { ScenePlan, Storyboard } from "../../core/types.js";

function getMotionNote(visualType: ScenePlan["scenes"][number]["visualType"]) {
  if (visualType === "cover") {
    return "Title reveal with a slow push.";
  }

  if (visualType === "problem") {
    return "Contrast emphasis with a sharp text beat.";
  }

  if (visualType === "solution") {
    return "Solution build with layered copy and asset reveal.";
  }

  if (visualType === "workflow") {
    return "Step stack with sequential panel movement.";
  }

  if (visualType === "ending") {
    return "CTA punch with a confident final hold.";
  }

  return "Proof highlight with a focused detail push.";
}

export function buildStoryboard(input: { scenePlan: ScenePlan }): Storyboard {
  return {
    scenes: input.scenePlan.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      visualIntent: scene.visualType,
      motionNote: getMotionNote(scene.visualType),
      transitionNote: scene.transition,
    })),
  };
}
