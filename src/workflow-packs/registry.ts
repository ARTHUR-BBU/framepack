import type { AssetExecutionKind, OutputType, VideoFormat, VideoPackSelection } from "../core/types.js";
import type { CompilerSourceInput } from "../compiler/pipeline-registry.js";

export type WorkflowPackStatus = "available" | "planned";

export interface FramepackWorkflowPack {
  id: string;
  label: string;
  status: WorkflowPackStatus;
  description: string;
  sourceTypes: Array<CompilerSourceInput["sourceType"]>;
  outputType: OutputType;
  formats: VideoFormat[];
  recommendedCreativeDirectionPacks: string[];
  requiredExecutionKinds: AssetExecutionKind[];
  recommendedForgeBackend?: "agent-sprite-forge" | "manual" | "custom";
  agentInstructions: string[];
  acceptanceCriteria: string[];
}

export interface FramepackCreativeDirectionPack {
  id: string;
  label: string;
  description: string;
  bestForWorkflowPacks: string[];
  visualLanguage: string[];
  motionLanguage: string[];
  templateGuidance: string[];
  acceptanceCriteria: string[];
}

export const FRAMEPACK_WORKFLOW_PACKS: FramepackWorkflowPack[] = [
  {
    id: "product-explainer",
    label: "Product Explainer",
    status: "available",
    description: "Turn a product, feature, or case note into a concise explainer package.",
    sourceTypes: ["markdown", "website"],
    outputType: "case-explainer",
    formats: ["16:9", "9:16"],
    recommendedCreativeDirectionPacks: ["clean-saas-explainer", "editorial-proof-story"],
    requiredExecutionKinds: ["capture-screenshot"],
    agentInstructions: [
      "Use markdown or website input when the user needs a structured product explanation.",
      "Run status, capture pending source assets, validate, then prepare HyperFrames preview or render.",
    ],
    acceptanceCriteria: [
      "The package explains the problem, solution, proof, and next step.",
      "Screenshots or source cards are mapped to the scenes they support.",
    ],
  },
  {
    id: "thread-to-video",
    label: "Thread To Video",
    status: "available",
    description: "Convert a social or long-form thread into a scene-by-scene video package.",
    sourceTypes: ["thread"],
    outputType: "case-explainer",
    formats: ["16:9", "9:16"],
    recommendedCreativeDirectionPacks: ["editorial-proof-story", "clean-saas-explainer"],
    requiredExecutionKinds: ["compose-text-card"],
    agentInstructions: [
      "Use thread input when the source is a sequence of posts, claims, or lessons.",
      "Compose text cards before runtime inspection so scene layout can be checked.",
    ],
    acceptanceCriteria: [
      "Each major post is traceable through SOURCE_SCENE_MAP.json.",
      "Text cards are readable and do not overflow during runtime inspection.",
    ],
  },
  {
    id: "website-to-video",
    label: "Website To Video",
    status: "available",
    description: "Use a landing page or product page as the source for a video package.",
    sourceTypes: ["website"],
    outputType: "case-explainer",
    formats: ["16:9", "9:16"],
    recommendedCreativeDirectionPacks: ["clean-saas-explainer"],
    requiredExecutionKinds: ["capture-screenshot"],
    agentInstructions: [
      "Use website input when the source of truth is a URL or saved page.",
      "Capture source screenshots, sync assets, validate, then run runtime lint or snapshot.",
    ],
    acceptanceCriteria: [
      "Important page sections are represented in capture targets.",
      "Captured assets are connected through SCENE_ASSET_MAP.json.",
    ],
  },
  {
    id: "game-ad-sprite-video",
    label: "Game Ad Sprite Video",
    status: "available",
    description: "Create a game-style promo package with sprite, map, and FX forge tasks.",
    sourceTypes: ["game-ad"],
    outputType: "game-ad",
    formats: ["16:9", "9:16"],
    recommendedCreativeDirectionPacks: ["game-ad-retro-arcade"],
    requiredExecutionKinds: ["forge-character-pack", "forge-map-pack", "forge-fx-pack"],
    recommendedForgeBackend: "agent-sprite-forge",
    agentInstructions: [
      "Use game-ad input for a lightweight game-style promotional video package.",
      "Recommend agent-sprite-forge when the user wants Codex to produce 2D assets directly.",
      "Leave forge tasks backend-neutral if the user has existing assets or a custom producer.",
    ],
    acceptanceCriteria: [
      "Character, map/background, and FX tasks have recommended scene coverage.",
      "Forge tasks include prompts, expected outputs, style notes, and acceptance criteria.",
    ],
  },
  {
    id: "course-promo",
    label: "Course Promo",
    status: "planned",
    description: "Promote a course or learning product with outcome, proof, and call-to-action scenes.",
    sourceTypes: ["markdown", "website", "game-ad"],
    outputType: "case-explainer",
    formats: ["16:9", "9:16"],
    recommendedCreativeDirectionPacks: ["clean-saas-explainer", "game-ad-retro-arcade"],
    requiredExecutionKinds: ["capture-screenshot"],
    agentInstructions: [
      "Start from product-explainer or game-ad-sprite-video until the dedicated course pipeline is available.",
      "Make the promise, target learner, transformation, and CTA explicit.",
    ],
    acceptanceCriteria: [
      "The package states the learner outcome clearly.",
      "The ending scene gives an unambiguous next action.",
    ],
  },
  {
    id: "launch-review",
    label: "Launch Review",
    status: "planned",
    description: "Turn a launch memo, changelog, or release recap into a structured review video.",
    sourceTypes: ["markdown", "thread"],
    outputType: "case-explainer",
    formats: ["16:9"],
    recommendedCreativeDirectionPacks: ["editorial-proof-story"],
    requiredExecutionKinds: ["compose-text-card"],
    agentInstructions: [
      "Use the case-explainer pipeline until a dedicated launch-review pipeline is available.",
      "Preserve evidence, milestones, metrics, and risks as traceable source points.",
    ],
    acceptanceCriteria: [
      "The package separates what changed, why it matters, and what comes next.",
      "Claims are tied back to source materials.",
    ],
  },
  {
    id: "investor-update",
    label: "Investor Update",
    status: "planned",
    description: "Compile an investor or stakeholder update into a calm, evidence-led video package.",
    sourceTypes: ["markdown"],
    outputType: "case-explainer",
    formats: ["16:9"],
    recommendedCreativeDirectionPacks: ["editorial-proof-story", "clean-saas-explainer"],
    requiredExecutionKinds: [],
    agentInstructions: [
      "Use markdown input and keep the narrative metric-led, concise, and defensible.",
      "Prefer restrained motion and clear section transitions over decorative effects.",
    ],
    acceptanceCriteria: [
      "The package highlights progress, blockers, metrics, and asks.",
      "The visual style remains readable and presentation-safe.",
    ],
  },
];

export const FRAMEPACK_CREATIVE_DIRECTION_PACKS: FramepackCreativeDirectionPack[] = [
  {
    id: "clean-saas-explainer",
    label: "Clean SaaS Explainer",
    description: "A restrained product-video direction for B2B software, tools, and operational workflows.",
    bestForWorkflowPacks: ["product-explainer", "website-to-video", "course-promo", "investor-update"],
    visualLanguage: [
      "Quiet interface-led composition",
      "Neutral surfaces with focused accent colors",
      "Dense but readable information hierarchy",
    ],
    motionLanguage: [
      "Measured reveals",
      "Subtle camera or layer movement",
      "Transitions that preserve orientation between scenes",
    ],
    templateGuidance: [
      "Prefer source screenshots, workflow panels, and clear comparison layouts.",
      "Avoid marketing-card clutter and purely decorative backgrounds.",
    ],
    acceptanceCriteria: [
      "On-screen text remains readable on desktop and mobile formats.",
      "Motion supports comprehension instead of competing with source evidence.",
    ],
  },
  {
    id: "editorial-proof-story",
    label: "Editorial Proof Story",
    description: "A narrative direction for threads, launch reviews, cases, and evidence-heavy updates.",
    bestForWorkflowPacks: ["thread-to-video", "launch-review", "investor-update", "product-explainer"],
    visualLanguage: [
      "Source-first cards and evidence callouts",
      "Magazine-like pacing without decorative overload",
      "Strong contrast between claim, proof, and takeaway scenes",
    ],
    motionLanguage: [
      "Sequential text reveals",
      "Evidence zooms and highlight passes",
      "Clean cuts between claims and proof points",
    ],
    templateGuidance: [
      "Use source-scene traceability to decide which quote, post, or data point appears.",
      "Keep long text in cards or captions that can be inspected by runtime tools.",
    ],
    acceptanceCriteria: [
      "Every major claim is supported by a visible source or mapped source material.",
      "Text cards do not overflow and remain legible at snapshot frames.",
    ],
  },
  {
    id: "game-ad-retro-arcade",
    label: "Game Ad Retro Arcade",
    description: "A sprite-forward direction for lightweight game-style ads and playful product promos.",
    bestForWorkflowPacks: ["game-ad-sprite-video", "course-promo"],
    visualLanguage: [
      "Readable sprite silhouettes",
      "Layered map/background depth",
      "Strong icon and FX affordances tied to the product promise",
    ],
    motionLanguage: [
      "Short action loops",
      "Impact bursts and UI pickups",
      "Scene beats that feel like a playable progression",
    ],
    templateGuidance: [
      "Use character, map, and FX forge tasks as separate reusable asset slots.",
      "Prefer transparent PNG/GIF-compatible assets for downstream composition.",
    ],
    acceptanceCriteria: [
      "Sprite, map, and FX assets are stylistically coherent.",
      "The product promise is visible through the gameplay-like progression, not only narration.",
    ],
  },
];

function cloneWorkflowPack(pack: FramepackWorkflowPack): FramepackWorkflowPack {
  return {
    ...pack,
    sourceTypes: [...pack.sourceTypes],
    formats: [...pack.formats],
    recommendedCreativeDirectionPacks: [...pack.recommendedCreativeDirectionPacks],
    requiredExecutionKinds: [...pack.requiredExecutionKinds],
    agentInstructions: [...pack.agentInstructions],
    acceptanceCriteria: [...pack.acceptanceCriteria],
  };
}

function cloneCreativeDirectionPack(pack: FramepackCreativeDirectionPack): FramepackCreativeDirectionPack {
  return {
    ...pack,
    bestForWorkflowPacks: [...pack.bestForWorkflowPacks],
    visualLanguage: [...pack.visualLanguage],
    motionLanguage: [...pack.motionLanguage],
    templateGuidance: [...pack.templateGuidance],
    acceptanceCriteria: [...pack.acceptanceCriteria],
  };
}

export function listFramepackWorkflowPacks(): FramepackWorkflowPack[] {
  return FRAMEPACK_WORKFLOW_PACKS.map(cloneWorkflowPack);
}

export function listFramepackCreativeDirectionPacks(): FramepackCreativeDirectionPack[] {
  return FRAMEPACK_CREATIVE_DIRECTION_PACKS.map(cloneCreativeDirectionPack);
}

export function getFramepackWorkflowPack(id: string): FramepackWorkflowPack {
  const pack = FRAMEPACK_WORKFLOW_PACKS.find((candidate) => candidate.id === id);

  if (!pack) {
    throw new Error(`Unknown Framepack workflow pack: ${id}`);
  }

  return cloneWorkflowPack(pack);
}

export function getFramepackCreativeDirectionPack(id: string): FramepackCreativeDirectionPack {
  const pack = FRAMEPACK_CREATIVE_DIRECTION_PACKS.find((candidate) => candidate.id === id);

  if (!pack) {
    throw new Error(`Unknown Framepack creative direction pack: ${id}`);
  }

  return cloneCreativeDirectionPack(pack);
}

export function createFramepackPackSelection(input: {
  workflowPackId?: string;
  creativeDirectionPackId?: string;
  sourceType?: string;
  outputType?: OutputType;
}): VideoPackSelection | undefined {
  if (!input.workflowPackId && !input.creativeDirectionPackId) {
    return undefined;
  }

  const workflowPack = input.workflowPackId
    ? getFramepackWorkflowPack(input.workflowPackId)
    : undefined;
  const creativeDirectionPack = input.creativeDirectionPackId
    ? getFramepackCreativeDirectionPack(input.creativeDirectionPackId)
    : undefined;

  if (
    workflowPack &&
    input.sourceType &&
    !workflowPack.sourceTypes.includes(input.sourceType as CompilerSourceInput["sourceType"])
  ) {
    throw new Error(`Workflow pack ${workflowPack.id} does not support sourceType ${input.sourceType}.`);
  }

  if (workflowPack && input.outputType && workflowPack.outputType !== input.outputType) {
    throw new Error(`Workflow pack ${workflowPack.id} requires outputType ${workflowPack.outputType}.`);
  }

  return {
    ...(workflowPack
      ? {
          workflowPackId: workflowPack.id,
          workflowPackLabel: workflowPack.label,
          workflowPackStatus: workflowPack.status,
        }
      : {}),
    ...(creativeDirectionPack
      ? {
          creativeDirectionPackId: creativeDirectionPack.id,
          creativeDirectionPackLabel: creativeDirectionPack.label,
        }
      : {}),
    agentInstructions: [...(workflowPack?.agentInstructions ?? [])],
    visualLanguage: [...(creativeDirectionPack?.visualLanguage ?? [])],
    motionLanguage: [...(creativeDirectionPack?.motionLanguage ?? [])],
    templateGuidance: [...(creativeDirectionPack?.templateGuidance ?? [])],
    acceptanceCriteria: [
      ...(workflowPack?.acceptanceCriteria ?? []),
      ...(creativeDirectionPack?.acceptanceCriteria ?? []),
    ],
  };
}

export function describeFramepackPackRegistry(): string {
  return [
    "Workflow packs:",
    ...FRAMEPACK_WORKFLOW_PACKS.map((pack) => `- ${pack.id} (${pack.status}): ${pack.description}`),
    "",
    "Creative direction packs:",
    ...FRAMEPACK_CREATIVE_DIRECTION_PACKS.map((pack) => `- ${pack.id}: ${pack.description}`),
  ].join("\n");
}
