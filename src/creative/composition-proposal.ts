import type { Scene, ScenePlan } from "../core/types.js";
import type {
  CreativeBriefArtifact,
  MotionPlanArtifact,
  NarrativeArcArtifact,
  VisualDirectionArtifact,
} from "./harness.js";

export interface CompositionProposalScene {
  proposalId: string;
  sceneId: string;
  role: string;
  treatment: string;
  layout: string;
  visualHierarchy: string[];
  title: string;
  body: string;
  caption: string;
  assetSlot: {
    kind: "generated-asset" | "fallback-card";
    assetRef?: string;
    label: string;
  };
  motion: {
    entry: string;
    hold: string;
    exit: string;
    intensity: string;
  };
  rationale: string;
}

export interface CompositionProposal {
  version: "framepack.composition-proposal.v1";
  strategy: string;
  commercialIntent: string;
  style: string;
  scenes: CompositionProposalScene[];
}

function compactText(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean).join(" ");
}

function titleForScene(scene: Scene) {
  return scene.onScreenText[0] || scene.narration;
}

function bodyForScene(scene: Scene) {
  return compactText(scene.onScreenText.slice(1)) || scene.validationNotes[0] || scene.narration;
}

function fallbackTreatment(scene: Scene) {
  if (scene.visualType === "cover") {
    return {
      treatment: "hero-hook",
      layout: "centered title with kinetic subtitle and accent band",
      visualHierarchy: ["title", "promise", "source badge"],
    };
  }

  if (scene.visualType === "problem") {
    return {
      treatment: "contrast-problem",
      layout: "large pain statement with warning accent and supporting evidence",
      visualHierarchy: ["pain", "cost", "contrast"],
    };
  }

  if (scene.visualType === "ending") {
    return {
      treatment: "cta-punch",
      layout: "bold call to action with final promise",
      visualHierarchy: ["action", "promise", "brand"],
    };
  }

  return {
    treatment: "proof-build",
    layout: "directed proof panel with asset slot and supporting detail",
    visualHierarchy: ["proof", "mechanism", "asset"],
  };
}

function fallbackMotion(scene: Scene) {
  if (scene.visualType === "cover") {
    return {
      entry: "title reveal",
      hold: "slow push with accent shimmer",
      exit: "fast fade to problem contrast",
      intensity: "medium",
    };
  }

  if (scene.visualType === "problem") {
    return {
      entry: "contrast cut",
      hold: "sharp text beat",
      exit: "snap toward solution",
      intensity: "high",
    };
  }

  if (scene.visualType === "ending") {
    return {
      entry: "cta rise",
      hold: "confident final hold",
      exit: "clean fade",
      intensity: "high",
    };
  }

  return {
    entry: "panel build",
    hold: "controlled detail push",
    exit: "soft transition",
    intensity: "medium",
  };
}

export function buildCompositionProposal(input: {
  creativeBrief: CreativeBriefArtifact;
  narrativeArc: NarrativeArcArtifact;
  visualDirection: VisualDirectionArtifact;
  motionPlan: MotionPlanArtifact;
  scenePlan: ScenePlan;
}): CompositionProposal {
  return {
    version: "framepack.composition-proposal.v1",
    strategy: input.creativeBrief.narrativePattern,
    commercialIntent: input.creativeBrief.commercialIntent,
    style: input.visualDirection.style,
    scenes: input.scenePlan.scenes.map((scene) => {
      const treatment = input.visualDirection.sceneTreatments.find(
        (candidate) => candidate.sceneId === scene.sceneId,
      ) ?? fallbackTreatment(scene);
      const motion = input.motionPlan.beats.find((candidate) => candidate.sceneId === scene.sceneId)
        ?? fallbackMotion(scene);
      const beat = input.narrativeArc.beats.find((candidate) => candidate.sceneId === scene.sceneId);
      const assetRef = scene.assets[0];

      return {
        proposalId: `proposal-${scene.sceneId}`,
        sceneId: scene.sceneId,
        role: beat?.role ?? scene.visualType,
        treatment: treatment.treatment,
        layout: treatment.layout,
        visualHierarchy: [...treatment.visualHierarchy],
        title: titleForScene(scene),
        body: bodyForScene(scene),
        caption: beat?.intent ?? scene.narration,
        assetSlot: assetRef
          ? {
              kind: "generated-asset",
              assetRef,
              label: assetRef,
            }
          : {
              kind: "fallback-card",
              label: `${treatment.treatment} visual placeholder`,
            },
        motion: {
          entry: motion.entry,
          hold: motion.hold,
          exit: motion.exit,
          intensity: motion.intensity,
        },
        rationale: beat
          ? `${beat.tension} ${beat.release}`
          : scene.validationNotes[0] ?? "Keep this scene visually directed and readable.",
      };
    }),
  };
}
