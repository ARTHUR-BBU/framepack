import { normalizeVideoBriefInput } from "./brief/normalize.js";
import { buildAssetPlan } from "../planning/assets/index.js";
import { buildScript } from "../planning/script/index.js";
import { buildStoryboard } from "../planning/storyboard/index.js";
import { compileCompositionSpec } from "./compile/composition-spec.js";
import { createVideoProjectPackage } from "./package/project-package.js";
import { planCaseExplainerScenes } from "./planning/scene-planner.js";
import { validateScenePlan } from "./planning/scene-validators.js";
import { emitHyperframesComposition } from "./render/hyperframes-adapter.js";
import { createValidationReport } from "./validation/validation-report.js";

export function buildCaseExplainerVideoProject(input: {
  inputType: "markdown";
  markdown: string;
  defaults: {
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
  };
  projectName: string;
}) {
  const brief = normalizeVideoBriefInput(input);
  const scenePlan = planCaseExplainerScenes(brief);
  const script = buildScript({ scenePlan });
  const storyboard = buildStoryboard({ scenePlan });
  const assetPlan = buildAssetPlan({ scenePlan });
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
  });
  const composition = emitHyperframesComposition(spec);
  const projectPackage = createVideoProjectPackage({
    projectName: input.projectName,
    brief,
    scenePlan,
    validationReport,
    compositionHtml: composition.html,
  });

  return {
    brief,
    scenePlan,
    script,
    storyboard,
    assetPlan,
    validationReport,
    spec,
    composition,
    package: projectPackage,
  };
}

export function ensureValidationPassed(validationReport: { issues: string[] }) {
  if (validationReport.issues.length > 0) {
    throw new Error(`Validation failed: ${validationReport.issues.join(", ")}`);
  }
}
