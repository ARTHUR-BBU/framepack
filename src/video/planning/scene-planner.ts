import { CASE_EXPLAINER_SCENE_SEQUENCE } from "../templates/case-explainer.js";
import type { Scene, ScenePlan, SceneVisualType, VideoBrief } from "../types.js";

function slugifyAssetName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "section";
}

function classifyStructuredMaterial(input: { index: number; total: number; title: string; body: string }) {
  const normalized = `${input.title} ${input.body}`.toLowerCase();

  if (input.total <= 1 || input.index === 0) {
    return "hero" as const;
  }

  if (/\b(how|process|steps|workflow|flow)\b/.test(normalized)) {
    return "workflow" as const;
  }

  if (/\b(proof|result|metric|review|customer|evidence|testimonial)\b/.test(normalized)) {
    return "proof" as const;
  }

  return "highlight" as const;
}

function getStructuredMaterialForScene(brief: VideoBrief, visualType: SceneVisualType) {
  const structuredMaterials = brief.sourceMaterials
    .map((material, index, all) => ({
      material,
      tag:
        material.kind === "structured"
          ? classifyStructuredMaterial({
              index,
              total: all.length,
              title: material.title,
              body: material.body,
            })
          : null,
    }))
    .filter((entry) => entry.material.kind === "structured");

  if (structuredMaterials.length === 0) {
    return undefined;
  }

  const pickByTag = (tag: "hero" | "workflow" | "proof" | "highlight") =>
    structuredMaterials.find((entry) => entry.tag === tag)?.material;

  if (visualType === "cover" || visualType === "problem") {
    return pickByTag("hero") ?? structuredMaterials[0]?.material;
  }

  if (visualType === "workflow") {
    return pickByTag("workflow") ?? pickByTag("highlight") ?? structuredMaterials[1]?.material ?? structuredMaterials[0]?.material;
  }

  if (visualType === "solution") {
    return pickByTag("proof") ?? pickByTag("highlight") ?? structuredMaterials[1]?.material ?? structuredMaterials[0]?.material;
  }

  if (visualType === "highlights" || visualType === "ending") {
    return pickByTag("proof") ?? pickByTag("highlight") ?? structuredMaterials[structuredMaterials.length - 1]?.material;
  }

  return structuredMaterials[0]?.material;
}

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

  const scenes = CASE_EXPLAINER_SCENE_SEQUENCE.map((visualType: SceneVisualType, index: number): Scene => {
      const supportingMaterial = getStructuredMaterialForScene(brief, visualType);
      const supportingTitle = supportingMaterial?.title;
      const supportingAsset = supportingTitle ? `${slugifyAssetName(supportingTitle)}-capture` : undefined;

      return ({
      sceneId: `scene-${index + 1}`,
      purpose: visualType,
      startTimeSec: index * durationPerScene,
      durationSec: durationPerScene,
      narration: supportingTitle ? `${brief.goal} - ${supportingTitle}` : `${brief.goal} - ${visualType}`,
      onScreenText: supportingTitle ? [brief.goal, supportingTitle] : [brief.goal, visualType],
      visualType,
      assets: supportingAsset ? [supportingAsset] : [],
      transition: "fade",
      validationNotes: supportingTitle ? [`source material: ${supportingTitle}`] : [],
    });
  });

  return {
    totalDurationSec: durationPerScene * CASE_EXPLAINER_SCENE_SEQUENCE.length,
    scenes,
  };
}
