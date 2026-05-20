import { describeFramepackPackRegistry } from "../workflow-packs/registry.js";

export const FRAMEPACK_MCP_TOOLS = [
  "generateProject",
  "getStatus",
  "getCapabilityGraph",
  "explainCapabilityGaps",
  "exposeArsenal",
  "validatePackage",
  "repairPackage",
  "captureAssets",
  "syncAssets",
  "runtimeDoctor",
  "runtimeLint",
  "runtimeInspect",
  "runtimeSnapshot",
  "explainNextActions",
  "listWorkflowPacks",
  "getWorkflowPack",
  "listCreativeDirectionPacks",
  "getCreativeDirectionPack",
  "recommendPacks",
  "releaseSmoke",
] as const;

export const FRAMEPACK_MCP_RESOURCES = [
  "framepack://packs/workflows",
  "framepack://packs/creative-directions",
  "framepack://project/{projectName}/manifest",
  "framepack://project/{projectName}/handoff",
  "framepack://project/{projectName}/asset-execution-plan",
  "framepack://project/{projectName}/capability-graph",
  "framepack://project/{projectName}/forge-tasks",
  "framepack://project/{projectName}/status",
] as const;

export const FRAMEPACK_MCP_PROMPTS = [
  "create-video-from-markdown",
  "create-video-from-thread",
  "create-video-from-website",
  "create-game-ad-video",
  "continue-framepack-project",
  "materialize-framepack-assets",
  "prepare-hyperframes-render",
] as const;

export function describeFramepackMcpSurface(): string {
  return [
    "Framepack MCP surface",
    "",
    "Tools:",
    ...FRAMEPACK_MCP_TOOLS.map((tool) => `- ${tool}`),
    "",
    "Resources:",
    ...FRAMEPACK_MCP_RESOURCES.map((resource) => `- ${resource}`),
    "",
    "Prompts:",
    ...FRAMEPACK_MCP_PROMPTS.map((prompt) => `- ${prompt}`),
    "",
    describeFramepackPackRegistry(),
  ].join("\n");
}
