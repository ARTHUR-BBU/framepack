import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  CapabilityDelivery,
  CapabilityGraph,
  CapabilityNode,
  CapabilityStatus,
} from "./capability-graph.js";
import {
  listFramepackCreativeDirectionPacks,
  listFramepackWorkflowPacks,
} from "../workflow-packs/registry.js";

const CAPABILITY_GRAPH_VERSION = "framepack.capability-graph.v1";

export interface CapabilityGraphSummary {
  present: boolean;
  version?: CapabilityGraph["version"];
  error?: string;
  totalNodes: number;
  nodeIds: string[];
  gapNodeIds: string[];
  byStatus: Record<CapabilityStatus, number>;
  byDelivery: Record<CapabilityDelivery, number>;
}

export interface CommonTechStatus {
  name: string;
  inCapabilityGraph: boolean;
  matchedNodeId?: string;
  delivery?: CapabilityDelivery;
  status?: CapabilityStatus;
  possibleDelivery?: CapabilityDelivery;
  alternativeInArsenal?: string;
  riskNote?: string;
}

export interface ArsenalExposure {
  userRawInput: string;
  agentBoundary: string;
  workflowPacks: ReturnType<typeof listFramepackWorkflowPacks>;
  creativeDirectionPacks: ReturnType<typeof listFramepackCreativeDirectionPacks>;
  capabilityGraph: CapabilityGraphSummary;
  commonTechStatus: CommonTechStatus[];
}

function createStatusCounts(): Record<CapabilityStatus, number> {
  return {
    available: 0,
    planned: 0,
    "not-detected": 0,
    external: 0,
    blocked: 0,
  };
}

function createDeliveryCounts(): Record<CapabilityDelivery, number> {
  return {
    "npm-local": 0,
    "cdn-runtime": 0,
    "cli-local": 0,
    "mcp-tool": 0,
    "remote-api": 0,
    "codex-skill": 0,
    "manual-external": 0,
  };
}

export function summarizeCapabilityGraph(graph?: CapabilityGraph): CapabilityGraphSummary {
  const byStatus = createStatusCounts();
  const byDelivery = createDeliveryCounts();

  if (!graph) {
    return {
      present: false,
      totalNodes: 0,
      nodeIds: [],
      gapNodeIds: [],
      byStatus,
      byDelivery,
    };
  }

  for (const node of graph.nodes) {
    byStatus[node.status] += 1;
    byDelivery[node.delivery] += 1;
  }

  return {
    present: true,
    version: graph.version,
    totalNodes: graph.nodes.length,
    nodeIds: graph.nodes.map((node) => node.id).sort(),
    gapNodeIds: graph.nodes
      .filter((node) => node.status === "not-detected" || node.status === "blocked")
      .map((node) => node.id)
      .sort(),
    byStatus,
    byDelivery,
  };
}

export function readCapabilityGraph(projectDir: string): CapabilityGraph | undefined {
  const graphPath = resolve(projectDir, "CAPABILITY_GRAPH.json");

  if (!existsSync(graphPath)) {
    return undefined;
  }

  const graph = JSON.parse(readFileSync(graphPath, "utf8")) as CapabilityGraph;

  if (
    graph.version !== CAPABILITY_GRAPH_VERSION ||
    !Array.isArray(graph.nodes) ||
    !Array.isArray(graph.edges)
  ) {
    throw new Error("CAPABILITY_GRAPH.json is not a framepack.capability-graph.v1 graph.");
  }

  return graph;
}

export function summarizeCapabilityGraphFile(projectDir: string): CapabilityGraphSummary {
  const graphPath = resolve(projectDir, "CAPABILITY_GRAPH.json");

  if (!existsSync(graphPath)) {
    return summarizeCapabilityGraph();
  }

  try {
    return summarizeCapabilityGraph(readCapabilityGraph(projectDir));
  } catch (error) {
    return {
      ...summarizeCapabilityGraph(),
      present: true,
      error: `CAPABILITY_GRAPH.json: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function findCapabilityNode(graph: CapabilityGraph | undefined, names: string[]): CapabilityNode | undefined {
  if (!graph) {
    return undefined;
  }

  const normalizedNames = names.map((name) => name.toLowerCase());

  return graph.nodes.find((node) => {
    const haystack = `${node.id} ${node.provider}`.toLowerCase();
    return normalizedNames.some((name) => haystack.includes(name));
  });
}

function createCommonTechStatus(graph: CapabilityGraph | undefined): CommonTechStatus[] {
  const knownTech = [
    {
      name: "Three.js",
      aliases: ["three.js", "threejs", "three"],
      possibleDelivery: "npm-local" as const,
      alternativeInArsenal: "video-runtime.hyperframes",
      riskNote: "Three.js is not part of the default HyperFrames package contract; custom runtime integration may be needed.",
    },
    {
      name: "GSAP",
      aliases: ["gsap"],
      possibleDelivery: "npm-local" as const,
      alternativeInArsenal: "video-runtime.hyperframes",
      riskNote: "GSAP can be added as a local library, but Framepack motion grammar should remain the package-level contract.",
    },
    {
      name: "Anime.js",
      aliases: ["anime.js", "animejs"],
      possibleDelivery: "npm-local" as const,
      alternativeInArsenal: "video-runtime.hyperframes",
      riskNote: "Anime.js is an optional library and should not replace Framepack package contracts.",
    },
    {
      name: "PixiJS",
      aliases: ["pixijs", "pixi.js", "pixi"],
      possibleDelivery: "npm-local" as const,
      alternativeInArsenal: "asset-forge.agent-sprite-forge",
      riskNote: "PixiJS may be useful for custom 2D runtime work, while forge tasks stay backend-neutral.",
    },
    {
      name: "agent-sprite-forge",
      aliases: ["agent-sprite-forge"],
      possibleDelivery: "codex-skill" as const,
      alternativeInArsenal: "manual asset production",
      riskNote: "Framepack recommends the backend for 2D assets but does not install it automatically.",
    },
  ];

  return knownTech.map((tech) => {
    const node = findCapabilityNode(graph, tech.aliases);

    return {
      name: tech.name,
      inCapabilityGraph: Boolean(node),
      matchedNodeId: node?.id,
      delivery: node?.delivery,
      status: node?.status,
      possibleDelivery: tech.possibleDelivery,
      alternativeInArsenal: tech.alternativeInArsenal,
      riskNote: tech.riskNote,
    };
  });
}

export function exposeFramepackArsenal(input: {
  userRawInput?: string;
  projectDir?: string;
} = {}): ArsenalExposure {
  const graph = input.projectDir ? readCapabilityGraph(input.projectDir) : undefined;

  return {
    userRawInput: input.userRawInput ?? "",
    agentBoundary:
      "Framepack exposes context, capabilities, constraints, and execution surfaces; the coding agent remains responsible for creative interpretation and final decisions.",
    workflowPacks: listFramepackWorkflowPacks(),
    creativeDirectionPacks: listFramepackCreativeDirectionPacks(),
    capabilityGraph: summarizeCapabilityGraph(graph),
    commonTechStatus: createCommonTechStatus(graph),
  };
}
