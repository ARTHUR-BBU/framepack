import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  exposeFramepackArsenal,
  readCapabilityGraph,
  summarizeCapabilityGraph,
} from "../capabilities/arsenal.js";
import { materializeProjectAssets } from "../capture/index.js";
import { ensureProjectValidationPassed } from "../compiler/index.js";
import { compileVideoProjectFromSource, type CompilerSourceInput } from "../compiler/pipeline-registry.js";
import { runFramepackReleaseSmoke } from "../release-smoke.js";
import { syncAssetExecutionProject } from "../packaging/asset-execution.js";
import { getProjectPackageStatus } from "../packaging/package-status.js";
import { repairProjectPackage } from "../packaging/package-repair.js";
import { validateProjectPackage, writeProjectPackageValidationReport } from "../packaging/package-validation.js";
import { createHyperframesRuntimeAdapter, detectHyperframesCapabilities } from "../runtime/hyperframes/adapter.js";
import { executeHyperframesCommand } from "../runtime/hyperframes/execution.js";
import { writeVideoProjectPackage } from "../video/package/project-package.js";
import {
  getFramepackCreativeDirectionPack,
  getFramepackWorkflowPack,
  listFramepackCreativeDirectionPacks,
  listFramepackWorkflowPacks,
  recommendFramepackPacks,
  resolveFramepackPackSelection,
} from "../workflow-packs/registry.js";

type SourceType = "markdown" | "thread" | "website" | "game-ad";

function textJson(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function sourceInput(input: {
  sourceType: SourceType;
  inputPath?: string;
  threadFile?: string;
  url?: string;
  gameAdDescription?: string;
}): CompilerSourceInput {
  if (input.sourceType === "game-ad") {
    return {
      sourceType: "game-ad",
      description: input.gameAdDescription ?? "",
    };
  }

  if (input.sourceType === "website") {
    return {
      sourceType: "website",
      url: input.url ?? "",
    };
  }

  if (input.sourceType === "thread") {
    return {
      sourceType: "thread",
      text: readFileSync(resolve(input.threadFile ?? input.inputPath ?? ""), "utf8"),
    };
  }

  return {
    sourceType: "markdown",
    markdown: readFileSync(resolve(input.inputPath ?? ""), "utf8"),
  };
}

function runtimeAction(action: "lint" | "inspect" | "snapshot", projectDir: string, passthroughArgs: string[] = []) {
  const capabilities = detectHyperframesCapabilities();

  if (!capabilities.available) {
    return {
      success: false,
      error: capabilities.fallbackNotes.join(" | "),
    };
  }

  const meta = JSON.parse(readFileSync(resolve(projectDir, "meta.json"), "utf8")) as {
    rootEntry: string;
    compositionDirectory: string;
    assetDirectory: string;
  };
  const runtimeAdapter = createHyperframesRuntimeAdapter();
  const command = runtimeAdapter.buildCommand({
    action,
    packageDirectory: resolve(projectDir),
    packageRuntimeInfo: meta,
    capabilities,
    passthroughArgs,
  });
  const result = executeHyperframesCommand({
    command,
  });

  return {
    success: result.success,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    summary: result.summary,
  };
}

function readProjectFile(projectName: string, fileName: string): string {
  return readFileSync(resolve("out", projectName, fileName), "utf8");
}

export function createFramepackMcpServer(): McpServer {
  const server = new McpServer({
    name: "framepack",
    version: "0.3.0-agent-platform",
  });

  server.registerTool(
    "generateProject",
    {
      description: "Generate a Framepack video project package.",
      inputSchema: {
        sourceType: z.enum(["markdown", "thread", "website", "game-ad"]),
        inputPath: z.string().optional(),
        threadFile: z.string().optional(),
        url: z.string().optional(),
        gameAdDescription: z.string().optional(),
        outputDir: z.string(),
        goal: z.string(),
        audience: z.string(),
        projectName: z.string(),
        format: z.enum(["16:9", "9:16"]).default("16:9"),
        workflowPackId: z.string().optional(),
        creativeDirectionPackId: z.string().optional(),
        autoRecommendPacks: z.boolean().optional(),
      },
    },
    async (input) => {
      const outputType = input.sourceType === "game-ad" ? "game-ad" : "case-explainer";
      const packSelection = resolveFramepackPackSelection({
        workflowPackId: input.workflowPackId,
        creativeDirectionPackId: input.creativeDirectionPackId,
        autoRecommendPacks: input.autoRecommendPacks,
        sourceType: input.sourceType,
        outputType,
        goal: input.goal,
        audience: input.audience,
        format: input.format,
      });
      const result = await compileVideoProjectFromSource({
        source: sourceInput(input),
        defaults: {
          goal: input.goal,
          audience: input.audience,
          format: input.format,
          outputType,
          packSelection,
        },
        projectName: input.projectName,
      });
      ensureProjectValidationPassed(result.validationReport);
      const projectDir = writeVideoProjectPackage(input.outputDir, result.package);

      return textJson({
        projectDir,
        validationStatus: result.validationReport.status,
        sceneCount: result.scenePlan.scenes.length,
      });
    },
  );

  server.registerTool(
    "getStatus",
    {
      description: "Read structured Framepack package status.",
      inputSchema: {
        projectDir: z.string(),
      },
    },
    (input) => textJson(getProjectPackageStatus({ projectDir: resolve(input.projectDir) })),
  );

  server.registerTool(
    "getCapabilityGraph",
    {
      description: "Read a package capability graph and an agent-friendly summary.",
      inputSchema: {
        projectDir: z.string(),
      },
    },
    (input) => {
      const projectDir = resolve(input.projectDir);
      const graph = readCapabilityGraph(projectDir);

      return textJson({
        projectDir,
        summary: summarizeCapabilityGraph(graph),
        graph,
      });
    },
  );

  server.registerTool(
    "explainCapabilityGaps",
    {
      description: "List missing or blocked capability nodes with conservative next actions.",
      inputSchema: {
        projectDir: z.string(),
      },
    },
    (input) => {
      const projectDir = resolve(input.projectDir);
      const graph = readCapabilityGraph(projectDir);
      const gapNodes =
        graph?.nodes.filter((node) => node.status === "not-detected" || node.status === "blocked") ?? [];

      return textJson({
        projectDir,
        summary: summarizeCapabilityGraph(graph),
        gapNodes,
        nextActions: gapNodes.map((node) => ({
          nodeId: node.id,
          action:
            node.delivery === "codex-skill"
              ? "Enable or install the referenced Codex skill, or route the work to manual/custom production."
              : "Run the relevant doctor/validation command or provide the capability externally.",
        })),
      });
    },
  );

  server.registerTool(
    "exposeArsenal",
    {
      description:
        "Expose Framepack workflow packs, creative direction packs, capability status, and common technology fit without making creative decisions.",
      inputSchema: {
        userRawInput: z.string().optional(),
        projectDir: z.string().optional(),
      },
    },
    (input) =>
      textJson(
        exposeFramepackArsenal({
          userRawInput: input.userRawInput,
          projectDir: input.projectDir ? resolve(input.projectDir) : undefined,
        }),
      ),
  );

  server.registerTool("validatePackage", { inputSchema: { projectDir: z.string() } }, (input) => {
    const projectDir = resolve(input.projectDir);
    const report = validateProjectPackage({ projectDir });
    writeProjectPackageValidationReport({ projectDir, report });
    return textJson(report);
  });

  server.registerTool("repairPackage", { inputSchema: { projectDir: z.string() } }, (input) =>
    textJson(repairProjectPackage({ projectDir: resolve(input.projectDir) })),
  );

  server.registerTool("captureAssets", { inputSchema: { projectDir: z.string() } }, async (input) =>
    textJson(await materializeProjectAssets({ projectDir: resolve(input.projectDir) })),
  );

  server.registerTool("syncAssets", { inputSchema: { projectDir: z.string() } }, (input) =>
    textJson(syncAssetExecutionProject({ projectDir: resolve(input.projectDir) })),
  );

  server.registerTool("runtimeDoctor", { inputSchema: { projectDir: z.string().optional() } }, (input) =>
    textJson({
      runtime: detectHyperframesCapabilities(),
      status: input.projectDir ? getProjectPackageStatus({ projectDir: resolve(input.projectDir) }) : undefined,
    }),
  );

  server.registerTool("runtimeLint", { inputSchema: { projectDir: z.string() } }, (input) =>
    textJson(runtimeAction("lint", input.projectDir)),
  );

  server.registerTool(
    "runtimeInspect",
    { inputSchema: { projectDir: z.string(), samples: z.number().optional(), json: z.boolean().optional() } },
    (input) => textJson(runtimeAction("inspect", input.projectDir, input.samples ? ["--samples", String(input.samples), "--json"] : ["--json"])),
  );

  server.registerTool("runtimeSnapshot", { inputSchema: { projectDir: z.string(), frames: z.number().optional() } }, (input) =>
    textJson(runtimeAction("snapshot", input.projectDir, input.frames ? ["--frames", String(input.frames)] : [])),
  );

  server.registerTool("explainNextActions", { inputSchema: { projectDir: z.string() } }, (input) => {
    const status = getProjectPackageStatus({ projectDir: resolve(input.projectDir) });
    return textJson({
      readiness: status.readiness,
      nextActionItems: status.nextActionItems,
      explanation: status.nextActionItems.map((item) => `${item.id}: ${item.reason}`),
    });
  });

  server.registerTool("listWorkflowPacks", { inputSchema: {} }, () =>
    textJson({ workflowPacks: listFramepackWorkflowPacks() }),
  );

  server.registerTool("getWorkflowPack", { inputSchema: { id: z.string() } }, (input) =>
    textJson(getFramepackWorkflowPack(input.id)),
  );

  server.registerTool("listCreativeDirectionPacks", { inputSchema: {} }, () =>
    textJson({ creativeDirectionPacks: listFramepackCreativeDirectionPacks() }),
  );

  server.registerTool("getCreativeDirectionPack", { inputSchema: { id: z.string() } }, (input) =>
    textJson(getFramepackCreativeDirectionPack(input.id)),
  );

  server.registerTool(
    "recommendPacks",
    {
      inputSchema: {
        sourceType: z.enum(["markdown", "thread", "website", "game-ad"]),
        outputType: z.enum(["case-explainer", "game-ad"]),
        goal: z.string().optional(),
        audience: z.string().optional(),
        format: z.enum(["16:9", "9:16"]).optional(),
      },
    },
    (input) => textJson(recommendFramepackPacks(input)),
  );

  server.registerTool(
    "releaseSmoke",
    {
      description: "Run the agent-platform release smoke harness for Framepack.",
      inputSchema: {
        outputDir: z.string(),
      },
    },
    async (input) => textJson(await runFramepackReleaseSmoke({ outputDir: input.outputDir })),
  );

  server.registerResource(
    "workflow-packs",
    "framepack://packs/workflows",
    { title: "Framepack workflow packs" },
    (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify({ workflowPacks: listFramepackWorkflowPacks() }, null, 2) }],
    }),
  );

  server.registerResource(
    "creative-direction-packs",
    "framepack://packs/creative-directions",
    { title: "Framepack creative direction packs" },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({ creativeDirectionPacks: listFramepackCreativeDirectionPacks() }, null, 2),
        },
      ],
    }),
  );

  server.registerResource(
    "manifest",
    new ResourceTemplate("framepack://project/{projectName}/manifest", { list: undefined }),
    { title: "Framepack package manifest" },
    (uri, variables) => ({
      contents: [{ uri: uri.href, text: readProjectFile(String(variables.projectName), "PACKAGE_MANIFEST.json") }],
    }),
  );

  server.registerResource(
    "handoff",
    new ResourceTemplate("framepack://project/{projectName}/handoff", { list: undefined }),
    { title: "Framepack handoff" },
    (uri, variables) => ({
      contents: [{ uri: uri.href, text: readProjectFile(String(variables.projectName), "HANDOFF.md") }],
    }),
  );

  server.registerResource(
    "asset-execution-plan",
    new ResourceTemplate("framepack://project/{projectName}/asset-execution-plan", { list: undefined }),
    { title: "Framepack asset execution plan" },
    (uri, variables) => ({
      contents: [{ uri: uri.href, text: readProjectFile(String(variables.projectName), "ASSET_EXECUTION_PLAN.json") }],
    }),
  );

  server.registerResource(
    "capability-graph",
    new ResourceTemplate("framepack://project/{projectName}/capability-graph", { list: undefined }),
    { title: "Framepack capability graph" },
    (uri, variables) => ({
      contents: [{ uri: uri.href, text: readProjectFile(String(variables.projectName), "CAPABILITY_GRAPH.json") }],
    }),
  );

  server.registerResource(
    "forge-tasks",
    new ResourceTemplate("framepack://project/{projectName}/forge-tasks", { list: undefined }),
    { title: "Framepack forge tasks" },
    (uri, variables) => ({
      contents: [{ uri: uri.href, text: readProjectFile(String(variables.projectName), "FORGE_TASKS.md") }],
    }),
  );

  server.registerResource(
    "status",
    new ResourceTemplate("framepack://project/{projectName}/status", { list: undefined }),
    { title: "Framepack package status" },
    (uri, variables) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(getProjectPackageStatus({ projectDir: resolve("out", String(variables.projectName)) }), null, 2),
        },
      ],
    }),
  );

  for (const promptName of [
    "create-video-from-markdown",
    "create-video-from-thread",
    "create-video-from-website",
    "create-game-ad-video",
    "continue-framepack-project",
    "materialize-framepack-assets",
    "prepare-hyperframes-render",
  ]) {
    server.registerPrompt(
      promptName,
      {
        description: `Framepack workflow prompt: ${promptName}`,
        argsSchema: {
          request: z.string().optional(),
        },
      },
      (input) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Use Framepack for this workflow: ${promptName}. Request: ${input.request ?? "Continue from current project context."} Generate or inspect the package, run status and validation, then follow nextActionItems.`,
            },
          },
        ],
      }),
    );
  }

  return server;
}

export async function runFramepackMcpServer(): Promise<void> {
  const server = createFramepackMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
