import type { VideoBrief } from "../types.js";
import type { VideoBriefInput } from "../types.js";
import { parseMarkdownSourceMaterials } from "./markdown.js";

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

export function normalizeVideoBriefInput(input: VideoBriefInput): VideoBrief {
  switch (input.inputType) {
    case "markdown":
      if (input.defaults.outputType !== SUPPORTED_MARKDOWN_OUTPUT_TYPE) {
        throw new Error("Markdown normalization only supports case-explainer outputType");
      }

      return {
        goal: input.defaults.goal,
        audience: input.defaults.audience,
        format: input.defaults.format,
        style: createVideoStyle(input.defaults.style),
        sourceMaterials: parseMarkdownSourceMaterials(input.markdown),
        constraints: createVideoConstraints(input.defaults.constraints),
        outputType: input.defaults.outputType,
      };
    default:
      throw new Error(`Unsupported video brief input type: ${(input as { inputType: string }).inputType}`);
  }
}
