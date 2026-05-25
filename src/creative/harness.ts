import type { Scene, ScenePlan, Script, Storyboard, VideoBrief } from "../core/types.js";
import type { CompositionProposal } from "./composition-proposal.js";

export interface CreativeBriefArtifact {
  version: "framepack.creative-brief.v1";
  sourceType: string;
  outputType: VideoBrief["outputType"];
  goal: string;
  audience: string;
  commercialIntent: string;
  contentType: string;
  emotionalEnergy: string[];
  narrativePattern: string;
  visualSeeds: string[];
  motionSeeds: string[];
  constraints: string[];
}

export interface NarrativeArcArtifact {
  version: "framepack.narrative-arc.v1";
  pattern: string;
  beats: Array<{
    sceneId: string;
    role: string;
    intent: string;
    tension: string;
    release: string;
  }>;
}

export interface VisualDirectionArtifact {
  version: "framepack.visual-direction.v1";
  style: string;
  paletteIntent: string;
  typographyIntent: string;
  sceneTreatments: Array<{
    sceneId: string;
    treatment: string;
    layout: string;
    visualHierarchy: string[];
  }>;
}

export interface MotionPlanArtifact {
  version: "framepack.motion-plan.v1";
  motionLanguage: string;
  beats: Array<{
    sceneId: string;
    entry: string;
    hold: string;
    exit: string;
    intensity: string;
  }>;
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function getNarrativePattern(brief: VideoBrief) {
  if (brief.outputType === "game-ad") {
    return "hook-challenge-powerup-payoff-cta";
  }

  return "hook-problem-solution-proof-cta";
}

function getCommercialIntent(goal: string) {
  const normalized = goal.toLowerCase();

  if (/\b(promote|sell|convert|join|subscribe|buy)\b/.test(normalized)) {
    return "conversion";
  }

  if (/\b(explain|teach|educate|brief)\b/.test(normalized)) {
    return "education";
  }

  return "clarity";
}

function getContentType(brief: VideoBrief) {
  const normalized = `${brief.goal} ${brief.style.brandName}`.toLowerCase();

  if (/\b(course|sprint|training|workshop)\b/.test(normalized)) {
    return "course-promo";
  }

  if (brief.outputType === "game-ad") {
    return "game-ad";
  }

  return "product-explainer";
}

function getSceneRole(scene: Scene) {
  if (scene.visualType === "cover") {
    return "hook";
  }

  if (scene.visualType === "problem") {
    return "problem";
  }

  if (scene.visualType === "solution" || scene.visualType === "workflow") {
    return "solution";
  }

  if (scene.visualType === "ending") {
    return "cta";
  }

  return "proof";
}

function getSceneTreatment(scene: Scene) {
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

  if (scene.visualType === "solution" || scene.visualType === "workflow") {
    return {
      treatment: "solution-build",
      layout: "split panel with mechanism copy and asset slot",
      visualHierarchy: ["mechanism", "steps", "asset"],
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
    treatment: "proof-highlight",
    layout: "focused proof card with secondary detail",
    visualHierarchy: ["proof", "detail", "source"],
  };
}

function getMotionBeat(scene: Scene) {
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

function hasVisibleSection(compositionHtml: string, scene: Scene) {
  const sectionMatch = compositionHtml.match(
    new RegExp(`<section[^>]*data-scene-id="${scene.sceneId}"[\\s\\S]*?<\\/section>`),
  );

  if (!sectionMatch) {
    return false;
  }

  return /<h1>|scene-body|scene-caption|scene-asset/.test(sectionMatch[0]);
}

function buildQualityReport(input: {
  scenePlan: ScenePlan;
  script: Script;
  storyboard: Storyboard;
  compositionHtml: string;
  compositionProposal?: CompositionProposal;
}) {
  const findings: string[] = [];
  const proposalSceneIds = new Set(input.compositionProposal?.scenes.map((scene) => scene.sceneId) ?? []);
  const checks = [
    {
      id: "composition-visible-content",
      status: input.scenePlan.scenes.every((scene) => hasVisibleSection(input.compositionHtml, scene))
        ? "passed"
        : "failed",
      summary: "Every generated scene should contain visible fallback content.",
    },
    {
      id: "script-not-mechanical",
      status: input.script.scenes.some((scene) => /^.*?\s+-\s+/.test(scene.voiceoverLines[0] ?? ""))
        ? "failed"
        : "passed",
      summary: "Voiceover lines should be purpose-specific rather than repeated goal-body joins.",
    },
    {
      id: "storyboard-motion-variety",
      status:
        unique(input.storyboard.scenes.map((scene) => scene.motionNote)).length > 1 ||
        input.storyboard.scenes.length <= 1
          ? "passed"
          : "failed",
      summary: "Storyboard motion notes should vary across the scene sequence.",
    },
    {
      id: "proposal-scene-coverage",
      status:
        input.scenePlan.scenes.every((scene) => proposalSceneIds.has(scene.sceneId)) ||
        input.scenePlan.scenes.length === 0
          ? "passed"
          : "failed",
      summary: "Every planned scene should have a composition proposal before HyperFrames emission.",
    },
    {
      id: "proposal-motion-variety",
      status:
        !input.compositionProposal ||
        new Set(input.compositionProposal.scenes.map((scene) => scene.motion.entry)).size > 1 ||
        input.compositionProposal.scenes.length <= 1
          ? "passed"
          : "failed",
      summary: "Composition proposal motion recipes should not collapse into a single repeated entry.",
    },
  ];

  for (const check of checks) {
    if (check.status === "failed") {
      findings.push(check.summary);
    }
  }

  return {
    version: "framepack.quality-report.v1",
    status: findings.length === 0 ? "passed" : "failed",
    checks,
    findings,
    revisionHints: findings.map((finding) => `Revise package: ${finding}`),
  };
}

export function buildCreativePlanningArtifacts(input: {
  brief: VideoBrief;
  scenePlan: ScenePlan;
}) {
  const narrativePattern = getNarrativePattern(input.brief);
  const sceneTreatments = input.scenePlan.scenes.map((scene) => ({
    sceneId: scene.sceneId,
    ...getSceneTreatment(scene),
  }));

  return {
    creativeBrief: {
      version: "framepack.creative-brief.v1",
      sourceType: input.brief.sourceMaterials[0]?.kind ?? "unknown",
      outputType: input.brief.outputType,
      goal: input.brief.goal,
      audience: input.brief.audience,
      commercialIntent: getCommercialIntent(input.brief.goal),
      contentType: getContentType(input.brief),
      emotionalEnergy: ["credible", "forward-moving", "directed"],
      narrativePattern,
      visualSeeds: ["high-contrast hierarchy", "directed scene treatments", "visible fallback cards"],
      motionSeeds: ["title reveal", "contrast beat", "panel build", "cta punch"],
      constraints: ["no empty scenes", "text readable at 1080p", "fallback visual content required"],
    } satisfies CreativeBriefArtifact,
    narrativeArc: {
      version: "framepack.narrative-arc.v1",
      pattern: narrativePattern,
      beats: input.scenePlan.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        role: getSceneRole(scene),
        intent: scene.validationNotes[0] ?? `${scene.visualType} scene`,
        tension: scene.visualType === "problem" ? scene.narration : "Keep the viewer moving through the promise.",
        release: scene.visualType === "ending" ? "Ask for the next action." : "Advance the story with a clear beat.",
      })),
    } satisfies NarrativeArcArtifact,
    visualDirection: {
      version: "framepack.visual-direction.v1",
      style: input.brief.packSelection?.creativeDirectionPackId ?? input.brief.style.tone,
      paletteIntent: "credible dark base with high-energy accent",
      typographyIntent: "large hook, compact proof text, strong CTA",
      sceneTreatments,
    } satisfies VisualDirectionArtifact,
    motionPlan: {
      version: "framepack.motion-plan.v1",
      motionLanguage: input.brief.packSelection?.motionLanguage.join("; ") || "controlled kinetic explainer",
      beats: input.scenePlan.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        ...getMotionBeat(scene),
      })),
    } satisfies MotionPlanArtifact,
  };
}

export function buildCreativeHarnessArtifacts(input: {
  brief: VideoBrief;
  scenePlan: ScenePlan;
  script: Script;
  storyboard: Storyboard;
  compositionHtml: string;
  compositionProposal?: CompositionProposal;
}) {
  const planningArtifacts = buildCreativePlanningArtifacts(input);

  return {
    ...planningArtifacts,
    qualityReport: buildQualityReport(input),
  };
}
