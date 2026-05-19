export type CapabilityKind =
  | "runtime"
  | "library"
  | "cli"
  | "mcp-tool"
  | "skill"
  | "remote-api"
  | "manual";

export type CapabilityDelivery =
  | "npm-local"
  | "cdn-runtime"
  | "cli-local"
  | "mcp-tool"
  | "remote-api"
  | "codex-skill"
  | "manual-external";

export type CapabilityStatus =
  | "available"
  | "planned"
  | "not-detected"
  | "external"
  | "blocked";

export interface CapabilityNode {
  id: string;
  kind: CapabilityKind;
  provider: string;
  delivery: CapabilityDelivery;
  required: boolean;
  status: CapabilityStatus;
  usedBy: string[];
}

export interface CapabilityEdge {
  from: string;
  to: string;
  reason: string;
}

export interface CapabilityGraph {
  version: "framepack.capability-graph.v1";
  nodes: CapabilityNode[];
  edges: CapabilityEdge[];
}

export interface BuildCapabilityGraphInput {
  sourceType: string;
  outputType: string;
  executionKinds: string[];
  forgeBackends: string[];
  requiredSkills: string[];
  runtimeBackend: "hyperframes";
  packageCommands: string[];
}

export function buildCapabilityGraph(input: BuildCapabilityGraphInput): CapabilityGraph {
  const forgeExecutionKinds = [...new Set(input.executionKinds.filter((kind) => kind.startsWith("forge-")))];
  const forgeBackends = [...new Set(input.forgeBackends)];
  const requiredSkills = [...new Set(input.requiredSkills)];
  const runtimeNodeId = "video-runtime.hyperframes";
  const nodes: CapabilityNode[] = [
    {
      id: runtimeNodeId,
      kind: "runtime",
      provider: input.runtimeBackend,
      delivery: "npm-local",
      required: true,
      status: "available",
      usedBy: input.packageCommands,
    },
    {
      id: "mcp.framepack",
      kind: "mcp-tool",
      provider: "framepack",
      delivery: "mcp-tool",
      required: false,
      status: "available",
      usedBy: ["generateProject", "getStatus", "validatePackage"],
    },
  ];

  for (const backend of forgeBackends) {
    nodes.push({
      id: `asset-forge.${backend}`,
      kind: "skill",
      provider: backend,
      delivery: backend === "agent-sprite-forge" ? "codex-skill" : "manual-external",
      required: false,
      status: "not-detected",
      usedBy: forgeExecutionKinds,
    });
  }

  for (const skill of requiredSkills) {
    nodes.push({
      id: `skill.${skill}`,
      kind: "skill",
      provider: skill,
      delivery: "codex-skill",
      required: false,
      status: "not-detected",
      usedBy: forgeExecutionKinds,
    });
  }

  return {
    version: "framepack.capability-graph.v1",
    nodes,
    edges: nodes
      .filter((node) => node.id !== runtimeNodeId)
      .map((node) => ({
        from: node.id,
        to: runtimeNodeId,
        reason: `${node.id} supports ${input.outputType} package production before HyperFrames runtime verification.`,
      })),
  };
}
