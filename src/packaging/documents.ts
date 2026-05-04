import type { AssetPlan, Script, Storyboard, ValidationReport, VideoBrief } from "../core/types.js";
import type { HyperframesCommandSpec, RuntimeCapabilities } from "../runtime/hyperframes/types.js";

function formatList(items: string[]): string {
  return items.length === 0 ? "- None" : items.map((item) => `- ${item}`).join("\n");
}

function formatForgeTargetList(input: AssetPlan): string {
  const forgeTargets = input.forgeTargets ?? [];

  if (forgeTargets.length === 0) {
    return "- None";
  }

  return forgeTargets
    .map((target) => {
      const qualifiers = [
        target.executionKind,
        target.requiredSkill,
        target.forgeBackend,
      ].filter(Boolean);

      return `${target.sourceLabel} -> ${target.suggestedAsset} (${target.recommendedSceneIds.join(", ")}) [${qualifiers.join(" / ")}]`;
    })
    .map((line) => `- ${line}`)
    .join("\n");
}

function formatForgeGuidance(input: AssetPlan): string {
  const forgeTargets = input.forgeTargets ?? [];

  if (forgeTargets.length === 0) {
    return "- None";
  }

  const hasAgentSpriteForgeTargets = forgeTargets.some(
    (target) => target.forgeBackend === "agent-sprite-forge",
  );
  const guidance = [
    "- Use the task prompts, expected outputs, recommended scene IDs, style notes, and acceptance criteria in `ASSET_EXECUTION_PLAN.json`.",
    "- Framepack only defines the task contract; it does not install or run an image generator.",
  ];

  if (hasAgentSpriteForgeTargets) {
    guidance.unshift(
      "- If agent-sprite-forge skills are installed, use `$generate2dsprite` for character, sprite, prop, and FX packs.",
      "- Use `$generate2dmap` for map/background packs.",
    );
  }

  return guidance.join("\n");
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
  runtimeAvailable: boolean;
  runtimeBinary: string;
  runtimeFallbackNotes: string[];
}): string {
  return [
    "# Handoff",
    "",
    `Audience: ${input.brief.audience}`,
    `Validation status: ${input.validationReport.status}`,
    `Runtime available: ${input.runtimeAvailable}`,
    `Runtime binary: ${input.runtimeBinary}`,
    "",
    "Missing assets:",
    formatList(input.assetPlan.missingAssets),
    "",
    "Capture targets:",
    formatList(
      (input.assetPlan.captureTargets ?? []).map(
        (target) =>
          `${target.sectionTitle} -> ${target.suggestedAsset} (${target.recommendedSceneIds.join(", ")}) [${target.purposeTag} / ${target.assetForm}]`,
      ),
    ),
    "",
    "Asset forge tasks:",
    formatForgeTargetList(input.assetPlan),
    "",
    "Forge guidance:",
    formatForgeGuidance(input.assetPlan),
    "",
    "Scene asset map:",
    "- See `SCENE_ASSET_MAP.json` for scene-first and capture-first lookup.",
    "",
    "Source scene map:",
    "- See `SOURCE_SCENE_MAP.json` for source-first and scene-first source linkage.",
    "",
    "Asset execution:",
    "- See `ASSET_EXECUTION_PLAN.json` for expected output paths, execution kinds, and sync status.",
    "",
    "Runtime guidance:",
    formatList(
      input.runtimeAvailable
        ? ["Run `framepack preview --project-dir <path>` or `framepack render --project-dir <path>`."]
        : input.runtimeFallbackNotes,
    ),
    "",
  ].join("\n");
}

export function formatRuntimeCommandsMarkdown(input: {
  capabilities: RuntimeCapabilities;
  commands: HyperframesCommandSpec[];
}): string {
  const commandLines =
    input.commands.length === 0
      ? ["- None"]
      : input.commands.flatMap((command) => [
          `## ${command.action}`,
          "",
          `- Executable: ${command.executable}`,
          `- CWD: ${command.cwd}`,
          `- Command: ${command.summary}`,
          "",
        ]);

  return [
    "# Runtime Commands",
    "",
    `Runtime available: ${input.capabilities.available}`,
    `Binary: ${input.capabilities.binary}`,
    `Detected at: ${input.capabilities.detectedAt}`,
    `Version: ${input.capabilities.version}`,
    "",
    "Fallback notes:",
    formatList(input.capabilities.fallbackNotes),
    "",
    ...commandLines,
    "",
  ].join("\n");
}
