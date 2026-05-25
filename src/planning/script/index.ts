import type { ScenePlan, Script } from "../../core/types.js";

function cleanLine(value: string) {
  return value
    .replace(/^.*?\s+-\s+/, "")
    .replace(/^#{1,6}\s+/, "")
    .trim();
}

function getPrimaryText(scene: ScenePlan["scenes"][number]) {
  return cleanLine(scene.onScreenText[0] ?? scene.narration);
}

function getSupportingText(scene: ScenePlan["scenes"][number]) {
  return cleanLine(scene.onScreenText[1] ?? scene.narration);
}

function buildVoiceover(scene: ScenePlan["scenes"][number]) {
  const primary = getPrimaryText(scene);
  const supporting = getSupportingText(scene);

  if (scene.visualType === "cover") {
    return supporting ? `Meet ${primary}. ${supporting}` : `Meet ${primary}.`;
  }

  if (scene.visualType === "problem") {
    return `The problem: ${supporting || primary}`;
  }

  if (scene.visualType === "solution") {
    return `The solution: ${supporting || primary}`;
  }

  if (scene.visualType === "workflow") {
    return `Here is the workflow: ${supporting || primary}`;
  }

  if (scene.visualType === "ending") {
    return `${primary}. ${supporting}`;
  }

  return `The proof point: ${supporting || primary}`;
}

export function buildScript(input: { scenePlan: ScenePlan }): Script {
  return {
    scenes: input.scenePlan.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      voiceoverLines: [buildVoiceover(scene)],
      captionLines: [...scene.onScreenText],
    })),
  };
}
