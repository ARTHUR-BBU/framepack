import { mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { initAgentProject } from "./agent/init-agent.js";
import { exposeFramepackArsenal } from "./capabilities/arsenal.js";
import type { CapabilityGraph } from "./capabilities/capability-graph.js";
import { ensureProjectValidationPassed } from "./compiler/index.js";
import { compileVideoProjectFromSource } from "./compiler/pipeline-registry.js";
import { describeFramepackMcpSurface } from "./mcp/surface.js";
import { getProjectPackageStatus } from "./packaging/package-status.js";
import {
  validateProjectPackage,
  writeProjectPackageValidationReport,
} from "./packaging/package-validation.js";
import type { RuntimeManifest } from "./runtime/manifest.js";
import { writeVideoProjectPackage } from "./video/package/project-package.js";
import {
  recommendFramepackPacks,
  resolveFramepackPackSelection,
} from "./workflow-packs/registry.js";

export type ReleaseSmokeCheckId =
  | "init-agent-codex"
  | "init-agent-claude-code"
  | "mcp-surface"
  | "arsenal-exposure"
  | "pack-recommendation"
  | "auto-pack-generation"
  | "capability-runtime-artifacts"
  | "package-status"
  | "package-validation";

export interface ReleaseSmokeCheck {
  id: ReleaseSmokeCheckId;
  status: "passed" | "failed";
  summary: string;
}

export interface ReleaseSmokeReport {
  roundId: "AGENT-PLATFORM-RC-SMOKE";
  status: "passed" | "failed";
  outputDir: string;
  generatedProjectDir?: string;
  recommended?: {
    workflowPackId: string;
    creativeDirectionPackId: string;
  };
  arsenal?: {
    workflowPackCount: number;
    creativeDirectionPackCount: number;
    commonTechCount: number;
  };
  generatedArtifacts?: {
    capabilityGraph: boolean;
    runtimeManifest: boolean;
    capabilityGraphNodeCount: number;
    runtimeCommandActions: string[];
  };
  checks: ReleaseSmokeCheck[];
}

async function runReleaseSmokeStep(
  checks: ReleaseSmokeCheck[],
  id: ReleaseSmokeCheckId,
  action: () => Promise<string> | string,
): Promise<void> {
  try {
    const summary = await action();
    checks.push({
      id,
      status: "passed",
      summary,
    });
  } catch (error) {
    checks.push({
      id,
      status: "failed",
      summary: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function runFramepackReleaseSmoke(input: {
  outputDir: string;
  platform?: NodeJS.Platform;
}): Promise<ReleaseSmokeReport> {
  const outputDir = resolve(input.outputDir);
  const checks: ReleaseSmokeCheck[] = [];
  const report: ReleaseSmokeReport = {
    roundId: "AGENT-PLATFORM-RC-SMOKE",
    status: "failed",
    outputDir,
    checks,
  };

  mkdirSync(outputDir, { recursive: true });

  await runReleaseSmokeStep(checks, "init-agent-codex", () => {
    const result = initAgentProject({
      cwd: resolve(outputDir, "codex-agent"),
      target: "codex",
      scope: "project",
      packageSource: "npm",
      force: true,
      platform: input.platform,
    });

    return `initialized ${result.target} workflow with ${result.writtenFiles.length} files`;
  });

  await runReleaseSmokeStep(checks, "init-agent-claude-code", () => {
    const result = initAgentProject({
      cwd: resolve(outputDir, "claude-code-agent"),
      target: "claude-code",
      scope: "project",
      packageSource: "npm",
      force: true,
      platform: input.platform,
    });

    return `initialized ${result.target} workflow with ${result.writtenFiles.length} files`;
  });

  await runReleaseSmokeStep(checks, "mcp-surface", () => {
    const surface = describeFramepackMcpSurface();
    const requiredSurfaceItems = [
      "generateProject",
      "recommendPacks",
      "exposeArsenal",
      "getCapabilityGraph",
      "framepack://packs/workflows",
      "framepack://project/{projectName}/capability-graph",
    ];
    const missingItems = requiredSurfaceItems.filter((item) => !surface.includes(item));

    if (missingItems.length > 0) {
      throw new Error(`MCP surface is missing: ${missingItems.join(", ")}`);
    }

    return "MCP surface includes generation, recommendation, arsenal, capability graph, and pack resources";
  });

  await runReleaseSmokeStep(checks, "arsenal-exposure", () => {
    const arsenal = exposeFramepackArsenal({
      userRawInput: "Promote an agent-native video course with sprite visuals.",
    });

    if (arsenal.workflowPacks.length === 0 || arsenal.creativeDirectionPacks.length === 0) {
      throw new Error("Arsenal exposure did not include workflow and creative direction packs.");
    }

    if (!arsenal.commonTechStatus.some((tech) => tech.name === "agent-sprite-forge")) {
      throw new Error("Arsenal exposure did not include agent-sprite-forge technology status.");
    }

    report.arsenal = {
      workflowPackCount: arsenal.workflowPacks.length,
      creativeDirectionPackCount: arsenal.creativeDirectionPacks.length,
      commonTechCount: arsenal.commonTechStatus.length,
    };

    return `exposed ${arsenal.workflowPacks.length} workflow packs and ${arsenal.creativeDirectionPacks.length} creative directions`;
  });

  await runReleaseSmokeStep(checks, "pack-recommendation", () => {
    const recommendation = recommendFramepackPacks({
      sourceType: "game-ad",
      outputType: "game-ad",
      goal: "Promote an agent-native video course",
      audience: "Founders",
      format: "9:16",
    });

    report.recommended = {
      workflowPackId: recommendation.workflowPack.id,
      creativeDirectionPackId: recommendation.creativeDirectionPack.id,
    };

    return `recommended ${recommendation.workflowPack.id} with ${recommendation.creativeDirectionPack.id}`;
  });

  await runReleaseSmokeStep(checks, "auto-pack-generation", async () => {
    const result = await compileVideoProjectFromSource({
      source: {
        sourceType: "game-ad",
        description: "A course that teaches founders to ship agent-native video systems.",
      },
      defaults: {
        goal: "Promote the course",
        audience: "Founders",
        format: "9:16",
        outputType: "game-ad",
        packSelection: resolveFramepackPackSelection({
          autoRecommendPacks: true,
          sourceType: "game-ad",
          outputType: "game-ad",
          goal: "Promote the course",
          audience: "Founders",
          format: "9:16",
        }),
      },
      projectName: "sprite-video-demo",
    });
    ensureProjectValidationPassed(result.validationReport);
    report.generatedProjectDir = writeVideoProjectPackage(outputDir, result.package);

    return `generated ${result.scenePlan.scenes.length} scenes at ${report.generatedProjectDir}`;
  });

  await runReleaseSmokeStep(checks, "capability-runtime-artifacts", () => {
    if (!report.generatedProjectDir) {
      throw new Error("No generated project directory is available");
    }

    const capabilityGraph = JSON.parse(
      readFileSync(join(report.generatedProjectDir, "CAPABILITY_GRAPH.json"), "utf8"),
    ) as CapabilityGraph;
    const runtimeManifest = JSON.parse(
      readFileSync(join(report.generatedProjectDir, "RUNTIME_MANIFEST.json"), "utf8"),
    ) as RuntimeManifest;

    if (!capabilityGraph.nodes.some((node) => node.id === "video-runtime.hyperframes")) {
      throw new Error("Capability graph is missing video-runtime.hyperframes.");
    }

    if (runtimeManifest.version !== "framepack.runtime-manifest.v1") {
      throw new Error(`Runtime manifest version is ${runtimeManifest.version}.`);
    }

    report.generatedArtifacts = {
      capabilityGraph: true,
      runtimeManifest: true,
      capabilityGraphNodeCount: capabilityGraph.nodes.length,
      runtimeCommandActions: runtimeManifest.commands.map((command) => command.action).sort(),
    };

    return `verified ${capabilityGraph.nodes.length} capability nodes and ${runtimeManifest.commands.length} runtime commands`;
  });

  await runReleaseSmokeStep(checks, "package-status", () => {
    if (!report.generatedProjectDir) {
      throw new Error("No generated project directory is available");
    }

    const status = getProjectPackageStatus({
      projectDir: report.generatedProjectDir,
    });

    if (status.protocolStatus !== "passed") {
      throw new Error(`Package protocol status is ${status.protocolStatus}`);
    }

    if (!status.capabilityGraph.present || !status.capabilityGraph.nodeIds.includes("video-runtime.hyperframes")) {
      throw new Error("Package status did not expose the runtime capability graph node.");
    }

    return `readiness ${status.readiness} with ${status.nextActionItems.length} next actions`;
  });

  await runReleaseSmokeStep(checks, "package-validation", () => {
    if (!report.generatedProjectDir) {
      throw new Error("No generated project directory is available");
    }

    const validation = validateProjectPackage({
      projectDir: report.generatedProjectDir,
    });
    writeProjectPackageValidationReport({
      projectDir: report.generatedProjectDir,
      report: validation,
    });

    if (validation.status !== "passed") {
      throw new Error(`Package validation failed: ${validation.issues.join(", ")}`);
    }

    return `validated ${validation.sceneCount} scenes`;
  });

  report.status = checks.every((check) => check.status === "passed") ? "passed" : "failed";

  return report;
}
