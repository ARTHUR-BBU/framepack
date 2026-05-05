import type { AssetExecutionPlanItem } from "../core/types.js";

export interface ForgeTaskInstruction {
  backend: string;
  skill?: string;
  agentInstruction: string;
  expectedMetadata: {
    status: "available";
    outputs: string[];
  };
  autoExecute: false;
}

function formatList(items?: string[]) {
  return !items || items.length === 0 ? "- None" : items.map((item) => `- ${item}`).join("\n");
}

function createSkillLine(item: AssetExecutionPlanItem) {
  if (item.forgeBackend === "agent-sprite-forge" && item.requiredSkill) {
    return `Use \`$${item.requiredSkill}\` if that skill is installed.`;
  }

  return "Use a manual or custom asset producer that can satisfy this task contract.";
}

export function createForgeTaskInstruction(
  item: AssetExecutionPlanItem,
): ForgeTaskInstruction {
  const backend = item.forgeBackend ?? "manual";
  const skill = item.requiredSkill;
  const agentInstruction = [
    `Asset: ${item.suggestedAsset}`,
    `Backend: ${backend}`,
    createSkillLine(item),
    "",
    "Prompt:",
    item.prompt ?? item.sourceText,
    "",
    "Expected outputs:",
    formatList(item.expectedOutputs),
    "",
    "Style notes:",
    formatList(item.styleNotes),
    "",
    "Acceptance criteria:",
    formatList(item.acceptanceCriteria),
    "",
    `Write files under: ${item.outputPath}`,
    `Write metadata to: ${item.metadataPath}`,
    "Metadata must include `status` and package-relative `outputs` paths.",
  ].join("\n");

  return {
    backend,
    ...(skill ? { skill } : {}),
    agentInstruction,
    expectedMetadata: {
      status: "available",
      outputs: ["<package-relative output paths>"],
    },
    autoExecute: false,
  };
}
