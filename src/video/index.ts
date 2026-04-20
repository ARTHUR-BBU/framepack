import { normalizeVideoBriefInput } from "./brief/normalize.js";
import { compileCompositionSpec } from "./compile/composition-spec.js";
import { createVideoProjectPackage } from "./package/project-package.js";
import { planCaseExplainerScenes } from "./planning/scene-planner.js";
import { validateScenePlan } from "./planning/scene-validators.js";
import { emitHyperframesComposition } from "./render/hyperframes-adapter.js";

export function buildCaseExplainerVideoProject(input: {
  inputType: "markdown";
  markdown: string;
  defaults: {
    goal: string;
    audience: string;
    format: "16:9" | "9:16";
    outputType: "case-explainer";
  };
  projectName: string;
}) {
  const brief = normalizeVideoBriefInput(input);
  const scenePlan = planCaseExplainerScenes(brief);
  const reviewIssues = validateScenePlan(scenePlan, brief.constraints);

  if (reviewIssues.length > 0) {
    throw new Error(`Scene plan validation failed: ${reviewIssues.join(", ")}`);
  }

  const spec = compileCompositionSpec({ ...scenePlan, format: brief.format });
  const composition = emitHyperframesComposition(spec);
  const projectPackage = createVideoProjectPackage({
    projectName: input.projectName,
    brief,
    scenePlan,
    compositionHtml: composition.html,
  });

  return {
    brief,
    scenePlan,
    spec,
    composition,
    package: projectPackage,
  };
}
