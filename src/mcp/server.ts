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
import {
  getCapabilityAtlasNode,
  listCapabilityAtlasNodes,
  listRecommendedCapabilityStacks,
  recommendCapabilityStack,
} from "../capabilities/atlas.js";
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

  server.registerTool("listCapabilityAtlas", { inputSchema: {} }, () =>
    textJson({
      capabilityAtlas: {
        nodes: listCapabilityAtlasNodes(),
        recommendedStacks: listRecommendedCapabilityStacks(),
      },
    }),
  );

  server.registerTool("getCapabilityAtlasNode", { inputSchema: { id: z.string() } }, (input) =>
    textJson({ node: getCapabilityAtlasNode(input.id) }),
  );

  server.registerTool(
    "recommendCapabilityStack",
    {
      inputSchema: {
        workflowPackId: z.string().optional(),
        creativeDirectionPackId: z.string().optional(),
        outputType: z.string().optional(),
        format: z.string().optional(),
        goal: z.string().optional(),
      },
    },
    (input) => textJson({ stack: recommendCapabilityStack(input) }),
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

  // ── Knowledge Query Tools (alpha.24) ──────────────

  server.registerTool(
    "querySceneTemplate",
    {
      description: "Query scene templates by purpose/category. Returns matching HTML/CSS/GSAP code snippets that an agent can paste directly into a composition. This is a knowledge query, not a command executor.",
      inputSchema: {
        purpose: z.string().describe("Scene purpose: opening, name-reveal, stats, footage, cta, transition, overlay"),
        format: z.enum(["16:9", "9:16", "any"]).optional().describe("Target format"),
        tags: z.string().optional().describe("Comma-separated style tags: dramatic, sports, bold, minimal..."),
        duration: z.number().optional().describe("Scene duration in seconds"),
      },
    },
    async (input) => {
      const { matchSceneTemplates } = await import("../workbench/scene-templates.js");
      const results = matchSceneTemplates({
        category: input.purpose as "opening",
        format: input.format,
        tags: input.tags ? input.tags.split(",") : undefined,
        duration: input.duration,
      }).slice(0, 5);

      return textJson({
        query: input,
        count: results.length,
        templates: results.map(t => ({
          id: t.id,
          category: t.category,
          tags: t.tags,
          source: t.source,
          duration: `${t.minDuration}-${t.maxDuration}s`,
          requiredTokens: t.requiredTokens,
          code: t.html,
        })),
      });
    },
  );

  server.registerTool(
    "recommendAnimation",
    {
      description: "Recommend GSAP animation code for a specific element and style. Returns complete GSAP timeline snippets an agent can use directly.",
      inputSchema: {
        element: z.string().describe("What to animate: stat-number, headline, title, button, image, scene-content, sweep-line"),
        style: z.enum(["impact", "elegant", "energetic", "subtle", "dramatic"]).optional().describe("Animation mood"),
      },
    },
    async (input) => {
      const animations: Record<string, Record<string, string>> = {
        "stat-number": {
          impact: "var proxy = { val: 0 };\ntl.to(proxy, { val: TARGET, duration: 1.5, ease: \"power2.out\", onUpdate: function() {\n  document.querySelector(\"SELECTOR\").textContent = Math.round(proxy.val).toLocaleString();\n}}, TIME)",
          elegant: "tl.from(\"SELECTOR\", { opacity: 0, y: 20, duration: 0.8, ease: \"power2.out\" }, TIME)",
          energetic: "tl.from(\"SELECTOR\", { scale: 0, duration: 0.5, ease: \"back.out(1.7)\" }, TIME)\n  .to(\"SELECTOR\", { scale: 1.05, duration: 0.15, yoyo: true, repeat: 1 }, TIME + 0.5)",
        },
        headline: {
          impact: "tl.from(\"SELECTOR\", { scale: 5, opacity: 0, duration: 0.5, ease: \"back.out(1.7)\" }, TIME)",
          elegant: "tl.from(\"SELECTOR\", { opacity: 0, y: 20, duration: 1, ease: \"power2.out\" }, TIME)",
          dramatic: "tl.from(\"SELECTOR\", { scale: 8, opacity: 0, filter: \"blur(30px)\", duration: 0.7, ease: \"expo.out\" }, TIME)",
          energetic: "tl.from(\"SELECTOR\", { scale: 3, opacity: 0, filter: \"blur(20px)\", duration: 0.5, ease: \"expo.out\" }, TIME)",
        },
        title: {
          impact: "tl.from(\"SELECTOR\", { y: \"-120%\", duration: 0.6, ease: \"bounce.out\" }, TIME)",
          elegant: "tl.from(\"SELECTOR\", { opacity: 0, y: 15, duration: 0.8, ease: \"power2.out\" }, TIME)",
          subtle: "tl.from(\"SELECTOR\", { opacity: 0, duration: 0.6 }, TIME)",
        },
        button: {
          impact: "tl.from(\"SELECTOR\", { scale: 0, duration: 0.5, ease: \"back.out(1.7)\" }, TIME)\n  .to(\"SELECTOR\", { scale: 1.1, duration: 0.8, ease: \"power1.out\", repeat: 2 }, TIME + 1)",
          elegant: "tl.from(\"SELECTOR\", { opacity: 0, y: 20, duration: 0.4, ease: \"power3.out\" }, TIME)",
          energetic: "tl.from(\"SELECTOR\", { scale: 0, rotation: -10, duration: 0.4, ease: \"back.out(1.7)\" }, TIME)",
        },
        "scene-content": {
          subtle: "tl.from(\"SELECTOR\", { opacity: 0, y: 60, duration: 0.5, ease: \"power3.out\" }, TIME)",
          dramatic: "tl.from(\"SELECTOR > *\", { scale: 0, ease: \"back.out(1.4)\", duration: 0.5, stagger: 0.1, overwrite: \"auto\" }, TIME)",
        },
        "sweep-line": {
          impact: "tl.from(\"SELECTOR\", { scaleX: 0, duration: 0.4, ease: \"power2.out\" }, TIME)",
          elegant: "tl.from(\"SELECTOR\", { scaleX: 0, duration: 0.6, ease: \"power2.inOut\" }, TIME)",
        },
        image: {
          impact: "tl.from(\"SELECTOR\", { scale: 0, opacity: 0, duration: 0.5, ease: \"back.out(1.4)\" }, TIME)",
          elegant: "tl.from(\"SELECTOR\", { opacity: 0, scale: 1.1, duration: 0.8, ease: \"power2.out\" }, TIME)",
          dramatic: "tl.from(\"SELECTOR\", { scale: 2, opacity: 0, filter: \"blur(20px)\", duration: 0.6, ease: \"expo.out\" }, TIME)",
        },
      };

      const el = input.element;
      const style = input.style || "impact";
      const elAnims = animations[el];
      const code = elAnims?.[style] || elAnims?.impact || "// No matching animation found";

      return textJson({
        element: el,
        style: style,
        code: code,
        placeholders: { SELECTOR: "CSS selector for the element", TARGET: "target number value", TIME: "start time in seconds" },
        tips: [
          "Replace SELECTOR with your element's CSS selector (e.g., '#scene-0 .stat-value')",
          "Replace TIME with the scene start time in seconds",
          "Use gsap.set() for initial state, tl.from()/tl.to() for animations",
          "Always add overwrite: 'auto' when multiple tweens affect the same property",
        ],
      });
    },
  );

  server.registerTool(
    "getComponentCode",
    {
      description: "Get the CSS+JS code for a HyperFrames Catalog Component. Returns the component's complete code that an agent can paste into a composition.",
      inputSchema: {
        componentId: z.string().describe("Component ID, e.g. caption-kinetic-slam, vignette, shimmer-sweep, grain-overlay"),
      },
    },
    async (input) => {
      const { resolve } = await import("node:path");
      const { readFileSync, existsSync } = await import("node:fs");
      const { fileURLToPath } = await import("node:url");

      const candidates = [
        resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), "..", "..", "templates", "catalog", "components"),
        resolve(new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"), "..", "..", "..", "templates", "catalog", "components"),
      ];

      for (const dir of candidates) {
        const htmlPath = resolve(dir, `${input.componentId}.html`);
        const jsonPath = resolve(dir, `${input.componentId}.json`);
        if (existsSync(htmlPath)) {
          const html = readFileSync(htmlPath, "utf-8");
          const meta = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, "utf-8")) : {};
          return textJson({
            componentId: input.componentId,
            name: meta.name || input.componentId,
            tags: meta.tags || [],
            integrationMode: "copy-snippet",
            code: html,
            usage: "Copy the CSS into <style> and the JS into your GSAP timeline. Adjust selectors to match your scene structure.",
          });
        }
      }

      return textJson({ error: `Component '${input.componentId}' not found. Use framepack scene-templates list to see available templates and components.` });
    },
  );

  // ── Knowledge Base Resources (alpha.24) ────────────

  server.registerResource(
    "video-design-best-practices",
    "framepack://knowledge/video-design",
    { title: "Video design best practices from industry (HeyGen, Synthesia, universal principles)" },
    (uri) => ({
      contents: [{
        uri: uri.href,
        text: [
          "# Video Design Best Practices",
          "",
          "## Universal Principles",
          "- 3-second hook rule: first 3 seconds must grab attention",
          "- Brand color consistency: max 2 primary colors + 1 accent",
          "- Typography hierarchy (1080p): title ≥ 72px, subtitle 36-48px, body 24-30px",
          "- Scene duration: 3-8 seconds ideal; >10s needs internal rhythm changes",
          "- Transition rhythm matches content: hard cut for data, dissolve for emotion",
          "- Text on video: always add dark/light overlay for readability",
          "",
          "## HeyGen Patterns (700+ templates)",
          "- Marketing templates: hook → benefit → proof → CTA",
          "- Social Media: word-synced captions, dynamic zoom, 4 visual hooks",
          "- Announcement: dark build opening → name reveal → details → countdown CTA",
          "- Training: chapter markers, progress bars, pause points",
          "- 12 social-optimized templates: 4 visual hooks, 8 caption styles",
          "",
          "## Synthesia Patterns (230+ avatars)",
          "- L&D best: chapter-based, SCORM export, brand kit integration",
          "- Avatar naturalism: consistent gaze, gesture timing, voice sync",
          "- Corporate: brand colors in every scene, logo watermark, professional pacing",
          "",
          "## Agent Template Creation Guide",
          "1. Design with CSS variables (var(--accent-primary)) not hardcoded colors",
          "2. Add data-start/data-duration attributes to all timed elements",
          "3. Register GSAP timeline: window.__timelines['id'] = tl",
          "4. Follow HyperFrames 15 rules (see framepack://knowledge/hyperframes-rules)",
          "5. Validate: npx hyperframes lint your-template.html",
          "6. Save: npx framepack template save --name 'my-template' --category 'opening'",
        ].join("\n"),
      }],
    }),
  );

  server.registerResource(
    "hyperframes-rules",
    "framepack://knowledge/hyperframes-rules",
    { title: "HyperFrames 15 compatibility rules for video compositions" },
    (uri) => ({
      contents: [{
        uri: uri.href,
        text: [
          "# HyperFrames Compatibility Rules",
          "",
          "1. <video> needs data-start AND data-media-start",
          "2. No Math.random() — use seeded PRNG (mulberry32)",
          "3. No repeat: -1 — calculate finite repeats",
          "4. GSAP loaded synchronously from CDN",
          "5. Scene switches use tl.set(), not tl.to()",
          "6. First scene visible via CSS before JavaScript",
          "7. Multiple tweens on same property need overwrite: 'auto'",
          "8. Timeline registration: window.__timelines['id'] = tl",
          "9. Root element: data-composition-id, data-start, data-duration, data-width, data-height",
          "10. No async timeline construction",
          "11. Every multi-scene composition needs transitions",
          "12. No exit animations except on final scene",
          "13. All timed elements need class='clip'",
          "14. No <br> tags — use CSS for line breaks",
          "15. No video.play() — HyperFrames controls playback",
        ].join("\n"),
      }],
    }),
  );

  server.registerResource(
    "scene-templates-index",
    "framepack://templates/scene-templates",
    { title: "Complete index of available scene templates (builtin + blocks)" },
    async (uri) => {
      const { getTemplateStats, loadAllTemplates } = await import("../workbench/scene-templates.js");
      const stats = getTemplateStats();
      const templates = loadAllTemplates().map(t => ({
        id: t.id, category: t.category, tags: t.tags, source: t.source,
        duration: `${t.minDuration}-${t.maxDuration}s`, format: t.format,
      }));
      return {
        contents: [{ uri: uri.href, text: JSON.stringify({ stats, templates }, null, 2) }],
      };
    },
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
    "capability-atlas",
    "framepack://capabilities/atlas",
    { title: "Framepack capability atlas" },
    (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(
            {
              capabilityAtlas: {
                nodes: listCapabilityAtlasNodes(),
                recommendedStacks: listRecommendedCapabilityStacks(),
              },
            },
            null,
            2,
          ),
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
