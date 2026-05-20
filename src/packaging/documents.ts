import type { AssetPlan, Script, Storyboard, ValidationReport, VideoBrief } from "../core/types.js";
import { createForgeTaskInstruction } from "../forge/adapter.js";
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
      "- Recommended backend: agent-sprite-forge.",
      "- Install or enable the agent-sprite-forge skills when you want Codex to produce the referenced 2D sprites, maps, props, and FX assets.",
      "- If agent-sprite-forge skills are installed, use `$generate2dsprite` for character, sprite, prop, and FX packs.",
      "- Use `$generate2dmap` for map/background packs.",
    );
  }

  guidance.push(
    "- Framepack does not install external skills automatically.",
    "- You may also produce these assets manually, use a custom forge backend, or reuse existing assets as long as outputs and metadata match the task contract.",
  );

  return guidance.join("\n");
}

function formatPackSelection(input: VideoBrief): string {
  const selection = input.packSelection;

  if (!selection) {
    return "- None";
  }

  const lines = [
    selection.workflowPackId
      ? `- Workflow pack: ${selection.workflowPackId}${selection.workflowPackLabel ? ` (${selection.workflowPackLabel})` : ""}`
      : undefined,
    selection.creativeDirectionPackId
      ? `- Creative direction pack: ${selection.creativeDirectionPackId}${selection.creativeDirectionPackLabel ? ` (${selection.creativeDirectionPackLabel})` : ""}`
      : undefined,
    ...selection.agentInstructions.map((item) => `- Agent instruction: ${item}`),
    ...selection.visualLanguage.map((item) => `- Visual language: ${item}`),
    ...selection.motionLanguage.map((item) => `- Motion language: ${item}`),
    ...selection.templateGuidance.map((item) => `- Template guidance: ${item}`),
    ...selection.acceptanceCriteria.map((item) => `- Acceptance criterion: ${item}`),
  ].filter((line): line is string => line !== undefined);

  return lines.length === 0 ? "- None" : lines.join("\n");
}

function formatCapabilityStackSelection(input: VideoBrief): string {
  const selection = input.capabilityStackSelection;

  if (!selection) {
    return "- None";
  }

  return [
    `- Capability stack: ${selection.id} (${selection.name})`,
    ...selection.nodes.map(
      (node) =>
        `- Capability: ${node.capabilityId} [${node.role}${node.required ? " / required" : ""}]`,
    ),
    ...selection.rationale.map((item) => `- Rationale: ${item}`),
    ...selection.acceptanceCriteria.map((item) => `- Acceptance criterion: ${item}`),
    ...selection.riskNotes.map((item) => `- Risk note: ${item}`),
  ].join("\n");
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
    "Pack selection:",
    formatPackSelection(input.brief),
    "",
    "Capability stack:",
    formatCapabilityStackSelection(input.brief),
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
    "- See `SCENE_ASSET_MAP.json` for scene-first `recommendedAssets`, top-level `assets`, and compatibility capture lookup.",
    "",
    "Source scene map:",
    "- See `SOURCE_SCENE_MAP.json` for source-first and scene-first source linkage.",
    "",
    "Asset execution:",
    "- See `ASSET_EXECUTION_PLAN.json` for expected output paths, execution kinds, and sync status.",
    "",
    "Package lifecycle guidance:",
    formatList([
      "Run `framepack validate --project-dir <path>` after package edits to check protocol alignment.",
      "Run `framepack repair --project-dir <path>` only when derived protocol files drift from the source JSON.",
      "`repair` rebuilds package indexes and scene/source asset maps; it does not generate assets, capture screenshots, execute forge tasks, or install skills.",
      "Run `framepack sync-assets --project-dir <path>` after manual, capture, or forge asset work to sync pending/available state.",
    ]),
    "",
    "Runtime guidance:",
    formatList(
      [
        "Run `framepack runtime doctor --project-dir <path>` before preview or render.",
        "Run `framepack runtime lint --project-dir <path>` to validate HyperFrames composition mistakes.",
        "Run `framepack runtime inspect --project-dir <path>` to check visual layout and text overflow across the timeline.",
        "Run `framepack runtime snapshot --project-dir <path>` to capture PNG key frames for visual verification.",
        "Run `framepack runtime upgrade-check` explicitly when you want to check HyperFrames updates.",
        ...(input.runtimeAvailable
          ? ["Run `framepack preview --project-dir <path>` or `framepack render --project-dir <path>`."]
          : input.runtimeFallbackNotes),
      ],
    ),
    "",
  ].join("\n");
}

export function formatForgeTasksMarkdown(assetPlan: AssetPlan): string {
  const forgeTargets = assetPlan.forgeTargets ?? [];

  if (forgeTargets.length === 0) {
    return ["# Forge Tasks", "", "- None", ""].join("\n");
  }

  const hasAgentSpriteForgeTargets = forgeTargets.some(
    (target) => target.forgeBackend === "agent-sprite-forge",
  );
  const backendGuidance = hasAgentSpriteForgeTargets
    ? [
        "Recommended backend: agent-sprite-forge.",
        "Install or enable the agent-sprite-forge skills to let Codex use `$generate2dsprite` and `$generate2dmap` for these tasks.",
        "Manual or custom backends are valid if they produce the declared outputs and metadata.",
        "Framepack does not install external skills automatically.",
      ]
    : [
        "Use the declared backend, a manual workflow, a custom forge, or existing assets that satisfy each task contract.",
      ];

  const sections = forgeTargets.flatMap((target) => {
    const instruction = createForgeTaskInstruction({
      suggestedAsset: target.suggestedAsset,
      sourceType: "game-ad",
      sourceLabel: target.sourceLabel,
      sourceText: target.sourceText,
      executionKind: target.executionKind,
      assetForm: target.assetForm,
      recommendedSceneIds: [...target.recommendedSceneIds],
      rationale: target.rationale,
      ...(target.forgeBackend ? { forgeBackend: target.forgeBackend } : {}),
      ...(target.requiredSkill ? { requiredSkill: target.requiredSkill } : {}),
      expectedOutputs: [...target.expectedOutputs],
      prompt: target.prompt,
      styleNotes: [...target.styleNotes],
      acceptanceCriteria: [...target.acceptanceCriteria],
      outputPath: `assets/forge/${target.suggestedAsset}`,
      metadataPath: `assets/forge/${target.suggestedAsset}.json`,
      status: assetPlan.availableAssets.includes(target.suggestedAsset) ? "available" : "pending",
    });

    return [
      `## ${target.suggestedAsset}`,
      "",
      instruction.agentInstruction,
      "",
    ];
  });

  return ["# Forge Tasks", "", ...backendGuidance, "", ...sections, ""].join("\n");
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
    "# Package Lifecycle Commands",
    "",
    "Validate package protocol alignment:",
    "",
    "- Command: framepack validate --project-dir <path>",
    "",
    "Repair derived protocol files after manual edits or older package drift:",
    "",
    "- Command: framepack repair --project-dir <path>",
    "- Scope: repair derived protocol files only; it does not generate assets or execute forge tasks.",
    "",
    "Sync materialized asset state after capture, manual production, or forge work:",
    "",
    "- Command: framepack sync-assets --project-dir <path>",
    "",
    "Validate HyperFrames composition mistakes:",
    "",
    "- Command: framepack runtime lint --project-dir <path>",
    "",
    "Inspect visual layout and text overflow across the timeline:",
    "",
    "- Command: framepack runtime inspect --project-dir <path>",
    "",
    "Capture PNG key frames for visual verification:",
    "",
    "- Command: framepack runtime snapshot --project-dir <path>",
    "",
    "Check HyperFrames updates explicitly:",
    "",
    "- Command: framepack runtime upgrade-check",
    "- Scope: explicit runtime update check only; Framepack status and validation do not run network upgrade checks.",
    "",
    "Publish boundary:",
    "",
    "- publish exists in HyperFrames 0.5.5, but Framepack 0.2 does not orchestrate it because it uploads externally and returns a public URL.",
    "",
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
