import type { SourceMaterial, VideoBrief, VideoBriefDefaults } from "../../core/types.js";

const DEFAULT_VIDEO_STYLE = {
  tone: "direct",
  pacing: "medium",
  brandName: "Studio",
} as const;

const DEFAULT_VIDEO_CONSTRAINTS = {
  maxDurationSec: 60,
  requiredPoints: [],
  bannedTerms: [],
} as const;

const SUPPORTED_MARKDOWN_OUTPUT_TYPE = "case-explainer" as const;

function createDefaultVideoStyle(): VideoBrief["style"] {
  return {
    ...DEFAULT_VIDEO_STYLE,
  };
}

function createVideoStyle(overrides?: Partial<VideoBrief["style"]>): VideoBrief["style"] {
  return {
    ...createDefaultVideoStyle(),
    ...overrides,
  };
}

function createDefaultVideoConstraints(): VideoBrief["constraints"] {
  return {
    maxDurationSec: DEFAULT_VIDEO_CONSTRAINTS.maxDurationSec,
    requiredPoints: [...DEFAULT_VIDEO_CONSTRAINTS.requiredPoints],
    bannedTerms: [...DEFAULT_VIDEO_CONSTRAINTS.bannedTerms],
  };
}

function createVideoConstraints(
  overrides?: Partial<VideoBrief["constraints"]>,
): VideoBrief["constraints"] {
  return {
    ...createDefaultVideoConstraints(),
    ...overrides,
    requiredPoints: [...(overrides?.requiredPoints ?? DEFAULT_VIDEO_CONSTRAINTS.requiredPoints)],
    bannedTerms: [...(overrides?.bannedTerms ?? DEFAULT_VIDEO_CONSTRAINTS.bannedTerms)],
  };
}

function compileMarkdownSourceMaterials(
  collectedArtifacts: Array<Record<string, string>>,
): SourceMaterial[] {
  return collectedArtifacts.map((artifact) => ({
    kind: (artifact.kind as SourceMaterial["kind"]) ?? "markdown",
    title: artifact.title ?? "Imported Markdown",
    body: artifact.body ?? "",
  }));
}

export function compileVideoBrief(input: {
  sourceBundle: {
    sourceType: "markdown" | "website" | "prd" | "case";
    collectedArtifacts: Array<Record<string, string>>;
  };
  defaults: VideoBriefDefaults;
}): VideoBrief {
  if (input.sourceBundle.sourceType !== "markdown") {
    throw new Error(`Unsupported source bundle type: ${input.sourceBundle.sourceType}`);
  }

  if (input.defaults.outputType !== SUPPORTED_MARKDOWN_OUTPUT_TYPE) {
    throw new Error("Markdown normalization only supports case-explainer outputType");
  }

  return {
    goal: input.defaults.goal,
    audience: input.defaults.audience,
    format: input.defaults.format,
    style: createVideoStyle(input.defaults.style),
    sourceMaterials: compileMarkdownSourceMaterials(input.sourceBundle.collectedArtifacts),
    constraints: createVideoConstraints(input.defaults.constraints),
    outputType: input.defaults.outputType,
  };
}
