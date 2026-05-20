export type CapabilityAtlasDomain =
  | "source-understanding"
  | "planning"
  | "generative-media"
  | "programmatic-animation"
  | "asset-forge"
  | "composition-runtime"
  | "post-production"
  | "agent-interface"
  | "verification"
  | "creative-direction";

export type CapabilityAtlasLayer =
  | "stack"
  | "technique"
  | "model"
  | "library"
  | "runtime"
  | "cli"
  | "mcp-tool"
  | "skill"
  | "plugin"
  | "manual";

export type CapabilityAtlasDeliveryMode =
  | "npm-local"
  | "cdn-runtime"
  | "cli-local"
  | "mcp-tool"
  | "remote-api"
  | "hosted-product"
  | "codex-skill"
  | "claude-skill"
  | "plugin"
  | "manual-external";

export type CapabilityAtlasInvocationSurface =
  | "typescript-api"
  | "browser-runtime"
  | "cli"
  | "mcp-tool"
  | "skill-command"
  | "hosted-ui"
  | "remote-api"
  | "human-handoff";

export type CapabilityAtlasLifecycle =
  | "emerging"
  | "recommended"
  | "stable"
  | "watch"
  | "deprecated"
  | "blocked";

export type FramepackSupportLevel =
  | "known"
  | "recommended"
  | "contracted"
  | "detectable"
  | "invokable"
  | "verifiable";

export interface CapabilityAtlasSourceReference {
  label: string;
  url: string;
  type: "official-docs" | "release-notes" | "model-card" | "technical-report" | "community" | "framepack";
}

export interface CapabilityAtlasNode {
  id: string;
  name: string;
  domain: CapabilityAtlasDomain;
  category: string;
  layer: CapabilityAtlasLayer;
  provider: string;
  deliveryModes: CapabilityAtlasDeliveryMode[];
  invocationSurfaces: CapabilityAtlasInvocationSurface[];
  techniques: string[];
  inputContracts: string[];
  outputContracts: string[];
  verificationContracts: string[];
  bestUseCases: string[];
  notFor: string[];
  compatibleWith: string[];
  risks: string[];
  lifecycle: CapabilityAtlasLifecycle;
  localFirst: boolean;
  requiresNetwork: boolean;
  requiresAccount: boolean;
  requiresApiKey: boolean;
  agentFriendliness: number;
  verifiability: number;
  creativeRange: number;
  controllability: number;
  operationalCost: number;
  maturity: number;
  score: number;
  framepackSupportLevel: FramepackSupportLevel[];
  sourceRefs: CapabilityAtlasSourceReference[];
  lastVerifiedAt: string;
}

export interface RecommendedCapabilityStack {
  id: string;
  name: string;
  appliesTo: {
    workflowPackIds: string[];
    creativeDirectionPackIds: string[];
    outputTypes: string[];
    formats: string[];
  };
  nodes: {
    capabilityId: string;
    role: "source" | "asset-forge" | "motion" | "composition" | "verification" | "handoff";
    required: boolean;
    alternatives: string[];
  }[];
  rationale: string[];
  acceptanceCriteria: string[];
  riskNotes: string[];
}

export interface RecommendCapabilityStackInput {
  workflowPackId?: string;
  creativeDirectionPackId?: string;
  outputType?: string;
  format?: string;
  goal?: string;
}

const LAST_VERIFIED_AT = "2026-05-21";

function score(input: {
  agentFriendliness: number;
  verifiability: number;
  controllability: number;
  maturity: number;
  creativeRange: number;
  operationalCost: number;
  localFirst: boolean;
  integrationRiskPenalty?: number;
}): number {
  const value =
    input.agentFriendliness * 0.22 +
    input.verifiability * 0.22 +
    input.controllability * 0.18 +
    input.maturity * 0.14 +
    input.creativeRange * 0.12 +
    (input.localFirst ? 0.06 : 0) -
    input.operationalCost * 0.12 -
    (input.integrationRiskPenalty ?? 0);

  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

const CAPABILITY_ATLAS_NODES: CapabilityAtlasNode[] = [
  {
    id: "library.animejs",
    name: "Anime.js",
    domain: "programmatic-animation",
    category: "web-motion",
    layer: "library",
    provider: "animejs",
    deliveryModes: ["npm-local", "cdn-runtime"],
    invocationSurfaces: ["typescript-api", "browser-runtime"],
    techniques: [
      "timeline-animation",
      "stagger-animation",
      "svg-animation",
      "text-animation",
      "draggable-interaction",
      "spring-easing",
      "waapi-adjacent-animation",
    ],
    inputContracts: ["dom-elements", "svg-elements", "css-properties", "timeline-spec"],
    outputContracts: ["browser-motion", "runtime-observable-animation"],
    verificationContracts: ["runtime-inspect", "runtime-snapshot", "text-overflow-check"],
    bestUseCases: [
      "kinetic-typography",
      "logo-motion",
      "icon-motion",
      "ui-micro-animation",
      "agent-generated-motion-prototype",
    ],
    notFor: ["photorealistic-video-generation", "long-form-cinematic-generation", "full-render-pipeline-by-itself"],
    compatibleWith: ["video-runtime.hyperframes", "browser-snapshot", "svg-assets"],
    risks: ["Requires a browser/runtime host; it is not a complete video renderer by itself."],
    lifecycle: "recommended",
    localFirst: true,
    requiresNetwork: false,
    requiresAccount: false,
    requiresApiKey: false,
    agentFriendliness: 0.86,
    verifiability: 0.82,
    creativeRange: 0.78,
    controllability: 0.88,
    operationalCost: 0.18,
    maturity: 0.82,
    score: score({
      agentFriendliness: 0.86,
      verifiability: 0.82,
      creativeRange: 0.78,
      controllability: 0.88,
      operationalCost: 0.18,
      maturity: 0.82,
      localFirst: true,
    }),
    framepackSupportLevel: ["known", "recommended"],
    sourceRefs: [
      {
        label: "Anime.js documentation",
        url: "https://animejs.com/documentation/",
        type: "official-docs",
      },
    ],
    lastVerifiedAt: LAST_VERIFIED_AT,
  },
  {
    id: "video-runtime.hyperframes",
    name: "HyperFrames",
    domain: "composition-runtime",
    category: "timeline-rendering",
    layer: "runtime",
    provider: "hyperframes",
    deliveryModes: ["npm-local", "cli-local"],
    invocationSurfaces: ["cli", "typescript-api"],
    techniques: ["timeline-composition", "preview", "render", "runtime-inspect", "runtime-snapshot"],
    inputContracts: ["hyperframes.json", "index.html", "meta.json", "assets"],
    outputContracts: ["preview", "rendered-video", "snapshot-pngs", "inspect-report"],
    verificationContracts: ["runtime-doctor", "runtime-lint", "runtime-inspect", "runtime-snapshot"],
    bestUseCases: ["framepack-runtime-composition", "agent-verifiable-video-package", "timeline-preview-render"],
    notFor: ["frontier-video-model-generation", "standalone-asset-forge"],
    compatibleWith: ["library.animejs", "asset-forge.agent-sprite-forge", "cli.framepack"],
    risks: ["Runtime capability depends on local installation and HyperFrames version compatibility."],
    lifecycle: "stable",
    localFirst: true,
    requiresNetwork: false,
    requiresAccount: false,
    requiresApiKey: false,
    agentFriendliness: 0.9,
    verifiability: 0.92,
    creativeRange: 0.72,
    controllability: 0.88,
    operationalCost: 0.16,
    maturity: 0.82,
    score: score({
      agentFriendliness: 0.9,
      verifiability: 0.92,
      creativeRange: 0.72,
      controllability: 0.88,
      operationalCost: 0.16,
      maturity: 0.82,
      localFirst: true,
    }),
    framepackSupportLevel: ["known", "recommended", "contracted", "detectable", "invokable", "verifiable"],
    sourceRefs: [
      {
        label: "Framepack runtime commands",
        url: "docs/architecture/package-protocol-v1.md",
        type: "framepack",
      },
    ],
    lastVerifiedAt: LAST_VERIFIED_AT,
  },
  {
    id: "asset-forge.agent-sprite-forge",
    name: "agent-sprite-forge",
    domain: "asset-forge",
    category: "2d-asset-forge",
    layer: "skill",
    provider: "agent-sprite-forge",
    deliveryModes: ["codex-skill", "manual-external"],
    invocationSurfaces: ["skill-command", "human-handoff"],
    techniques: ["sprite-sheet-generation", "map-pack-generation", "prop-pack-generation", "fx-pack-generation"],
    inputContracts: ["forge-task", "prompt", "style-notes", "acceptance-criteria"],
    outputContracts: ["transparent-png", "gif", "asset-metadata-json"],
    verificationContracts: ["sync-assets", "validate", "asset-exists"],
    bestUseCases: ["game-ad-sprite-video", "2d-character-pack", "map-background-pack", "fx-burst-pack"],
    notFor: ["hard-bound-framepack-dependency", "unverified-runtime-render"],
    compatibleWith: ["video-runtime.hyperframes", "library.animejs", "cli.framepack"],
    risks: ["External skill must be installed or replaced by manual/custom production; Framepack does not install it automatically."],
    lifecycle: "recommended",
    localFirst: true,
    requiresNetwork: false,
    requiresAccount: false,
    requiresApiKey: false,
    agentFriendliness: 0.82,
    verifiability: 0.76,
    creativeRange: 0.84,
    controllability: 0.7,
    operationalCost: 0.24,
    maturity: 0.68,
    score: score({
      agentFriendliness: 0.82,
      verifiability: 0.76,
      creativeRange: 0.84,
      controllability: 0.7,
      operationalCost: 0.24,
      maturity: 0.68,
      localFirst: true,
    }),
    framepackSupportLevel: ["known", "recommended", "contracted"],
    sourceRefs: [
      {
        label: "agent-sprite-forge repository",
        url: "https://github.com/0x0funky/agent-sprite-forge",
        type: "official-docs",
      },
    ],
    lastVerifiedAt: LAST_VERIFIED_AT,
  },
  {
    id: "model.seedance-2-0",
    name: "Seedance 2.0",
    domain: "generative-media",
    category: "frontier-video-model",
    layer: "model",
    provider: "bytedance",
    deliveryModes: ["remote-api", "hosted-product"],
    invocationSurfaces: ["remote-api", "hosted-ui"],
    techniques: ["text-to-video", "image-to-video", "audio-video-generation"],
    inputContracts: ["text", "image", "audio"],
    outputContracts: ["generated-video", "generated-audio-video"],
    verificationContracts: ["asset-exists", "license-policy-check", "visual-review", "runtime-ingest-check"],
    bestUseCases: ["cinematic-source-material", "concept-visualization", "frontier-video-reference"],
    notFor: ["local-first-repeatable-rendering", "deterministic-programmatic-motion"],
    compatibleWith: ["video-runtime.hyperframes"],
    risks: ["Access, pricing, policy, and API details may change quickly."],
    lifecycle: "watch",
    localFirst: false,
    requiresNetwork: true,
    requiresAccount: true,
    requiresApiKey: true,
    agentFriendliness: 0.48,
    verifiability: 0.46,
    creativeRange: 0.92,
    controllability: 0.52,
    operationalCost: 0.72,
    maturity: 0.56,
    score: score({
      agentFriendliness: 0.48,
      verifiability: 0.46,
      creativeRange: 0.92,
      controllability: 0.52,
      operationalCost: 0.72,
      maturity: 0.56,
      localFirst: false,
      integrationRiskPenalty: 0.06,
    }),
    framepackSupportLevel: ["known"],
    sourceRefs: [
      {
        label: "Seedance 2.0 official launch",
        url: "https://seed.bytedance.com/blog/seedance-2-0-official-launch",
        type: "release-notes",
      },
    ],
    lastVerifiedAt: LAST_VERIFIED_AT,
  },
  {
    id: "model.gemini-omni",
    name: "Gemini Omni",
    domain: "generative-media",
    category: "frontier-video-model",
    layer: "model",
    provider: "google-deepmind",
    deliveryModes: ["remote-api", "hosted-product"],
    invocationSurfaces: ["remote-api", "hosted-ui"],
    techniques: ["text-to-video", "image-to-video", "audio-video-reference", "conversational-video-editing"],
    inputContracts: ["text", "image", "audio", "video"],
    outputContracts: ["video-with-audio"],
    verificationContracts: ["asset-exists", "license-policy-check", "visual-review", "runtime-ingest-check"],
    bestUseCases: ["cinematic-source-material", "video-reference-editing", "concept-visualization"],
    notFor: ["local-first-repeatable-rendering", "deterministic-motion-timing"],
    compatibleWith: ["video-runtime.hyperframes"],
    risks: ["Frontier hosted model access and behavior may change; Framepack should treat it as an external source material path."],
    lifecycle: "watch",
    localFirst: false,
    requiresNetwork: true,
    requiresAccount: true,
    requiresApiKey: true,
    agentFriendliness: 0.5,
    verifiability: 0.48,
    creativeRange: 0.94,
    controllability: 0.54,
    operationalCost: 0.72,
    maturity: 0.58,
    score: score({
      agentFriendliness: 0.5,
      verifiability: 0.48,
      creativeRange: 0.94,
      controllability: 0.54,
      operationalCost: 0.72,
      maturity: 0.58,
      localFirst: false,
      integrationRiskPenalty: 0.06,
    }),
    framepackSupportLevel: ["known"],
    sourceRefs: [
      {
        label: "Google DeepMind Gemini Omni",
        url: "https://deepmind.google/models/gemini-omni/",
        type: "official-docs",
      },
      {
        label: "Gemini Omni Flash model card",
        url: "https://deepmind.google/models/model-cards/gemini-omni-flash/",
        type: "model-card",
      },
    ],
    lastVerifiedAt: LAST_VERIFIED_AT,
  },
  {
    id: "model.kling-3-0",
    name: "Kling AI 3.0",
    domain: "generative-media",
    category: "frontier-video-model",
    layer: "model",
    provider: "kuaishou",
    deliveryModes: ["remote-api", "hosted-product"],
    invocationSurfaces: ["remote-api", "hosted-ui"],
    techniques: ["text-to-video", "image-to-video", "audio-video-generation", "video-editing"],
    inputContracts: ["text", "image", "video"],
    outputContracts: ["generated-video", "generated-audio-video"],
    verificationContracts: ["asset-exists", "license-policy-check", "visual-review", "runtime-ingest-check"],
    bestUseCases: ["cinematic-source-material", "marketing-video-reference", "frontier-video-generation"],
    notFor: ["local-first-repeatable-rendering", "deterministic-programmatic-motion"],
    compatibleWith: ["video-runtime.hyperframes"],
    risks: ["Hosted model features, availability, and policy constraints may move faster than package protocol."],
    lifecycle: "watch",
    localFirst: false,
    requiresNetwork: true,
    requiresAccount: true,
    requiresApiKey: true,
    agentFriendliness: 0.48,
    verifiability: 0.46,
    creativeRange: 0.92,
    controllability: 0.52,
    operationalCost: 0.72,
    maturity: 0.56,
    score: score({
      agentFriendliness: 0.48,
      verifiability: 0.46,
      creativeRange: 0.92,
      controllability: 0.52,
      operationalCost: 0.72,
      maturity: 0.56,
      localFirst: false,
      integrationRiskPenalty: 0.06,
    }),
    framepackSupportLevel: ["known"],
    sourceRefs: [
      {
        label: "Kling AI 3.0 launch release",
        url: "https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be",
        type: "release-notes",
      },
    ],
    lastVerifiedAt: LAST_VERIFIED_AT,
  },
];

const RECOMMENDED_CAPABILITY_STACKS: RecommendedCapabilityStack[] = [
  {
    id: "game-ad-sprite-video-stack",
    name: "Game Ad Sprite Video Stack",
    appliesTo: {
      workflowPackIds: ["game-ad-sprite-video"],
      creativeDirectionPackIds: ["game-ad-retro-arcade"],
      outputTypes: ["game-ad"],
      formats: ["9:16", "16:9", "1:1"],
    },
    nodes: [
      {
        capabilityId: "asset-forge.agent-sprite-forge",
        role: "asset-forge",
        required: false,
        alternatives: ["manual.2d-asset-production", "custom.asset-forge"],
      },
      {
        capabilityId: "library.animejs",
        role: "motion",
        required: false,
        alternatives: ["library.pixijs", "video-runtime.hyperframes"],
      },
      {
        capabilityId: "video-runtime.hyperframes",
        role: "composition",
        required: true,
        alternatives: [],
      },
    ],
    rationale: [
      "Sprite video needs 2D asset production before composition.",
      "Programmatic animation can control short loops, UI bursts, and kinetic accents after assets exist.",
      "HyperFrames remains the package runtime and verification body.",
    ],
    acceptanceCriteria: [
      "Forge outputs are transparent assets or explicit external/manual outputs.",
      "Composition passes Framepack validation before preview or render.",
      "Runtime inspect or snapshot evidence exists before visual-ready claims.",
    ],
    riskNotes: [
      "agent-sprite-forge is recommended but not installed automatically.",
      "Programmatic motion should stay compatible with HyperFrames runtime constraints.",
    ],
  },
  {
    id: "web-motion-explainer-stack",
    name: "Web Motion Explainer Stack",
    appliesTo: {
      workflowPackIds: ["product-explainer", "website-to-video"],
      creativeDirectionPackIds: ["clean-saas-explainer", "editorial-proof-story"],
      outputTypes: ["case-explainer", "website-video", "product-explainer"],
      formats: ["16:9", "9:16", "1:1"],
    },
    nodes: [
      {
        capabilityId: "library.animejs",
        role: "motion",
        required: false,
        alternatives: ["css-waapi", "video-runtime.hyperframes"],
      },
      {
        capabilityId: "video-runtime.hyperframes",
        role: "composition",
        required: true,
        alternatives: [],
      },
    ],
    rationale: [
      "Programmatic animation is appropriate for kinetic typography, SVG motion, and restrained product storytelling.",
      "HyperFrames keeps the package inspectable and renderable.",
    ],
    acceptanceCriteria: [
      "Text remains readable and passes runtime inspect when available.",
      "Motion supports the selected creative direction instead of becoming decorative noise.",
      "Snapshots or runtime inspect evidence are captured before handoff.",
    ],
    riskNotes: [
      "Browser animation libraries should be treated as runtime dependencies, not package protocol replacements.",
    ],
  },
];

export function listCapabilityAtlasNodes(): CapabilityAtlasNode[] {
  return CAPABILITY_ATLAS_NODES.map((node) => cloneCapabilityAtlasNode(node));
}

export function getCapabilityAtlasNode(id: string): CapabilityAtlasNode | undefined {
  const node = CAPABILITY_ATLAS_NODES.find((candidate) => candidate.id === id);
  return node ? cloneCapabilityAtlasNode(node) : undefined;
}

function matches(value: string | undefined, candidates: string[]): boolean {
  return Boolean(value && candidates.includes(value));
}

export function listRecommendedCapabilityStacks(): RecommendedCapabilityStack[] {
  return RECOMMENDED_CAPABILITY_STACKS.map((stack) => cloneRecommendedCapabilityStack(stack));
}

function cloneCapabilityAtlasNode(node: CapabilityAtlasNode): CapabilityAtlasNode {
  return {
    ...node,
    deliveryModes: [...node.deliveryModes],
    invocationSurfaces: [...node.invocationSurfaces],
    techniques: [...node.techniques],
    inputContracts: [...node.inputContracts],
    outputContracts: [...node.outputContracts],
    verificationContracts: [...node.verificationContracts],
    bestUseCases: [...node.bestUseCases],
    notFor: [...node.notFor],
    compatibleWith: [...node.compatibleWith],
    risks: [...node.risks],
    framepackSupportLevel: [...node.framepackSupportLevel],
    sourceRefs: node.sourceRefs.map((sourceRef) => ({ ...sourceRef })),
  };
}

function cloneRecommendedCapabilityStack(stack: RecommendedCapabilityStack): RecommendedCapabilityStack {
  return {
    ...stack,
    appliesTo: { ...stack.appliesTo },
    nodes: stack.nodes.map((node) => ({ ...node, alternatives: [...node.alternatives] })),
    rationale: [...stack.rationale],
    acceptanceCriteria: [...stack.acceptanceCriteria],
    riskNotes: [...stack.riskNotes],
  };
}

export function recommendCapabilityStack(input: RecommendCapabilityStackInput): RecommendedCapabilityStack | undefined {
  const normalizedGoal = input.goal?.toLowerCase() ?? "";
  const webMotionRequested =
    normalizedGoal.includes("programmatic") ||
    normalizedGoal.includes("anime") ||
    normalizedGoal.includes("motion") ||
    normalizedGoal.includes("animation");

  const stack =
    RECOMMENDED_CAPABILITY_STACKS.find((candidate) => matches(input.workflowPackId, candidate.appliesTo.workflowPackIds)) ??
    RECOMMENDED_CAPABILITY_STACKS.find((candidate) =>
      matches(input.creativeDirectionPackId, candidate.appliesTo.creativeDirectionPackIds),
    ) ??
    (webMotionRequested
      ? RECOMMENDED_CAPABILITY_STACKS.find((candidate) => candidate.id === "web-motion-explainer-stack")
      : undefined) ??
    RECOMMENDED_CAPABILITY_STACKS.find((candidate) => matches(input.outputType, candidate.appliesTo.outputTypes));

  if (!stack) {
    return undefined;
  }

  return listRecommendedCapabilityStacks().find((candidate) => candidate.id === stack.id);
}
