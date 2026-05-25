import type {
  AssetPlan,
  ScenePlan,
  SourceManifest,
  VideoBrief,
  VideoBriefDefaults,
} from "../core/types.js";
import { buildCompositionProposal } from "../creative/composition-proposal.js";
import { buildCreativePlanningArtifacts } from "../creative/harness.js";
import { buildScript } from "../planning/script/index.js";
import { buildStoryboard } from "../planning/storyboard/index.js";
import { compileCompositionSpec } from "../video/compile/composition-spec.js";
import { createVideoProjectPackage } from "../video/package/project-package.js";
import { validateScenePlan } from "../video/planning/scene-validators.js";
import { emitHyperframesComposition } from "../video/render/hyperframes-adapter.js";
import { createValidationReport } from "../video/validation/validation-report.js";

function createGameAdSourceManifest(input: {
  title: string;
  description: string;
  collectedAt: string;
}): SourceManifest {
  return {
    sourceType: "game-ad",
    title: input.title,
    description: input.description,
    collectedAt: input.collectedAt,
  };
}

function createGameAdBrief(input: {
  description: string;
  defaults: VideoBriefDefaults & { outputType: "game-ad" };
}): VideoBrief {
  return {
    goal: input.defaults.goal,
    audience: input.defaults.audience,
    format: input.defaults.format,
    style: {
      tone: input.defaults.style?.tone ?? "direct",
      pacing: input.defaults.style?.pacing ?? "fast",
      brandName: input.defaults.style?.brandName ?? "Studio",
    },
    ...(input.defaults.packSelection ? { packSelection: input.defaults.packSelection } : {}),
    sourceMaterials: [
      {
        kind: "structured",
        title: "Game ad source description",
        body: input.description,
      },
    ],
    constraints: {
      maxDurationSec: input.defaults.constraints?.maxDurationSec ?? 45,
      requiredPoints: [...(input.defaults.constraints?.requiredPoints ?? [])],
      bannedTerms: [...(input.defaults.constraints?.bannedTerms ?? [])],
    },
    outputType: "game-ad",
  };
}

function buildGameAdScenePlan(brief: VideoBrief): ScenePlan {
  const sceneDuration = Math.floor(brief.constraints.maxDurationSec / 4);

  if (sceneDuration < 1) {
    throw new Error("game-ad scene plan requires at least 1 second per scene");
  }

  const scenes = [
    {
      sceneId: "scene-1",
      purpose: "arcade hook",
      visualType: "cover" as const,
      narration: `Open with ${brief.style.brandName} as a playable promise for ${brief.audience}.`,
      onScreenText: [brief.style.brandName, brief.goal],
      assets: ["hero-character-pack", "pixel-world-map-pack"],
    },
    {
      sceneId: "scene-2",
      purpose: "challenge setup",
      visualType: "problem" as const,
      narration: `Show the challenge ${brief.audience} must beat before the product becomes the power-up.`,
      onScreenText: ["Challenge", brief.audience],
      assets: ["pixel-world-map-pack", "impact-fx-pack"],
    },
    {
      sceneId: "scene-3",
      purpose: "power-up reveal",
      visualType: "workflow" as const,
      narration: `Reveal the mechanism as a power-up that turns the source promise into momentum.`,
      onScreenText: ["Power-up", brief.sourceMaterials[0]?.body.slice(0, 72) ?? ""],
      assets: ["hero-character-pack", "impact-fx-pack"],
    },
    {
      sceneId: "scene-4",
      purpose: "call to action",
      visualType: "ending" as const,
      narration: `Close with a direct quest invitation and make the next action feel immediate.`,
      onScreenText: [brief.style.brandName, "Start the quest"],
      assets: ["hero-character-pack", "pixel-world-map-pack", "impact-fx-pack"],
    },
  ];

  return {
    totalDurationSec: sceneDuration * scenes.length,
    scenes: scenes.map((scene, index) => ({
      ...scene,
      startTimeSec: index * sceneDuration,
      durationSec: sceneDuration,
      transition: "quick-cut",
      validationNotes: [],
    })),
  };
}

function buildGameAdAssetPlan(input: {
  brief: VideoBrief;
  description: string;
}): AssetPlan {
  const styleNotes = [
    "2D game-ad look, readable at video scale, consistent palette across outputs.",
    "Transparent PNGs where foreground sprites or FX are expected.",
    "Keep compositions video-friendly rather than full game implementation assets.",
  ];

  return {
    availableAssets: [],
    placeholderAssets: ["hero-character-pack", "pixel-world-map-pack", "impact-fx-pack"],
    missingAssets: [
      "forge-character-pack:hero-character-pack",
      "forge-map-pack:pixel-world-map-pack",
      "forge-fx-pack:impact-fx-pack",
    ],
    captureTargets: [],
    forgeTargets: [
      {
        suggestedAsset: "hero-character-pack",
        sourceLabel: "Playable hero character",
        sourceText: input.description,
        executionKind: "forge-character-pack",
        assetForm: "character-pack",
        forgeBackend: "agent-sprite-forge",
        requiredSkill: "generate2dsprite",
        expectedOutputs: ["transparent PNG sprite sheet", "idle/run/action poses", "asset metadata JSON"],
        prompt: `Create a hero character pack for a game-style video ad. Goal: ${input.brief.goal}. Audience: ${input.brief.audience}. Source: ${input.description}`,
        recommendedSceneIds: ["scene-1", "scene-3", "scene-4"],
        styleNotes,
        acceptanceCriteria: [
          "Character silhouette is clear over both bright and dark backgrounds.",
          "Sprite sheet includes reusable pose states for short video animation.",
          "Output can be referenced from HyperFrames without manual cropping.",
        ],
        rationale: "Use the character as the recurring visual anchor for the ad.",
      },
      {
        suggestedAsset: "pixel-world-map-pack",
        sourceLabel: "Game world background map",
        sourceText: input.description,
        executionKind: "forge-map-pack",
        assetForm: "map-pack",
        forgeBackend: "agent-sprite-forge",
        requiredSkill: "generate2dmap",
        expectedOutputs: ["layered 2D map pack", "background PNG", "foreground/depth layers"],
        prompt: `Create a layered game map/background pack for a video ad. Goal: ${input.brief.goal}. Brand: ${input.brief.style.brandName}. Source: ${input.description}`,
        recommendedSceneIds: ["scene-1", "scene-2", "scene-3", "scene-4"],
        styleNotes,
        acceptanceCriteria: [
          "Map has enough negative space for captions and product callouts.",
          "Layers support parallax or simple camera movement in a video timeline.",
          "Visual tone matches the hero character and FX pack.",
        ],
        rationale: "Use the map pack as the shared world/background across the demo spot.",
      },
      {
        suggestedAsset: "impact-fx-pack",
        sourceLabel: "Power-up and transition FX",
        sourceText: input.description,
        executionKind: "forge-fx-pack",
        assetForm: "fx-pack",
        forgeBackend: "agent-sprite-forge",
        requiredSkill: "generate2dsprite",
        expectedOutputs: ["transparent PNG FX frames", "icon or burst variants", "timing notes"],
        prompt: `Create power-up, impact, icon, and transition FX for a game-style video ad. Goal: ${input.brief.goal}. Source: ${input.description}`,
        recommendedSceneIds: ["scene-2", "scene-3", "scene-4"],
        styleNotes,
        acceptanceCriteria: [
          "FX read as short video accents, not full gameplay systems.",
          "Transparent outputs can layer over text, sprites, and background maps.",
          "Pack includes at least one reveal, one impact, and one CTA accent.",
        ],
        rationale: "Use FX to sell motion, transformation, and the final call to action.",
      },
    ],
  };
}

export function compileGameAdProject(input: {
  description: string;
  defaults: VideoBriefDefaults & { outputType: "game-ad" };
  projectName: string;
}) {
  const brief = createGameAdBrief({
    description: input.description,
    defaults: input.defaults,
  });
  const scenePlan = buildGameAdScenePlan(brief);
  const script = buildScript({ scenePlan });
  const storyboard = buildStoryboard({ scenePlan });
  const creativePlanningArtifacts = buildCreativePlanningArtifacts({
    brief,
    scenePlan,
  });
  const compositionProposal = buildCompositionProposal({
    ...creativePlanningArtifacts,
    scenePlan,
  });
  const assetPlan = buildGameAdAssetPlan({
    brief,
    description: input.description,
  });
  const validationReport = createValidationReport({
    projectName: input.projectName,
    scenePlan,
    issues: validateScenePlan(scenePlan, brief.constraints),
  });
  const spec = compileCompositionSpec({
    ...scenePlan,
    format: brief.format,
    themePalette: input.defaults.theme?.palette,
    compositionProposal,
  });
  const composition = emitHyperframesComposition(spec);
  const sourceManifest = createGameAdSourceManifest({
    title: input.projectName,
    description: input.description,
    collectedAt: new Date().toISOString(),
  });
  const projectPackage = createVideoProjectPackage({
    projectName: input.projectName,
    brief,
    scenePlan,
    script,
    storyboard,
    assetPlan,
    validationReport,
    compositionHtml: composition.html,
    compositionProposal,
    sourceManifest,
  });

  return {
    brief,
    scenePlan,
    script,
    storyboard,
    assetPlan,
    validationReport,
    compositionProposal,
    spec,
    composition,
    package: projectPackage,
  };
}
