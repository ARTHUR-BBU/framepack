import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "../dist/interfaces/cli/index.js";
import { compileMarkdownSourceBundle } from "../dist/ingest/markdown/index.js";
import { compileThreadSourceBundle } from "../dist/ingest/thread/index.js";
import {
  compileWebsiteSourceBundle,
  extractWebsiteContent,
  fetchWebsiteSourceBundle,
} from "../dist/ingest/website/index.js";
import { compileVideoBrief } from "../dist/planning/brief/index.js";
import { buildAssetPlan } from "../dist/planning/assets/index.js";
import { buildCapabilityGraph } from "../dist/capabilities/capability-graph.js";
import {
  exposeFramepackArsenal,
  summarizeCapabilityGraph,
} from "../dist/capabilities/arsenal.js";
import {
  getCapabilityAtlasNode,
  listCapabilityAtlasNodes,
  recommendCapabilityStack,
} from "../dist/capabilities/atlas.js";
import { buildAssetExecutionPlan } from "../dist/packaging/asset-execution.js";
import { createGoldenPackageProtocolSummary } from "../dist/packaging/golden-package.js";
import {
  FRAMEPACK_PACKAGE_PROTOCOL,
  FRAMEPACK_PACKAGE_PROTOCOL_VERSION,
  FRAMEPACK_PACKAGE_PROTOCOL_V1,
  FRAMEPACK_PACKAGE_COMMANDS,
  getRequiredPackageProtocolFiles,
} from "../dist/packaging/package-protocol.js";
import { createPackageStatusDecision } from "../dist/packaging/package-status.js";
import { normalizeVideoBriefInput } from "../dist/video/brief/normalize.js";
import { buildScript } from "../dist/planning/script/index.js";
import { buildStoryboard } from "../dist/planning/storyboard/index.js";
import { parseMarkdownSourceMaterials } from "../dist/video/brief/markdown.js";
import { compileCompositionSpec } from "../dist/video/compile/composition-spec.js";
import {
  createVideoProjectPackage,
  writeVideoProjectPackage,
} from "../dist/video/package/project-package.js";
import {
  createHyperframesRuntimeAdapter,
  detectHyperframesCapabilities,
} from "../dist/runtime/hyperframes/adapter.js";
import { buildRuntimeManifest } from "../dist/runtime/manifest.js";
import { buildHyperframesCommandSpec } from "../dist/runtime/hyperframes/commands.js";
import { executeHyperframesCommand } from "../dist/runtime/hyperframes/execution.js";
import {
  createMissingHyperframesCapabilities,
  detectLocalHyperframesCapabilities,
  parseHyperframesVersion,
  resolveHyperframesBinary,
} from "../dist/runtime/hyperframes/discovery.js";
import { planCaseExplainerScenes } from "../dist/video/planning/scene-planner.js";
import { validateScenePlan } from "../dist/video/planning/scene-validators.js";
import { emitHyperframesComposition } from "../dist/video/render/hyperframes-adapter.js";
import { buildCaseExplainerVideoProject } from "../dist/video/index.js";
import {
  compileWebsiteCaseExplainerProject,
  compileGameAdProject,
  compileThreadCaseExplainerProject,
  compileThreadVideoBrief,
  compileWebsiteVideoBrief,
} from "../dist/compiler/index.js";
import {
  compileVideoProjectFromSource,
  listCompilerPipelines,
} from "../dist/compiler/pipeline-registry.js";
import { captureWebsiteProject } from "../dist/capture/website/executor.js";
import { composeThreadProject } from "../dist/capture/thread/executor.js";
import { createForgeTaskInstruction } from "../dist/forge/adapter.js";
import {
  listFramepackCreativeDirectionPacks,
  listFramepackWorkflowPacks,
  recommendFramepackPacks,
  resolveFramepackPackSelection,
} from "../dist/workflow-packs/registry.js";

const fixturePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../examples/case-explainer-input.md",
);
const readmePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../README.md",
);
const chineseReadmePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../README.zh-CN.md",
);
const packageJsonPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../package.json",
);
const framepack04AlphaNotesPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/release-candidate-v0.4.0-alpha.3.md",
);
const framepack04ScenarioReportPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/real-scenario-test-report-v0.4.0-alpha.1.md",
);
const framepack04RealUserTrialPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/real-user-trial-v0.4.0-alpha.3.md",
);
const agentsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../AGENTS.md",
);
const threadExamplePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../examples/thread.txt",
);
const websiteExamplePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../examples/website.html",
);
const goldenPackageProtocolFixtureDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../test/fixtures/golden-package-protocol",
);

function readGoldenPackageProtocolFixture(name) {
  return JSON.parse(readFileSync(join(goldenPackageProtocolFixtureDir, `${name}.summary.json`), "utf8"));
}

const tests = [
  {
    name: "define the Framepack package protocol v1 contract",
    run: () => {
      assert.equal(FRAMEPACK_PACKAGE_PROTOCOL, "framepack.project-package");
      assert.equal(FRAMEPACK_PACKAGE_PROTOCOL_VERSION, 1);
      assert.deepEqual(FRAMEPACK_PACKAGE_PROTOCOL_V1.entrypoints, {
        rootComposition: "index.html",
        runtimeMeta: "meta.json",
        runtimeConfig: "hyperframes.json",
        handoff: "HANDOFF.md",
        commands: "COMMANDS.md",
      });
      assert.deepEqual(FRAMEPACK_PACKAGE_PROTOCOL_V1.artifacts.execution, [
        "ASSET_EXECUTION_PLAN.json",
        "CAPTURE_EXECUTION_PLAN.json",
        "CAPABILITY_GRAPH.json",
      ]);
      assert.ok(FRAMEPACK_PACKAGE_PROTOCOL_V1.artifacts.runtime.includes("RUNTIME_MANIFEST.json"));
      assert.deepEqual(FRAMEPACK_PACKAGE_PROTOCOL_V1.compatibility.legacyFiles, [
        "CAPTURE_EXECUTION_PLAN.json",
      ]);
      assert.deepEqual(FRAMEPACK_PACKAGE_COMMANDS, [
        "status",
        "validate",
        "repair",
        "sync-assets",
        "capture",
        "runtime-doctor",
        "runtime-lint",
        "runtime-inspect",
        "runtime-snapshot",
        "runtime-upgrade-check",
        "preview",
        "render",
      ]);
      assert.deepEqual(getRequiredPackageProtocolFiles(), [
        "PACKAGE_MANIFEST.json",
        "SCENE_PLAN.json",
        "SCENE_ASSET_MAP.json",
        "SOURCE_SCENE_MAP.json",
        "ASSET_PLAN.json",
        "ASSET_EXECUTION_PLAN.json",
        "HANDOFF.md",
        "FORGE_TASKS.md",
      ]);
    },
  },
  {
    name: "build a runtime manifest for HyperFrames package execution",
    run: () => {
      const manifest = buildRuntimeManifest({
        backend: "hyperframes",
        runtimeInfo: {
          rootEntry: "index.html",
          compositionDirectory: "compositions",
          assetDirectory: "assets",
        },
        capabilities: {
          available: true,
          binary: "hyperframes",
          detectedAt: "2026-05-20T00:00:00.000Z",
          version: "0.5.5",
          supportedCommands: ["preview", "lint", "inspect", "snapshot", "render", "upgrade"],
          supportedCatalogFeatures: ["blocks"],
          supportedRenderOptions: ["--fps"],
          fallbackNotes: [],
        },
        commands: [
          {
            action: "preview",
            executable: "hyperframes",
            args: ["preview", "demo"],
            cwd: "demo",
            summary: "hyperframes preview demo",
            passthroughArgs: [],
          },
          {
            action: "upgrade-check",
            executable: "hyperframes",
            args: ["upgrade", "--check", "--json"],
            cwd: ".",
            summary: "hyperframes upgrade --check --json",
            passthroughArgs: [],
          },
        ],
      });

      assert.equal(manifest.version, "framepack.runtime-manifest.v1");
      assert.equal(manifest.backend, "hyperframes");
      assert.equal(manifest.entrypoints.rootEntry, "index.html");
      assert.equal(manifest.entrypoints.runtimeConfig, "hyperframes.json");
      assert.equal(manifest.capabilities.available, true);
      assert.deepEqual(manifest.commands.map((command) => command.action), ["preview", "upgrade-check"]);
      assert.deepEqual(manifest.evidence, {
        validationReport: "VALIDATION_REPORT.json",
        guardrails: "GUARDRAILS.md",
        runtimeSnapshots: "snapshots/",
        runtimeInspectReports: "reports/runtime-inspect/",
      });
    },
  },
  {
    name: "build a capability graph for game-ad forge packages",
    run: () => {
      const graph = buildCapabilityGraph({
        sourceType: "game-ad",
        outputType: "game-ad",
        executionKinds: ["forge-character-pack", "forge-map-pack", "forge-fx-pack"],
        forgeBackends: ["agent-sprite-forge"],
        requiredSkills: ["generate2dsprite", "generate2dmap"],
        runtimeBackend: "hyperframes",
        packageCommands: ["runtime-lint", "runtime-snapshot", "render"],
      });

      assert.equal(graph.version, "framepack.capability-graph.v1");
      assert.equal("sourceType" in graph, false);
      assert.equal("outputType" in graph, false);
      assert.ok(graph.nodes.some((node) => node.id === "video-runtime.hyperframes"));
      assert.ok(graph.nodes.some((node) => node.id === "asset-forge.agent-sprite-forge"));
      assert.ok(graph.nodes.some((node) => node.delivery === "codex-skill"));
      assert.ok(
        graph.edges.some(
          (edge) => edge.from === "asset-forge.agent-sprite-forge" && edge.to === "video-runtime.hyperframes",
        ),
      );
    },
  },
  {
    name: "deduplicate capability graph backend and skill nodes",
    run: () => {
      const graph = buildCapabilityGraph({
        sourceType: "game-ad",
        outputType: "game-ad",
        executionKinds: ["forge-character-pack", "forge-character-pack"],
        forgeBackends: ["agent-sprite-forge", "agent-sprite-forge"],
        requiredSkills: ["generate2dsprite", "generate2dsprite"],
        runtimeBackend: "hyperframes",
        packageCommands: ["runtime-lint"],
      });

      const nodeIds = graph.nodes.map((node) => node.id);
      assert.equal(nodeIds.filter((id) => id === "asset-forge.agent-sprite-forge").length, 1);
      assert.equal(nodeIds.filter((id) => id === "skill.generate2dsprite").length, 1);
      assert.deepEqual(
        graph.nodes.find((node) => node.id === "asset-forge.agent-sprite-forge")?.usedBy,
        ["forge-character-pack"],
      );
    },
  },
  {
    name: "summarize capability graph for agent status decisions",
    run: () => {
      const graph = buildCapabilityGraph({
        sourceType: "game-ad",
        outputType: "game-ad",
        executionKinds: ["forge-character-pack", "forge-map-pack", "forge-fx-pack"],
        forgeBackends: ["agent-sprite-forge"],
        requiredSkills: ["generate2dsprite", "generate2dmap"],
        runtimeBackend: "hyperframes",
        runtimeStatus: "not-detected",
        packageCommands: ["status", "runtime-lint", "runtime-snapshot", "render"],
      });

      const summary = summarizeCapabilityGraph(graph);

      assert.equal(summary.present, true);
      assert.equal(summary.version, "framepack.capability-graph.v1");
      assert.equal(summary.totalNodes, 5);
      assert.deepEqual(summary.byStatus, {
        available: 1,
        planned: 0,
        "not-detected": 4,
        external: 0,
        blocked: 0,
      });
      assert.deepEqual(summary.byDelivery, {
        "npm-local": 1,
        "cdn-runtime": 0,
        "cli-local": 0,
        "mcp-tool": 1,
        "remote-api": 0,
        "codex-skill": 3,
        "manual-external": 0,
      });
      assert.deepEqual(summary.gapNodeIds, [
        "asset-forge.agent-sprite-forge",
        "skill.generate2dmap",
        "skill.generate2dsprite",
        "video-runtime.hyperframes",
      ]);
      assert.ok(summary.nodeIds.includes("mcp.framepack"));
    },
  },
  {
    name: "expose the Framepack arsenal without making creative decisions",
    run: () => {
      const arsenal = exposeFramepackArsenal({
        userRawInput: "我想做一个苹果发布会风格的 AI 产品视频，还想看看 Three.js 能不能用。",
      });

      assert.match(arsenal.userRawInput, /Three\.js/);
      assert.ok(arsenal.workflowPacks.some((pack) => pack.id === "game-ad-sprite-video"));
      assert.ok(
        arsenal.creativeDirectionPacks.some((pack) => pack.id === "clean-saas-explainer"),
      );
      assert.equal(arsenal.capabilityGraph.present, false);
      assert.equal(
        arsenal.commonTechStatus.find((tech) => tech.name === "Three.js")?.inCapabilityGraph,
        false,
      );
      assert.equal(
        arsenal.commonTechStatus.find((tech) => tech.name === "Three.js")?.possibleDelivery,
        "npm-local",
      );
      assert.match(arsenal.agentBoundary, /Framepack exposes context/);
      assert.doesNotMatch(JSON.stringify(arsenal), /suggestedCommand/);
    },
  },
  {
    name: "expose an animation capability atlas with programmatic animation and frontier model nodes",
    run: () => {
      const atlasNodes = listCapabilityAtlasNodes();
      const anime = getCapabilityAtlasNode("library.animejs");
      const hyperframes = getCapabilityAtlasNode("video-runtime.hyperframes");
      const spriteForge = getCapabilityAtlasNode("asset-forge.agent-sprite-forge");

      assert.ok(atlasNodes.length >= 6);
      assert.equal(anime?.domain, "programmatic-animation");
      assert.equal(anime?.category, "web-motion");
      assert.ok(anime?.techniques.includes("timeline-animation"));
      assert.ok(anime?.techniques.includes("stagger-animation"));
      assert.ok(anime?.invocationSurfaces.includes("typescript-api"));
      assert.equal(anime?.lifecycle, "recommended");
      assert.equal(anime?.framepackSupportLevel.includes("recommended"), true);
      assert.equal(hyperframes?.domain, "composition-runtime");
      assert.equal(hyperframes?.framepackSupportLevel.includes("verifiable"), true);
      assert.equal(spriteForge?.domain, "asset-forge");
      assert.equal(spriteForge?.deliveryModes.includes("codex-skill"), true);
      assert.ok(getCapabilityAtlasNode("model.seedance-2-0"));
      assert.ok(getCapabilityAtlasNode("model.gemini-omni"));
      assert.ok(getCapabilityAtlasNode("model.kling-3-0"));
      assert.equal(getCapabilityAtlasNode("missing.capability"), undefined);
    },
  },
  {
    name: "recommend capability stacks from workflow and creative direction context",
    run: () => {
      const gameAdStack = recommendCapabilityStack({
        workflowPackId: "game-ad-sprite-video",
        creativeDirectionPackId: "game-ad-retro-arcade",
        outputType: "game-ad",
        format: "9:16",
      });
      const webMotionStack = recommendCapabilityStack({
        workflowPackId: "product-explainer",
        creativeDirectionPackId: "clean-saas-explainer",
        outputType: "case-explainer",
        format: "16:9",
        goal: "Use programmatic animation for a SaaS explainer",
      });

      assert.equal(gameAdStack?.id, "game-ad-sprite-video-stack");
      assert.ok(gameAdStack?.nodes.some((node) => node.capabilityId === "asset-forge.agent-sprite-forge"));
      assert.ok(gameAdStack?.nodes.some((node) => node.capabilityId === "video-runtime.hyperframes"));
      assert.match(gameAdStack?.rationale.join(" ") ?? "", /sprite/i);
      assert.equal(webMotionStack?.id, "web-motion-explainer-stack");
      assert.ok(webMotionStack?.nodes.some((node) => node.capabilityId === "library.animejs"));
      assert.ok(webMotionStack?.acceptanceCriteria.some((criterion) => criterion.includes("runtime inspect")));
    },
  },
  {
    name: "describe the animation capability atlas through the CLI",
    run: async () => {
      const listStdout = [];
      const listExitCode = await runCli(["atlas", "--json"], {
        stdout: (message) => listStdout.push(message),
        stderr: () => {},
      });
      const getStdout = [];
      const getExitCode = await runCli(["atlas", "get", "library.animejs", "--json"], {
        stdout: (message) => getStdout.push(message),
        stderr: () => {},
      });
      const recommendStdout = [];
      const recommendExitCode = await runCli(
        [
          "atlas",
          "recommend",
          "--workflow-pack",
          "game-ad-sprite-video",
          "--creative-direction-pack",
          "game-ad-retro-arcade",
          "--output-type",
          "game-ad",
          "--format",
          "9:16",
          "--json",
        ],
        {
          stdout: (message) => recommendStdout.push(message),
          stderr: () => {},
        },
      );

      const listPayload = JSON.parse(listStdout.join("\n"));
      const getPayload = JSON.parse(getStdout.join("\n"));
      const recommendPayload = JSON.parse(recommendStdout.join("\n"));

      assert.equal(listExitCode, 0);
      assert.ok(listPayload.capabilityAtlas.nodes.some((node) => node.id === "library.animejs"));
      assert.ok(listPayload.capabilityAtlas.recommendedStacks.some((stack) => stack.id === "web-motion-explainer-stack"));
      assert.equal(getExitCode, 0);
      assert.equal(getPayload.node.id, "library.animejs");
      assert.equal(getPayload.node.domain, "programmatic-animation");
      assert.equal(recommendExitCode, 0);
      assert.equal(recommendPayload.stack.id, "game-ad-sprite-video-stack");
      assert.ok(recommendPayload.stack.nodes.some((node) => node.capabilityId === "asset-forge.agent-sprite-forge"));
    },
  },
  {
    name: "create golden package protocol summaries for core package routes",
    run: async () => {
      const markdownResult = await compileVideoProjectFromSource({
        source: {
          sourceType: "markdown",
          markdown: readFileSync(fixturePath, "utf8"),
        },
        defaults: {
          goal: "Explain the case",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
        projectName: "golden-markdown-case",
      });
      const threadResult = compileThreadCaseExplainerProject({
        text: readFileSync(threadExamplePath, "utf8"),
        projectName: "golden-thread-case",
        defaults: {
          goal: "Explain the thread",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });
      const gameAdResult = compileGameAdProject({
        description: "A course that teaches founders to ship agent-native video systems.",
        projectName: "golden-game-ad",
        defaults: {
          goal: "Promote the course",
          audience: "Founders",
          format: "16:9",
          outputType: "game-ad",
        },
      });

      const summaries = [
        createGoldenPackageProtocolSummary(markdownResult.package),
        createGoldenPackageProtocolSummary(threadResult.package),
        createGoldenPackageProtocolSummary(gameAdResult.package),
      ];

      assert.deepEqual(summaries[0], readGoldenPackageProtocolFixture("markdown-case"));
      assert.deepEqual(summaries[1], readGoldenPackageProtocolFixture("thread-case"));
      assert.deepEqual(summaries[2], readGoldenPackageProtocolFixture("game-ad"));
      assert.equal(summaries[2].capabilityGraph.present, true);
      assert.ok(summaries[2].capabilityGraph.nodeIds.includes("video-runtime.hyperframes"));
      assert.equal(summaries[2].runtimeManifest.present, true);
      assert.equal(summaries[2].runtimeManifest.backend, "hyperframes");
      assert.ok(summaries[2].runtimeManifest.commandActions.includes("render"));
    },
  },
  {
    name: "create agent-sprite-forge task instructions without executing the backend",
    run: () => {
      const instruction = createForgeTaskInstruction({
        suggestedAsset: "hero-character-pack",
        sourceType: "game-ad",
        sourceLabel: "Playable hero character",
        sourceText: "A platform that turns product stories into videos.",
        executionKind: "forge-character-pack",
        assetForm: "character-pack",
        recommendedSceneIds: ["scene-1", "scene-3"],
        forgeBackend: "agent-sprite-forge",
        requiredSkill: "generate2dsprite",
        expectedOutputs: ["transparent PNG sprite sheet", "asset metadata JSON"],
        prompt: "Create a hero character pack.",
        styleNotes: ["Readable at video scale."],
        acceptanceCriteria: ["Includes reusable poses."],
        outputPath: "assets/forge/hero-character-pack",
        metadataPath: "assets/forge/hero-character-pack.json",
        status: "pending",
      });

      assert.equal(instruction.backend, "agent-sprite-forge");
      assert.equal(instruction.skill, "generate2dsprite");
      assert.match(instruction.agentInstruction, /\$generate2dsprite/);
      assert.match(instruction.agentInstruction, /Create a hero character pack/);
      assert.match(instruction.agentInstruction, /assets\/forge\/hero-character-pack\.json/);
      assert.deepEqual(instruction.expectedMetadata, {
        status: "available",
        outputs: ["<package-relative output paths>"],
      });
      assert.equal(instruction.autoExecute, false);
    },
  },
  {
    name: "create manual forge task instructions without skill commands",
    run: () => {
      const instruction = createForgeTaskInstruction({
        suggestedAsset: "custom-prop-pack",
        sourceType: "game-ad",
        sourceLabel: "Custom prop pack",
        sourceText: "Props from a custom backend.",
        executionKind: "forge-prop-pack",
        assetForm: "prop-pack",
        recommendedSceneIds: ["scene-2"],
        forgeBackend: "manual",
        expectedOutputs: ["prop PNGs", "metadata JSON"],
        prompt: "Create product props.",
        styleNotes: ["Match package palette."],
        acceptanceCriteria: ["Props are transparent PNGs."],
        outputPath: "assets/forge/custom-prop-pack",
        metadataPath: "assets/forge/custom-prop-pack.json",
        status: "pending",
      });

      assert.equal(instruction.backend, "manual");
      assert.equal(instruction.skill, undefined);
      assert.doesNotMatch(instruction.agentInstruction, /\$/);
      assert.match(instruction.agentInstruction, /manual or custom asset producer/);
      assert.equal(instruction.autoExecute, false);
    },
  },
  {
    name: "mark forge metadata available when declared outputs exist",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-forge-output-available-"));

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into game-style videos.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "forge-output-available",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const projectDir = join(tempRoot, "forge-output-available");
        const outputDir = join(projectDir, "assets", "forge", "hero-character-pack");
        mkdirSync(outputDir, { recursive: true });
        writeFileSync(join(outputDir, "hero.png"), "fake image bytes", "utf8");
        writeFileSync(
          join(projectDir, "assets", "forge", "hero-character-pack.json"),
          JSON.stringify(
            {
              status: "available",
              outputs: ["assets/forge/hero-character-pack/hero.png"],
            },
            null,
            2,
          ),
          "utf8",
        );

        const syncExitCode = await runCli(
          ["sync-assets", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );
        const assetExecutionPlan = JSON.parse(readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"));
        const assetPlan = JSON.parse(readFileSync(join(projectDir, "ASSET_PLAN.json"), "utf8"));
        const heroItem = assetExecutionPlan.items.find((item) => item.suggestedAsset === "hero-character-pack");

        assert.equal(syncExitCode, 0);
        assert.equal(heroItem.status, "available");
        assert.equal(assetPlan.availableAssets.includes("hero-character-pack"), true);
        assert.equal(assetPlan.missingAssets.includes("forge-character-pack:hero-character-pack"), false);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "keep forge metadata with missing declared outputs pending",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-forge-output-sync-"));

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into game-style videos.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "forge-output-sync",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const projectDir = join(tempRoot, "forge-output-sync");
        const outputDir = join(projectDir, "assets", "forge", "hero-character-pack");
        mkdirSync(outputDir, { recursive: true });
        writeFileSync(
          join(projectDir, "assets", "forge", "hero-character-pack.json"),
          JSON.stringify(
            {
              status: "available",
              outputs: ["assets/forge/hero-character-pack/missing.png"],
            },
            null,
            2,
          ),
          "utf8",
        );

        const syncExitCode = await runCli(
          ["sync-assets", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );
        const assetExecutionPlan = JSON.parse(readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"));
        const assetPlan = JSON.parse(readFileSync(join(projectDir, "ASSET_PLAN.json"), "utf8"));
        const heroItem = assetExecutionPlan.items.find((item) => item.suggestedAsset === "hero-character-pack");

        assert.equal(syncExitCode, 0);
        assert.equal(heroItem.status, "pending");
        assert.equal(assetPlan.availableAssets.includes("hero-character-pack"), false);
        assert.equal(assetPlan.missingAssets.includes("forge-character-pack:hero-character-pack"), true);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "sync forge metadata status into asset execution lifecycle",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-forge-status-sync-"));

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into game-style videos.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "forge-status-sync",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const projectDir = join(tempRoot, "forge-status-sync");
        const outputDir = join(projectDir, "assets", "forge", "hero-character-pack");
        mkdirSync(outputDir, { recursive: true });
        writeFileSync(join(outputDir, "placeholder.txt"), "not final", "utf8");
        writeFileSync(
          join(projectDir, "assets", "forge", "hero-character-pack.json"),
          JSON.stringify(
            {
              status: "failed",
              summary: "Generated asset failed acceptance criteria.",
              outputs: ["assets/forge/hero-character-pack/placeholder.txt"],
            },
            null,
            2,
          ),
          "utf8",
        );

        const syncExitCode = await runCli(
          ["sync-assets", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );
        const assetExecutionPlan = JSON.parse(readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"));
        const assetPlan = JSON.parse(readFileSync(join(projectDir, "ASSET_PLAN.json"), "utf8"));
        const heroItem = assetExecutionPlan.items.find((item) => item.suggestedAsset === "hero-character-pack");

        assert.equal(syncExitCode, 0);
        assert.equal(heroItem.status, "failed");
        assert.equal(assetPlan.availableAssets.includes("hero-character-pack"), false);
        assert.equal(assetPlan.missingAssets.includes("forge-character-pack:hero-character-pack"), false);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "render custom forge handoff tasks without undefined skills or agent-sprite-forge guidance",
    run: () => {
      const result = createVideoProjectPackage({
        projectName: "custom-forge-video",
        brief: {
          goal: "Explain custom forge",
          audience: "Producers",
          format: "16:9",
          style: { tone: "direct", pacing: "medium", brandName: "Studio" },
          sourceMaterials: [],
          constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
          outputType: "game-ad",
        },
        scenePlan: { totalDurationSec: 60, scenes: [] },
        script: { scenes: [] },
        storyboard: { scenes: [] },
        assetPlan: {
          availableAssets: [],
          placeholderAssets: ["custom-prop-pack"],
          missingAssets: ["forge-prop-pack:custom-prop-pack"],
          captureTargets: [],
          forgeTargets: [
            {
              suggestedAsset: "custom-prop-pack",
              sourceLabel: "Custom prop pack",
              sourceText: "Props from a custom backend.",
              executionKind: "forge-prop-pack",
              assetForm: "prop-pack",
              forgeBackend: "custom",
              expectedOutputs: ["prop PNGs", "metadata JSON"],
              prompt: "Create product props.",
              recommendedSceneIds: ["scene-2"],
              styleNotes: ["Match package palette."],
              acceptanceCriteria: ["Props are transparent PNGs."],
              rationale: "Custom backend produces props.",
            },
          ],
        },
        validationReport: {
          projectName: "custom-forge-video",
          status: "passed",
          sceneCount: 0,
          totalDurationSec: 60,
          issues: [],
          generatedAt: "2026-05-05T00:00:00.000Z",
        },
        compositionHtml: "<div></div>",
      });

      assert.match(result.files["HANDOFF.md"], /Custom prop pack -> custom-prop-pack/);
      assert.doesNotMatch(result.files["HANDOFF.md"], /undefined/);
      assert.doesNotMatch(result.files["HANDOFF.md"], /\$generate2dsprite/);
      assert.doesNotMatch(result.files["HANDOFF.md"], /agent-sprite-forge/);
    },
  },
  {
    name: "route project compilation through the compiler pipeline registry",
    run: async () => {
      const pipelines = listCompilerPipelines();

      assert.deepEqual(
        pipelines.map((pipeline) => `${pipeline.sourceType}:${pipeline.outputType}`).sort(),
        ["game-ad:game-ad", "markdown:case-explainer", "thread:case-explainer", "website:case-explainer"],
      );

      const markdownResult = await compileVideoProjectFromSource({
        source: {
          sourceType: "markdown",
          markdown: "# Problem\nTeams need reusable video.\n\n# Solution\nCompile packages.",
        },
        defaults: {
          goal: "Explain the system",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
        projectName: "registry-markdown",
      });

      assert.equal(markdownResult.brief.outputType, "case-explainer");
      assert.match(markdownResult.package.files["VIDEO_BRIEF.json"], /"goal": "Explain the system"/);

      const gameAdResult = await compileVideoProjectFromSource({
        source: {
          sourceType: "game-ad",
          description: "A platform for agent-native video workflows.",
        },
        defaults: {
          goal: "Promote the platform",
          audience: "Founders",
          format: "16:9",
          outputType: "game-ad",
        },
        projectName: "registry-game-ad",
      });

      assert.equal(gameAdResult.brief.outputType, "game-ad");
      assert.match(gameAdResult.package.files["ASSET_EXECUTION_PLAN.json"], /forge-character-pack/);
    },
  },
  {
    name: "reject mismatched compiler pipeline output types",
    run: async () => {
      await assert.rejects(
        () =>
          compileVideoProjectFromSource({
            source: {
              sourceType: "game-ad",
              description: "A platform for agent-native video workflows.",
            },
            defaults: {
              goal: "Explain the platform",
              audience: "Founders",
              format: "16:9",
              outputType: "case-explainer",
            },
            projectName: "bad-registry-route",
          }),
        /Pipeline for game-ad requires outputType game-ad/,
      );
    },
  },
  {
    name: "allow custom forge tasks without agent-sprite-forge skill coupling",
    run: () => {
      const plan = buildAssetExecutionPlan({
        assetPlan: {
          availableAssets: [],
          placeholderAssets: ["custom-prop-pack"],
          missingAssets: ["forge-prop-pack:custom-prop-pack"],
          captureTargets: [],
          forgeTargets: [
            {
              suggestedAsset: "custom-prop-pack",
              sourceLabel: "Manual prop pack",
              sourceText: "Props for a game-ad package.",
              executionKind: "forge-prop-pack",
              assetForm: "prop-pack",
              forgeBackend: "custom",
              expectedOutputs: ["prop PNGs", "metadata JSON"],
              prompt: "Create product props.",
              recommendedSceneIds: ["scene-2"],
              styleNotes: ["Match package palette."],
              acceptanceCriteria: ["Props are transparent PNGs."],
              rationale: "Manual custom backend produces props.",
            },
          ],
        },
        sourceManifest: {
          sourceType: "game-ad",
          title: "custom-game-ad",
          description: "Props for a game-ad package.",
          collectedAt: "2026-05-05T00:00:00.000Z",
        },
        now: () => "2026-05-05T00:00:00.000Z",
      });

      assert.equal(plan.items[0].forgeBackend, "custom");
      assert.equal("requiredSkill" in plan.items[0], false);
      assert.equal(plan.items[0].executionKind, "forge-prop-pack");
    },
  },
  {
    name: "keep empty forge output directories pending during sync",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-empty-forge-sync-"));

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into game-style videos.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "empty-forge-sync",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const projectDir = join(tempRoot, "empty-forge-sync");
        mkdirSync(join(projectDir, "assets", "forge", "hero-character-pack"), { recursive: true });

        const syncExitCode = await runCli(
          ["sync-assets", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );
        const assetExecutionPlan = JSON.parse(readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"));
        const heroItem = assetExecutionPlan.items.find((item) => item.suggestedAsset === "hero-character-pack");

        assert.equal(syncExitCode, 0);
        assert.equal(heroItem.status, "pending");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "compile game-ad input into forge execution tasks",
    run: () => {
      const result = compileGameAdProject({
        description: "A course that teaches founders to ship agent-native video systems.",
        projectName: "game-ad-demo",
        defaults: {
          goal: "Promote the course",
          audience: "Founders",
          format: "16:9",
          outputType: "game-ad",
        },
      });

      const assetExecutionPlan = JSON.parse(result.package.files["ASSET_EXECUTION_PLAN.json"]);
      const packageManifest = JSON.parse(result.package.files["PACKAGE_MANIFEST.json"]);

      assert.equal(result.brief.outputType, "game-ad");
      assert.equal(result.validationReport.status, "passed");
      assert.match(result.package.files["SOURCE_MANIFEST.json"], /"sourceType": "game-ad"/);
      assert.deepEqual(
        assetExecutionPlan.items.map((item) => item.executionKind),
        ["forge-character-pack", "forge-map-pack", "forge-fx-pack"],
      );
      assert.equal(assetExecutionPlan.items[0].forgeBackend, "agent-sprite-forge");
      assert.equal(assetExecutionPlan.items[0].requiredSkill, "generate2dsprite");
      assert.ok(assetExecutionPlan.items[0].expectedOutputs.includes("transparent PNG sprite sheet"));
      assert.match(assetExecutionPlan.items[0].prompt, /Promote the course/);
      assert.deepEqual(assetExecutionPlan.items[1].recommendedSceneIds, ["scene-1", "scene-2", "scene-3", "scene-4"]);
      assert.equal(packageManifest.capabilities.executionKinds.includes("forge-character-pack"), true);
      assert.equal(packageManifest.capabilities.executionKinds.includes("forge-map-pack"), true);
      assert.equal(packageManifest.capabilities.executionKinds.includes("forge-fx-pack"), true);
      assert.deepEqual(packageManifest.capabilities.packageCommands, [
        "status",
        "validate",
        "repair",
        "sync-assets",
        "capture",
        "runtime-doctor",
        "runtime-lint",
        "runtime-inspect",
        "runtime-snapshot",
        "runtime-upgrade-check",
        "preview",
        "render",
      ]);
      assert.equal(packageManifest.capabilities.packageCommands.includes("publish"), false);
      assert.match(result.package.files["HANDOFF.md"], /\$generate2dsprite/);
      assert.match(result.package.files["HANDOFF.md"], /\$generate2dmap/);
      assert.match(result.package.files["HANDOFF.md"], /agent-sprite-forge/);
      assert.match(result.package.files["HANDOFF.md"], /Recommended backend: agent-sprite-forge/);
      assert.match(result.package.files["HANDOFF.md"], /Install or enable the agent-sprite-forge skills/);
      assert.match(result.package.files["HANDOFF.md"], /Framepack does not install external skills automatically/);
      assert.match(result.package.files["HANDOFF.md"], /You may also produce these assets manually, use a custom forge backend, or reuse existing assets/);
      assert.match(result.package.files["FORGE_TASKS.md"], /\$generate2dsprite/);
      assert.match(result.package.files["FORGE_TASKS.md"], /Recommended backend: agent-sprite-forge/);
      assert.match(result.package.files["FORGE_TASKS.md"], /Install or enable the agent-sprite-forge skills/);
      assert.match(result.package.files["FORGE_TASKS.md"], /Manual or custom backends are valid/);
      assert.match(result.package.files["FORGE_TASKS.md"], /Metadata must include/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"recommendedAssets": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"assets": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"executionKind": "forge-character-pack"/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"suggestedAsset": "hero-character-pack"/);
    },
  },
  {
    name: "parse and normalize detected HyperFrames versions",
    run: () => {
      assert.equal(parseHyperframesVersion("hyperframes/0.4.11\n"), "0.4.11");
      assert.equal(parseHyperframesVersion("0.4.12"), "0.4.12");
      assert.equal(parseHyperframesVersion("0.5.5"), "0.5.5");
      assert.equal(parseHyperframesVersion("F:/repo/node_modules/.bin/hyperframes.cmd 0.4.11\n"), "0.4.11");
      assert.equal(parseHyperframesVersion(""), "unknown");
    },
  },
  {
    name: "create missing runtime capabilities with actionable fallback notes",
    run: () => {
      const capabilities = createMissingHyperframesCapabilities({
        binary: "hyperframes",
      });

      assert.equal(capabilities.available, false);
      assert.equal(capabilities.binary, "hyperframes");
      assert.equal(capabilities.version, "unknown");
      assert.ok(capabilities.fallbackNotes.some((note) => note.includes("not installed")));
      assert.ok(capabilities.detectedAt.length > 0);
    },
  },
  {
    name: "resolve local HyperFrames binary from node_modules bin directory",
    run: () => {
      const binary = resolveHyperframesBinary({
        cwd: "F:/repo",
        platform: "win32",
        exists: (candidate) =>
          candidate.replaceAll("\\", "/") === "F:/repo/node_modules/.bin/hyperframes.cmd",
      });

      assert.match(binary.replaceAll("\\", "/"), /F:\/repo\/node_modules\/\.bin\/hyperframes\.cmd$/);
    },
  },
  {
    name: "detect local runtime capabilities from a version probe",
    run: () => {
      const capabilities = detectLocalHyperframesCapabilities({
        cwd: "F:/repo",
        now: () => "2026-04-22T09:00:00.000Z",
        exists: (candidate) =>
          candidate.replaceAll("\\", "/") === "F:/repo/node_modules/.bin/hyperframes.cmd",
        runner: (binary) => ({
          status: 0,
          stdout: `${binary} 0.4.11\n`,
          stderr: "",
        }),
      });

      assert.equal(capabilities.available, true);
      assert.match(
        capabilities.binary.replaceAll("\\", "/"),
        /F:\/repo\/node_modules\/\.bin\/hyperframes\.cmd$/,
      );
      assert.equal(capabilities.version, "0.4.11");
      assert.equal(capabilities.detectedAt, "2026-04-22T09:00:00.000Z");
      assert.deepEqual(capabilities.supportedCommands, [
        "preview",
        "lint",
        "validate",
        "render",
        "inspect",
        "snapshot",
        "upgrade",
        "skills",
        "capture",
        "remove-background",
      ]);
      assert.deepEqual(capabilities.supportedRenderOptions, [
        "format",
        "fps",
        "quality",
        "workers",
        "docker",
        "hdr",
        "crf",
        "video-bitrate",
        "gpu",
        "quiet",
        "strict",
        "strict-all",
        "max-concurrent-renders",
      ]);
    },
  },
  {
    name: "fallback to plain hyperframes binary when no local install exists",
    run: () => {
      const capabilities = detectLocalHyperframesCapabilities({
        binary: "hyperframes",
        cwd: "F:/repo",
        now: () => "2026-04-22T09:00:00.000Z",
        exists: () => false,
        runner: (binary) => ({
          status: 0,
          stdout: `${binary} 0.4.12\n`,
          stderr: "",
        }),
      });

      assert.equal(capabilities.available, true);
      assert.equal(capabilities.binary, "hyperframes");
      assert.equal(capabilities.version, "0.4.12");
    },
  },
  {
    name: "detect runtime capabilities from the real local install",
    run: () => {
      const capabilities = detectLocalHyperframesCapabilities({
        cwd: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
      });

      assert.match(capabilities.binary, /hyperframes(\.cmd)?$/);
      assert.ok(capabilities.available === true || capabilities.available === false);
      assert.ok(capabilities.version === "0.5.5" || capabilities.version === "unknown");
    },
  },
  {
    name: "extract structured website content from HTML",
    run: () => {
      const extracted = extractWebsiteContent({
        url: "https://example.com/product",
        html: `
          <!doctype html>
          <html>
            <head>
              <title>Example Product</title>
              <meta name="description" content="A product landing page for founders." />
            </head>
            <body>
              <h1>Launch faster</h1>
              <p>Ship reusable video workflows.</p>
              <h2>Review gates</h2>
              <p>Keep output quality stable.</p>
            </body>
          </html>
        `,
      });

      assert.equal(extracted.title, "Example Product");
      assert.equal(extracted.summary, "A product landing page for founders.");
      assert.equal(extracted.sections.length, 2);
      assert.equal(extracted.sections[0]?.title, "Launch faster");
      assert.match(extracted.sections[0]?.body ?? "", /Ship reusable video workflows/);
    },
  },
  {
    name: "fetch and compile website input from a URL",
    run: async () => {
      const sourceBundle = await fetchWebsiteSourceBundle({
        url: "https://example.com/product",
        fetchImpl: async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Example Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          ),
      });

      assert.equal(sourceBundle.sourceType, "website");
      assert.equal(sourceBundle.rawInputs.title, "Example Product");
      assert.equal(sourceBundle.collectedArtifacts.length, 2);
    },
  },
  {
    name: "fail website fetch when extracted content is empty",
    run: async () => {
      await assert.rejects(
        () =>
          fetchWebsiteSourceBundle({
            url: "https://example.com/empty",
            fetchImpl: async () =>
              new Response("<html><head></head><body></body></html>", {
                status: 200,
                headers: { "Content-Type": "text/html" },
              }),
          }),
        /Extracted website content is empty/,
      );
    },
  },
  {
    name: "fail website fetch when response is not HTML",
    run: async () => {
      await assert.rejects(
        () =>
          fetchWebsiteSourceBundle({
            url: "https://example.com/data.json",
            fetchImpl: async () =>
              new Response('{"ok":true}', {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
          }),
        /Expected HTML content/,
      );
    },
  },
  {
    name: "compile thread input into a SourceBundle",
    run: () => {
      const sourceBundle = compileThreadSourceBundle({
        text: `
1. Teams keep shipping one-off launch videos.

2. We need reusable production systems instead of ad hoc editing.

3. Framepack compiles content into executable video projects.
        `,
      });

      assert.equal(sourceBundle.sourceType, "thread");
      assert.equal(sourceBundle.collectedArtifacts.length, 3);
      assert.equal(sourceBundle.collectedArtifacts[0]?.title, "Post 1");
      assert.match(sourceBundle.collectedArtifacts[2]?.body ?? "", /Framepack compiles content/);
    },
  },
  {
    name: "reject empty thread input during ingest",
    run: () => {
      assert.throws(
        () =>
          compileThreadSourceBundle({
            text: " \n\n ",
          }),
        /Thread input is empty/,
      );
    },
  },
  {
    name: "compile a VideoBrief from a thread SourceBundle",
    run: () => {
      const result = compileThreadVideoBrief({
        text: `
Teams keep shipping one-off launch videos.

We need reusable production systems instead of ad hoc editing.

Framepack compiles content into executable video projects.
        `,
        defaults: {
          goal: "Explain the thread",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(result.sourceBundle.sourceType, "thread");
      assert.equal(result.brief.goal, "Explain the thread");
      assert.equal(result.brief.sourceMaterials.length, 3);
      assert.equal(result.brief.sourceMaterials[0]?.kind, "structured");
    },
  },
  {
    name: "compile thread input into a case-explainer project package",
    run: () => {
      const result = compileThreadCaseExplainerProject({
        text: `
Teams keep shipping one-off launch videos.

We need reusable production systems instead of ad hoc editing.

Framepack compiles content into executable video projects.
        `,
        projectName: "thread-case-video",
        defaults: {
          goal: "Explain the thread",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(result.validationReport.status, "passed");
      assert.match(result.package.files["SOURCE_MANIFEST.json"], /"sourceType": "thread"/);
      assert.match(result.package.files["SOURCE_MANIFEST.json"], /"posts": \[/);
      assert.match(result.package.files["PACKAGE_MANIFEST.json"], /"sourceType": "thread"/);
      assert.match(result.package.files["PACKAGE_MANIFEST.json"], /"compose-text-card"/);
      assert.match(result.package.files["VIDEO_BRIEF.json"], /"goal": "Explain the thread"/);
      assert.match(result.package.files["SCENE_PLAN.json"], /post-1-card/);
      assert.match(result.package.files["ASSET_PLAN.json"], /compose:post-1-card/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"recommendedAssets": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"assets": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"executionKind": "compose-text-card"/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"suggestedAsset": "post-1-card"/);
      assert.match(result.package.files["SOURCE_SCENE_MAP.json"], /"sourceType": "thread"/);
      assert.match(result.package.files["SOURCE_SCENE_MAP.json"], /"sourceLabel": "Post 1"/);
    },
  },
  {
    name: "compile website input into a SourceBundle",
    run: () => {
      const sourceBundle = compileWebsiteSourceBundle({
        url: "https://example.com/product",
        title: "Example Product",
        summary: "A product landing page for founders.",
        sections: [
          { title: "Hero", body: "Launch faster with a reusable workflow." },
          { title: "Features", body: "Templates, video output, and review gates." },
        ],
      });

      assert.equal(sourceBundle.sourceType, "website");
      assert.equal(sourceBundle.rawInputs.url, "https://example.com/product");
      assert.equal(sourceBundle.collectedArtifacts.length, 2);
      assert.equal(sourceBundle.collectedArtifacts[0]?.title, "Hero");
    },
  },
  {
    name: "compile a VideoBrief from a website SourceBundle",
    run: () => {
      const sourceBundle = compileWebsiteSourceBundle({
        url: "https://example.com/product",
        title: "Example Product",
        summary: "A product landing page for founders.",
        sections: [
          { title: "Hero", body: "Launch faster with a reusable workflow." },
          { title: "Features", body: "Templates, video output, and review gates." },
        ],
      });

      const brief = compileVideoBrief({
        sourceBundle,
        defaults: {
          goal: "Explain the product",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(brief.goal, "Explain the product");
      assert.equal(brief.sourceMaterials.length, 2);
      assert.equal(brief.sourceMaterials[0]?.kind, "structured");
      assert.match(brief.sourceMaterials[0]?.body ?? "", /https:\/\/example\.com\/product/);
    },
  },
  {
    name: "compile website input through the compiler entrypoint",
    run: () => {
      const result = compileWebsiteVideoBrief({
        url: "https://example.com/product",
        title: "Example Product",
        summary: "A product landing page for founders.",
        sections: [
          { title: "Hero", body: "Launch faster with a reusable workflow." },
        ],
        defaults: {
          goal: "Explain the product",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(result.sourceBundle.sourceType, "website");
      assert.equal(result.brief.goal, "Explain the product");
      assert.equal(result.brief.sourceMaterials.length, 1);
    },
  },
  {
    name: "compile website input into a case-explainer project package",
    run: async () => {
      const result = await compileWebsiteCaseExplainerProject({
        url: "https://example.com/product",
        projectName: "website-case-video",
        defaults: {
          goal: "Explain the product",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
        fetchImpl: async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Example Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          ),
      });

      assert.equal(result.brief.goal, "Explain the product");
      assert.equal(result.validationReport.status, "passed");
      assert.match(result.package.files["SOURCE_MANIFEST.json"], /"sourceType": "website"/);
      assert.match(result.package.files["SOURCE_MANIFEST.json"], /"url": "https:\/\/example.com\/product"/);
      assert.match(result.package.files["PACKAGE_MANIFEST.json"], /"sourceType": "website"/);
        assert.match(result.package.files["PACKAGE_MANIFEST.json"], /"ASSET_EXECUTION_PLAN.json"/);
        assert.match(result.package.files["PACKAGE_MANIFEST.json"], /"RUNTIME_MANIFEST.json"/);
        assert.match(result.package.files["RUNTIME_MANIFEST.json"], /"version": "framepack.runtime-manifest.v1"/);
        assert.match(result.package.files["RUNTIME_MANIFEST.json"], /"backend": "hyperframes"/);
        assert.match(result.package.files["PACKAGE_MANIFEST.json"], /"capture-screenshot"/);
      assert.match(result.package.files["ASSET_PLAN.json"], /"captureTargets": \[/);
      assert.match(result.package.files["ASSET_PLAN.json"], /"purposeTag": "hero"/);
      assert.match(result.package.files["ASSET_PLAN.json"], /"assetForm": "screenshot"/);
      assert.match(result.package.files["ASSET_EXECUTION_PLAN.json"], /"items": \[/);
      assert.match(result.package.files["ASSET_EXECUTION_PLAN.json"], /"executionKind": "capture-screenshot"/);
      assert.match(result.package.files["ASSET_EXECUTION_PLAN.json"], /assets[\\/]+captures[\\/]+launch-faster-capture\.png/);
      assert.match(result.package.files["ASSET_EXECUTION_PLAN.json"], /"recommendedSceneIds": \[/);
      assert.match(result.package.files["ASSET_EXECUTION_PLAN.json"], /"rationale": /);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"scenes": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"captures": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"sceneId": "scene-1"/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"suggestedAsset": "launch-faster-capture"/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"recommendedAssets": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"assets": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"executionKind": "capture-screenshot"/);
      assert.match(result.package.files["SOURCE_SCENE_MAP.json"], /"sourceType": "website"/);
      assert.match(result.package.files["SOURCE_SCENE_MAP.json"], /"sourceLabel": "Launch faster"/);
      assert.match(result.package.files["HANDOFF.md"], /Capture targets:/);
      assert.match(result.package.files["HANDOFF.md"], /ASSET_EXECUTION_PLAN.json/);
      assert.match(result.package.files["HANDOFF.md"], /SCENE_ASSET_MAP.json/);
      assert.match(result.package.files["HANDOFF.md"], /SOURCE_SCENE_MAP.json/);
      assert.match(result.package.files["HANDOFF.md"], /scene-1, scene-2/);
      assert.match(result.package.files["HANDOFF.md"], /hero/);
      assert.match(result.package.files["HANDOFF.md"], /screenshot/);
    },
  },
  {
    name: "fail website project compilation when fetch fails",
    run: async () => {
      await assert.rejects(
        () =>
          compileWebsiteCaseExplainerProject({
            url: "https://example.com/missing",
            projectName: "website-case-video",
            defaults: {
              goal: "Explain the product",
              audience: "Founders",
              format: "16:9",
              outputType: "case-explainer",
            },
            fetchImpl: async () =>
              new Response("nope", {
                status: 404,
              }),
          }),
        /Failed to fetch website/,
      );
    },
  },
  {
    name: "compile markdown into a SourceBundle",
    run: () => {
      const sourceBundle = compileMarkdownSourceBundle({
        markdown: "# Problem\nTeams need reusable video output.",
      });

      assert.equal(sourceBundle.sourceType, "markdown");
      assert.equal(sourceBundle.rawInputs.markdown, "# Problem\nTeams need reusable video output.");
      assert.equal(sourceBundle.collectedArtifacts.length, 1);
    },
  },
  {
    name: "compile a VideoBrief from a SourceBundle",
    run: () => {
      const sourceBundle = compileMarkdownSourceBundle({
        markdown:
          "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
      });

      const brief = compileVideoBrief({
        sourceBundle,
        defaults: {
          goal: "Explain the solution",
          audience: "Internal team",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(brief.goal, "Explain the solution");
      assert.equal(brief.outputType, "case-explainer");
      assert.equal(brief.sourceMaterials.length, 2);
      assert.deepEqual(brief.constraints, {
        maxDurationSec: 60,
        requiredPoints: [],
        bannedTerms: [],
      });
    },
  },
  {
    name: "normalize markdown into a case-explainer VideoBrief",
    run: () => {
      const brief = normalizeVideoBriefInput({
        inputType: "markdown",
        markdown:
          "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
        defaults: {
          goal: "Explain the solution",
          audience: "Internal team",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(brief.outputType, "case-explainer");
      assert.equal(brief.goal, "Explain the solution");
      assert.equal(brief.sourceMaterials.length, 2);
      assert.deepEqual(brief.style, {
        tone: "direct",
        pacing: "medium",
        brandName: "Studio",
      });
    },
  },
  {
    name: "reject unsupported output types in markdown normalization",
    run: () => {
      assert.throws(
        () =>
          normalizeVideoBriefInput({
            inputType: "markdown",
            markdown: "# Problem\nTeams need reusable video output.",
            defaults: {
              goal: "Explain the solution",
              audience: "Internal team",
              format: "16:9",
              outputType: "product-demo",
            },
          }),
        /Video brief compilation only supports case-explainer outputType/,
      );
    },
  },
  {
    name: "reject unsupported output types in website brief compilation",
    run: () => {
      assert.throws(
        () =>
          compileWebsiteVideoBrief({
            url: "https://example.com/product",
            title: "Example Product",
            summary: "A product landing page for founders.",
            sections: [
              { title: "Hero", body: "Launch faster with a reusable workflow." },
            ],
            defaults: {
              goal: "Explain the product",
              audience: "Founders",
              format: "16:9",
              outputType: "product-demo",
            },
          }),
        /Video brief compilation only supports case-explainer outputType/,
      );
    },
  },
  {
    name: "parse fixture markdown into three source materials",
    run: () => {
      const markdown = readFileSync(fixturePath, "utf8");
      const brief = normalizeVideoBriefInput({
        inputType: "markdown",
        markdown,
        defaults: {
          goal: "Explain the case",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.deepEqual(
        brief.sourceMaterials.map((material) => material.title),
        ["Problem", "Solution", "Success Criteria"],
      );
    },
  },
  {
    name: "skip empty titled markdown sections",
    run: () => {
      const materials = parseMarkdownSourceMaterials(
        "# Problem\n\n# Solution\nUse Studio plus HyperFrames.",
      );

      assert.equal(materials.length, 1);
      assert.equal(materials[0]?.title, "Solution");
    },
  },
  {
    name: "plan the fixed first-version scene sequence",
    run: () => {
      const plan = planCaseExplainerScenes({
        goal: "Explain the case",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [{ kind: "markdown", title: "Case", body: "# Problem\nA\n# Solution\nB" }],
        constraints: { maxDurationSec: 61, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      assert.equal(plan.totalDurationSec, 60);
      assert.equal(plan.scenes.length, 6);
      assert.deepEqual(plan.scenes.map((scene) => scene.visualType), [
        "cover",
        "problem",
        "solution",
        "workflow",
        "highlights",
        "ending",
      ]);
    },
  },
  {
    name: "plan website-aware scene details from structured source materials",
    run: () => {
      const plan = planCaseExplainerScenes({
        goal: "Explain the site",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [
          { kind: "structured", title: "Launch faster", body: "Hero section for the landing page." },
          { kind: "structured", title: "How it works", body: "A clear workflow with steps and process." },
          { kind: "structured", title: "Customer proof", body: "Review evidence and customer result." },
          { kind: "structured", title: "Big result", body: "Highlight the final impact." },
        ],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      assert.match(plan.scenes[0]?.narration ?? "", /Launch faster/);
      assert.match((plan.scenes[0]?.onScreenText ?? []).join(" "), /Launch faster/);
      assert.ok((plan.scenes[0]?.assets ?? []).includes("launch-faster-capture"));
      assert.match(plan.scenes[3]?.narration ?? "", /How it works/);
      assert.ok((plan.scenes[3]?.assets ?? []).includes("how-it-works-capture"));
      assert.match(plan.scenes[4]?.narration ?? "", /Customer proof|Big result/);
      assert.ok((plan.scenes[4]?.assets ?? []).length > 0);
      assert.match((plan.scenes[0]?.validationNotes ?? []).join(" "), /source material/i);
    },
  },
  {
    name: "build script, storyboard, and asset plan from a scene plan",
    run: () => {
      const scenePlan = planCaseExplainerScenes({
        goal: "Explain the case",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [{ kind: "markdown", title: "Case", body: "# Problem\nA\n# Solution\nB" }],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      const script = buildScript({ scenePlan });
      const storyboard = buildStoryboard({ scenePlan });
      const assetPlan = buildAssetPlan({ scenePlan });

      assert.equal(script.scenes.length, scenePlan.scenes.length);
      assert.equal(storyboard.scenes.length, scenePlan.scenes.length);
      assert.equal(assetPlan.availableAssets.length, 0);
      assert.equal(assetPlan.placeholderAssets.length, scenePlan.scenes.length);
      assert.equal(assetPlan.captureTargets.length, 0);
    },
  },
  {
    name: "build website asset plan with capture targets from source manifest",
    run: () => {
      const scenePlan = planCaseExplainerScenes({
        goal: "Explain the site",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [{ kind: "structured", title: "Hero", body: "Launch faster" }],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      const assetPlan = buildAssetPlan({
        scenePlan,
        sourceManifest: {
          sourceType: "website",
          url: "https://example.com/product",
          title: "Example Product",
          summary: "A product landing page for founders.",
          sections: [
            { title: "Hero", body: "Launch faster with reusable workflows." },
            { title: "Review gates", body: "Keep output quality stable." },
          ],
          collectedAt: "2026-04-22T12:00:00.000Z",
        },
      });

      assert.equal(assetPlan.captureTargets.length, 2);
      assert.equal(assetPlan.captureTargets[0]?.sourceUrl, "https://example.com/product");
      assert.match(assetPlan.captureTargets[0]?.suggestedAsset ?? "", /hero/i);
      assert.equal(assetPlan.captureTargets[0]?.purposeTag, "hero");
      assert.equal(assetPlan.captureTargets[0]?.assetForm, "screenshot");
      assert.deepEqual(assetPlan.captureTargets[0]?.recommendedSceneIds, ["scene-1", "scene-2"]);
      assert.match(assetPlan.captureTargets[0]?.rationale ?? "", /early story beats/i);
      assert.equal(assetPlan.captureTargets[1]?.purposeTag, "proof");
      assert.equal(assetPlan.captureTargets[1]?.assetForm, "text-overlay");
      assert.deepEqual(assetPlan.captureTargets[1]?.recommendedSceneIds, ["scene-3", "scene-4", "scene-5"]);
      assert.ok(assetPlan.missingAssets.some((item) => item.includes("capture:hero")));
    },
  },
  {
    name: "fall back website capture tags conservatively when no strong rule matches",
    run: () => {
      const scenePlan = planCaseExplainerScenes({
        goal: "Explain the site",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [{ kind: "structured", title: "Overview", body: "General overview" }],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      const assetPlan = buildAssetPlan({
        scenePlan,
        sourceManifest: {
          sourceType: "website",
          url: "https://example.com/product",
          title: "Example Product",
          summary: "A product landing page for founders.",
          sections: [
            { title: "Overview", body: "General overview and positioning." },
            { title: "More details", body: "Additional information without special signals." },
            { title: "Closing note", body: "A general closing section." },
          ],
          collectedAt: "2026-04-22T12:00:00.000Z",
        },
      });

      assert.equal(assetPlan.captureTargets[1]?.purposeTag, "highlight");
      assert.equal(assetPlan.captureTargets[1]?.assetForm, "section-card");
    },
  },
  {
    name: "reject unsupported scene-planning output types",
    run: () => {
      assert.throws(
        () =>
          planCaseExplainerScenes({
            goal: "Explain the case",
            audience: "Founders",
            format: "16:9",
            style: { tone: "direct", pacing: "medium", brandName: "Studio" },
            sourceMaterials: [],
            constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
            outputType: "product-demo",
          }),
        /planCaseExplainerScenes only supports case-explainer briefs/,
      );
    },
  },
  {
    name: "validate scene plans",
    run: () => {
      const issues = validateScenePlan(
        {
          totalDurationSec: 60,
          scenes: [
            {
              sceneId: "scene-1",
              purpose: "cover",
              startTimeSec: 0,
              durationSec: 40,
              narration: "Intro",
              onScreenText: ["Intro"],
              visualType: "cover",
              assets: [],
              transition: "fade",
              validationNotes: [],
            },
            {
              sceneId: "scene-2",
              purpose: "problem",
              startTimeSec: 40,
              durationSec: 30,
              narration: "Problem",
              onScreenText: ["Problem"],
              visualType: "problem",
              assets: [],
              transition: "fade",
              validationNotes: [],
            },
          ],
        },
        { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
      );

      assert.ok(issues.includes("total duration exceeds maxDurationSec"));
      assert.ok(issues.includes("total duration does not match sum of scene durations"));
    },
  },
  {
    name: "compile composition specs for 16:9 and 9:16",
    run: () => {
      const wide = compileCompositionSpec({
        format: "16:9",
        totalDurationSec: 60,
        scenes: [],
      });
      const tall = compileCompositionSpec({
        format: "9:16",
        totalDurationSec: 45,
        scenes: [],
      });

      assert.equal(wide.width, 1920);
      assert.equal(wide.height, 1080);
      assert.equal(tall.width, 1080);
      assert.equal(tall.height, 1920);
    },
  },
  {
    name: "emit HyperFrames composition HTML and commands",
    run: () => {
      const output = emitHyperframesComposition({
        width: 1920,
        height: 1080,
        fps: 30,
        durationSec: 60,
        scenes: [
          {
            sceneId: "scene-1",
            htmlTemplate: "<section>Intro</section>",
            cssClassNames: ["cover"],
            assetRefs: [],
          },
        ],
        theme: { palette: "default" },
      });

      assert.match(output.html, /<!doctype html>/i);
      assert.match(output.html, /data-composition-id="case-explainer"/);
      assert.match(output.html, /data-start="0"/);
      assert.match(output.html, /data-duration="60"/);
      assert.match(output.html, /window\.__timelines/);
      assert.match(output.html, /window\.__timelines\["case-explainer"\]/);
      assert.deepEqual(output.commands, {
        preview: "npx hyperframes preview",
        lint: "npx hyperframes lint",
        validate: "npx hyperframes validate",
        render: "npx hyperframes render",
      });
    },
  },
  {
    name: "detect runtime capabilities and map package metadata",
    run: () => {
      const capabilities = detectHyperframesCapabilities();
      const adapter = createHyperframesRuntimeAdapter();
      const runtimeInfo = adapter.describePackage({
        projectName: "case-video",
      });

      assert.ok(capabilities.available === true || capabilities.available === false);
      assert.match(capabilities.binary, /hyperframes(\.cmd)?$/);
      assert.ok(capabilities.version === "0.5.5" || capabilities.version === "unknown");
      assert.ok(capabilities.detectedAt.length > 0);
      assert.ok(capabilities.supportedCommands.includes("preview"));
      assert.ok(capabilities.supportedCommands.includes("inspect"));
      assert.ok(capabilities.supportedRenderOptions.includes("strict-all"));
      assert.equal(runtimeInfo.rootEntry, "index.html");
      assert.equal(runtimeInfo.compositionDirectory, "compositions");
      assert.equal(runtimeInfo.assetDirectory, "assets");
    },
  },
  {
    name: "build runtime command specs from package metadata",
    run: () => {
      const commandSpec = buildHyperframesCommandSpec({
        action: "preview",
        packageDirectory: "/tmp/case-video",
        packageRuntimeInfo: {
          rootEntry: "index.html",
          compositionDirectory: "compositions",
          assetDirectory: "assets",
        },
        capabilities: {
          available: true,
          binary: "hyperframes",
          detectedAt: "2026-04-22T09:00:00.000Z",
          version: "0.4.11",
          supportedCommands: ["preview", "lint", "validate", "render"],
          supportedCatalogFeatures: [],
          supportedRenderOptions: [],
          fallbackNotes: [],
        },
        passthroughArgs: ["--port", "3010"],
      });

      assert.equal(commandSpec.executable, "hyperframes");
      assert.deepEqual(commandSpec.args, ["preview", "--port", "3010", "/tmp/case-video"]);
      assert.equal(commandSpec.cwd, "/tmp/case-video");
      assert.match(commandSpec.summary, /hyperframes preview --port 3010 \/tmp\/case-video/);
    },
  },
  {
    name: "build render command specs with output passthrough",
    run: () => {
      const commandSpec = buildHyperframesCommandSpec({
        action: "render",
        packageDirectory: "/tmp/case-video",
        packageRuntimeInfo: {
          rootEntry: "index.html",
          compositionDirectory: "compositions",
          assetDirectory: "assets",
        },
        capabilities: {
          available: true,
          binary: "hyperframes",
          detectedAt: "2026-04-22T09:00:00.000Z",
          version: "0.4.11",
          supportedCommands: ["preview", "lint", "validate", "render"],
          supportedCatalogFeatures: [],
          supportedRenderOptions: [],
          fallbackNotes: [],
        },
        passthroughArgs: ["--output", "renders/out.mp4"],
      });

      assert.deepEqual(commandSpec.args, ["render", "--output", "renders/out.mp4", "/tmp/case-video"]);
      assert.match(commandSpec.summary, /hyperframes render --output renders\/out\.mp4 \/tmp\/case-video/);
    },
  },
  {
    name: "build extended runtime command specs for HyperFrames 0.5 commands",
    run: () => {
      const baseInput = {
        packageDirectory: "/tmp/case-video",
        packageRuntimeInfo: {
          rootEntry: "index.html",
          compositionDirectory: "compositions",
          assetDirectory: "assets",
        },
        capabilities: {
          available: true,
          binary: "hyperframes",
          detectedAt: "2026-05-11T00:00:00.000Z",
          version: "0.5.5",
          supportedCommands: ["preview", "lint", "validate", "render", "inspect", "snapshot", "upgrade"],
          supportedCatalogFeatures: [],
          supportedRenderOptions: ["format", "fps", "quality", "strict"],
          fallbackNotes: [],
        },
      };

      assert.deepEqual(
        buildHyperframesCommandSpec({
          ...baseInput,
          action: "lint",
        }).args,
        ["lint", "/tmp/case-video"],
      );
      assert.deepEqual(
        buildHyperframesCommandSpec({
          ...baseInput,
          action: "inspect",
          passthroughArgs: ["--json", "--samples", "9"],
        }).args,
        ["inspect", "--json", "--samples", "9", "/tmp/case-video"],
      );
      assert.deepEqual(
        buildHyperframesCommandSpec({
          ...baseInput,
          action: "snapshot",
          passthroughArgs: ["--frames", "5"],
        }).args,
        ["snapshot", "--frames", "5", "/tmp/case-video"],
      );
      assert.deepEqual(
        buildHyperframesCommandSpec({
          ...baseInput,
          action: "upgrade-check",
        }).args,
        ["upgrade", "--check", "--json"],
      );
    },
  },
  {
    name: "normalize runtime execution results",
    run: () => {
      const result = executeHyperframesCommand({
        command: {
          action: "render",
          executable: "hyperframes",
          args: ["render", "index.html"],
          cwd: "/tmp/case-video",
          summary: "hyperframes render index.html",
        },
        runner: () => ({
          status: 0,
          stdout: "render complete",
          stderr: "",
        }),
      });

      assert.equal(result.action, "render");
      assert.equal(result.success, true);
      assert.equal(result.exitCode, 0);
      assert.equal(result.summary, "hyperframes render index.html");
      assert.equal(result.stdout, "render complete");
    },
  },
  {
    name: "create and write the video project package",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-"));

      try {
        const projectPackage = createVideoProjectPackage({
          projectName: "case-video",
          brief: {
            goal: "Explain the case",
            audience: "Founders",
            format: "16:9",
            style: { tone: "direct", pacing: "medium", brandName: "Studio" },
            sourceMaterials: [],
            constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
            outputType: "case-explainer",
          },
          scenePlan: { totalDurationSec: 60, scenes: [] },
          script: { scenes: [] },
          storyboard: { scenes: [] },
          assetPlan: { availableAssets: [], placeholderAssets: [], missingAssets: [], captureTargets: [] },
          validationReport: {
            projectName: "case-video",
            status: "passed",
            sceneCount: 0,
            totalDurationSec: 60,
            issues: [],
            generatedAt: "2026-04-21T00:00:00.000Z",
          },
          compositionHtml: "<div></div>",
        });

        const writtenDir = writeVideoProjectPackage(tempRoot, projectPackage);

        assert.equal(projectPackage.projectName, "case-video");
        assert.match(readFileSync(join(writtenDir, "FLYWHEEL.md"), "utf8"), /Intake -> Plan/);
        assert.match(readFileSync(join(writtenDir, "SCRIPT.md"), "utf8"), /# Script/);
        assert.match(readFileSync(join(writtenDir, "STORYBOARD.md"), "utf8"), /# Storyboard/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /Validation status: passed/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /Runtime available: (true|false)/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /framepack repair --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /does not generate assets/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /runtime doctor --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /runtime lint --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /runtime inspect --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /runtime snapshot --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /runtime upgrade-check/);
        assert.match(readFileSync(join(writtenDir, "hyperframes.json"), "utf8"), /"assets": "assets"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"rootEntry": "index.html"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"runtime": "hyperframes"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"supportedCommands": \[/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"binary": ".*hyperframes(\.cmd)?"/);
        assert.equal(existsSync(join(writtenDir, "assets")), true);
        assert.equal(existsSync(join(writtenDir, "compositions")), true);
        assert.match(readFileSync(join(writtenDir, "GUARDRAILS.md"), "utf8"), /Max duration: 60s/);
        assert.match(readFileSync(join(writtenDir, "GUARDRAILS.md"), "utf8"), /Latest validation: passed/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /# Runtime Commands/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /# Package Lifecycle Commands/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /framepack repair --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /repair derived protocol files/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /framepack runtime lint --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /framepack runtime inspect --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /framepack runtime snapshot --project-dir <path>/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /framepack runtime upgrade-check/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /publish exists in HyperFrames 0\.5\.5/);
        assert.doesNotMatch(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /framepack publish/);
        assert.match(
          readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"),
          /hyperframes(\.cmd)? preview case-video/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "run the full first-version pipeline",
    run: () => {
      const result = buildCaseExplainerVideoProject({
        inputType: "markdown",
        markdown:
          "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
        defaults: {
          goal: "Explain the system",
          audience: "Internal team",
          format: "16:9",
          outputType: "case-explainer",
        },
        projectName: "case-video",
      });

      assert.equal(result.scenePlan.scenes.length, 6);
      assert.equal(result.script.scenes.length, 6);
      assert.equal(result.storyboard.scenes.length, 6);
      assert.equal(result.assetPlan.placeholderAssets.length, 6);
      assert.equal(result.spec.width, 1920);
      assert.equal(result.validationReport.status, "passed");
      assert.match(result.package.files["index.html"], /data-composition-id/);
      assert.match(result.package.files["VALIDATION_REPORT.json"], /"status": "passed"/);
    },
  },
  {
    name: "document runtime prerequisites in the README",
    run: () => {
      const readme = readFileSync(readmePath, "utf8");

      assert.match(readme, /Agents should start with \[AGENTS\.md\]/);
      assert.match(readme, /npx framepack generate/);
      assert.match(readme, /HyperFrames is required for runtime execution/);
      assert.match(readme, /runtime doctor/);
      assert.match(readme, /capture --project-dir/);
      assert.match(readme, /sync-assets/);
      assert.match(readme, /sync-captures` remains available as a compatibility alias/);
      assert.match(readme, /preview/);
      assert.match(readme, /render/);
      assert.match(readme, /generate --url/);
      assert.match(readme, /validate --url/);
      assert.match(readme, /thread-file/);
      assert.match(readme, /SOURCE_MANIFEST\.json/);
      assert.match(readme, /captureTargets/);
      assert.match(readme, /ASSET_EXECUTION_PLAN\.json/);
      assert.match(readme, /Asset forge layer/);
      assert.match(readme, /agent-sprite-forge/);
      assert.match(readme, /forge-map-pack/);
      assert.match(readme, /--game-ad-description/);
      assert.match(readme, /Playwright is required for automated asset materialization/);
    },
  },
  {
    name: "publish package metadata under the framepack identity",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const cliEntrypoint = readFileSync(join(dirname(packageJsonPath), "dist", "cli.js"), "utf8");

      assert.equal(packageJson.name, "framepack");
      assert.equal(packageJson.version, "0.4.0-alpha.3");
      assert.equal(packageJson.private, false);
      assert.equal(packageJson.bin.framepack, "dist/cli.js");
      assert.ok(cliEntrypoint.startsWith("#!/usr/bin/env node"));
      assert.ok(Array.isArray(packageJson.files));
      assert.ok(packageJson.files.includes("README.zh-CN.md"));
      assert.ok(packageJson.files.includes("AGENTS.md"));
      assert.ok(packageJson.files.includes("docs/architecture"));
      assert.ok(packageJson.files.includes("LICENSE"));
      assert.ok(packageJson.files.includes("examples"));
      assert.ok(packageJson.files.includes("dist"));
    },
  },
  {
    name: "expose first-run version and help commands for npm users",
    run: async () => {
      const versionStdout = [];
      const versionStderr = [];
      const versionExitCode = await runCli(["--version"], {
        stdout: (message) => versionStdout.push(message),
        stderr: (message) => versionStderr.push(message),
      });
      const helpStdout = [];
      const helpStderr = [];
      const helpExitCode = await runCli(["--help"], {
        stdout: (message) => helpStdout.push(message),
        stderr: (message) => helpStderr.push(message),
      });

      assert.equal(versionExitCode, 0);
      assert.deepEqual(versionStderr, []);
      assert.equal(versionStdout.join("\n").trim(), "0.4.0-alpha.3");
      assert.equal(helpExitCode, 0);
      assert.deepEqual(helpStderr, []);
      assert.match(helpStdout.join("\n"), /Framepack CLI/);
      assert.match(helpStdout.join("\n"), /npx -y -p framepack@alpha framepack --version/);
      assert.match(helpStdout.join("\n"), /npx -y -p framepack@alpha framepack --help/);
      assert.match(helpStdout.join("\n"), /npm exec --yes --package=framepack@alpha -- framepack mcp --describe/);
      assert.match(helpStdout.join("\n"), /release:scenarios/);
    },
  },
  {
    name: "publish a real install smoke script for release candidates",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const scriptPath = resolve(dirname(packageJsonPath), "scripts", "run-install-smoke.mjs");
      const script = readFileSync(scriptPath, "utf8");

      assert.equal(packageJson.scripts["release:smoke:install"], "npm run build && node scripts/run-install-smoke.mjs");
      assert.match(script, /npm pack/);
      assert.match(script, /npm install/);
      assert.match(script, /framepack/);
      assert.match(script, /--version/);
      assert.match(script, /--help/);
      assert.match(script, /release-smoke/);
      assert.match(script, /--auto-pack/);
      assert.match(script, /validate/);
      assert.match(script, /status/);
    },
  },
  {
    name: "publish a final release gate script for release candidates",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const scriptPath = resolve(dirname(packageJsonPath), "scripts", "run-release-gate.mjs");
      const script = readFileSync(scriptPath, "utf8");

      assert.equal(packageJson.scripts["release:gate"], "node scripts/run-release-gate.mjs");
      assert.match(script, /npm run typecheck/);
      assert.match(script, /npm test/);
      assert.match(script, /npm pack --dry-run --json/);
      assert.match(script, /npm run release:smoke:install/);
      assert.match(script, /Release gate/);
    },
  },
  {
    name: "publish a three-scenario release test harness for v0.4 alpha",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const scriptPath = resolve(dirname(packageJsonPath), "scripts", "run-real-scenarios.mjs");
      const script = readFileSync(scriptPath, "utf8");
      const scenarioReport = readFileSync(framepack04ScenarioReportPath, "utf8");

      assert.equal(packageJson.scripts["release:scenarios"], "npm run build && node scripts/run-real-scenarios.mjs");
      assert.match(script, /markdown-product-explainer/);
      assert.match(script, /thread-editorial-video/);
      assert.match(script, /game-ad-sprite-video/);
      assert.match(script, /capabilityStackSelection/);
      assert.match(script, /validate/);
      assert.match(script, /status/);
      assert.match(scenarioReport, /markdown-product-explainer/);
      assert.match(scenarioReport, /thread-editorial-video/);
      assert.match(scenarioReport, /game-ad-sprite-video/);
      assert.match(scenarioReport, /npm run release:scenarios/);
      assert.match(scenarioReport, /v0\.4\.0-alpha\.1/);
    },
  },
  {
    name: "document the v0.4 alpha real user trial",
    run: () => {
      const trialReport = readFileSync(framepack04RealUserTrialPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.match(trialReport, /REAL-USER-TRIAL-03/);
      assert.match(trialReport, /0\.4\.0-alpha\.3/);
      assert.match(trialReport, /npm install framepack@alpha/);
      assert.match(trialReport, /npx framepack init-agent --target codex --scope project/);
      assert.match(trialReport, /npx framepack init-agent --target claude-code --scope project/);
      assert.match(trialReport, /forge-character-pack/);
      assert.match(trialReport, /forge-map-pack/);
      assert.match(trialReport, /forge-fx-pack/);
      assert.match(trialReport, /agent-sprite-forge/);
      assert.match(trialReport, /needs-assets/);
      assert.match(readme, /real-user-trial-v0\.4\.0-alpha\.3/);
      assert.match(chineseReadme, /real-user-trial-v0\.4\.0-alpha\.3/);
      assert.match(agents, /real-user-trial-v0\.4\.0-alpha\.3/);
    },
  },
  {
    name: "document the release candidate and next architecture uplift",
    run: () => {
      const previousReleaseDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "agent-platform", "release-candidate-v0.3.0-rc.1.md"),
        "utf8",
      );
      const previousAlphaDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "agent-platform", "release-candidate-v0.4.0-alpha.1.md"),
        "utf8",
      );
      const releaseDoc = readFileSync(framepack04AlphaNotesPath, "utf8");
      const upliftDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "architecture", "next-architecture-uplift.md"),
        "utf8",
      );
      const architectureDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "architecture", "framepack-0.4-capability-runtime-architecture.md"),
        "utf8",
      );

      assert.match(releaseDoc, /npm run release:gate/);
      assert.match(releaseDoc, /v0\.4\.0-alpha\.3/);
      assert.match(previousAlphaDoc, /v0\.4\.0-alpha\.1/);
      assert.match(releaseDoc, /Animation Capability Atlas/);
      assert.match(releaseDoc, /--help/);
      assert.match(releaseDoc, /--version/);
      assert.match(releaseDoc, /npx -y -p framepack@alpha framepack --version/);
      assert.match(releaseDoc, /npm exec --yes --package=framepack@alpha -- framepack mcp --describe/);
      assert.match(previousReleaseDoc, /v0\.3\.0-rc\.1/);
      assert.match(releaseDoc, /MCP/);
      assert.match(releaseDoc, /agent-sprite-forge/);
      assert.match(upliftDoc, /Framepack 0\.4/);
      assert.match(upliftDoc, /Architecture Learning Agenda/);
      assert.match(upliftDoc, /HyperFrames/);
      assert.match(upliftDoc, /agent-first/);
      assert.match(upliftDoc, /framepack-0\.4-capability-runtime-architecture/);
      assert.match(architectureDoc, /Capability Graph/);
      assert.match(architectureDoc, /RUNTIME_MANIFEST\.json/);
      assert.match(architectureDoc, /Template Pack Contract/);
      assert.match(architectureDoc, /MOTION_GRAMMAR\.json/);
      assert.match(architectureDoc, /Visual QA Evidence/);
      assert.match(architectureDoc, /Asset Forge Loop V2/);
      assert.match(architectureDoc, /MCP/);
      assert.match(architectureDoc, /HyperFrames/);
    },
  },
  {
    name: "document the Framepack 0.4 implementation plan",
    run: () => {
      const planDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "superpowers", "plans", "2026-05-19-framepack-0.4-capability-runtime-foundation.md"),
        "utf8",
      );

      assert.match(planDoc, /Framepack 0\.4 Capability Runtime Foundation Implementation Plan/);
      assert.match(planDoc, /CAPABILITY_GRAPH\.json/);
      assert.match(planDoc, /RUNTIME_MANIFEST\.json/);
      assert.match(planDoc, /Template Pack Contract/);
      assert.match(planDoc, /MOTION_GRAMMAR\.json/);
      assert.match(planDoc, /Visual QA Evidence/);
      assert.match(planDoc, /Asset Forge Loop V2/);
      assert.match(planDoc, /npm run release:gate/);
    },
  },
  {
    name: "document the Framepack 0.4 Agent Harness positioning",
    run: () => {
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");
      const architectureDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "architecture", "framepack-0.4-capability-runtime-architecture.md"),
        "utf8",
      );
      const planDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "superpowers", "plans", "2026-05-19-framepack-0.4-capability-runtime-foundation.md"),
        "utf8",
      );
      const changelog = readFileSync(resolve(dirname(packageJsonPath), "CHANGELOG.md"), "utf8");

      for (const doc of [readme, agents, architectureDoc, planDoc]) {
        assert.match(doc, /Agent Harness/);
        assert.match(doc, /Sense filter/);
        assert.match(doc, /Motor pathways/);
        assert.match(doc, /Reflexes/);
        assert.match(doc, /Memory encoding/);
        assert.match(doc, /Feedback loop/);
      }

      assert.match(readme, /Codex or Claude Code is the brain/);
      assert.match(readme, /Framepack is the video-production nervous system/);
      assert.match(architectureDoc, /field engineering rather than a fixed rail workflow/);
      assert.match(planDoc, /video production Agent Harness/);
      assert.match(chineseReadme, /视频生产垂类 Agent Harness/);
      assert.match(chineseReadme, /视频生产神经系统/);
      assert.match(chineseReadme, /感觉过滤器/);
      assert.match(chineseReadme, /运动通路/);
      assert.match(chineseReadme, /脊髓反射/);
      assert.match(chineseReadme, /记忆编码/);
      assert.match(chineseReadme, /反馈循环/);
      assert.match(changelog, /video production Agent Harness/);
    },
  },
  {
    name: "document the Framepack 0.4 alpha release candidate",
    run: () => {
      const notes = readFileSync(framepack04AlphaNotesPath, "utf8");

      assert.match(notes, /v0\.4\.0-alpha\.2/);
      assert.match(notes, /Animation Capability Atlas/);
      assert.match(notes, /capabilityStackSelection/);
      assert.match(notes, /first-run/);
      assert.match(notes, /npm run release:gate/);
      assert.match(notes, /does not install external skills/i);
      assert.match(notes, /does not publish or tag/i);
    },
  },
  {
    name: "ship agent and example entry files for the published repo",
    run: () => {
      const agents = readFileSync(agentsPath, "utf8");
      const threadExample = readFileSync(threadExamplePath, "utf8");
      const websiteExample = readFileSync(websiteExamplePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");

      assert.match(agents, /PACKAGE_MANIFEST\.json/);
      assert.match(agents, /HANDOFF\.md/);
      assert.match(agents, /capture --project-dir/);
      assert.match(agents, /sync-assets --project-dir/);
      assert.match(agents, /npx framepack generate --thread-file/);
      assert.match(agents, /--game-ad-description/);
      assert.match(agents, /agent-sprite-forge/);
      assert.match(agents, /forge-character-pack/);
      assert.match(threadExample, /Framepack turns content into executable video project packages/);
      assert.match(websiteExample, /Framepack Demo Site/);
      assert.match(chineseReadme, /Framepack 是一个面向 agent 的视频工程编译器/);
      assert.match(chineseReadme, /PACKAGE_MANIFEST\.json/);
      assert.match(chineseReadme, /agent-sprite-forge/);
    },
  },
  {
    name: "ship agent platform docs and templates for packaged installs",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      assert.ok(packageJson.files.includes("docs/agent-platform"));
      assert.ok(packageJson.files.includes("templates"));
      assert.match(readFileSync(resolve(dirname(packageJsonPath), "README.md"), "utf8"), /Install with Codex/);
      assert.match(readFileSync(resolve(dirname(packageJsonPath), "README.zh-CN.md"), "utf8"), /让 Codex 安装 Framepack/);
    },
  },
  {
    name: "describe the Framepack MCP surface for agent installers",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(["mcp", "--describe"], {
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      });
      const output = stdout.join("\n");

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.match(output, /generateProject/);
      assert.match(output, /getStatus/);
      assert.match(output, /getCapabilityGraph/);
      assert.match(output, /exposeArsenal/);
      assert.match(output, /listCapabilityAtlas/);
      assert.match(output, /getCapabilityAtlasNode/);
      assert.match(output, /recommendCapabilityStack/);
      assert.match(output, /runtimeSnapshot/);
      assert.match(output, /framepack:\/\/project\/\{projectName\}\/manifest/);
      assert.match(output, /framepack:\/\/project\/\{projectName\}\/capability-graph/);
      assert.match(output, /framepack:\/\/capabilities\/atlas/);
      assert.match(output, /create-game-ad-video/);
    },
  },
  {
    name: "report runtime availability from the CLI doctor command",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(["runtime", "doctor"], {
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      });

      assert.equal(exitCode, 0);
      assert.equal(stderr.length, 0);
      assert.match(stdout.join("\n"), /HyperFrames runtime/);
      assert.match(stdout.join("\n"), /available: (true|false)/);
      assert.match(stdout.join("\n"), /version: (0\.5\.5|unknown)/);
    },
  },
  {
    name: "report package protocol status from the CLI doctor command",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-doctor-package-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "doctor-case",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "doctor-case");
        const doctorExitCode = await runCli(
          ["runtime", "doctor", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(doctorExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /HyperFrames runtime/);
        assert.match(stdout.join("\n"), /Package protocol/);
        assert.match(stdout.join("\n"), /packageStatus: passed/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail CLI doctor when the package protocol is invalid",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-doctor-package-fail-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--thread-file",
            threadExamplePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the thread",
            "--audience",
            "Founders",
            "--project-name",
            "doctor-thread",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "doctor-thread");
        const manifestPath = join(projectDir, "PACKAGE_MANIFEST.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        manifest.protocolVersion = 99;
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

        const doctorExitCode = await runCli(
          ["runtime", "doctor", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(doctorExitCode, 1);
        assert.match(stdout.join("\n"), /HyperFrames runtime/);
        assert.match(stdout.join("\n"), /Package protocol/);
        assert.match(stdout.join("\n"), /packageStatus: failed/);
        assert.match(stderr.join("\n"), /protocolVersion/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "generate a package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-cli-"));

      try {
        const stdout = [];
        const stderr = [];

        const exitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "cli-case-video",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const packageDir = join(tempRoot, "cli-case-video");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(readFileSync(join(packageDir, "VIDEO_BRIEF.json"), "utf8"), /"goal": "Explain the case"/);
        assert.match(readFileSync(join(packageDir, "index.html"), "utf8"), /data-composition-id/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "generate a website package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-cli-url-"));
      const originalFetch = globalThis.fetch;

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const stdout = [];
        const stderr = [];
        const exitCode = await runCli(
          [
            "generate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            "cli-website-video",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const packageDir = join(tempRoot, "cli-website-video");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(readFileSync(join(packageDir, "SOURCE_MANIFEST.json"), "utf8"), /"sourceType": "website"/);
        assert.match(readFileSync(join(packageDir, "SOURCE_MANIFEST.json"), "utf8"), /"Website Product"/);
        assert.match(readFileSync(join(packageDir, "PACKAGE_MANIFEST.json"), "utf8"), /"protocol": "framepack.project-package"/);
        assert.match(readFileSync(join(packageDir, "ASSET_EXECUTION_PLAN.json"), "utf8"), /"status": "pending"/);
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "sync asset execution state from generated files",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-sync-captures-"));
      const originalFetch = globalThis.fetch;

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const projectName = "sync-website-video";
        const projectDir = join(tempRoot, projectName);
        const generateExitCode = await runCli(
          [
            "generate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            projectName,
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);
        writeFileSync(join(projectDir, "assets", "captures", "launch-faster-capture.png"), "fake", "utf8");

        const stdout = [];
        const stderr = [];
        const syncExitCode = await runCli(
          ["sync-assets", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(syncExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Asset sync updated/);
        assert.match(stdout.join("\n"), /1 available, 1 pending/);
        assert.match(readFileSync(join(projectDir, "ASSET_PLAN.json"), "utf8"), /"availableAssets": \[\s*"launch-faster-capture"/);
        assert.match(readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"), /"status": "available"/);
        assert.match(readFileSync(join(projectDir, "HANDOFF.md"), "utf8"), /ASSET_EXECUTION_PLAN.json/);
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "capture website project assets and write metadata",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-capture-project-"));
      const originalFetch = globalThis.fetch;

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const projectName = "captured-website-video";
        const projectDir = join(tempRoot, projectName);
        const generateExitCode = await runCli(
          [
            "generate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            projectName,
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const result = await captureWebsiteProject({
          projectDir,
          now: () => "2026-04-23T00:00:00.000Z",
          captureScreenshot: async ({ suggestedAsset, sectionTitle }) => ({
            image: Buffer.from(`capture:${suggestedAsset}:${sectionTitle}`),
            captureMode: "section-clip",
          }),
        });

        assert.equal(result.capturedCount, 2);
        assert.equal(result.availableCount, 2);
        assert.equal(result.pendingCount, 0);
        assert.match(
          readFileSync(join(projectDir, "assets", "captures", "launch-faster-capture.png"), "utf8"),
          /capture:launch-faster-capture:Launch faster/,
        );
        assert.match(
          readFileSync(join(projectDir, "assets", "captures", "launch-faster-capture.json"), "utf8"),
          /"captureMode": "section-clip"/,
        );
        assert.match(
          readFileSync(join(projectDir, "assets", "captures", "launch-faster-capture.json"), "utf8"),
          /"capturedAt": "2026-04-23T00:00:00.000Z"/,
        );
        assert.match(
          readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"),
          /"status": "available"/,
        );
        assert.match(
          readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"),
          /"executionKind": "capture-screenshot"/,
        );
        assert.match(
          readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"),
          /"recommendedSceneIds": \[\s*"scene-1",\s*"scene-2"/,
        );
        assert.match(
          readFileSync(join(projectDir, "ASSET_PLAN.json"), "utf8"),
          /"availableAssets": \[\s*"launch-faster-capture",\s*"review-gates-capture"/,
        );
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "capture website project assets from the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(
        ["capture", "--project-dir", "F:/repo/out/demo-project"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
        {
          captureProject: async ({ projectDir }) => ({
            projectDir,
            capturedCount: 2,
            availableCount: 3,
            pendingCount: 0,
          }),
        },
      );

      assert.equal(exitCode, 0);
      assert.equal(stderr.length, 0);
      assert.match(stdout.join("\n"), /Materialized 2 source assets/);
      assert.match(stdout.join("\n"), /3 available, 0 pending/);
    },
  },
  {
    name: "compose thread project assets and write metadata",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-compose-thread-"));
      const threadPath = join(tempRoot, "thread.txt");

      try {
        writeFileSync(
          threadPath,
          [
            "Teams keep shipping one-off launch videos.",
            "",
            "We need reusable production systems instead of ad hoc editing.",
            "",
            "Framepack compiles content into executable video projects.",
          ].join("\n"),
          "utf8",
        );

        const projectName = "thread-compose-video";
        const projectDir = join(tempRoot, projectName);
        const generateExitCode = await runCli(
          [
            "generate",
            "--thread-file",
            threadPath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the thread",
            "--audience",
            "Founders",
            "--project-name",
            projectName,
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const result = await composeThreadProject({
          projectDir,
          now: () => "2026-04-23T01:00:00.000Z",
          renderCard: async ({ suggestedAsset, text }) => ({
            image: Buffer.from(`card:${suggestedAsset}:${text}`),
            renderMode: "text-card",
          }),
        });

        assert.equal(result.composedCount, 3);
        assert.equal(result.availableCount, 3);
        assert.equal(result.pendingCount, 0);
        assert.match(
          readFileSync(join(projectDir, "assets", "generated", "post-1-card.png"), "utf8"),
          /card:post-1-card:Teams keep shipping one-off launch videos\./,
        );
        assert.match(
          readFileSync(join(projectDir, "assets", "generated", "post-1-card.json"), "utf8"),
          /"renderMode": "text-card"/,
        );
        assert.match(
          readFileSync(join(projectDir, "assets", "generated", "post-1-card.json"), "utf8"),
          /"composedAt": "2026-04-23T01:00:00.000Z"/,
        );
        assert.match(
          readFileSync(join(projectDir, "ASSET_PLAN.json"), "utf8"),
          /"availableAssets": \[\s*"post-1-card",\s*"post-2-card",\s*"post-3-card"/,
        );
        assert.doesNotMatch(
          readFileSync(join(projectDir, "ASSET_PLAN.json"), "utf8"),
          /compose:post-1-card/,
        );
        assert.match(
          readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"),
          /"executionKind": "compose-text-card"/,
        );
        assert.match(
          readFileSync(join(projectDir, "ASSET_EXECUTION_PLAN.json"), "utf8"),
          /"recommendedSceneIds": \[\s*"scene-1",\s*"scene-2"/,
        );
        assert.match(
          readFileSync(join(projectDir, "assets", "generated", "post-1-card.json"), "utf8"),
          /"recommendedSceneIds": \[\s*"scene-1",\s*"scene-2"/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "keep sync-captures as a compatibility alias",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(
        ["sync-captures", "--project-dir", "F:/repo/out/demo-project"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );

      assert.equal(exitCode, 1);
      assert.equal(stdout.length, 0);
      assert.match(stderr.join("\n"), /ENOENT|no such file/i);
    },
  },
  {
    name: "capture command composes thread project assets from the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(
        ["capture", "--project-dir", "F:/repo/out/thread-project"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
        {
          captureProject: async ({ projectDir }) => ({
            projectDir,
            composedCount: 3,
            availableCount: 3,
            pendingCount: 0,
          }),
        },
      );

      assert.equal(exitCode, 0);
      assert.equal(stderr.length, 0);
      assert.match(stdout.join("\n"), /Materialized 3 source assets/);
      assert.match(stdout.join("\n"), /3 available, 0 pending/);
    },
  },
  {
    name: "run extended HyperFrames runtime commands from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-runtime-commands-"));

      try {
        const projectDir = join(tempRoot, "runtime-case");
        mkdirSync(projectDir, { recursive: true });
        writeFileSync(
          join(projectDir, "meta.json"),
          JSON.stringify(
            {
              rootEntry: "index.html",
              compositionDirectory: "compositions",
              assetDirectory: "assets",
            },
            null,
            2,
          ),
          "utf8",
        );

        const commands = [];
        const dependencies = {
          detectRuntimeCapabilities: () => ({
            available: true,
            binary: "hyperframes",
            detectedAt: "2026-05-11T00:00:00.000Z",
            version: "0.5.5",
            supportedCommands: ["lint", "inspect", "snapshot", "upgrade"],
            supportedCatalogFeatures: [],
            supportedRenderOptions: ["format", "fps", "quality", "strict"],
            fallbackNotes: [],
          }),
          executeRuntimeCommand: ({ command }) => {
            commands.push(command);
            return {
              action: command.action,
              success: true,
              outputPaths: [],
              warnings: [],
              summary: command.summary,
              exitCode: 0,
              stdout: `${command.action} ok`,
              stderr: "",
            };
          },
        };

        assert.equal(await runCli(["runtime", "lint", "--project-dir", projectDir], { stdout: () => {}, stderr: () => {} }, dependencies), 0);
        assert.equal(
          await runCli(
            ["runtime", "inspect", "--project-dir", projectDir, "--json", "--samples", "9"],
            { stdout: () => {}, stderr: () => {} },
            dependencies,
          ),
          0,
        );
        assert.equal(
          await runCli(
            ["runtime", "snapshot", "--project-dir", projectDir, "--frames", "5"],
            { stdout: () => {}, stderr: () => {} },
            dependencies,
          ),
          0,
        );
        assert.equal(await runCli(["runtime", "upgrade-check"], { stdout: () => {}, stderr: () => {} }, dependencies), 0);

        assert.deepEqual(commands.map((command) => command.args), [
          ["lint", projectDir],
          ["inspect", "--json", "--samples", "9", projectDir],
          ["snapshot", "--frames", "5", projectDir],
          ["upgrade", "--check", "--json"],
        ]);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "pass extended render options through the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-render-options-"));

      try {
        const projectDir = join(tempRoot, "render-case");
        mkdirSync(projectDir, { recursive: true });
        writeFileSync(
          join(projectDir, "meta.json"),
          JSON.stringify(
            {
              rootEntry: "index.html",
              compositionDirectory: "compositions",
              assetDirectory: "assets",
            },
            null,
            2,
          ),
          "utf8",
        );

        let commandArgs = [];
        const dependencies = {
          detectRuntimeCapabilities: () => ({
            available: true,
            binary: "hyperframes",
            detectedAt: "2026-05-11T00:00:00.000Z",
            version: "0.5.5",
            supportedCommands: ["render"],
            supportedCatalogFeatures: [],
            supportedRenderOptions: ["format", "fps", "quality", "strict"],
            fallbackNotes: [],
          }),
          executeRuntimeCommand: ({ command }) => {
            commandArgs = command.args;
            return {
              action: command.action,
              success: true,
              outputPaths: [],
              warnings: [],
              summary: command.summary,
              exitCode: 0,
              stdout: "render ok",
              stderr: "",
            };
          },
        };

        const exitCode = await runCli(
          ["render", "--project-dir", projectDir, "--format", "webm", "--fps", "60", "--quality", "high", "--strict"],
          { stdout: () => {}, stderr: () => {} },
          dependencies,
        );

        assert.equal(exitCode, 0);
        assert.deepEqual(commandArgs, [
          "render",
          "--format",
          "webm",
          "--fps",
          "60",
          "--quality",
          "high",
          "--strict",
          projectDir,
        ]);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail preview when runtime is unavailable",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-preview-"));
      const previousCwd = process.cwd();

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "preview-case",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const stdout = [];
        const stderr = [];
        process.chdir(tempRoot);
        const previewExitCode = await runCli(
          ["preview", "--project-dir", join(tempRoot, "preview-case")],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(previewExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /HyperFrames runtime is unavailable/);
      } finally {
        process.chdir(previousCwd);
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail render when runtime is unavailable",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-render-"));
      const previousCwd = process.cwd();

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "render-case",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const stdout = [];
        const stderr = [];
        process.chdir(tempRoot);
        const renderExitCode = await runCli(
          ["render", "--project-dir", join(tempRoot, "render-case")],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(renderExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /HyperFrames runtime is unavailable/);
      } finally {
        process.chdir(previousCwd);
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail the CLI when required arguments are missing",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(["generate"], {
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      });

      assert.equal(exitCode, 1);
      assert.equal(stdout.length, 0);
      assert.match(stderr.join("\n"), /Missing required argument: --output-dir/);
    },
  },
  {
    name: "initialize a CLI project template",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-init-"));

      try {
        const stdout = [];
        const stderr = [];

        const exitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "starter", "--format", "9:16"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const projectDir = join(tempRoot, "starter");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Initialized project template/);
        assert.match(readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"), /"format": "9:16"/);
        assert.match(
          readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"),
          /"brandName": "Studio"/,
        );
        assert.match(
          readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"),
          /"palette": "default"/,
        );
        assert.match(
          readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"),
          /"maxDurationSec": 60/,
        );
        assert.match(readFileSync(join(projectDir, "input.md"), "utf8"), /# Problem/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "initialize Codex agent workflow files in a project",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-agent-codex-"));

      try {
        const stdout = [];
        const stderr = [];
        const exitCode = await runCli(
          ["init-agent", "--target", "codex", "--scope", "project", "--package-source", "npm"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
          {},
          { cwd: tempRoot },
        );

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.match(stdout.join("\n"), /Initialized Framepack agent workflow/);
        assert.match(readFileSync(join(tempRoot, "AGENTS.md"), "utf8"), /FRAMEPACK MANAGED BLOCK/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /generateProject/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "INSTALL.md"), "utf8"), /npx -y framepack mcp/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "initialize Claude Code preview MCP files in a project",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-agent-claude-"));

      try {
        const stdout = [];
        const stderr = [];
        const exitCode = await runCli(
          ["init-agent", "--target", "claude-code", "--scope", "project", "--package-source", "npm"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
          {},
          { cwd: tempRoot, platform: "win32" },
        );

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.match(readFileSync(join(tempRoot, "CLAUDE.md"), "utf8"), /Framepack/);
        const mcpConfig = JSON.parse(readFileSync(join(tempRoot, ".mcp.json"), "utf8"));
        assert.equal(mcpConfig.mcpServers.framepack.command, "cmd");
        assert.deepEqual(mcpConfig.mcpServers.framepack.args, ["/c", "npx", "-y", "framepack", "mcp"]);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "expose built-in workflow packs and creative direction packs",
    run: () => {
      const workflowPacks = listFramepackWorkflowPacks();
      const creativePacks = listFramepackCreativeDirectionPacks();

      assert.ok(workflowPacks.length >= 6);
      assert.deepEqual(
        workflowPacks.map((pack) => pack.id),
        [
          "product-explainer",
          "thread-to-video",
          "website-to-video",
          "game-ad-sprite-video",
          "course-promo",
          "launch-review",
          "investor-update",
        ],
      );
      assert.equal(workflowPacks.find((pack) => pack.id === "game-ad-sprite-video")?.recommendedForgeBackend, "agent-sprite-forge");
      assert.ok(
        workflowPacks
          .find((pack) => pack.id === "game-ad-sprite-video")
          ?.requiredExecutionKinds.includes("forge-character-pack"),
      );

      assert.ok(creativePacks.length >= 3);
      assert.ok(creativePacks.some((pack) => pack.id === "clean-saas-explainer"));
      assert.ok(creativePacks.some((pack) => pack.acceptanceCriteria.some((criterion) => criterion.includes("text"))));
    },
  },
  {
    name: "describe workflow packs through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        ["packs", "--json"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );

      assert.equal(exitCode, 0, stderr.join("\n"));
      const payload = JSON.parse(stdout.join("\n"));
      assert.equal(payload.workflowPacks[0].id, "product-explainer");
      assert.ok(payload.workflowPacks.some((pack) => pack.id === "game-ad-sprite-video"));
      assert.ok(payload.creativeDirectionPacks.some((pack) => pack.id === "game-ad-retro-arcade"));
    },
  },
  {
    name: "recommend workflow and creative direction packs from source intent",
    run: () => {
      const gameAdRecommendation = recommendFramepackPacks({
        sourceType: "game-ad",
        outputType: "game-ad",
        goal: "Promote a course with a game-style founder quest",
        audience: "Founders",
        format: "9:16",
      });
      const markdownRecommendation = recommendFramepackPacks({
        sourceType: "markdown",
        outputType: "case-explainer",
        goal: "Explain a B2B SaaS product launch",
        audience: "Operators",
        format: "16:9",
      });

      assert.equal(gameAdRecommendation.workflowPack.id, "game-ad-sprite-video");
      assert.equal(gameAdRecommendation.creativeDirectionPack.id, "game-ad-retro-arcade");
      assert.equal(gameAdRecommendation.packSelection.workflowPackId, "game-ad-sprite-video");
      assert.ok(gameAdRecommendation.reason.includes("sourceType game-ad"));
      assert.equal(markdownRecommendation.workflowPack.id, "product-explainer");
      assert.equal(markdownRecommendation.creativeDirectionPack.id, "clean-saas-explainer");
    },
  },
  {
    name: "describe pack recommendations through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        [
          "packs",
          "recommend",
          "--source-type",
          "game-ad",
          "--output-type",
          "game-ad",
          "--goal",
          "Promote a course with game-style visuals",
          "--audience",
          "Founders",
          "--format",
          "9:16",
          "--json",
        ],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );

      assert.equal(exitCode, 0, stderr.join("\n"));
      const payload = JSON.parse(stdout.join("\n"));
      assert.equal(payload.workflowPack.id, "game-ad-sprite-video");
      assert.equal(payload.creativeDirectionPack.id, "game-ad-retro-arcade");
      assert.equal(payload.packSelection.workflowPackId, "game-ad-sprite-video");
    },
  },
  {
    name: "resolve automatic pack selection with explicit ids taking priority",
    run: () => {
      const automaticSelection = resolveFramepackPackSelection({
        sourceType: "game-ad",
        outputType: "game-ad",
        goal: "Promote a course with game-style visuals",
        audience: "Founders",
        format: "9:16",
        autoRecommendPacks: true,
      });
      const explicitSelection = resolveFramepackPackSelection({
        sourceType: "markdown",
        outputType: "case-explainer",
        workflowPackId: "product-explainer",
        creativeDirectionPackId: "editorial-proof-story",
        autoRecommendPacks: true,
      });

      assert.equal(automaticSelection?.workflowPackId, "game-ad-sprite-video");
      assert.equal(automaticSelection?.creativeDirectionPackId, "game-ad-retro-arcade");
      assert.equal(explicitSelection?.workflowPackId, "product-explainer");
      assert.equal(explicitSelection?.creativeDirectionPackId, "editorial-proof-story");
    },
  },
  {
    name: "include workflow pack tools and resources in the MCP description",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        ["mcp", "--describe"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );
      const output = stdout.join("\n");

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.match(output, /listWorkflowPacks/);
      assert.match(output, /getWorkflowPack/);
      assert.match(output, /listCreativeDirectionPacks/);
      assert.match(output, /getCreativeDirectionPack/);
      assert.match(output, /recommendPacks/);
      assert.match(output, /listCapabilityAtlas/);
      assert.match(output, /recommendCapabilityStack/);
      assert.match(output, /releaseSmoke/);
      assert.match(output, /framepack:\/\/packs\/workflows/);
      assert.match(output, /framepack:\/\/packs\/creative-directions/);
      assert.match(output, /framepack:\/\/capabilities\/atlas/);
    },
  },
  {
    name: "validate CLI input without writing a package",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validate-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "validate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "validated-case",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const reportDir = join(tempRoot, "validated-case");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Validation passed/);
        assert.equal(existsSync(join(reportDir, "VIDEO_BRIEF.json")), false);
        assert.match(
          readFileSync(join(reportDir, "VALIDATION_REPORT.json"), "utf8"),
          /"status": "passed"/,
        );
        assert.match(
          readFileSync(join(reportDir, "VALIDATION_REPORT.md"), "utf8"),
          /# Validation Report/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate website CLI input without writing a package",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validate-url-"));
      const originalFetch = globalThis.fetch;
      const stdout = [];
      const stderr = [];

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const exitCode = await runCli(
          [
            "validate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            "validated-website",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const reportDir = join(tempRoot, "validated-website");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Validation passed/);
        assert.equal(existsSync(join(reportDir, "VIDEO_BRIEF.json")), false);
        assert.equal(existsSync(join(reportDir, "SOURCE_MANIFEST.json")), false);
        assert.match(readFileSync(join(reportDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "passed"/);
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "generate a thread package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-thread-generate-"));
      const threadPath = join(tempRoot, "thread.txt");

      try {
        writeFileSync(
          threadPath,
          [
            "Teams keep shipping one-off launch videos.",
            "",
            "We need reusable production systems instead of ad hoc editing.",
            "",
            "Framepack compiles content into executable video projects.",
          ].join("\n"),
          "utf8",
        );

        const stdout = [];
        const stderr = [];

        const exitCode = await runCli(
          [
            "generate",
            "--thread-file",
            threadPath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the thread",
            "--audience",
            "Founders",
            "--project-name",
            "thread-case",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const packageDir = join(tempRoot, "thread-case");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(readFileSync(join(packageDir, "SOURCE_MANIFEST.json"), "utf8"), /"sourceType": "thread"/);
        assert.match(readFileSync(join(packageDir, "SOURCE_MANIFEST.json"), "utf8"), /"posts": \[/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate thread CLI input without writing a package",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-thread-validate-"));
      const threadPath = join(tempRoot, "thread.txt");
      const stdout = [];
      const stderr = [];

      try {
        writeFileSync(
          threadPath,
          [
            "Teams keep shipping one-off launch videos.",
            "",
            "We need reusable production systems instead of ad hoc editing.",
            "",
            "Framepack compiles content into executable video projects.",
          ].join("\n"),
          "utf8",
        );

        const exitCode = await runCli(
          [
            "validate",
            "--thread-file",
            threadPath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the thread",
            "--audience",
            "Founders",
            "--project-name",
            "thread-validated",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const reportDir = join(tempRoot, "thread-validated");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Validation passed/);
        assert.equal(existsSync(join(reportDir, "VIDEO_BRIEF.json")), false);
        assert.equal(existsSync(join(reportDir, "SOURCE_MANIFEST.json")), false);
        assert.match(readFileSync(join(reportDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "passed"/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "reject conflicting CLI source arguments",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(
        [
            "generate",
            "--input",
            fixturePath,
            "--thread-file",
            fixturePath,
            "--url",
            "https://example.com/product",
            "--output-dir",
          "out",
          "--goal",
          "Explain the site",
          "--audience",
          "Founders",
        ],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );

      assert.equal(exitCode, 1);
      assert.equal(stdout.length, 0);
      assert.match(stderr.join("\n"), /Use exactly one source input: --config, --input, --thread-file, --url, or --game-ad-description/);
    },
  },
  {
    name: "generate a game-ad forge package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-game-ad-generate-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into agent-native video packages.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const packageDir = join(tempRoot, "sprite-video-demo");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(readFileSync(join(packageDir, "SOURCE_MANIFEST.json"), "utf8"), /"sourceType": "game-ad"/);
        assert.match(readFileSync(join(packageDir, "PACKAGE_MANIFEST.json"), "utf8"), /"game-ad"/);
        assert.match(readFileSync(join(packageDir, "PACKAGE_MANIFEST.json"), "utf8"), /CAPABILITY_GRAPH\.json/);
        assert.match(readFileSync(join(packageDir, "ASSET_EXECUTION_PLAN.json"), "utf8"), /"forge-map-pack"/);
        assert.match(readFileSync(join(packageDir, "ASSET_EXECUTION_PLAN.json"), "utf8"), /"agent-sprite-forge"/);
        assert.equal(existsSync(join(packageDir, "CAPABILITY_GRAPH.json")), true);
        const capabilityGraph = JSON.parse(readFileSync(join(packageDir, "CAPABILITY_GRAPH.json"), "utf8"));
        const runtimeNode = capabilityGraph.nodes.find((node) => node.id === "video-runtime.hyperframes");
        assert.equal(runtimeNode.required, true);
        assert.deepEqual(runtimeNode.usedBy, [
          "status",
          "validate",
          "repair",
          "sync-assets",
          "capture",
          "runtime-doctor",
          "runtime-lint",
          "runtime-inspect",
          "runtime-snapshot",
          "runtime-upgrade-check",
          "preview",
          "render",
        ]);
        assert.match(readFileSync(join(packageDir, "HANDOFF.md"), "utf8"), /\$generate2dmap/);
        assert.equal(existsSync(join(packageDir, "assets", "forge")), true);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "generate a package with workflow and creative direction pack selection",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-pack-selection-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into agent-native video packages.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
            "--workflow-pack",
            "game-ad-sprite-video",
            "--creative-direction-pack",
            "game-ad-retro-arcade",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const brief = JSON.parse(readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"));
        const handoff = readFileSync(join(projectDir, "HANDOFF.md"), "utf8");

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.equal(brief.packSelection.workflowPackId, "game-ad-sprite-video");
        assert.equal(brief.packSelection.creativeDirectionPackId, "game-ad-retro-arcade");
        assert.ok(brief.packSelection.acceptanceCriteria.some((criterion) => criterion.includes("Forge tasks")));
        assert.match(handoff, /Workflow pack: game-ad-sprite-video/);
        assert.match(handoff, /Creative direction pack: game-ad-retro-arcade/);
        assert.match(handoff, /Readable sprite silhouettes/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "auto-recommend pack selection during CLI generation",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-auto-pack-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into agent-native video packages.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform with game-style visuals",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
            "--format",
            "9:16",
            "--auto-pack",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const brief = JSON.parse(readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"));
        const handoff = readFileSync(join(projectDir, "HANDOFF.md"), "utf8");

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.equal(brief.packSelection.workflowPackId, "game-ad-sprite-video");
        assert.equal(brief.packSelection.creativeDirectionPackId, "game-ad-retro-arcade");
        assert.equal(brief.capabilityStackSelection.id, "game-ad-sprite-video-stack");
        assert.ok(
          brief.capabilityStackSelection.nodes.some(
            (node) => node.capabilityId === "asset-forge.agent-sprite-forge",
          ),
        );
        assert.match(handoff, /Workflow pack: game-ad-sprite-video/);
        assert.match(handoff, /Capability stack: game-ad-sprite-video-stack/);
        assert.match(handoff, /asset-forge\.agent-sprite-forge/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "honor explicit pack selection over auto recommendation",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-auto-pack-explicit-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--workflow-pack",
            "product-explainer",
            "--creative-direction-pack",
            "editorial-proof-story",
            "--auto-pack",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const projectDir = join(tempRoot, "case-explainer-input");
        const brief = JSON.parse(readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"));

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.equal(brief.packSelection.workflowPackId, "product-explainer");
        assert.equal(brief.packSelection.creativeDirectionPackId, "editorial-proof-story");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "run release smoke harness for agent platform readiness",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-release-smoke-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          ["release-smoke", "--output-dir", tempRoot, "--json"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const report = JSON.parse(stdout.join("\n"));
        const projectDir = join(tempRoot, "sprite-video-demo");

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.equal(stderr.length, 0);
        assert.equal(report.status, "passed");
        assert.equal(report.roundId, "AGENT-PLATFORM-RC-SMOKE");
        assert.equal(report.outputDir, tempRoot);
        assert.deepEqual(
          report.checks.map((check) => check.id),
          [
            "init-agent-codex",
            "init-agent-claude-code",
            "mcp-surface",
            "arsenal-exposure",
            "pack-recommendation",
            "auto-pack-generation",
            "capability-runtime-artifacts",
            "package-status",
            "package-validation",
          ],
        );
        assert.ok(report.checks.every((check) => check.status === "passed"));
        assert.equal(report.recommended.workflowPackId, "game-ad-sprite-video");
        assert.equal(report.recommended.creativeDirectionPackId, "game-ad-retro-arcade");
        assert.equal(report.generatedProjectDir, projectDir);
        assert.equal(report.arsenal.workflowPackCount >= 4, true);
        assert.equal(report.arsenal.creativeDirectionPackCount >= 3, true);
        assert.equal(report.generatedArtifacts.capabilityGraph, true);
        assert.equal(report.generatedArtifacts.runtimeManifest, true);
        assert.equal(report.generatedArtifacts.capabilityGraphNodeCount >= 5, true);
        assert.ok(report.generatedArtifacts.runtimeCommandActions.includes("render"));
        assert.equal(existsSync(join(projectDir, "PACKAGE_MANIFEST.json")), true);
        assert.equal(existsSync(join(projectDir, "VIDEO_BRIEF.json")), true);
        assert.equal(existsSync(join(projectDir, "CAPABILITY_GRAPH.json")), true);
        assert.equal(existsSync(join(projectDir, "RUNTIME_MANIFEST.json")), true);
        assert.equal(existsSync(join(tempRoot, "codex-agent", ".framepack", "agent", "codex", "SKILL.md")), true);
        assert.equal(existsSync(join(tempRoot, "claude-code-agent", "CLAUDE.md")), true);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "reject incompatible workflow pack selection during generation",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-pack-selection-invalid-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--workflow-pack",
            "game-ad-sprite-video",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(exitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /Workflow pack game-ad-sprite-video does not support sourceType markdown/);
        assert.equal(existsSync(join(tempRoot, "case-explainer-input")), false);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate a generated project package protocol from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-validate-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into agent-native video packages.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const validateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(validateExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Package validation passed/);
        assert.match(readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "passed"/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "report generated project package status from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-status-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into agent-native video packages.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const statusExitCode = await runCli(
          ["status", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );
        const output = stdout.join("\n");

        assert.equal(generateExitCode, 0);
        assert.equal(statusExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(output, /Package status/);
        assert.match(output, /project: sprite-video-demo/);
        assert.match(output, /protocol: passed/);
        assert.match(output, /assets: 0 available, 3 pending, 3 total/);
        assert.match(output, /forge: 0 available, 3 pending, 3 total/);
        assert.match(output, /runtime: (available|unavailable)/);
        assert.match(output, /next: run framepack sync-assets --project-dir <path> after materializing assets/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "derive package status readiness and action ids across state matrix",
    run: () => {
      const emptyCounts = {
        total: 0,
        available: 0,
        pending: 0,
        failed: 0,
        skipped: 0,
        external: 0,
      };

      const matrix = [
        {
          input: {
            protocolStatus: "failed",
            assets: { ...emptyCounts, total: 3, pending: 2, failed: 1 },
            forge: { ...emptyCounts, total: 1, failed: 1 },
            runtimeAvailable: false,
          },
          readiness: "blocked",
          actions: [
            {
              id: "repair-protocol",
              category: "protocol",
              command: "framepack repair --project-dir <path>",
              reason: "Package protocol validation failed and may have derivable drift.",
            },
            {
              id: "validate-protocol",
              category: "protocol",
              command: "framepack validate --project-dir <path>",
              reason: "Re-run validation after repair or manual protocol fixes.",
            },
            {
              id: "inspect-failed-assets",
              category: "assets",
              command: "inspect-failed-assets",
              reason: "1 asset execution items failed and need manual inspection before preview/render.",
            },
            {
              id: "sync-assets",
              category: "assets",
              command: "framepack sync-assets --project-dir <path>",
              reason: "2 asset execution items are still pending after materialization work.",
            },
            {
              id: "inspect-failed-forge-assets",
              category: "forge",
              command: "inspect-failed-forge-assets",
              reason: "1 forge tasks failed and need manual, custom, or skill-backed recovery.",
            },
            {
              id: "runtime-doctor",
              category: "runtime",
              command: "framepack runtime doctor --project-dir <path>",
              reason: "HyperFrames runtime is unavailable or not confirmed for preview/render.",
            },
          ],
        },
        {
          input: {
            protocolStatus: "passed",
            assets: { ...emptyCounts, total: 2, pending: 2 },
            forge: { ...emptyCounts, total: 1, pending: 1 },
            runtimeAvailable: true,
          },
          readiness: "needs-assets",
          actions: [
            {
              id: "sync-assets",
              category: "assets",
              command: "framepack sync-assets --project-dir <path>",
              reason: "2 asset execution items are still pending after materialization work.",
            },
            {
              id: "produce-forge-assets",
              category: "forge",
              command: "produce-forge-assets",
              reason: "1 forge tasks are pending and need manual, custom, or skill-backed production.",
            },
          ],
        },
        {
          input: {
            protocolStatus: "passed",
            assets: { ...emptyCounts, total: 1, failed: 1 },
            forge: emptyCounts,
            runtimeAvailable: true,
          },
          readiness: "blocked",
          actions: [
            {
              id: "inspect-failed-assets",
              category: "assets",
              command: "inspect-failed-assets",
              reason: "1 asset execution items failed and need manual inspection before preview/render.",
            },
          ],
        },
        {
          input: {
            protocolStatus: "passed",
            assets: emptyCounts,
            forge: emptyCounts,
            runtimeAvailable: false,
          },
          readiness: "needs-runtime",
          actions: [
            {
              id: "runtime-doctor",
              category: "runtime",
              command: "framepack runtime doctor --project-dir <path>",
              reason: "HyperFrames runtime is unavailable or not confirmed for preview/render.",
            },
          ],
        },
        {
          input: {
            protocolStatus: "passed",
            assets: emptyCounts,
            forge: emptyCounts,
            runtimeAvailable: true,
          },
          readiness: "ready",
          actions: [
            {
              id: "preview",
              category: "ready",
              command: "framepack preview --project-dir <path>",
              reason: "Package has no pending status blockers and can move to preview or render.",
            },
          ],
        },
      ];

      for (const item of matrix) {
        const decision = createPackageStatusDecision(item.input);

        assert.equal(decision.readiness, item.readiness);
        assert.deepEqual(decision.nextActionItems, item.actions);
      }
    },
  },
  {
    name: "report generated project package status as JSON from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-status-json-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into agent-native video packages.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const statusExitCode = await runCli(
          ["status", "--project-dir", projectDir, "--json"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );
        const status = JSON.parse(stdout.join("\n"));

        assert.equal(generateExitCode, 0);
        assert.equal(statusExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.equal(status.projectName, "sprite-video-demo");
        assert.equal(status.readiness, "needs-assets");
        assert.equal(status.protocolStatus, "passed");
        assert.equal(status.assets.total, 3);
        assert.equal(status.assets.pending, 3);
        assert.equal(status.forge.total, 3);
        assert.equal(status.forge.pending, 3);
        assert.equal(status.capabilityGraph.present, true);
        assert.equal(status.capabilityGraph.version, "framepack.capability-graph.v1");
        assert.ok(status.capabilityGraph.nodeIds.includes("video-runtime.hyperframes"));
        assert.ok(status.capabilityGraph.gapNodeIds.includes("asset-forge.agent-sprite-forge"));
        assert.equal(status.capabilityGraph.byStatus["not-detected"], 3);
        assert.equal(status.capabilityGraph.byDelivery["codex-skill"], 3);
        assert.deepEqual(status.forgeBreakdown.byExecutionKind, [
          {
            key: "forge-character-pack",
            total: 1,
            available: 0,
            pending: 1,
            failed: 0,
            skipped: 0,
            external: 0,
          },
          {
            key: "forge-fx-pack",
            total: 1,
            available: 0,
            pending: 1,
            failed: 0,
            skipped: 0,
            external: 0,
          },
          {
            key: "forge-map-pack",
            total: 1,
            available: 0,
            pending: 1,
            failed: 0,
            skipped: 0,
            external: 0,
          },
        ]);
        assert.deepEqual(status.forgeBreakdown.byBackend, [
          {
            key: "agent-sprite-forge",
            total: 3,
            available: 0,
            pending: 3,
            failed: 0,
            skipped: 0,
            external: 0,
          },
        ]);
        assert.deepEqual(status.forgeBreakdown.byRequiredSkill, [
          {
            key: "generate2dmap",
            total: 1,
            available: 0,
            pending: 1,
            failed: 0,
            skipped: 0,
            external: 0,
          },
          {
            key: "generate2dsprite",
            total: 2,
            available: 0,
            pending: 2,
            failed: 0,
            skipped: 0,
            external: 0,
          },
        ]);
        assert.equal(typeof status.runtimeAvailable, "boolean");
        assert.ok(status.nextActions.includes("run framepack sync-assets --project-dir <path> after materializing assets"));
        assert.deepEqual(status.nextActionItems[0], {
          id: "sync-assets",
          category: "assets",
          command: "framepack sync-assets --project-dir <path>",
          reason: "3 asset execution items are still pending after materialization work.",
        });
        assert.deepEqual(status.nextActionItems[1], {
          id: "produce-forge-assets",
          category: "forge",
          command: "produce-forge-assets",
          reason: "3 forge tasks are pending and need manual, custom, or skill-backed production.",
        });
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "report invalid capability graph in package status without crashing",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-status-invalid-capability-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A course that teaches founders to ship agent-native video systems.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the course",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        writeFileSync(join(projectDir, "CAPABILITY_GRAPH.json"), "{", "utf8");

        const statusExitCode = await runCli(
          ["status", "--project-dir", projectDir, "--json"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );
        const status = JSON.parse(stdout.join("\n"));

        assert.equal(generateExitCode, 0);
        assert.equal(statusExitCode, 1);
        assert.equal(stderr.length, 0);
        assert.equal(status.capabilityGraph.present, true);
        assert.match(status.capabilityGraph.error, /CAPABILITY_GRAPH\.json/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail project package validation when capability graph is invalid JSON",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validation-invalid-capability-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A course that teaches founders to ship agent-native video systems.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the course",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        writeFileSync(join(projectDir, "CAPABILITY_GRAPH.json"), "{", "utf8");

        const validateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /CAPABILITY_GRAPH\.json/);
        assert.match(readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "failed"/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail project package validation when capability graph is missing runtime node",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validation-capability-node-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A course that teaches founders to ship agent-native video systems.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the course",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const capabilityGraphPath = join(projectDir, "CAPABILITY_GRAPH.json");
        const capabilityGraph = JSON.parse(readFileSync(capabilityGraphPath, "utf8"));
        capabilityGraph.nodes = capabilityGraph.nodes.filter((node) => node.id !== "video-runtime.hyperframes");
        writeFileSync(capabilityGraphPath, JSON.stringify(capabilityGraph, null, 2), "utf8");

        const validateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /video-runtime\.hyperframes/);
        assert.match(readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"), /video-runtime\.hyperframes/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "repair project package rebuilds invalid capability graph",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-repair-invalid-capability-"));
      const repairStdout = [];
      const repairStderr = [];
      const validateStdout = [];
      const validateStderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A course that teaches founders to ship agent-native video systems.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the course",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        writeFileSync(join(projectDir, "CAPABILITY_GRAPH.json"), "{", "utf8");

        const failingValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: () => {},
          },
        );
        const repairExitCode = await runCli(
          ["repair", "--project-dir", projectDir],
          {
            stdout: (message) => repairStdout.push(message),
            stderr: (message) => repairStderr.push(message),
          },
        );
        const finalValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => validateStdout.push(message),
            stderr: (message) => validateStderr.push(message),
          },
        );
        const repairedCapabilityGraph = JSON.parse(readFileSync(join(projectDir, "CAPABILITY_GRAPH.json"), "utf8"));

        assert.equal(generateExitCode, 0);
        assert.equal(failingValidateExitCode, 1);
        assert.equal(repairExitCode, 0);
        assert.equal(finalValidateExitCode, 0);
        assert.equal(repairStderr.length, 0);
        assert.equal(validateStderr.length, 0);
        assert.match(repairStdout.join("\n"), /CAPABILITY_GRAPH\.json/);
        assert.ok(repairedCapabilityGraph.nodes.some((node) => node.id === "video-runtime.hyperframes"));
        assert.match(validateStdout.join("\n"), /Package validation passed/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail project package validation when runtime manifest is invalid JSON",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validation-invalid-runtime-manifest-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A course that teaches founders to ship agent-native video systems.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the course",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        writeFileSync(join(projectDir, "RUNTIME_MANIFEST.json"), "{", "utf8");

        const validateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /RUNTIME_MANIFEST\.json/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "repair project package rebuilds missing runtime manifest",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-repair-runtime-manifest-"));
      const repairStdout = [];
      const repairStderr = [];
      const validateStdout = [];
      const validateStderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A course that teaches founders to ship agent-native video systems.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the course",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        rmSync(join(projectDir, "RUNTIME_MANIFEST.json"), { force: true });

        const failingValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: () => {},
          },
        );
        const repairExitCode = await runCli(
          ["repair", "--project-dir", projectDir],
          {
            stdout: (message) => repairStdout.push(message),
            stderr: (message) => repairStderr.push(message),
          },
        );
        const finalValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => validateStdout.push(message),
            stderr: (message) => validateStderr.push(message),
          },
        );
        const runtimeManifest = JSON.parse(readFileSync(join(projectDir, "RUNTIME_MANIFEST.json"), "utf8"));

        assert.equal(generateExitCode, 0);
        assert.equal(failingValidateExitCode, 1);
        assert.equal(repairExitCode, 0);
        assert.equal(finalValidateExitCode, 0);
        assert.equal(repairStderr.length, 0);
        assert.equal(validateStderr.length, 0);
        assert.match(repairStdout.join("\n"), /RUNTIME_MANIFEST\.json/);
        assert.equal(runtimeManifest.version, "framepack.runtime-manifest.v1");
        assert.equal(runtimeManifest.backend, "hyperframes");
        assert.match(validateStdout.join("\n"), /Package validation passed/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail project package validation when execution assets are not mapped to scenes",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-validate-fail-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A platform that turns product stories into agent-native video packages.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the platform",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const sceneAssetMapPath = join(projectDir, "SCENE_ASSET_MAP.json");
        const sceneAssetMap = JSON.parse(readFileSync(sceneAssetMapPath, "utf8"));
        sceneAssetMap.assets = sceneAssetMap.assets.filter((asset) => asset.suggestedAsset !== "hero-character-pack");
        sceneAssetMap.scenes = sceneAssetMap.scenes.map((scene) => ({
          ...scene,
          recommendedAssets: scene.recommendedAssets.filter((asset) => asset.suggestedAsset !== "hero-character-pack"),
        }));
        writeFileSync(sceneAssetMapPath, JSON.stringify(sceneAssetMap, null, 2), "utf8");

        const validateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /Package validation failed/);
        assert.match(stderr.join("\n"), /hero-character-pack/);
        assert.match(readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "failed"/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail project package validation when manifest protocol version is unsupported",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-validate-version-"));
      const stdout = [];
      const stderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--thread-file",
            threadExamplePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the thread",
            "--audience",
            "Founders",
            "--project-name",
            "thread-package",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "thread-package");
        const manifestPath = join(projectDir, "PACKAGE_MANIFEST.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        manifest.protocolVersion = 99;
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

        const validateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /protocolVersion/);
        assert.match(readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "failed"/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail project package validation cleanly when scene asset map lacks unified asset fields",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-validate-legacy-map-"));
      const originalFetch = globalThis.fetch;
      const stdout = [];
      const stderr = [];

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const generateExitCode = await runCli(
          [
            "generate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            "legacy-map-package",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "legacy-map-package");
        const sceneAssetMapPath = join(projectDir, "SCENE_ASSET_MAP.json");
        const sceneAssetMap = JSON.parse(readFileSync(sceneAssetMapPath, "utf8"));
        delete sceneAssetMap.assets;
        sceneAssetMap.scenes = sceneAssetMap.scenes.map((scene) => {
          const nextScene = { ...scene };
          delete nextScene.recommendedAssets;
          return nextScene;
        });
        writeFileSync(sceneAssetMapPath, JSON.stringify(sceneAssetMap, null, 2), "utf8");

        const validateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /SCENE_ASSET_MAP.json assets/);
        assert.match(readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "failed"/);
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "repair project package rebuilds unified scene asset map fields",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-repair-map-"));
      const originalFetch = globalThis.fetch;
      const repairStdout = [];
      const repairStderr = [];
      const validateStdout = [];
      const validateStderr = [];

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const generateExitCode = await runCli(
          [
            "generate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            "repair-map-package",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "repair-map-package");
        const sceneAssetMapPath = join(projectDir, "SCENE_ASSET_MAP.json");
        const sceneAssetMap = JSON.parse(readFileSync(sceneAssetMapPath, "utf8"));
        delete sceneAssetMap.assets;
        sceneAssetMap.scenes = sceneAssetMap.scenes.map((scene) => {
          const nextScene = { ...scene };
          delete nextScene.recommendedAssets;
          return nextScene;
        });
        writeFileSync(sceneAssetMapPath, JSON.stringify(sceneAssetMap, null, 2), "utf8");

        const failingValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: () => {},
          },
        );
        const repairExitCode = await runCli(
          ["repair", "--project-dir", projectDir],
          {
            stdout: (message) => repairStdout.push(message),
            stderr: (message) => repairStderr.push(message),
          },
        );
        const repairedSceneAssetMap = JSON.parse(readFileSync(sceneAssetMapPath, "utf8"));
        const finalValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => validateStdout.push(message),
            stderr: (message) => validateStderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(failingValidateExitCode, 1);
        assert.equal(repairExitCode, 0);
        assert.equal(finalValidateExitCode, 0);
        assert.equal(repairStderr.length, 0);
        assert.equal(validateStderr.length, 0);
        assert.match(repairStdout.join("\n"), /Package repair updated/);
        assert.ok(Array.isArray(repairedSceneAssetMap.assets));
        assert.ok(repairedSceneAssetMap.assets.length > 0);
        assert.ok(Array.isArray(repairedSceneAssetMap.scenes[0].recommendedAssets));
        assert.match(validateStdout.join("\n"), /Package validation passed/);
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "repair project package refreshes manifest capabilities",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-repair-manifest-"));
      const repairStdout = [];
      const repairStderr = [];
      const validateStdout = [];
      const validateStderr = [];

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--game-ad-description",
            "A course that teaches founders to ship agent-native video systems.",
            "--output-dir",
            tempRoot,
            "--goal",
            "Promote the course",
            "--audience",
            "Founders",
            "--project-name",
            "sprite-video-demo",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "sprite-video-demo");
        const manifestPath = join(projectDir, "PACKAGE_MANIFEST.json");
        const capabilityGraphPath = join(projectDir, "CAPABILITY_GRAPH.json");
        const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        manifest.capabilities.executionKinds = [];
        manifest.capabilities.packageCommands = [];
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
        rmSync(capabilityGraphPath, { force: true });

        const failingValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: () => {},
            stderr: () => {},
          },
        );
        const repairExitCode = await runCli(
          ["repair", "--project-dir", projectDir],
          {
            stdout: (message) => repairStdout.push(message),
            stderr: (message) => repairStderr.push(message),
          },
        );
        const repairedManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
        const repairedCapabilityGraph = JSON.parse(readFileSync(capabilityGraphPath, "utf8"));
        const finalValidateExitCode = await runCli(
          ["validate", "--project-dir", projectDir],
          {
            stdout: (message) => validateStdout.push(message),
            stderr: (message) => validateStderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(failingValidateExitCode, 1);
        assert.equal(repairExitCode, 0);
        assert.equal(finalValidateExitCode, 0);
        assert.equal(repairStderr.length, 0);
        assert.equal(validateStderr.length, 0);
        assert.match(repairStdout.join("\n"), /PACKAGE_MANIFEST.json/);
        assert.match(repairStdout.join("\n"), /CAPABILITY_GRAPH.json/);
        assert.deepEqual(repairedManifest.capabilities.executionKinds, [
          "forge-character-pack",
          "forge-map-pack",
          "forge-fx-pack",
        ]);
        assert.deepEqual(repairedManifest.capabilities.packageCommands, [
          "status",
          "validate",
          "repair",
          "sync-assets",
          "capture",
          "runtime-doctor",
          "runtime-lint",
          "runtime-inspect",
          "runtime-snapshot",
          "runtime-upgrade-check",
          "preview",
          "render",
        ]);
        assert.equal(repairedCapabilityGraph.version, "framepack.capability-graph.v1");
        assert.ok(
          repairedCapabilityGraph.nodes.some((node) => node.id === "asset-forge.agent-sprite-forge"),
        );
        assert.match(validateStdout.join("\n"), /Package validation passed/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "generate from a project config file",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-generate-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "config-project"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "config-project");
        const stdout = [];
        const stderr = [];

        const generateExitCode = await runCli(
          ["generate", "--config", join(projectDir, "hyperframes-studio.json"), "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(
          readFileSync(join(tempRoot, "config-project", "VIDEO_BRIEF.json"), "utf8"),
          /"audience": "Founders"/,
        );
        assert.match(
          readFileSync(join(tempRoot, "config-project", "VIDEO_BRIEF.json"), "utf8"),
          /"brandName": "Studio"/,
        );
        assert.match(
          readFileSync(join(tempRoot, "config-project", "VIDEO_BRIEF.json"), "utf8"),
          /"maxDurationSec": 60/,
        );
        assert.match(
          readFileSync(join(tempRoot, "config-project", "index.html"), "utf8"),
          /data-palette="default"/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate from a project config file",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-validate-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "config-validate"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "config-validate");
        const stdout = [];
        const stderr = [];

        const validateExitCode = await runCli(
          ["validate", "--config", join(projectDir, "hyperframes-studio.json"), "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(validateExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Validation passed/);
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /"sceneCount": 6/,
        );
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.md"), "utf8"),
          /Validation passed for config-validate/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail validation from config when required points are missing",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-required-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "required-points"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "required-points");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));
        config.constraints ??= { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] };
        config.constraints.requiredPoints = ["Nonexistent proof point"];
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const stdout = [];
        const stderr = [];
        const validateExitCode = await runCli(
          ["validate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /Validation failed/);
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /"status": "failed"/,
        );
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /required point missing: Nonexistent proof point/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail validation from config when banned terms are present",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-banned-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "banned-terms"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "banned-terms");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));
        config.constraints ??= { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] };
        config.constraints.bannedTerms = ["solution"];
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const stdout = [];
        const stderr = [];
        const validateExitCode = await runCli(
          ["validate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /Validation failed/);
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /banned term present: solution/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "block generate when config max duration is too small",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-duration-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "duration-limit"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "duration-limit");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));
        config.constraints ??= { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] };
        config.constraints.maxDurationSec = 5;
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const stdout = [];
        const stderr = [];
        const generateExitCode = await runCli(
          ["generate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /case explainer scene plan requires at least 1 second per scene/);
        assert.equal(existsSync(join(projectDir, "VIDEO_BRIEF.json")), false);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "carry custom brand and palette values from config into output",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-brand-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "brand-project"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "brand-project");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));

        config.style.brandName = "HyperBrand";
        config.style.tone = "bold";
        config.style.pacing = "fast";
        config.theme.palette = "sunset";

        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const generateExitCode = await runCli(
          ["generate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);
        assert.match(
          readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"),
          /"brandName": "HyperBrand"/,
        );
        assert.match(
          readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"),
          /"tone": "bold"/,
        );
        assert.match(
          readFileSync(join(projectDir, "index.html"), "utf8"),
          /data-palette="sunset"/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "apply default style and theme when config omits them",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-defaults-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "legacy-project"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "legacy-project");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));

        delete config.style;
        delete config.theme;

        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const generateExitCode = await runCli(
          ["generate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);
        assert.match(
          readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"),
          /"brandName": "Studio"/,
        );
        assert.match(
          readFileSync(join(projectDir, "index.html"), "utf8"),
          /data-palette="default"/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
];

let passed = 0;

for (const test of tests) {
  await test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}

console.log(`\n${passed}/${tests.length} checks passed`);
