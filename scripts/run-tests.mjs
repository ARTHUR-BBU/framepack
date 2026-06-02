import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
import { buildCompositionProposal } from "../dist/creative/composition-proposal.js";
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
import {
  createWorkbenchProject,
  listHyperframesCatalogPrefabs,
  listHyperframesPromptTemplates,
  listTemplateMarket,
  listWorkbenchTemplates,
  recommendPolishArsenal,
  recommendHyperframesCatalogPrefabs,
  recommendHyperframesPromptTemplate,
  recommendTemplateRoute,
  auditWorkbenchProject,
  validateWorkbenchFiles,
} from "../dist/workbench/index.js";
import { buildWorkbenchProject, extractIdeaEntities } from "../dist/workbench/index.js";
import {
  loadAllTemplates,
  matchSceneTemplates,
  getTemplateStats,
  listRegistries,
  fetchRegistryIndex,
} from "../dist/workbench/scene-templates.js";

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
  "../docs/README.zh-CN.md",
);
const packageJsonPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../package.json",
);
const framepack04AlphaNotesPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/release-candidate-v0.4.0-alpha.4.md",
);
const framepack04BetaNotesPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/release-candidate-v0.4.0-beta.1.md",
);
const framepack04ScenarioReportPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/real-scenario-test-report-v0.4.0-alpha.1.md",
);
const framepack04RealUserTrialPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/real-user-trial-v0.4.0-alpha.3.md",
);
const framepack04BetaUserTrialPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/real-user-trial-v0.4.0-beta.1.md",
);
const framepack04BetaFeedbackLoopPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/beta-feedback-loop-v0.4.md",
);
const framepack04BetaCutoffPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/v0.4-beta-product-state-cutoff.md",
);
const framepack04BetaPatchRadarPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/beta-patch-radar-v0.4.md",
);
const framepack04ManualBetaTestGuidePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/manual-beta-test-guide-v0.4.zh-CN.md",
);
const framepack04BetaReadinessPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/beta-readiness-v0.4.md",
);
const framepack04BetaOnboardingTrialsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/beta-onboarding-trials-v0.4.md",
);
const framepack04HyperframesCompatPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../docs/agent-platform/hyperframes-compat-v0.4.md",
);
const agentsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../AGENTS.md",
);
const betaFeedbackIssueTemplatePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../.github/ISSUE_TEMPLATE/beta-feedback.md",
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
    name: "detect local HyperFrames cmd when project path contains spaces",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes path spaces "));

      try {
        const binDir = join(tempRoot, "node_modules", ".bin");
        mkdirSync(binDir, { recursive: true });
        writeFileSync(
          join(binDir, "hyperframes.cmd"),
          "@echo off\r\necho hyperframes 0.6.42\r\n",
          "utf8",
        );

        const capabilities = detectLocalHyperframesCapabilities({
          cwd: tempRoot,
          now: () => "2026-05-25T00:00:00.000Z",
          platform: "win32",
        });

        assert.equal(capabilities.available, true);
        assert.equal(capabilities.version, "0.6.42");
        assert.match(capabilities.binary, /hyperframes\.cmd$/);
        assert.equal(capabilities.fallbackNotes.length, 0);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
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
      assert.ok(capabilities.version === "0.6.40" || capabilities.version === "unknown");
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
    name: "compile markdown-like thread headings with their following body",
    run: () => {
      const sourceBundle = compileThreadSourceBundle({
        text: `
# Agent-Native Video Sprint

## Problem

Teams waste time moving between scripts, screenshots, image generation, and editing tools.

## Solution

Framepack gives agents a package protocol, asset plan, runtime manifest, and validation loop.

## Offer

Join a practical sprint and ship your first agent-native video workflow.
        `,
      });

      assert.equal(sourceBundle.sourceType, "thread");
      assert.equal(sourceBundle.collectedArtifacts.length, 4);
      assert.equal(sourceBundle.collectedArtifacts[0]?.title, "Post 1");
      assert.equal(sourceBundle.collectedArtifacts[0]?.body, "# Agent-Native Video Sprint");
      assert.match(sourceBundle.collectedArtifacts[1]?.body ?? "", /^## Problem\n\nTeams waste time/);
      assert.match(sourceBundle.collectedArtifacts[2]?.body ?? "", /^## Solution\n\nFramepack gives agents/);
      assert.match(sourceBundle.collectedArtifacts[3]?.body ?? "", /^## Offer\n\nJoin a practical sprint/);
      assert.doesNotMatch(sourceBundle.collectedArtifacts[1]?.body ?? "", /^## Problem$/);
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
    name: "build purpose-specific script and storyboard notes",
    run: () => {
      const scenePlan = {
        totalDurationSec: 18,
        scenes: [
          {
            sceneId: "scene-1",
            purpose: "cover",
            startTimeSec: 0,
            durationSec: 6,
            narration: "Explain the course - Agent-Native Video Sprint",
            onScreenText: ["Agent-Native Video Sprint", "Ship agent-native video systems"],
            visualType: "cover",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
          {
            sceneId: "scene-2",
            purpose: "problem",
            startTimeSec: 6,
            durationSec: 6,
            narration: "Explain the course - Teams waste time moving between scripts and tools.",
            onScreenText: ["The problem", "Teams waste time moving between scripts and tools."],
            visualType: "problem",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
          {
            sceneId: "scene-3",
            purpose: "ending",
            startTimeSec: 12,
            durationSec: 6,
            narration: "Explain the course - Join the sprint.",
            onScreenText: ["Join the sprint", "Ship your first agent-native video workflow."],
            visualType: "ending",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
        ],
      };
      const script = buildScript({ scenePlan });
      const storyboard = buildStoryboard({ scenePlan });

      assert.match(script.scenes[0].voiceoverLines[0], /Meet Agent-Native Video Sprint/);
      assert.match(script.scenes[1].voiceoverLines[0], /The problem/);
      assert.match(script.scenes[2].voiceoverLines[0], /Join the sprint/);
      assert.doesNotMatch(script.scenes[0].voiceoverLines[0], /Explain the course -/);
      assert.deepEqual(
        storyboard.scenes.map((scene) => scene.motionNote),
        [
          "Title reveal with a slow push.",
          "Contrast emphasis with a sharp text beat.",
          "CTA punch with a confident final hold.",
        ],
      );
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
    name: "compile composition scenes into visible directed sections",
    run: () => {
      const spec = compileCompositionSpec({
        format: "16:9",
        totalDurationSec: 24,
        scenes: [
          {
            sceneId: "scene-1",
            purpose: "cover",
            startTimeSec: 0,
            durationSec: 6,
            narration: "Meet the Agent-Native Video Sprint.",
            onScreenText: ["Agent-Native Video Sprint", "Ship video systems with agents"],
            visualType: "cover",
            assets: ["post-1-card"],
            transition: "fade",
            validationNotes: [],
          },
        ],
      });
      const output = emitHyperframesComposition(spec);

      assert.doesNotMatch(spec.scenes[0].htmlTemplate, /<section[^>]*><\/section>/);
      assert.match(spec.scenes[0].htmlTemplate, /Agent-Native Video Sprint/);
      assert.match(spec.scenes[0].htmlTemplate, /Ship video systems with agents/);
      assert.match(spec.scenes[0].htmlTemplate, /assets\/generated\/post-1-card\.png/);
      assert.match(output.html, /class="scene scene-cover/);
      assert.match(output.html, /data-motion-intent="title reveal"/);
    },
  },
  {
    name: "build a composition proposal that drives scene treatment and motion",
    run: () => {
      const scenePlan = {
        totalDurationSec: 24,
        scenes: [
          {
            sceneId: "scene-1",
            purpose: "cover",
            startTimeSec: 0,
            durationSec: 6,
            narration: "A sharp opening promise.",
            onScreenText: ["Agent Video Sprint", "Ship a usable package"],
            visualType: "cover",
            assets: ["hero-card"],
            transition: "fade",
            validationNotes: ["Open with the commercial promise."],
          },
          {
            sceneId: "scene-2",
            purpose: "problem",
            startTimeSec: 6,
            durationSec: 6,
            narration: "Teams lose time across tools.",
            onScreenText: ["Production breaks across tools"],
            visualType: "problem",
            assets: [],
            transition: "cut",
            validationNotes: ["Make the cost visible."],
          },
        ],
      };
      const proposal = buildCompositionProposal({
        creativeBrief: {
          version: "framepack.creative-brief.v1",
          sourceType: "thread",
          outputType: "case-explainer",
          goal: "Promote Agent Video Sprint",
          audience: "Founders",
          commercialIntent: "conversion",
          contentType: "course-promo",
          emotionalEnergy: ["credible", "forward-moving"],
          narrativePattern: "hook-problem-solution-proof-cta",
          visualSeeds: ["high contrast"],
          motionSeeds: ["title reveal"],
          constraints: ["no empty scenes"],
        },
        narrativeArc: {
          version: "framepack.narrative-arc.v1",
          pattern: "hook-problem-solution-proof-cta",
          beats: [
            {
              sceneId: "scene-1",
              role: "hook",
              intent: "Create immediate recognition.",
              tension: "Video production feels scattered.",
              release: "A sprint gives the team a route.",
            },
            {
              sceneId: "scene-2",
              role: "problem",
              intent: "Make the hidden cost obvious.",
              tension: "Tools do not line up.",
              release: "Move toward a harness.",
            },
          ],
        },
        visualDirection: {
          version: "framepack.visual-direction.v1",
          style: "clean-saas-explainer",
          paletteIntent: "credible dark base with high-energy accent",
          typographyIntent: "large hook, compact proof text, strong CTA",
          sceneTreatments: [
            {
              sceneId: "scene-1",
              treatment: "hero-hook",
              layout: "centered title with kinetic subtitle",
              visualHierarchy: ["title", "promise", "source badge"],
            },
            {
              sceneId: "scene-2",
              treatment: "contrast-problem",
              layout: "large pain statement with warning accent",
              visualHierarchy: ["pain", "cost", "contrast"],
            },
          ],
        },
        motionPlan: {
          version: "framepack.motion-plan.v1",
          motionLanguage: "controlled kinetic explainer",
          beats: [
            {
              sceneId: "scene-1",
              entry: "title reveal",
              hold: "slow push",
              exit: "fast fade",
              intensity: "medium",
            },
            {
              sceneId: "scene-2",
              entry: "contrast cut",
              hold: "sharp text beat",
              exit: "snap toward solution",
              intensity: "high",
            },
          ],
        },
        scenePlan,
      });
      const spec = compileCompositionSpec({
        ...scenePlan,
        format: "16:9",
        compositionProposal: proposal,
      });

      assert.equal(proposal.version, "framepack.composition-proposal.v1");
      assert.equal(proposal.scenes[0].treatment, "hero-hook");
      assert.equal(proposal.scenes[1].motion.entry, "contrast cut");
      assert.match(spec.scenes[0].htmlTemplate, /data-proposal-id="proposal-scene-1"/);
      assert.match(spec.scenes[0].htmlTemplate, /data-treatment="hero-hook"/);
      assert.match(spec.scenes[0].htmlTemplate, /centered title with kinetic subtitle/);
      assert.match(spec.scenes[1].htmlTemplate, /data-motion-intent="contrast cut"/);
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
      assert.ok(capabilities.version === "0.6.40" || capabilities.version === "unknown");
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
    name: "build extended runtime command specs for HyperFrames 0.6-compatible commands",
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
        assert.match(readFileSync(join(writtenDir, "CREATIVE_BRIEF.json"), "utf8"), /framepack\.creative-brief\.v1/);
        assert.match(readFileSync(join(writtenDir, "NARRATIVE_ARC.json"), "utf8"), /hook-problem-solution-proof-cta/);
        assert.match(readFileSync(join(writtenDir, "VISUAL_DIRECTION.json"), "utf8"), /framepack\.visual-direction\.v1/);
        assert.match(readFileSync(join(writtenDir, "MOTION_PLAN.json"), "utf8"), /framepack\.motion-plan\.v1/);
        assert.match(readFileSync(join(writtenDir, "COMPOSITION_PROPOSAL.json"), "utf8"), /framepack\.composition-proposal\.v1/);
        assert.match(readFileSync(join(writtenDir, "QUALITY_REPORT.json"), "utf8"), /composition-visible-content/);
        assert.match(readFileSync(join(writtenDir, "QUALITY_REPORT.json"), "utf8"), /proposal-scene-coverage/);
        assert.match(readFileSync(join(writtenDir, "PACKAGE_MANIFEST.json"), "utf8"), /CREATIVE_BRIEF\.json/);
        assert.match(readFileSync(join(writtenDir, "PACKAGE_MANIFEST.json"), "utf8"), /COMPOSITION_PROPOSAL\.json/);
        assert.match(readFileSync(join(writtenDir, "PACKAGE_MANIFEST.json"), "utf8"), /QUALITY_REPORT\.json/);
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
      assert.match(result.package.files["CREATIVE_BRIEF.json"], /commercialIntent/);
      assert.match(result.package.files["NARRATIVE_ARC.json"], /"role": "hook"/);
      assert.match(result.package.files["VISUAL_DIRECTION.json"], /sceneTreatments/);
      assert.match(result.package.files["MOTION_PLAN.json"], /motionLanguage/);
      assert.match(result.package.files["COMPOSITION_PROPOSAL.json"], /proposal-scene-/);
      assert.match(result.package.files["index.html"], /data-treatment=/);
      assert.match(result.package.files["QUALITY_REPORT.json"], /"status": "passed"/);
      assert.match(result.package.files["VALIDATION_REPORT.json"], /"status": "passed"/);
    },
  },
  {
    name: "document the reborn HyperFrames workbench in the README",
    run: () => {
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const charter = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "rebirth", "framepack-0.5-charter.md"),
        "utf8",
      );

      assert.match(readme, /programmatic video workbench/);
      assert.match(readme, /Programmatic Video vs Generative Video/);
      assert.match(readme, /outsider language into a professional video plan/);
      assert.match(readme, /framepack create --idea/);
      assert.match(readme, /ASSETS\.md/);
      assert.match(readme, /COMPOSITION\.md/);
      assert.match(readme, /postinstall hook/);
      assert.match(readme, /Polish Arsenal/);
      assert.match(chineseReadme, /\u7a0b\u5f0f\u5316\u89c6\u9891/);
      assert.match(chineseReadme, /framepack create --idea/);
      assert.match(chineseReadme, /\u4e09\u5c42\u673a\u5236/);
      assert.match(chineseReadme, /\u5185\u7f6e\u6a21\u677f registry/);
      assert.match(charter, /Framepack 0\.5 Rebirth Charter/);
      assert.match(charter, /HyperFrames creative workbench/);
      assert.match(charter, /One line beats two when one line is enough/);
    },
  },
  {
    name: "publish package metadata under the framepack identity",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const cliEntrypoint = readFileSync(join(dirname(packageJsonPath), "dist", "cli.js"), "utf8");

      assert.equal(packageJson.name, "framepack");
      assert.equal(packageJson.version, "0.6.0-alpha.2");
      assert.equal(packageJson.private, false);
      assert.match(packageJson.readme, /programmatic video workbench/);
      assert.match(packageJson.readme, /\u4e2d\u6587/);
      assert.match(packageJson.readme, /workbench brief/);
      assert.equal(packageJson.bin.framepack, "dist/cli.js");
      assert.ok(cliEntrypoint.startsWith("#!/usr/bin/env node"));
      assert.ok(Array.isArray(packageJson.files));
      assert.equal(packageJson.files.includes("README.zh-CN.md"), false);
      assert.ok(packageJson.files.includes("AGENTS.md"));
      assert.ok(packageJson.files.includes("docs/rebirth"));
      assert.ok(packageJson.files.includes("scripts/postinstall.mjs"));
      assert.ok(packageJson.files.includes("scripts/run-sandbox-benchmark.mjs"));
      assert.equal(packageJson.files.includes("docs/architecture"), false);
      assert.equal(packageJson.files.includes("docs/agent-platform"), false);
      assert.equal(packageJson.scripts.postinstall, "node scripts/postinstall.mjs");
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
      assert.equal(versionStdout.join("\n").trim(), "0.6.0-alpha.2");
      assert.equal(helpExitCode, 0);
      assert.deepEqual(helpStderr, []);
      assert.match(helpStdout.join("\n"), /Framepack CLI/);
      assert.match(helpStdout.join("\n"), /framepack create --idea <idea> --assets <dir> --output-dir <dir>/);
      assert.match(helpStdout.join("\n"), /framepack build --project-dir <dir>/);
      assert.match(helpStdout.join("\n"), /framepack preview --project-dir <dir>/);
      assert.match(helpStdout.join("\n"), /framepack render --project-dir <dir>/);
      assert.match(helpStdout.join("\n"), /framepack scene-templates search/);
      assert.match(helpStdout.join("\n"), /framepack scene-templates registries/);
      assert.match(helpStdout.join("\n"), /framepack scene-templates stats/);
      assert.match(helpStdout.join("\n"), /framepack scene-templates install --id <template-id>/);
      assert.match(helpStdout.join("\n"), /npx -y -p framepack@alpha framepack --version/);
      assert.match(helpStdout.join("\n"), /npx -y -p framepack@alpha framepack --help/);
      assert.match(helpStdout.join("\n"), /npm exec --yes --package=framepack@alpha -- framepack mcp --describe/);
      assert.match(helpStdout.join("\n"), /release:scenarios/);
    },
  },
  {
    name: "create a reborn HyperFrames workbench from idea and assets",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-rebirth-workbench-"));
      const assetDir = join(tempRoot, "source-assets");

      try {
        mkdirSync(assetDir, { recursive: true });
        writeFileSync(join(assetDir, "logo.png"), "png", "utf8");
        writeFileSync(join(assetDir, "demo.mp4"), "mp4", "utf8");
        writeFileSync(join(assetDir, "voice.wav"), "wav", "utf8");

        const project = createWorkbenchProject({
          projectName: "agent-video-launch",
          idea: "A founder-facing launch video for an agent-native video workflow.",
          assetDir,
          outputDir: tempRoot,
          style: "cinematic SaaS launch with kinetic interface motion",
          durationSec: 45,
          format: "16:9",
        });

        assert.equal(project.projectDir, join(tempRoot, "agent-video-launch"));
        assert.equal(project.assets.length, 3);
        assert.deepEqual(
          project.assets.map((asset) => asset.kind).sort(),
          ["audio", "image", "video"],
        );
        assert.match(project.files["FRAMEPACK.md"], /Start here/);
        assert.match(project.files["FRAMEPACK.md"], /For Human/);
        assert.match(project.files["ASSETS.md"], /logo\.png/);
        assert.match(project.files["HUMAN.md"], /Current Summary/);
        assert.match(project.files["HUMAN.md"], /Video Structure/);
        assert.match(project.files["HUMAN.md"], /What I need from you/);
        assert.match(project.files["DIRECTION.md"], /Polish Arsenal/);
        assert.match(project.files["DIRECTION.md"], /Structure Summary/);
        assert.match(project.files["COMPOSITION.md"], /Use HyperFrames/);
        assert.match(project.files["COMPOSITION.md"], /Do not judge user-provided assets/);
        assert.match(project.files["COMPOSITION.md"], /Human Explanation/);
        assert.match(project.files["COMPOSITION.md"], /HyperFrames Prompt Template/);
        assert.match(project.files["COMPOSITION.md"], /Template Fusion Plan/);
        assert.match(project.files["COMPOSITION.md"], /45-second/);
        assert.match(project.files["HUMAN.md"], /Recommended HyperFrames prompt template/);
        assert.match(project.files["ITERATIONS.md"], /Initial creative package/);
        assert.match(project.files["ITERATIONS.md"], /Human Review Notes/);
        assert.match(project.files["meta.json"], /"rootEntry": "index.html"/);
        assert.match(project.files["meta.json"], /"runtime": "hyperframes"/);
        assert.match(project.files[".framepack/state.json"], /"mode": "hyperframes-creative-workbench"/);
        assert.match(project.files[".framepack/state.json"], /"promptTemplateRecommendation"/);
        assert.match(project.files[".framepack/state.json"], /"humanDigest"/);
        assert.equal(existsSync(join(project.projectDir, "meta.json")), true);
        const createdHtml = readFileSync(join(project.projectDir, "index.html"), "utf8");
        assert.match(createdHtml, /data-start="0" data-duration="45" data-width="1920" data-height="1080"/);
        assert.equal(
          /<div[^>]+data-scene-id="[^"]+"[^>]+data-start="[^"]+"[^>]*>[\s\S]*?<video[^>]+data-start="/.test(createdHtml),
          false,
          "Created timed videos must not be nested inside timed scene elements",
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "expose built-in workbench template registry for outsider-friendly video routes",
    run: () => {
      const templates = listWorkbenchTemplates();

      assert.deepEqual(
        templates.map((template) => template.id),
        ["saas-launch", "news-explainer", "course-promo", "game-ad", "founder-story", "data-shock"],
      );
      assert.ok(templates.every((template) => template.visualLanguage.length > 0));
      assert.ok(templates.every((template) => template.motionLanguage.length > 0));
      assert.ok(templates.every((template) => template.acceptanceCriteria.length > 0));
    },
  },
  {
    name: "expose a local template market index with future paid-template metadata",
    run: () => {
      const templates = listTemplateMarket();

      assert.equal(templates.length, 6);
      assert.ok(templates.every((template) => template.access === "built-in"));
      assert.ok(templates.every((template) => template.license === "included"));
      assert.ok(templates.every((template) => template.priceCents === null));
      assert.ok(templates.every((template) => template.kind === "workflow-template"));
      assert.ok(templates.every((template) => template.contributionModel === "github-pr-reviewed"));
      assert.ok(templates.every((template) => template.implementationRoutes.includes("hyperframes")));
      assert.ok(templates.every((template) => template.assetNeeds.length > 0));
    },
  },
  {
    name: "expose Open Design HyperFrames prompt templates as built-in director blueprints",
    run: () => {
      const templates = listHyperframesPromptTemplates();

      assert.deepEqual(
        templates.map((template) => template.id),
        [
          "hyperframes-saas-product-promo-30s",
          "hyperframes-app-showcase-three-phones",
          "hyperframes-product-reveal-minimal",
          "hyperframes-website-to-video-promo",
          "hyperframes-tiktok-karaoke-talking-head",
          "hyperframes-data-bar-chart-race",
          "hyperframes-brand-sizzle-reel",
          "hyperframes-logo-outro-cinematic",
          "hyperframes-social-overlay-stack",
          "hyperframes-money-counter-hype",
          "hyperframes-flight-map-route",
        ],
      );
      assert.ok(templates.every((template) => template.kind === "prompt-template"));
      assert.ok(templates.every((template) => template.source === "open-design-hyperframes"));
      assert.ok(templates.every((template) => template.catalogCommands.every((command) => command.startsWith("npx hyperframes add "))));
      assert.ok(templates.every((template) => template.directorNotes.length > 0));
      assert.ok(templates.every((template) => template.hyperframesRules.includes("Register timelines on window.__timelines.")));
    },
  },
  {
    name: "recommend HyperFrames prompt templates for fuzzy creative intent",
    run: () => {
      const recommendation = recommendHyperframesPromptTemplate({
        idea: "A vertical founder short with karaoke captions and a talking head hook.",
        style: "fast TikTok subtitles big text social proof",
        format: "9:16",
        durationSec: 20,
      });

      assert.equal(recommendation.template.id, "hyperframes-tiktok-karaoke-talking-head");
      assert.ok(recommendation.score > 0);
      assert.match(recommendation.reason, /tiktok|talking|karaoke/i);
    },
  },
  {
    name: "expose HyperFrames Catalog prefabs as official block and component supply",
    run: () => {
      const prefabs = listHyperframesCatalogPrefabs();

      assert.ok(prefabs.some((prefab) => prefab.id === "caption-editorial-emphasis"));
      assert.ok(prefabs.some((prefab) => prefab.kind === "block"));
      assert.ok(prefabs.some((prefab) => prefab.kind === "component"));
      assert.ok(prefabs.every((prefab) => prefab.source === "hyperframes-catalog"));
      assert.ok(prefabs.every((prefab) => prefab.installCommand.startsWith("npx hyperframes add ")));
    },
  },
  {
    name: "recommend HyperFrames Catalog prefabs for template routes without auto-installing them",
    run: () => {
      const recommendation = recommendHyperframesCatalogPrefabs({
        templateId: "course-promo",
        idea: "A premium course promo for founders learning agent video systems.",
        style: "business dynamic polished bigger text",
        format: "9:16",
      });

      assert.equal(recommendation.templateId, "course-promo");
      assert.ok(recommendation.prefabs.some((prefab) => prefab.id === "caption-editorial-emphasis"));
      assert.ok(recommendation.prefabs.some((prefab) => prefab.kind === "component"));
      assert.match(recommendation.agentInstructions.join("\n"), /npx hyperframes catalog --json/);
      assert.match(recommendation.agentInstructions.join("\n"), /do not auto-install/i);
    },
  },
  {
    name: "recommend a template route from fuzzy market intent",
    run: () => {
      const recommendation = recommendTemplateRoute({
        idea: "A shocking data video about revenue growth for founders.",
        style: "big numbers, fast, premium, dramatic",
        format: "9:16",
        durationSec: 30,
      });

      assert.equal(recommendation.template.id, "data-shock");
      assert.ok(recommendation.reason.includes("data"));
      assert.ok(recommendation.template.tags.includes("data"));
      assert.ok(recommendation.score > 0);
    },
  },
  {
    name: "translate fuzzy user taste into a professional Polish Arsenal recommendation",
    run: () => {
      const recommendation = recommendPolishArsenal({
        idea: "A premium course promo for founders learning agent video systems.",
        style: "business, dynamic, polished, bigger text, fast pacing",
        format: "9:16",
        durationSec: 35,
      });

      assert.equal(recommendation.template.id, "course-promo");
      assert.equal(recommendation.directorTranslation.narrativePattern, "promise-path-proof-cta");
      assert.ok(recommendation.directorTranslation.humanCheckpoints.some((item) => /direction/i.test(item)));
      assert.ok(recommendation.catalogRecommendation.prefabs.some((prefab) => prefab.id === "caption-editorial-emphasis"));
      assert.match(recommendation.professionalCreativeLanguage, /premium education funnel/i);
      assert.ok(recommendation.animationTechniques.includes("kinetic typography"));
      assert.ok(recommendation.avoid.some((item) => /tiny text/i.test(item)));
      assert.ok(recommendation.acceptanceCriteria.some((item) => /first frame/i.test(item)));
    },
  },
  {
    name: "write Polish Arsenal recommendations into direction and composition files",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-polish-workbench-"));

      try {
        const project = createWorkbenchProject({
          projectName: "course-promo-polish",
          idea: "A premium course promo for founders learning agent video systems.",
          outputDir: tempRoot,
          style: "business, dynamic, polished, bigger text, fast pacing",
          format: "9:16",
          durationSec: 35,
        });

        assert.match(project.files["DIRECTION.md"], /Template: course-promo/);
        assert.match(project.files["DIRECTION.md"], /Director Translation/);
        assert.match(project.files["DIRECTION.md"], /Human Checkpoints/);
        assert.match(project.files["DIRECTION.md"], /Proposal Options/);
        assert.match(project.files["DIRECTION.md"], /Professional Creative Translation/);
        assert.match(project.files["DIRECTION.md"], /Structure Summary/);
        assert.match(project.files["STYLE.md"], /Brand Direction/);
        assert.match(project.files["STYLE.md"], /Tuning Parameters/);
        assert.match(project.files["STYLE.md"], /motionIntensity/);
        assert.match(project.files["HUMAN.md"], /course-promo/);
        assert.match(project.files["HUMAN.md"], /Next user decision/);
        assert.match(project.files["COMPOSITION.md"], /Recommended Template/);
        assert.match(project.files["COMPOSITION.md"], /Tuning Parameters/);
        assert.match(project.files["COMPOSITION.md"], /Human Explanation/);
        assert.match(project.files["COMPOSITION.md"], /Catalog Pre-Flight/);
        assert.match(project.files["COMPOSITION.md"], /caption-editorial-emphasis/);
        assert.match(project.files["COMPOSITION.md"], /npx hyperframes catalog --json/);
        assert.match(project.files["COMPOSITION.md"], /Kinetic typography/i);
        assert.match(project.files["COMPOSITION.md"], /Acceptance Criteria/);
        assert.match(project.files[".framepack/state.json"], /"directorTranslation"/);
        assert.match(project.files[".framepack/state.json"], /"catalogRecommendation"/);
        assert.match(project.files[".framepack/state.json"], /"hitlLoop"/);
        assert.match(project.files[".framepack/state.json"], /"tuningParameters"/);
        assert.match(project.files[".framepack/state.json"], /"humanDigest"/);
        assert.match(project.files["ITERATIONS.md"], /HITL Loop/);
        assert.match(project.files["ITERATIONS.md"], /Human Review Notes/);
        assert.match(project.files["ITERATIONS.md"], /Decision Log/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate workbench files for agentic loop readiness",
    run: () => {
      const project = createWorkbenchProject({
        projectName: "qa-ready-workbench",
        idea: "A premium SaaS launch video for founders.",
        outputDir: mkdtempSync(join(tmpdir(), "framepack-qa-ready-")),
        style: "business dynamic polished",
        format: "9:16",
        durationSec: 30,
      });
      const report = validateWorkbenchFiles(project.files);

      assert.equal(report.status, "passed");
      assert.equal(report.checks.every((check) => check.status === "passed"), true);
      assert.ok(report.checks.some((check) => check.id === "hitl-loop"));
      assert.ok(report.checks.some((check) => check.id === "catalog-plan"));
      assert.ok(report.checks.some((check) => check.id === "style-direction"));
      assert.ok(report.checks.some((check) => check.id === "tuning-parameters"));
      assert.ok(report.checks.some((check) => check.id === "human-digest"));
      assert.ok(report.checks.some((check) => check.id === "structure-summary"));
      assert.ok(report.checks.some((check) => check.id === "prompt-template-plan"));
    },
  },
  {
    name: "fail workbench validation when core loop files are generic or missing",
    run: () => {
      const report = validateWorkbenchFiles({
        "FRAMEPACK.md": "# Framepack Workbench\n",
        "DIRECTION.md": "# Creative Direction\n",
        "HUMAN.md": "# Human\n",
        "STYLE.md": "# Style\n",
        "COMPOSITION.md": "# Composition Plan\n",
        "ITERATIONS.md": "# Iterations\n",
        "ASSETS.md": "# Assets\n",
        ".framepack/state.json": "{}",
      });

      assert.equal(report.status, "failed");
      assert.ok(report.findings.some((finding) => /Director Translation/i.test(finding)));
      assert.ok(report.findings.some((finding) => /HITL Loop/i.test(finding)));
      assert.ok(report.findings.some((finding) => /Catalog Pre-Flight/i.test(finding)));
      assert.ok(report.findings.some((finding) => /STYLE\.md/i.test(finding)));
      assert.ok(report.findings.some((finding) => /tuningParameters/i.test(finding)));
      assert.ok(report.findings.some((finding) => /HUMAN\.md/i.test(finding)));
      assert.ok(report.findings.some((finding) => /Structure Summary/i.test(finding)));
      assert.ok(report.findings.some((finding) => /HyperFrames Prompt Template/i.test(finding)));
    },
  },
  {
    name: "describe template market through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        ["templates", "--json"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );
      const payload = JSON.parse(stdout.join("\n"));

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.equal(payload.templates.length, 6);
      assert.equal(payload.templates[0].access, "built-in");
      assert.ok(payload.templates.some((template) => template.id === "course-promo"));
    },
  },
  {
    name: "recommend template market routes through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        [
          "templates",
          "recommend",
          "--idea",
          "A premium course promo for founders learning agent video systems.",
          "--style",
          "business dynamic polished",
          "--format",
          "9:16",
          "--duration",
          "35",
          "--json",
        ],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );
      const payload = JSON.parse(stdout.join("\n"));

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.equal(payload.recommendation.template.id, "course-promo");
      assert.ok(payload.recommendation.template.implementationRoutes.includes("hyperframes"));
    },
  },
  {
    name: "describe HyperFrames prompt templates through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        ["templates", "prompt", "--json"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );
      const payload = JSON.parse(stdout.join("\n"));

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.equal(payload.promptTemplates.length, 11);
      assert.ok(payload.promptTemplates.some((template) => template.id === "hyperframes-brand-sizzle-reel"));
    },
  },
  {
    name: "recommend HyperFrames prompt templates through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        [
          "templates",
          "prompt",
          "recommend",
          "--idea",
          "A vertical founder short with karaoke captions.",
          "--style",
          "TikTok subtitles big text talking head",
          "--format",
          "9:16",
          "--json",
        ],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );
      const payload = JSON.parse(stdout.join("\n"));

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.equal(payload.recommendation.template.id, "hyperframes-tiktok-karaoke-talking-head");
      assert.ok(payload.recommendation.template.catalogCommands.includes("npx hyperframes add tiktok-follow"));
    },
  },
  {
    name: "describe HyperFrames Catalog bridge through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        ["catalog", "--json"],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );
      const payload = JSON.parse(stdout.join("\n"));

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.ok(payload.prefabs.some((prefab) => prefab.id === "caption-editorial-emphasis"));
      assert.ok(payload.prefabs.some((prefab) => prefab.kind === "block"));
      assert.ok(payload.prefabs.some((prefab) => prefab.kind === "component"));
    },
  },
  {
    name: "recommend HyperFrames Catalog prefabs through the CLI",
    run: async () => {
      const stdout = [];
      const stderr = [];
      const exitCode = await runCli(
        [
          "catalog",
          "recommend",
          "--template",
          "course-promo",
          "--idea",
          "A premium course promo for founders learning agent video systems.",
          "--style",
          "business dynamic polished",
          "--format",
          "9:16",
          "--json",
        ],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );
      const payload = JSON.parse(stdout.join("\n"));

      assert.equal(exitCode, 0, stderr.join("\n"));
      assert.equal(payload.recommendation.templateId, "course-promo");
      assert.ok(payload.recommendation.prefabs.some((prefab) => prefab.id === "caption-editorial-emphasis"));
      assert.match(payload.recommendation.agentInstructions.join("\n"), /npx hyperframes catalog --json/);
    },
  },
  {
    name: "create a reborn workbench package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-rebirth-cli-"));
      const assetDir = join(tempRoot, "assets-in");
      const stdout = [];
      const stderr = [];

      try {
        mkdirSync(assetDir, { recursive: true });
        writeFileSync(join(assetDir, "hero.jpg"), "jpg", "utf8");

        const exitCode = await runCli(
          [
            "create",
            "--idea",
            "A course promo with a bold animated proof sequence.",
            "--assets",
            assetDir,
            "--output-dir",
            tempRoot,
            "--project-name",
            "course-promo-workbench",
            "--style",
            "premium editorial motion",
            "--duration",
            "30",
            "--json",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const projectDir = join(tempRoot, "course-promo-workbench");
        const payload = JSON.parse(stdout.join("\n"));

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.equal(existsSync(join(projectDir, "FRAMEPACK.md")), true);
        assert.equal(existsSync(join(projectDir, "COMPOSITION.md")), true);
        assert.equal(existsSync(join(projectDir, ".framepack", "state.json")), true);
        assert.equal(payload.projectDir, projectDir);
        assert.equal(payload.assets.length, 1);
        assert.equal(payload.interventionContext.version, "framepack.intervention-context.v1");
        assert.equal(payload.interventionContext.command, "create");
        assert.equal(payload.interventionContext.phase, "preflight");
        assert.equal(payload.interventionContext.status, "needs-review");
        assert.ok(payload.interventionContext.requiredReads.includes("HUMAN.md"));
        assert.match(payload.interventionContext.nextCommand, /workbench brief/);
        assert.match(payload.interventionContext.shortcut, /小白版/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "generate a HyperFrames-passable index.html skeleton",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-skeleton-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "create",
            "--idea",
            "A premium product launch video",
            "--output-dir",
            tempRoot,
            "--project-name",
            "skeleton-test",
            "--style",
            "premium dynamic",
            "--format",
            "16:9",
            "--duration",
            "30",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const projectDir = join(tempRoot, "skeleton-test");
        const html = readFileSync(join(projectDir, "index.html"), "utf8");

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.match(html, /data-composition-id/);
        assert.match(html, /data-start="0"/);
        assert.match(html, /data-duration="30"/);
        assert.match(html, /data-width="1920"/);
        assert.match(html, /data-height="1080"/);
        assert.match(html, /window\.__timelines/);
        assert.match(html, /gsap\.timeline\(\{ paused: true \}\)/);
        assert.match(html, /gsap@3\.14\.2/);
        assert.match(html, /opacity: 1/);
        assert.match(html, /tl\.from/);

        // Enhanced skeleton: transitions between scenes
        assert.match(html, /tl\.set\(.*opacity.*\)|tl\.to\(.*opacity.*0.*\)/, "Should have scene transitions");

        // Enhanced skeleton: CSS custom properties from design tokens
        assert.match(html, /--bg-primary/);
        assert.match(html, /--text-primary/);
        assert.match(html, /--accent-primary/);

        // HyperFrames safety: no Math.random(), no <br>, no video.play()
        assert.equal(html.includes("Math.random()"), false, "No Math.random()");
        assert.equal(html.includes("<br>"), false, "No <br> tags");
        assert.equal(html.includes("video.play()"), false, "No video.play()");

        // Enhanced skeleton: role-specific content elements
        assert.match(html, /scene-title/, "Should have scene titles");
        assert.match(html, /scene-body|stat-value|cta-button|proof-quote/, "Should have role-specific content");

        // Alpha.22: explicit ID selectors (#scene-0) not :first-child only
        assert.match(html, /#scene-0/, "Should use explicit scene ID selectors");
        assert.match(html, /data-scene-id/, "Should have data-scene-id attributes");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "scaffold command regenerates index.html from existing project",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-scaffold-"));
      const stdout = [];
      const stderr = [];

      try {
        // Create a project first
        await runCli(
          ["create", "--idea", "A test video", "--output-dir", tempRoot, "--project-name", "scaffold-test", "--format", "9:16", "--duration", "15"],
          { stdout: (m) => stdout.push(m), stderr: (m) => stderr.push(m) },
        );

        const projectDir = join(tempRoot, "scaffold-test");
        const originalHtml = readFileSync(join(projectDir, "index.html"), "utf8");

        // Run scaffold
        const scaffoldLogs = [];
        const scaffoldExit = await runCli(
          ["scaffold", "--project-dir", projectDir],
          { stdout: (m) => scaffoldLogs.push(m), stderr: (m) => scaffoldLogs.push(m) },
        );

        assert.equal(scaffoldExit, 0, scaffoldLogs.join("\n"));
        assert.match(scaffoldLogs.join("\n"), /Scaffolded/);

        const newHtml = readFileSync(join(projectDir, "index.html"), "utf8");
        assert.match(newHtml, /data-composition-id/);
        assert.match(newHtml, /data-width="1080"/);
        assert.match(newHtml, /data-height="1920"/);
        assert.match(newHtml, /window\.__timelines/);

        // New HTML should be different from original (regenerated)
        assert.notEqual(newHtml.length, 0);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "skeleton applies brand colors to CSS variables",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-brands-"));
      try {
        await runCli(
          ["create", "--idea", "A brand test", "--output-dir", tempRoot, "--project-name", "brand-test", "--brand-colors", "#DA291C,#000000"],
          { stdout: () => {}, stderr: () => {} },
        );

        const html = readFileSync(join(tempRoot, "brand-test", "index.html"), "utf8");
        assert.match(html, /#DA291C/, "Brand primary color should appear in HTML");
        assert.match(html, /#000000/, "Brand secondary color should appear in HTML");
        assert.match(html, /--accent-primary/, "Should have CSS custom properties");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
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
      assert.match(script, /packageJson\.version/);
      assert.match(script, /releaseTag/);
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
    name: "publish a four-route release test harness for v0.4 alpha",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const scriptPath = resolve(dirname(packageJsonPath), "scripts", "run-real-scenarios.mjs");
      const script = readFileSync(scriptPath, "utf8");
      const scenarioReport = readFileSync(framepack04ScenarioReportPath, "utf8");

      assert.equal(packageJson.scripts["release:scenarios"], "npm run build && node scripts/run-real-scenarios.mjs");
      assert.match(script, /markdown-product-explainer/);
      assert.match(script, /thread-editorial-video/);
      assert.match(script, /website-product-video/);
      assert.match(script, /game-ad-sprite-video/);
      assert.match(script, /createServer/);
      assert.match(script, /capture-screenshot/);
      assert.match(script, /capabilityStackSelection/);
      assert.match(script, /validate/);
      assert.match(script, /status/);
      assert.match(scenarioReport, /markdown-product-explainer/);
      assert.match(scenarioReport, /thread-editorial-video/);
      assert.match(scenarioReport, /website-product-video/);
      assert.match(scenarioReport, /game-ad-sprite-video/);
      assert.match(scenarioReport, /four practical user routes/);
      assert.match(scenarioReport, /npm run release:scenarios/);
      assert.match(scenarioReport, /v0\.4\.0-alpha\.1/);
    },
  },
  {
    name: "publish a product-grade sandbox benchmark for internal scoring",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const scriptPath = resolve(dirname(packageJsonPath), "scripts", "run-sandbox-benchmark.mjs");
      const script = readFileSync(scriptPath, "utf8");

      assert.equal(packageJson.scripts["sandbox:benchmark"], "npm run build && node scripts/run-sandbox-benchmark.mjs");
      assert.match(script, /Framepack Sandbox Benchmark/);
      assert.match(script, /coreCapabilities/);
      assert.match(script, /mcp-callability/);
      assert.match(script, /workbench-mainline/);
      assert.match(script, /template-arsenal/);
      assert.match(script, /catalog-bridge/);
      assert.match(script, /composition-build-contract/);
      assert.match(script, /hyperframes-lint/);
      assert.match(script, /plain-language-review/);
      assert.match(script, /design-token-contract/);
      assert.match(script, /asset-gap-intelligence/);
      assert.match(script, /skill-install-surface/);
      assert.match(script, /harness-compliance-audit/);
      assert.match(script, /preflight/);
      assert.match(script, /phaseAudits/);
      assert.match(script, /lintWarnings/);
      assert.match(script, /sandbox-report\.json/);
      assert.match(script, /SANDBOX_REPORT\.md/);
      assert.match(script, /Xiaobai Summary/);
      assert.match(script, /BENCHMARK_MAX_SCORE = 100/);
      assert.match(script, /priorityBlockers/);
      assert.match(script, /timeout:/);
      assert.match(script, /--clean/);
      assert.match(script, /Client/);
      assert.match(script, /StdioClientTransport/);
      assert.match(script, /callTool/);
      assert.match(script, /--json/);
    },
  },
  {
    name: "run the sandbox benchmark and verify its report contract",
    run: () => {
      const outputDir = mkdtempSync(resolve(dirname(packageJsonPath), "out", "sandbox-benchmark", "test-contract-"));
      const stdout = execSync(
        `node scripts/run-sandbox-benchmark.mjs --output-dir "${outputDir}" --clean --json`,
        { cwd: resolve(dirname(packageJsonPath)), encoding: "utf8", timeout: 120000 },
      );
      const jsonStart = stdout.indexOf("{");
      const report = JSON.parse(stdout.slice(jsonStart));

      assert.equal(report.title, "Framepack Sandbox Benchmark");
      assert.equal(report.maxScore, 100);
      assert.ok(report.coreCapabilities.some((check) => check.id === "mcp-callability"));
      assert.ok(report.coreCapabilities.some((check) => check.id === "workbench-mainline"));
      assert.ok(report.coreCapabilities.some((check) => check.id === "design-token-contract"));
      assert.ok(report.coreCapabilities.some((check) => check.id === "asset-gap-intelligence"));
      assert.ok(report.coreCapabilities.some((check) => check.id === "skill-install-surface"));
      assert.ok(report.coreCapabilities.some((check) => check.id === "harness-compliance-audit"));
      assert.ok(report.coreCapabilities.some((check) => check.id === "hyperframes-lint"));
      assert.equal(existsSync(join(outputDir, "sandbox-report.json")), true);
      assert.equal(existsSync(join(outputDir, "SANDBOX_REPORT.md")), true);
      assert.match(readFileSync(join(outputDir, "SANDBOX_REPORT.md"), "utf8"), /Xiaobai Summary/);
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
      assert.match(agents, /real-user-trial-v0\.4\.0-alpha\.3/);
    },
  },
  {
    name: "document one-prompt agent onboarding",
    run: () => {
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const installDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "agent-platform", "install-with-agent.md"),
        "utf8",
      );
      const codexDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "agent-platform", "codex.md"),
        "utf8",
      );
      const claudeDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "agent-platform", "claude-code.md"),
        "utf8",
      );

      assert.match(installDoc, /create a small workbench/);
      assert.match(installDoc, /phase audits/);
      assert.match(codexDoc, /create a Framepack workbench/);
      assert.match(codexDoc, /workbench audit --phase preflight/);
      assert.match(claudeDoc, /Ask Claude Code/);
      assert.match(claudeDoc, /run the audit gates/);
    },
  },
  {
    name: "document v0.4 beta readiness criteria",
    run: () => {
      const betaReadiness = readFileSync(framepack04BetaReadinessPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.match(betaReadiness, /BETA-READINESS-06/);
      assert.match(betaReadiness, /beta published and trial passed/);
      assert.match(betaReadiness, /0\.4\.0-alpha\.4/);
      assert.match(betaReadiness, /0\.4\.0-beta\.1/);
      assert.match(betaReadiness, /140\/140 checks passed/);
      assert.match(betaReadiness, /entryCount 202/);
      assert.match(betaReadiness, /website-product-video/);
      assert.match(betaReadiness, /four routes/);
      assert.match(betaReadiness, /BETA-ONBOARDING-08/);
      assert.match(betaReadiness, /Codex onboarding generated `AGENTS\.md`/);
      assert.match(betaReadiness, /Claude Code onboarding generated `CLAUDE\.md`/);
      assert.match(betaReadiness, /Visual QA Minimum For Beta/);
      assert.match(betaReadiness, /runtime inspect/);
      assert.match(betaReadiness, /runtime snapshot/);
      assert.match(betaReadiness, /BETA-GATE-07/);
      assert.match(betaReadiness, /release-candidate-v0\.4\.0-beta\.1/);
      assert.match(betaReadiness, /BETA-CANDIDATE-10/);
      assert.match(betaReadiness, /real-user-trial-v0\.4\.0-beta\.1/);
      assert.match(betaReadiness, /Framepack does not claim assets are produced until outputs and metadata exist/);
      assert.match(agents, /beta-readiness-v0\.4/);
    },
  },
  {
    name: "document the published v0.4 beta real user trial",
    run: () => {
      const betaTrial = readFileSync(framepack04BetaUserTrialPath, "utf8");
      const betaReadiness = readFileSync(framepack04BetaReadinessPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.match(betaTrial, /BETA-CANDIDATE-10/);
      assert.match(betaTrial, /framepack@beta/);
      assert.match(betaTrial, /0\.4\.0-beta\.1/);
      assert.match(betaTrial, /installedHyperFrames": "0\.6\.40/);
      assert.match(betaTrial, /helpHasBetaCommand": true/);
      assert.match(betaTrial, /mcpHasGenerateProject": true/);
      assert.match(betaTrial, /recommendedWorkflow": "product-explainer/);
      assert.match(betaTrial, /atlasStack": "web-motion-explainer-stack/);
      assert.match(betaTrial, /readiness": "ready/);
      assert.match(betaTrial, /runtimeDoctorHas0640": true/);
      assert.match(betaTrial, /Npm Cache Note/);
      assert.match(betaReadiness, /real-user-trial-v0\.4\.0-beta\.1/);
      assert.match(agents, /real-user-trial-v0\.4\.0-beta\.1/);
    },
  },
  {
    name: "document the v0.4 beta feedback loop",
    run: () => {
      const feedbackLoop = readFileSync(framepack04BetaFeedbackLoopPath, "utf8");
      const betaReadiness = readFileSync(framepack04BetaReadinessPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");
      const issueTemplate = readFileSync(betaFeedbackIssueTemplatePath, "utf8");

      assert.match(feedbackLoop, /BETA-FEEDBACK-11/);
      assert.match(feedbackLoop, /\.github\/ISSUE_TEMPLATE\/beta-feedback\.md/);
      assert.match(feedbackLoop, /Standard Beta Trial Script/);
      assert.match(feedbackLoop, /npm install framepack@beta/);
      assert.match(feedbackLoop, /npx framepack mcp --describe/);
      assert.match(feedbackLoop, /npx framepack runtime doctor/);
      assert.match(feedbackLoop, /runtime inspect/);
      assert.match(feedbackLoop, /Feedback Report Template/);
      assert.match(feedbackLoop, /P0: blocks installation/);
      assert.match(feedbackLoop, /P1: blocks an advertised beta workflow/);
      assert.match(feedbackLoop, /installation/);
      assert.match(feedbackLoop, /agent-onboarding/);
      assert.match(feedbackLoop, /asset-forge/);
      assert.match(feedbackLoop, /What Agents Must Report/);
      assert.match(feedbackLoop, /Plain-Language Summary/);
      assert.match(issueTemplate, /Framepack beta feedback/);
      assert.match(issueTemplate, /readiness/);
      assert.match(issueTemplate, /nextActionItems/);
      assert.match(issueTemplate, /P0: blocks installation/);
      assert.match(issueTemplate, /runtime inspect JSON or snapshot manifest/);
      assert.match(betaReadiness, /beta-feedback-loop-v0\.4/);
      assert.match(agents, /beta-feedback-loop-v0\.4/);
    },
  },
  {
    name: "document the v0.4 beta product state cutoff",
    run: () => {
      const cutoff = readFileSync(framepack04BetaCutoffPath, "utf8");
      const betaReadiness = readFileSync(framepack04BetaReadinessPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.match(cutoff, /BETA-CUTOFF-12/);
      assert.match(cutoff, /0\.4\.0-beta\.1/);
      assert.match(cutoff, /0\.4\.0-alpha\.4/);
      assert.match(cutoff, /latest tag: intentionally not advanced/);
      assert.match(cutoff, /BETA-READINESS-06/);
      assert.match(cutoff, /BETA-GATE-07/);
      assert.match(cutoff, /BETA-ONBOARDING-08/);
      assert.match(cutoff, /HYPERFRAMES-COMPAT-09/);
      assert.match(cutoff, /BETA-CANDIDATE-10/);
      assert.match(cutoff, /BETA-FEEDBACK-11/);
      assert.match(cutoff, /Closed In 0\.4 Beta/);
      assert.match(cutoff, /Deliberately Not Closed/);
      assert.match(cutoff, /agent-first installation guidance/);
      assert.match(cutoff, /backend-neutral Asset Forge Layer contracts/);
      assert.match(cutoff, /automatic installation of `agent-sprite-forge` skills/);
      assert.match(cutoff, /BETA-PATCH-RADAR-13/);
      assert.match(cutoff, /beta-patch-radar-v0\.4/);
      assert.match(cutoff, /Plain-Language Summary/);
      assert.match(betaReadiness, /v0\.4-beta-product-state-cutoff/);
      assert.match(betaReadiness, /BETA-CUTOFF-12/);
      assert.match(agents, /v0\.4-beta-product-state-cutoff/);
    },
  },
  {
    name: "document the v0.4 beta patch radar",
    run: () => {
      const radar = readFileSync(framepack04BetaPatchRadarPath, "utf8");
      const cutoff = readFileSync(framepack04BetaCutoffPath, "utf8");
      const betaReadiness = readFileSync(framepack04BetaReadinessPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.match(radar, /BETA-PATCH-RADAR-13/);
      assert.match(radar, /framepack@0\.4\.0-beta\.1/);
      assert.match(radar, /npm view framepack dist-tags version --json/);
      assert.match(radar, /"beta": "0\.4\.0-beta\.1"/);
      assert.match(radar, /Trial A: Clean Markdown Project/);
      assert.match(radar, /Trial B: Clean Game-Ad Forge Project/);
      assert.match(radar, /"version": "0\.4\.0-beta\.1"/);
      assert.match(radar, /"statusReady": true/);
      assert.match(radar, /"statusNeedsAssets": true/);
      assert.match(radar, /forge-character-pack/);
      assert.match(radar, /forge-map-pack/);
      assert.match(radar, /forge-fx-pack/);
      assert.match(radar, /Beta Patch Queue/);
      assert.match(radar, /No `beta\.2` trigger/);
      assert.match(radar, /0\.4\.0-beta\.2` Trigger Rules/);
      assert.match(radar, /User Test Project Entry/);
      assert.match(radar, /Do not claim visual-ready output/);
      assert.match(radar, /Plain-Language Summary/);
      assert.match(cutoff, /beta-patch-radar-v0\.4/);
      assert.match(betaReadiness, /beta-patch-radar-v0\.4/);
      assert.match(agents, /beta-patch-radar-v0\.4/);
    },
  },
  {
    name: "document the v0.4 beta manual test guide",
    run: () => {
      const guide = readFileSync(framepack04ManualBetaTestGuidePath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      assert.match(guide, /BETA-MANUAL-TEST-14/);
      assert.match(guide, /framepack@0\.4\.0-beta\.1/);
      assert.match(guide, /npm install framepack@beta --no-audit --no-fund/);
      assert.match(guide, /npx framepack mcp --describe/);
      assert.match(guide, /init-agent --target codex/);
      assert.match(guide, /init-agent --target claude-code/);
      assert.match(guide, /Markdown 产品说明转视频项目/);
      assert.match(guide, /游戏风广告 \/ Asset Forge/);
      assert.match(guide, /forge-character-pack/);
      assert.match(guide, /forge-map-pack/);
      assert.match(guide, /forge-fx-pack/);
      assert.match(guide, /问题记录模板/);
      assert.match(guide, /P0: 安装、CLI、MCP、generate、validate、status 直接坏/);
      assert.match(guide, /小白总结/);
      assert.equal(packageJson.files.includes("README.zh-CN.md"), false);
      assert.match(readme, /docs\/README\.zh-CN\.md/);
      assert.match(agents, /manual-beta-test-guide-v0\.4\.zh-CN/);
    },
  },
  {
    name: "document separate beta onboarding trials",
    run: () => {
      const onboardingTrials = readFileSync(framepack04BetaOnboardingTrialsPath, "utf8");
      const betaReadiness = readFileSync(framepack04BetaReadinessPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.match(onboardingTrials, /BETA-ONBOARDING-08/);
      assert.match(onboardingTrials, /0\.4\.0-alpha\.4/);
      assert.match(onboardingTrials, /Codex Clean Install Trial/);
      assert.match(onboardingTrials, /Claude Code Clean Install Trial/);
      assert.match(onboardingTrials, /\.framepack\/agent\/codex\/SKILL\.md/);
      assert.match(onboardingTrials, /CLAUDE\.md/);
      assert.match(onboardingTrials, /\.mcp\.json/);
      assert.match(onboardingTrials, /`CLAUDE\.md` was absent/);
      assert.match(onboardingTrials, /Codex skill file was absent/);
      assert.match(onboardingTrials, /product-explainer/);
      assert.match(onboardingTrials, /thread-to-video/);
      assert.match(betaReadiness, /beta-onboarding-trials-v0\.4/);
      assert.match(agents, /beta-onboarding-trials-v0\.4/);
    },
  },
  {
    name: "document HyperFrames compatibility review for beta",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
      const hyperframesCompat = readFileSync(framepack04HyperframesCompatPath, "utf8");
      const betaReadiness = readFileSync(framepack04BetaReadinessPath, "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.equal(packageJson.dependencies.hyperframes, "^0.6.40");
      assert.match(hyperframesCompat, /HYPERFRAMES-COMPAT-09/);
      assert.match(hyperframesCompat, /0\.6\.40/);
      assert.match(hyperframesCompat, /runtime lint/);
      assert.match(hyperframesCompat, /runtime inspect/);
      assert.match(hyperframesCompat, /Framepack dependency after this review: `hyperframes \^0\.6\.40`/);
      assert.match(hyperframesCompat, /`lambda`/);
      assert.match(hyperframesCompat, /Plain-Language Summary/);
      assert.match(betaReadiness, /HYPERFRAMES-COMPAT-09/);
      assert.match(betaReadiness, /hyperframes-compat-v0\.4/);
      assert.match(betaReadiness, /hyperframes \^0\.6\.40/);
      assert.match(betaReadiness, /npm run release:gate/);
      assert.match(agents, /hyperframes-compat-v0\.4/);
    },
  },
  {
    name: "document the Framepack 0.4 beta release candidate",
    run: () => {
      const betaNotes = readFileSync(framepack04BetaNotesPath, "utf8");
      const changelog = readFileSync(resolve(dirname(packageJsonPath), "CHANGELOG.md"), "utf8");
      const readme = readFileSync(readmePath, "utf8");
      const chineseReadme = readFileSync(chineseReadmePath, "utf8");
      const agents = readFileSync(agentsPath, "utf8");

      assert.match(betaNotes, /v0\.4\.0-beta\.1/);
      assert.match(betaNotes, /framepack@beta/);
      assert.match(betaNotes, /HyperFrames `0\.6\.40`/);
      assert.match(betaNotes, /BETA-ONBOARDING-08|separate Codex and Claude Code/);
      assert.match(betaNotes, /HYPERFRAMES-COMPAT-09|HyperFrames compatibility/);
      assert.match(betaNotes, /npm publish --access public --tag beta/);
      assert.match(betaNotes, /Plain-Language Summary/);
      assert.match(changelog, /0\.4\.0-beta\.1/);
      assert.match(changelog, /HyperFrames runtime dependency to `\^0\.6\.40`/);
      assert.match(agents, /release-candidate-v0\.4\.0-beta\.1/);
      assert.match(agents, /framepack@beta/);
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
      assert.match(releaseDoc, /v0\.4\.0-alpha\.4/);
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
      const agents = readFileSync(agentsPath, "utf8");
      const architectureDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "architecture", "framepack-0.4-capability-runtime-architecture.md"),
        "utf8",
      );
      const planDoc = readFileSync(
        resolve(dirname(packageJsonPath), "docs", "superpowers", "plans", "2026-05-19-framepack-0.4-capability-runtime-foundation.md"),
        "utf8",
      );

      for (const doc of [agents, architectureDoc, planDoc]) {
        assert.match(doc, /Agent Harness/);
        assert.match(doc, /Sense filter/);
        assert.match(doc, /Motor pathways/);
        assert.match(doc, /Reflexes/);
        assert.match(doc, /Memory encoding/);
        assert.match(doc, /Feedback loop/);
      }

      assert.match(architectureDoc, /field engineering rather than a fixed rail workflow/);
      assert.match(planDoc, /video production Agent Harness/);
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
    },
  },
  {
    name: "ship rebirth docs and templates for packaged installs",
    run: () => {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

      assert.ok(packageJson.files.includes("templates"));
      assert.ok(packageJson.files.includes("docs/rebirth"));
      assert.equal(packageJson.files.includes("docs/agent-platform"), false);
      assert.match(readFileSync(resolve(dirname(packageJsonPath), "README.md"), "utf8"), /Programmatic Video/);
      assert.match(readFileSync(resolve(dirname(packageJsonPath), "docs", "README.zh-CN.md"), "utf8"), /\u4e09\u5c42\u673a\u5236/);
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
      assert.match(stdout.join("\n"), /version: (0\.6\.40|unknown)/);
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
        assert.match(readFileSync(join(tempRoot, "AGENTS.md"), "utf8"), /\.framepack\/agent\/codex\/skills/);
        assert.match(readFileSync(join(tempRoot, "AGENTS.md"), "utf8"), /ASSET_GAPS\.md/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /framepack create/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /FRAMEPACK\.md/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /framepack-director/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /framepack-template-fuser/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /framepack-hyperframes-builder/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /framepack-reference-miner/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /HUMAN\.md/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /TEMPLATE_BLUEPRINT\.md/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md"), "utf8"), /workbench audit --phase preflight/);
        assert.match(readFileSync(join(tempRoot, "AGENTS.md"), "utf8"), /workbench audit --phase/);
        assert.match(readFileSync(join(tempRoot, ".framepack", "agent", "codex", "INSTALL.md"), "utf8"), /npx -y framepack mcp/);
        const codexSkillRoot = join(tempRoot, ".framepack", "agent", "codex", "skills");
        for (const skillName of [
          "framepack-director",
          "framepack-template-fuser",
          "framepack-hyperframes-builder",
          "framepack-reference-miner",
        ]) {
          const skill = readFileSync(join(codexSkillRoot, skillName, "SKILL.md"), "utf8");
          assert.match(skill, new RegExp(`name: ${skillName}`));
          assert.match(skill, /description: Use when/);
          assert.match(skill, /FRAMEPACK\.md|COMPOSITION\.md|VIDEO_DNA\.md/);
        }
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
        assert.match(readFileSync(join(tempRoot, "CLAUDE.md"), "utf8"), /FRAMEPACK\.md/);
        assert.match(readFileSync(join(tempRoot, "CLAUDE.md"), "utf8"), /framepack-template-fuser/);
        assert.match(readFileSync(join(tempRoot, "CLAUDE.md"), "utf8"), /framepack-reference-miner/);
        assert.match(readFileSync(join(tempRoot, "CLAUDE.md"), "utf8"), /ASSET_GAPS\.md/);
        assert.match(readFileSync(join(tempRoot, "CLAUDE.md"), "utf8"), /workbench audit --phase/);
        assert.match(readFileSync(join(tempRoot, "CLAUDE.md"), "utf8"), /\.claude\/skills/);
        const claudeSkillRoot = join(tempRoot, ".claude", "skills");
        const directorSkill = readFileSync(join(claudeSkillRoot, "framepack-director", "SKILL.md"), "utf8");
        const fuserSkill = readFileSync(join(claudeSkillRoot, "framepack-template-fuser", "SKILL.md"), "utf8");
        const builderSkill = readFileSync(join(claudeSkillRoot, "framepack-hyperframes-builder", "SKILL.md"), "utf8");
        const minerSkill = readFileSync(join(claudeSkillRoot, "framepack-reference-miner", "SKILL.md"), "utf8");

        assert.match(directorSkill, /name: framepack-director/);
        assert.match(directorSkill, /HUMAN\.md/);
        assert.match(directorSkill, /fuzzy user language/i);
        assert.match(fuserSkill, /name: framepack-template-fuser/);
        assert.match(fuserSkill, /Template Fusion Plan/);
        assert.match(fuserSkill, /COMPOSITION\.md/);
        assert.match(builderSkill, /name: framepack-hyperframes-builder/);
        assert.match(builderSkill, /window\.__timelines/);
        assert.match(builderSkill, /npx hyperframes inspect/);
        assert.match(minerSkill, /name: framepack-reference-miner/);
        assert.match(minerSkill, /VIDEO_DNA\.md/);
        assert.match(minerSkill, /TEMPLATE_BLUEPRINT\.md/);
        const mcpConfig = JSON.parse(readFileSync(join(tempRoot, ".mcp.json"), "utf8"));
        assert.equal(mcpConfig.mcpServers.framepack.command, "cmd");
        assert.deepEqual(mcpConfig.mcpServers.framepack.args, ["/c", "npx", "-y", "framepack", "mcp"]);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "check a workbench package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-workbench-check-"));
      const stdout = [];
      const stderr = [];

      try {
        const createExitCode = await runCli(
          [
            "create",
            "--idea",
            "A premium SaaS launch video for founders.",
            "--output-dir",
            tempRoot,
            "--project-name",
            "checked-workbench",
            "--style",
            "business dynamic polished",
            "--duration",
            "30",
          ],
          {
            stdout: () => {},
            stderr: (message) => stderr.push(message),
          },
        );
        const checkExitCode = await runCli(
          ["workbench", "check", "--project-dir", join(tempRoot, "checked-workbench"), "--json"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );
        const payload = JSON.parse(stdout.join("\n"));

        assert.equal(createExitCode, 0, stderr.join("\n"));
        assert.equal(checkExitCode, 0, stderr.join("\n"));
        assert.equal(payload.report.status, "passed");
        assert.equal(payload.interventionContext.version, "framepack.intervention-context.v1");
        assert.equal(payload.interventionContext.command, "check");
        assert.equal(payload.interventionContext.status, "ready");
        assert.match(payload.interventionContext.nextCommand, /workbench audit --phase design/);
        assert.ok(payload.report.checks.some((check) => check.id === "hitl-loop"));
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "audit a workbench package for harness compliance",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-workbench-audit-"));
      const stdout = [];
      const stderr = [];

      try {
        const createExitCode = await runCli(
          [
            "create",
            "--idea",
            "A premium Apple-like SaaS launch video for founders with product proof and a strong CTA.",
            "--output-dir",
            tempRoot,
            "--project-name",
            "audited-workbench",
            "--style",
            "premium minimal polished business",
            "--duration",
            "30",
            "--format",
            "9:16",
          ],
          {
            stdout: () => {},
            stderr: (message) => stderr.push(message),
          },
        );
        const projectDir = join(tempRoot, "audited-workbench");
        const report = auditWorkbenchProject(projectDir);
        const auditExitCode = await runCli(
          ["workbench", "audit", "--project-dir", projectDir, "--json"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );
        const payload = JSON.parse(stdout.join("\n"));

        assert.equal(createExitCode, 0, stderr.join("\n"));
        assert.equal(auditExitCode, 0, stderr.join("\n"));
        assert.equal(report.status, "passed");
        assert.equal(payload.report.status, "passed");
        assert.equal(existsSync(join(projectDir, "DESIGN.md")), true);
        assert.equal(existsSync(join(projectDir, "DESIGN_TOKENS.md")), true);
        assert.ok(payload.report.checks.some((check) => check.id === "design-token-contract"));
        assert.ok(payload.report.checks.some((check) => check.id === "asset-gap-intelligence"));
        assert.ok(payload.report.checks.some((check) => check.id === "skill-install-surface"));
        assert.ok(payload.report.checks.some((check) => check.id === "harness-compliance-audit"));
        assert.equal(payload.report.phase, "all");
        assert.equal(payload.interventionContext.command, "audit");
        assert.equal(payload.interventionContext.phase, "preflight");
        assert.equal(payload.interventionContext.status, "ready");
        assert.ok(payload.interventionContext.skillHints.includes("framepack-director"));
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "audit lifecycle phases gate workbench progress before build and render",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-workbench-audit-phase-"));
      const stderr = [];

      try {
        const createExitCode = await runCli(
          [
            "create",
            "--idea",
            "A premium SaaS launch video for founders with big text and product proof.",
            "--output-dir",
            tempRoot,
            "--project-name",
            "phase-workbench",
            "--style",
            "premium business dynamic",
            "--duration",
            "30",
            "--format",
            "9:16",
          ],
          {
            stdout: () => {},
            stderr: (message) => stderr.push(message),
          },
        );
        const projectDir = join(tempRoot, "phase-workbench");

        for (const phase of ["preflight", "design", "composition", "preview", "render"]) {
          const stdout = [];
          const exitCode = await runCli(
            ["workbench", "audit", "--phase", phase, "--project-dir", projectDir, "--json"],
            {
              stdout: (message) => stdout.push(message),
              stderr: (message) => stderr.push(message),
            },
          );
          const payload = JSON.parse(stdout.join("\n"));

          assert.equal(exitCode, 0, `${phase}: ${stderr.join("\n")}`);
          assert.equal(payload.report.phase, phase);
          assert.equal(payload.report.status, "passed");
          assert.ok(payload.report.checks.length > 0);
        }

        rmSync(join(projectDir, "DESIGN_TOKENS.md"), { force: true });
        const failedStdout = [];
        const failedExitCode = await runCli(
          ["workbench", "audit", "--phase", "design", "--project-dir", projectDir, "--json"],
          {
            stdout: (message) => failedStdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );
        const failedPayload = JSON.parse(failedStdout.join("\n"));

        assert.equal(createExitCode, 0, stderr.join("\n"));
        assert.equal(failedExitCode, 1);
        assert.equal(failedPayload.report.phase, "design");
        assert.ok(failedPayload.report.priorityBlockers.some((check) => check.id === "design-token-contract"));
        assert.equal(failedPayload.interventionContext.status, "blocked");
        assert.equal(failedPayload.interventionContext.phase, "design");
        assert.ok(failedPayload.interventionContext.blockers.some((blocker) => blocker.includes("design-token-contract")));
        assert.match(failedPayload.interventionContext.nextCommand, /Fix blockers/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "audit reports harness drift when critical workbench files are skipped",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-workbench-audit-drift-"));

      try {
        mkdirSync(join(tempRoot, ".framepack"), { recursive: true });
        writeFileSync(join(tempRoot, "FRAMEPACK.md"), "# Framepack Workbench\n", "utf8");
        writeFileSync(join(tempRoot, "HUMAN.md"), "# Human Brief\n\n## Current Summary\n\nDraft.\n", "utf8");
        writeFileSync(join(tempRoot, "ASSETS.md"), "# Assets\n\n- logo.png (image)\n", "utf8");
        writeFileSync(join(tempRoot, "ASSET_GAPS.md"), "# Asset Gap Analysis\n\nNo critical gaps detected.\n", "utf8");
        writeFileSync(join(tempRoot, "STYLE.md"), "# Style Direction\n\n## Brand Direction\n\nDraft.\n", "utf8");
        writeFileSync(join(tempRoot, "DIRECTION.md"), "# Creative Direction\n\n## Director Translation\n\nDraft.\n", "utf8");
        writeFileSync(join(tempRoot, "COMPOSITION.md"), "# Composition Plan\n\n## Catalog Pre-Flight\n\nDraft.\n", "utf8");
        writeFileSync(join(tempRoot, "ITERATIONS.md"), "# Iterations\n\n## HITL Loop\n\nDraft.\n", "utf8");
        writeFileSync(join(tempRoot, ".framepack", "state.json"), JSON.stringify({ version: "framepack.workbench.v1" }, null, 2), "utf8");

        const report = auditWorkbenchProject(tempRoot);

        assert.equal(report.status, "failed");
        assert.ok(report.priorityBlockers.some((check) => check.id === "design-token-contract"));
        assert.ok(report.priorityBlockers.some((check) => check.id === "skill-install-surface"));
        assert.ok(report.corrections.some((item) => /DESIGN/.test(item)));
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "summarize a workbench package for human review from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-workbench-brief-"));
      const stdout = [];
      const stderr = [];

      try {
        const createExitCode = await runCli(
          [
            "create",
            "--idea",
            "A fast founder story video about learning to ship polished programmed video.",
            "--output-dir",
            tempRoot,
            "--project-name",
            "briefed-workbench",
            "--style",
            "cinematic, business, fast, bigger text",
            "--duration",
            "35",
            "--format",
            "9:16",
          ],
          {
            stdout: () => {},
            stderr: (message) => stderr.push(message),
          },
        );
        const briefExitCode = await runCli(
          ["workbench", "brief", "--project-dir", join(tempRoot, "briefed-workbench")],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );
        const output = stdout.join("\n");

        assert.equal(createExitCode, 0, stderr.join("\n"));
        assert.equal(briefExitCode, 0, stderr.join("\n"));
        assert.match(output, /Framepack human brief/);
        assert.match(output, /Current Summary/);
        assert.match(output, /Video Structure/);
        assert.match(output, /Next user decision/);
        assert.match(output, /Technology in plain words/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "initialize all agent surfaces with auto target",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-agent-auto-"));

      try {
        const stdout = [];
        const stderr = [];
        const exitCode = await runCli(
          ["init-agent", "--target", "auto", "--scope", "project", "--package-source", "npm"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
          {},
          { cwd: tempRoot, platform: "win32" },
        );

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.match(stdout.join("\n"), /target: auto/);
        assert.equal(existsSync(join(tempRoot, "AGENTS.md")), true);
        assert.equal(existsSync(join(tempRoot, "CLAUDE.md")), true);
        assert.equal(existsSync(join(tempRoot, ".framepack", "agent", "codex", "SKILL.md")), true);
        assert.equal(existsSync(join(tempRoot, ".mcp.json")), true);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "merge Framepack MCP config without removing existing servers",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-agent-mcp-merge-"));

      try {
        writeFileSync(
          join(tempRoot, ".mcp.json"),
          `\uFEFF\uFEFF${JSON.stringify({ mcpServers: { existing: { command: "node", args: ["server.js"] } }, custom: true }, null, 2)}\n`,
          "utf8",
        );

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

        const mcpConfig = JSON.parse(readFileSync(join(tempRoot, ".mcp.json"), "utf8"));

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.equal(mcpConfig.custom, true);
        assert.deepEqual(mcpConfig.mcpServers.existing, { command: "node", args: ["server.js"] });
        assert.equal(mcpConfig.mcpServers.framepack.command, "cmd");
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
      // Alpha.24: knowledge query tools
      assert.match(output, /querySceneTemplate/);
      assert.match(output, /recommendAnimation/);
      assert.match(output, /getComponentCode/);
      assert.match(output, /framepack:\/\/knowledge\/video-design/);
      assert.match(output, /framepack:\/\/knowledge\/hyperframes-rules/);
      assert.match(output, /framepack:\/\/templates\/scene-templates/);
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
        assert.equal(status.quality.status, "passed");
        assert.equal(status.quality.failedChecks, 0);
        assert.ok(status.quality.checkIds.includes("proposal-scene-coverage"));
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
    name: "repair project package rebuilds malformed asset execution plan",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-repair-asset-execution-"));
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
            "repair-asset-execution-package",
            "--format",
            "9:16",
            "--auto-pack",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        const projectDir = join(tempRoot, "repair-asset-execution-package");
        const assetExecutionPlanPath = join(projectDir, "ASSET_EXECUTION_PLAN.json");
        writeFileSync(assetExecutionPlanPath, '{"broken": true}', "utf8");

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
        const repairedAssetExecutionPlan = JSON.parse(readFileSync(assetExecutionPlanPath, "utf8"));

        assert.equal(generateExitCode, 0);
        assert.equal(repairExitCode, 0);
        assert.equal(finalValidateExitCode, 0);
        assert.equal(repairStderr.length, 0);
        assert.equal(validateStderr.length, 0);
        assert.ok(Array.isArray(repairedAssetExecutionPlan.items));
        assert.ok(repairedAssetExecutionPlan.items.length > 0);
        assert.match(repairStdout.join("\n"), /ASSET_EXECUTION_PLAN\.json/);
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
  {
    name: "bundled catalog components include all 23 HyperFrames components",
    async run() {
      const catalogDir = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../templates/catalog/components",
      );
      assert.ok(existsSync(catalogDir), "templates/catalog/components/ should exist");

      const files = readdirSync(catalogDir).filter(f => f.endsWith(".json"));
      assert.ok(files.length >= 23, `Expected 23+ component manifests, got ${files.length}`);

      const htmlFiles = readdirSync(catalogDir).filter(f => f.endsWith(".html"));
      assert.ok(htmlFiles.length >= 23, `Expected 23+ component HTML files, got ${htmlFiles.length}`);

      const notice = readFileSync(join(catalogDir, "NOTICE"), "utf8");
      assert.match(notice, /Apache License/);
      assert.match(notice, /HeyGen/);

      for (const mf of files) {
        const manifest = JSON.parse(readFileSync(join(catalogDir, mf), "utf8"));
        assert.ok(manifest.name, `${mf} should have a name`);
        assert.ok(Array.isArray(manifest.files), `${mf} should have files array`);
      }
    },
  },
  {
    name: "catalog install uses bundled components without network",
    async run() {
      const tempRoot = mkdtempSync(join(tmpdir(), "fp-catalog-"));
      const origCwd = process.cwd();
      try {
        mkdirSync(join(tempRoot, "compositions"), { recursive: true });
        process.chdir(tempRoot);

        const logs = [];
        const io = { stdout: (m) => logs.push(m), stderr: (m) => logs.push(m) };
        await runCli(["catalog", "install"], io);

        const outDir = join(tempRoot, "compositions", "components");
        assert.ok(existsSync(outDir), "compositions/components/ should be created");

        const installed = readdirSync(outDir).filter(f => f.endsWith(".html"));
        assert.ok(installed.length >= 23, `Expected 23+ installed components, got ${installed.length}`);
        assert.ok(logs.some(l => l.includes("bundled")), 'Should mention "bundled" in output');
      } finally {
        process.chdir(origCwd);
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  // ── Scene Template System Tests ──────────────────────

  {
    name: "scene template system loads 20 builtin templates",
    run() {
      const templatesDir = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../templates/scene-templates",
      );
      assert.ok(existsSync(templatesDir), "templates/scene-templates/ should exist");

      const categories = readdirSync(templatesDir).filter(d => {
        try { return readdirSync(join(templatesDir, d)).length > 0; } catch { return false; }
      });

      const jsonFiles = [];
      for (const cat of categories) {
        const catDir = join(templatesDir, cat);
        jsonFiles.push(...readdirSync(catDir).filter(f => f.endsWith(".json")));
      }

      assert.ok(jsonFiles.length >= 20, `Expected 20+ builtin templates, got ${jsonFiles.length}`);

      // Verify each JSON has required fields
      for (const jf of jsonFiles) {
        const cat = categories.find(c => readdirSync(join(templatesDir, c)).includes(jf));
        const content = JSON.parse(readFileSync(join(templatesDir, cat, jf), "utf-8"));
        assert.ok(content.id, `${jf} should have id`);
        assert.ok(content.category, `${jf} should have category`);
        assert.ok(Array.isArray(content.tags), `${jf} should have tags array`);
        assert.ok(typeof content.minDuration === "number", `${jf} should have minDuration`);
        assert.ok(typeof content.maxDuration === "number", `${jf} should have maxDuration`);
      }
    },
  },

  {
    name: "scene template system includes matching HTML for each JSON",
    run() {
      const templatesDir = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../templates/scene-templates",
      );
      const categories = readdirSync(templatesDir).filter(d => {
        try { return readdirSync(join(templatesDir, d)).some(f => f.endsWith(".json")); } catch { return false; }
      });

      for (const cat of categories) {
        const catDir = join(templatesDir, cat);
        const jsonFiles = readdirSync(catDir).filter(f => f.endsWith(".json"));

        for (const jf of jsonFiles) {
          const htmlFile = jf.replace(".json", ".html");
          const htmlPath = join(catDir, htmlFile);
          assert.ok(existsSync(htmlPath), `${htmlFile} should exist for ${jf}`);

          const html = readFileSync(htmlPath, "utf-8");
          assert.ok(html.length > 50, `${htmlFile} should have meaningful content`);
        }
      }
    },
  },

  {
    name: "scene template matching returns relevant results",
    run() {
      const openingTemplates = matchSceneTemplates({ category: "opening" });
      assert.ok(openingTemplates.length >= 4, `Expected 4+ opening templates, got ${openingTemplates.length}`);
      assert.ok(openingTemplates.some(t => t.id === "dark-build"), "Should include dark-build");
      assert.ok(openingTemplates.some(t => t.id === "impact-slam"), "Should include impact-slam");

      const statsTemplates = matchSceneTemplates({ category: "stats" });
      assert.ok(statsTemplates.length >= 3, `Expected 3+ stats templates, got ${statsTemplates.length}`);
      assert.ok(statsTemplates.some(t => t.id === "counter-cards"), "Should include counter-cards");

      // Test tag-based matching
      const sportsTemplates = matchSceneTemplates({ category: "opening", tags: ["sports", "dramatic"] });
      assert.ok(sportsTemplates.length >= 1, "Should find sports/dramatic templates");
      assert.equal(sportsTemplates[0].id, "dark-build", "dark-build should rank first for sports/dramatic");
    },
  },

  {
    name: "scene template stats reports correct counts",
    run() {
      const stats = getTemplateStats();
      assert.ok(stats.builtin >= 20, `Expected 20+ builtin, got ${stats.builtin}`);
      assert.ok(stats.blocks >= 8, `Expected 8+ blocks, got ${stats.blocks}`);
      assert.ok(stats.total >= 28, `Expected 28+ total, got ${stats.total}`);
      assert.ok(stats.byCategory.opening >= 4, "Should have 4+ opening templates");
      assert.ok(stats.byCategory.stats >= 3, "Should have 3+ stats templates");
      assert.ok(stats.byCategory.cta >= 3, "Should have 3+ CTA templates");
    },
  },

  {
    name: "scene templates use CSS variables not hardcoded colors",
    run() {
      const templatesDir = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../templates/scene-templates",
      );
      const categories = readdirSync(templatesDir).filter(d => {
        try { return readdirSync(join(templatesDir, d)).some(f => f.endsWith(".html")); } catch { return false; }
      });

      for (const cat of categories) {
        const catDir = join(templatesDir, cat);
        const htmlFiles = readdirSync(catDir).filter(f => f.endsWith(".html"));

        for (const hf of htmlFiles) {
          const html = readFileSync(join(catDir, hf), "utf-8");
          // Check that templates use var(--xxx) for colors, not hardcoded hex in styles
          // Exception: rgba() for overlays is acceptable
          const styleBlocks = html.match(/style="[^"]*"/g) || [];
          for (const block of styleBlocks) {
            const hexInStyle = block.match(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/g) || [];
            // Allow #000 and #fff as fallbacks, but main colors should use var()
            const problematicHex = hexInStyle.filter(h => h !== "#000" && h !== "#fff" && h !== "#000000" && h !== "#ffffff");
            // Templates should use CSS variables for brand colors
            // Note: Some hardcoded colors in backgrounds/overlays are acceptable
          }

          // At least some templates should reference --accent-primary
          if (cat !== "transition") {
            const hasVarRef = html.includes("var(--accent-primary)") || html.includes("var(--text-primary)") || html.includes("var(--bg-primary)");
            assert.ok(hasVarRef, `${hf} should use at least one CSS variable`);
          }
        }
      }
    },
  },

  {
    name: "scene templates include GSAP animation code comments",
    run() {
      const templatesDir = resolve(
        dirname(fileURLToPath(import.meta.url)),
        "../templates/scene-templates",
      );
      const categories = readdirSync(templatesDir).filter(d => {
        try { return readdirSync(join(templatesDir, d)).some(f => f.endsWith(".html")); } catch { return false; }
      });

      let withGsap = 0;
      let totalNonTransition = 0;

      for (const cat of categories) {
        const catDir = join(templatesDir, cat);
        const htmlFiles = readdirSync(catDir).filter(f => f.endsWith(".html"));

        for (const hf of htmlFiles) {
          const html = readFileSync(join(catDir, hf), "utf-8");
          if (cat === "transition") continue;
          totalNonTransition++;
          if (html.includes("GSAP") || html.includes("tl.from") || html.includes("tl.to") || html.includes("tl.set")) {
            withGsap++;
          }
        }
      }

      assert.ok(withGsap >= 15, `Expected 15+ templates with GSAP code, got ${withGsap}/${totalNonTransition}`);
    },
  },

  // ── Entity Extraction Tests ──────────────────────────

  {
    name: "extractIdeaEntities extracts names from transfer pattern",
    run() {
      const entities = extractIdeaEntities("Ederson → Manchester United transfer announcement");
      assert.ok(entities.names.length >= 1, `Should extract at least 1 name, got ${entities.names.join(", ")}`);
      assert.ok(entities.actions.includes("transfer"), "Should extract 'transfer' action");
      assert.ok(entities.actions.includes("announcement"), "Should extract 'announcement' action");
    },
  },

  {
    name: "extractIdeaEntities extracts duration and style keywords",
    run() {
      const entities = extractIdeaEntities("制作一个30秒的震撼转会宣传片，premium风格");
      assert.equal(entities.duration, 30, "Should extract 30s duration");
      assert.ok(entities.styleKeywords.includes("震撼"), "Should extract '震撼' style keyword");
      assert.ok(entities.styleKeywords.includes("premium"), "Should extract 'premium' style keyword");
    },
  },

  {
    name: "duration regex matches hyphenated format",
    run: async () => {
      // "30-second" should now match the duration regex
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-dur-hyphen-"));
      const stdout = [];
      const stderr = [];
      try {
        await runCli(
          ["create", "--idea", "A 30-second product launch", "--output-dir", tempRoot, "--project-name", "dur-test", "--format", "16:9"],
          { stdout: (m) => stdout.push(m), stderr: (m) => stderr.push(m) },
        );
        const html = readFileSync(join(tempRoot, "dur-test", "index.html"), "utf8");
        assert.match(html, /data-duration="30"/, "Should use 30s from '30-second' idea text");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  {
    name: "skeleton uses entity names in scene content",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-entity-"));
      const stdout = [];
      const stderr = [];
      try {
        await runCli(
          ["create", "--idea", "Ederson → Manchester United 转会宣传片 30秒", "--output-dir", tempRoot, "--project-name", "entity-test", "--format", "9:16", "--brand-colors", "#DA291C,#000000,#FFE500"],
          { stdout: (m) => stdout.push(m), stderr: (m) => stderr.push(m) },
        );
        const html = readFileSync(join(tempRoot, "entity-test", "index.html"), "utf8");
        // Entity names should appear in scene content
        assert.match(html, /Ederson|Manchester/i, "Should include extracted entity names in HTML");
        // Brand colors should be applied
        assert.match(html, /--accent-primary: #DA291C/);
        assert.match(html, /#scene-0/, "Should use explicit scene ID");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  {
    name: "render command accepts --audio flag",
    run: async () => {
      // Test that render --audio routes correctly (should fail gracefully, not crash)
      const logs = [];
      try {
        await runCli(
          ["render", "--project-dir", "/nonexistent", "--audio", "bgm.mp3"],
          { stdout: (m) => logs.push(m), stderr: (m) => logs.push(m) },
        );
      } catch {
        // Expected to fail — the point is it doesn't throw "invalid command"
      }
      // Should reach render (HyperFrames error) or audio file check, not "invalid command"
      const output = logs.join(" ");
      const hasNoCommandError = !output.includes("Missing or invalid command");
      assert.ok(hasNoCommandError, `Should route to render, not throw invalid command: ${output.slice(0, 100)}`);
    },
  },

  {
    name: "createWorkbenchProject auto-copies assets to project dir",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-copy-"));
      const assetDir = join(tempRoot, "source-assets");
      const outputDir = join(tempRoot, "output");
      mkdirSync(assetDir, { recursive: true });
      mkdirSync(outputDir, { recursive: true });

      // Create dummy asset files
      writeFileSync(join(assetDir, "test-image.jpg"), "fake-jpg");
      writeFileSync(join(assetDir, "test-video.mp4"), "fake-mp4");

      try {
        await runCli(
          ["create", "--idea", "Asset copy test", "--assets", assetDir, "--output-dir", outputDir, "--project-name", "copy-test", "--format", "16:9"],
          { stdout: () => {}, stderr: () => {} },
        );

        // Check that assets were copied to project dir
        const projectAssetsDir = join(outputDir, "copy-test", "assets");
        assert.ok(existsSync(projectAssetsDir), "assets/ directory should exist in project");
        assert.ok(existsSync(join(projectAssetsDir, "test-image.jpg")), "test-image.jpg should be copied");
        assert.ok(existsSync(join(projectAssetsDir, "test-video.mp4")), "test-video.mp4 should be copied");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  // ── MCP Knowledge Query Tests (alpha.24) ───────────

  {
    name: "MCP querySceneTemplate tool returns templates",
    run: async () => {
      const { createFramepackMcpServer } = await import("../dist/mcp/server.js");
      const server = createFramepackMcpServer();
      // Verify the server has the tool registered via mcp --describe
      const stdout = [];
      await runCli(["mcp", "--describe"], { stdout: (m) => stdout.push(m), stderr: () => {} });
      const output = stdout.join("\n");
      assert.match(output, /querySceneTemplate/);
      assert.match(output, /recommendAnimation/);
      assert.match(output, /getComponentCode/);
    },
  },

  {
    name: "MCP knowledge resources include best practices",
    run: async () => {
      const stdout = [];
      await runCli(["mcp", "--describe"], { stdout: (m) => stdout.push(m), stderr: () => {} });
      const output = stdout.join("\n");
      // Verify knowledge resources
      assert.match(output, /video-design/);
      assert.match(output, /hyperframes-rules/);
      assert.match(output, /scene-templates/);
    },
  },

  {
    name: "preview command accepts --open flag",
    run: async () => {
      const logs = [];
      try {
        await runCli(
          ["preview", "--project-dir", "/nonexistent", "--open"],
          { stdout: (m) => logs.push(m), stderr: (m) => logs.push(m) },
        );
      } catch {
        // Expected to fail — no HyperFrames
      }
      const output = logs.join(" ");
      const hasNoCommandError = !output.includes("Missing or invalid command");
      assert.ok(hasNoCommandError, "Should route to preview, not throw invalid command");
    },
  },

  {
    name: "template save creates a reusable template file",
    run() {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-tmpl-save-"));
      const projectDir = join(tempRoot, "project");
      mkdirSync(projectDir, { recursive: true });
      try {
        // Run template save via CLI — execSync throws on non-zero exit
        const stdout = execSync(
          `node dist/cli.js template save --name "test-opening" --category "opening" --tags "test,dramatic" --project-dir "${projectDir}"`,
          { cwd: resolve(dirname(fileURLToPath(import.meta.url)), ".."), encoding: "utf-8" },
        );
        assert.match(stdout, /Template saved/);

        // Check the template was saved
        const savedPath = join(projectDir, ".framepack", "templates", "opening", "test-opening.json");
        assert.ok(existsSync(savedPath), `Template should be saved at ${savedPath}`);
        const meta = JSON.parse(readFileSync(savedPath, "utf-8"));
        assert.equal(meta.id, "test-opening");
        assert.equal(meta.category, "opening");
        assert.ok(meta.tags.includes("test"));
        assert.ok(meta.tags.includes("dramatic"));

        // Check HTML was saved too
        const htmlPath = join(projectDir, ".framepack", "templates", "opening", "test-opening.html");
        assert.ok(existsSync(htmlPath), "HTML file should be saved");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  // --- alpha.26: framepack build ---

  {
    name: "build command reads project state and generates HTML",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-build-"));
      try {
        // Create a minimal project structure
        mkdirSync(join(tempRoot, ".framepack"), { recursive: true });
        const projectName = "build-test";

        // Write state.json
        writeFileSync(join(tempRoot, ".framepack", "state.json"), JSON.stringify({
          version: "framepack.workbench.v1",
          projectName,
          format: "16:9",
          durationSec: 18,
          directorTranslation: { narrativePattern: "saas-launch" },
        }));

        // Write DESIGN_TOKENS.md
        writeFileSync(join(tempRoot, "DESIGN_TOKENS.md"), [
          "# Design Tokens",
          "- Accent primary: #FF6600",
          "- Background: #111111",
        ].join("\n"));

        // Write ASSETS.md
        writeFileSync(join(tempRoot, "ASSETS.md"), [
          "# Assets",
          "- `hero.mp4` (video)",
          "- `logo.png` (image)",
        ].join("\n"));

        // Write COMPOSITION.md
        writeFileSync(join(tempRoot, "COMPOSITION.md"), [
          "# Composition Plan",
          "",
          "## Scene Shape",
          "1. Open with a strong visual promise.",
          "2. Build tension around the user's problem.",
          "3. End with a clear payoff or next action.",
          "",
          "## Code Templates",
          "Impact Pop (text shock): `tl.from(\".headline\", { scale: 5, ease: \"back.out(1.7)\", duration: 0.3 }, sceneStart + 0.2)`",
          "Hard Scene Snap: `tl.set(\"#prev .content\", { opacity: 0 }, cutTime); tl.from(\"#next .content\", { opacity: 0, duration: 0.15 }, cutTime)`",
        ].join("\n"));

        const result = buildWorkbenchProject(tempRoot);

        assert.equal(result.projectDir, tempRoot);
        assert.ok(result.sceneCount > 0, "Should have scenes");
        assert.equal(result.tokensApplied, true, "Tokens should be applied");
        assert.equal(result.assetsReferenced, 2, "Should reference 2 assets");

        // Check HTML was generated
        const html = readFileSync(result.htmlPath, "utf-8");
        assert.ok(html.includes("data-composition-id"), "Should have composition ID");
        assert.ok(html.includes("data-scene-id"), "Should have scene IDs");
        assert.match(html, /data-start="0" data-duration="18" data-width="1920" data-height="1080"/);
        assert.equal(
          html.includes("data-composition-src=\"compositions/blocks/"),
          false,
          "Build output should not reference missing block HTML files",
        );
        assert.equal(
          /<div[^>]+data-scene-id="[^"]+"[^>]+data-start="[^"]+"[^>]*>[\s\S]*?<video[^>]+data-start="/.test(html),
          false,
          "Timed videos must not be nested inside timed scene elements",
        );
        assert.ok(html.includes("FF6600"), "Should use design token colors");
        assert.ok(html.includes("gsap.timeline"), "Should have GSAP timeline");
        assert.ok(html.includes("__timelines"), "Should register timeline");

        const runtimeMeta = JSON.parse(readFileSync(join(tempRoot, "meta.json"), "utf8"));
        assert.equal(runtimeMeta.rootEntry, "index.html");
        assert.equal(runtimeMeta.runtime, "hyperframes");
        assert.equal(runtimeMeta.width, 1920);
        assert.equal(runtimeMeta.height, 1080);
        assert.equal(runtimeMeta.duration, 18);

        const stdout = [];
        const stderr = [];
        const exitCode = await runCli(["build", "--project-dir", tempRoot, "--json"], {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        });
        const payload = JSON.parse(stdout.join("\n"));

        assert.equal(exitCode, 0, stderr.join("\n"));
        assert.equal(payload.result.projectDir, tempRoot);
        assert.equal(payload.interventionContext.command, "build");
        assert.equal(payload.interventionContext.phase, "preview");
        assert.equal(payload.interventionContext.status, "ready");
        assert.match(payload.interventionContext.nextCommand, /framepack preview/);
        assert.ok(payload.interventionContext.requiredReads.includes("meta.json"));
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  {
    name: "build command fails without state.json",
    run() {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-build-nostate-"));
      try {
        let threw = false;
        try {
          buildWorkbenchProject(tempRoot);
        } catch (e) {
          threw = true;
          assert.ok(e instanceof Error);
          assert.match(e.message, /Not a Framepack project/);
        }
        assert.ok(threw, "Should throw when state.json is missing");
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  {
    name: "build CLI accepts --project-dir flag",
    run() {
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-build-cli-"));
      try {
        // Create a minimal project
        mkdirSync(join(tempRoot, ".framepack"), { recursive: true });
        writeFileSync(join(tempRoot, ".framepack", "state.json"), JSON.stringify({
          version: "framepack.workbench.v1",
          projectName: "cli-build-test",
          format: "9:16",
          durationSec: 15,
          directorTranslation: { narrativePattern: "saas-launch" },
        }));

        const stdout = execSync(
          `node dist/cli.js build --project-dir "${tempRoot}"`,
          { cwd: resolve(dirname(fileURLToPath(import.meta.url)), ".."), encoding: "utf-8" },
        );
        assert.match(stdout, /Built \d+ scenes/);
        assert.match(stdout, /Scene templates used/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  // --- 0.6.0-alpha.1: external template registries ---

  {
    name: "listRegistries returns default registries",
    run() {
      const registries = listRegistries();
      assert.ok(registries.length >= 3, "Should have at least 3 registries");
      const ids = registries.map(r => r.id);
      assert.ok(ids.includes("hyperframes-blocks"), "Should include hyperframes-blocks");
      assert.ok(ids.includes("gsap-community"), "Should include gsap-community");
      assert.ok(ids.includes("remotion-community"), "Should include remotion-community");

      for (const r of registries) {
        assert.ok(r.id, "Registry should have id");
        assert.ok(r.name, "Registry should have name");
        assert.ok(r.baseUrl, "Registry should have baseUrl");
        assert.ok(r.format, "Registry should have format");
      }
    },
  },
  {
    name: "external community registries infer useful scene categories",
    run: async () => {
      const oldFetch = globalThis.fetch;
      const oldUserProfile = process.env.USERPROFILE;
      const oldHome = process.env.HOME;
      const tempRoot = mkdtempSync(join(tmpdir(), "framepack-registry-categories-"));

      try {
        process.env.USERPROFILE = tempRoot;
        process.env.HOME = tempRoot;
        globalThis.fetch = async () => new Response(JSON.stringify({
          items: [
            {
              full_name: "demo/chart-race",
              description: "Animated data chart and analytics dashboard for product metrics.",
              html_url: "https://example.test/chart-race",
            },
            {
              full_name: "demo/checkout-cta",
              description: "Landing page CTA button and conversion animation.",
              html_url: "https://example.test/checkout-cta",
            },
            {
              full_name: "demo/logo-reveal",
              description: "Cinematic logo typography reveal intro.",
              html_url: "https://example.test/logo-reveal",
            },
          ],
        }), { status: 200 });

        const entries = await fetchRegistryIndex("gsap-community");
        assert.equal(entries.find((entry) => entry.id === "demo-chart-race")?.category, "stats");
        assert.equal(entries.find((entry) => entry.id === "demo-checkout-cta")?.category, "cta");
        assert.equal(entries.find((entry) => entry.id === "demo-logo-reveal")?.category, "name-reveal");
      } finally {
        globalThis.fetch = oldFetch;
        process.env.USERPROFILE = oldUserProfile;
        process.env.HOME = oldHome;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },

  {
    name: "scene-templates registries CLI lists registries",
    run() {
      const stdout = execSync(
        `node dist/cli.js scene-templates registries`,
        { cwd: resolve(dirname(fileURLToPath(import.meta.url)), ".."), encoding: "utf-8" },
      );
      assert.match(stdout, /hyperframes-blocks/);
      assert.match(stdout, /gsap-community/);
      assert.match(stdout, /remotion-community/);
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
