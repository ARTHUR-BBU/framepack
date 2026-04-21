import type { AssetPlan, Script, Storyboard, ValidationReport, VideoBrief } from "../core/types.js";

function formatList(items: string[]): string {
  return items.length === 0 ? "- None" : items.map((item) => `- ${item}`).join("\n");
}

export function formatGuardrailsMarkdown(input: {
  brief: VideoBrief;
  validationReport: ValidationReport;
}): string {
  return [
    "# Guardrails",
    "",
    `Max duration: ${input.brief.constraints.maxDurationSec}s`,
    "",
    "Required points:",
    formatList(input.brief.constraints.requiredPoints),
    "",
    "Banned terms:",
    formatList(input.brief.constraints.bannedTerms),
    "",
    `Latest validation: ${input.validationReport.status}`,
    "",
    "Latest issues:",
    formatList(input.validationReport.issues),
    "",
  ].join("\n");
}

export function formatScriptMarkdown(script: Script): string {
  const sections =
    script.scenes.length === 0
      ? ["- None"]
      : script.scenes.flatMap((scene) => [
          `## ${scene.sceneId}`,
          "",
          "Voiceover:",
          formatList(scene.voiceoverLines),
          "",
          "Captions:",
          formatList(scene.captionLines),
          "",
        ]);

  return ["# Script", "", ...sections, ""].join("\n");
}

export function formatStoryboardMarkdown(storyboard: Storyboard): string {
  const sections =
    storyboard.scenes.length === 0
      ? ["- None"]
      : storyboard.scenes.flatMap((scene) => [
          `## ${scene.sceneId}`,
          "",
          `Visual intent: ${scene.visualIntent}`,
          `Motion note: ${scene.motionNote}`,
          `Transition note: ${scene.transitionNote}`,
          "",
        ]);

  return ["# Storyboard", "", ...sections, ""].join("\n");
}

export function formatHandoffMarkdown(input: {
  brief: VideoBrief;
  validationReport: ValidationReport;
  assetPlan: AssetPlan;
}): string {
  return [
    "# Handoff",
    "",
    `Audience: ${input.brief.audience}`,
    `Validation status: ${input.validationReport.status}`,
    "",
    "Missing assets:",
    formatList(input.assetPlan.missingAssets),
    "",
  ].join("\n");
}
