import type { SourceManifest, VideoBrief } from "../core/types.js";
import { normalizeVideoBriefInput } from "./brief/normalize.js";
import { buildAssetPlan } from "../planning/assets/index.js";
import { buildScript } from "../planning/script/index.js";
import { buildStoryboard } from "../planning/storyboard/index.js";
import { buildCreativePlanningArtifacts } from "../creative/harness.js";
import { buildCompositionProposal } from "../creative/composition-proposal.js";
import { compileCompositionSpec } from "./compile/composition-spec.js";
import { createVideoProjectPackage } from "./package/project-package.js";
import { planCaseExplainerScenes } from "./planning/scene-planner.js";
import { validateScenePlan } from "./planning/scene-validators.js";
import { emitHyperframesComposition } from "./render/hyperframes-adapter.js";
import { createValidationReport } from "./validation/validation-report.js";

interface CaseExplainerDefaults {
  goal: string;
  audience: string;
  format: "16:9" | "9:16";
  outputType: "case-explainer";
  style?: {
    tone?: string;
    pacing?: "slow" | "medium" | "fast";
    brandName?: string;
  };
  constraints?: {
    maxDurationSec?: number;
    requiredPoints?: string[];
    bannedTerms?: string[];
  };
  theme?: {
    palette: string;
  };
}

function buildCaseExplainerVideoProjectFromBrief(input: {
  brief: VideoBrief;
  projectName: string;
  defaults: CaseExplainerDefaults;
  sourceManifest?: SourceManifest;
}) {
  const brief = input.brief;
  const scenePlan = planCaseExplainerScenes(brief);
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
  const assetPlan = buildAssetPlan({
    scenePlan,
    sourceManifest: input.sourceManifest,
  });
  const reviewIssues = validateScenePlan(scenePlan, brief.constraints);
  const validationReport = createValidationReport({
    projectName: input.projectName,
    scenePlan,
    issues: reviewIssues,
  });
  const spec = compileCompositionSpec({
    ...scenePlan,
    format: brief.format,
    themePalette: input.defaults.theme?.palette,
    compositionProposal,
  });
  const composition = emitHyperframesComposition(spec);
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
    sourceManifest: input.sourceManifest,
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

export function buildCaseExplainerVideoProject(input: {
  inputType: "markdown";
  markdown: string;
  defaults: CaseExplainerDefaults;
  projectName: string;
}) {
  const brief = normalizeVideoBriefInput(input);

  return buildCaseExplainerVideoProjectFromBrief({
    brief,
    projectName: input.projectName,
    defaults: input.defaults,
  });
}

export function buildCaseExplainerVideoProjectFromCompiledBrief(input: {
  brief: VideoBrief;
  defaults: CaseExplainerDefaults;
  projectName: string;
  sourceManifest?: SourceManifest;
}) {
  return buildCaseExplainerVideoProjectFromBrief(input);
}

export function ensureValidationPassed(validationReport: { issues: string[] }) {
  if (validationReport.issues.length > 0) {
    throw new Error(`Validation failed: ${validationReport.issues.join(", ")}`);
  }
}
