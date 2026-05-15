import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { initAgentProject } from "./agent/init-agent.js";
import { ensureProjectValidationPassed } from "./compiler/index.js";
import { compileVideoProjectFromSource } from "./compiler/pipeline-registry.js";
import { describeFramepackMcpSurface } from "./mcp/surface.js";
import { getProjectPackageStatus } from "./packaging/package-status.js";
import {
  validateProjectPackage,
  writeProjectPackageValidationReport,
} from "./packaging/package-validation.js";
import { writeVideoProjectPackage } from "./video/package/project-package.js";
import {
  recommendFramepackPacks,
  resolveFramepackPackSelection,
} from "./workflow-packs/registry.js";

export type ReleaseSmokeCheckId =
  | "init-agent-codex"
  | "init-agent-claude-code"
  | "mcp-surface"
  | "pack-recommendation"
  | "auto-pack-generation"
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
    const requiredSurfaceItems = ["generateProject", "recommendPacks", "framepack://packs/workflows"];
    const missingItems = requiredSurfaceItems.filter((item) => !surface.includes(item));

    if (missingItems.length > 0) {
      throw new Error(`MCP surface is missing: ${missingItems.join(", ")}`);
    }

    return "MCP surface includes generation, recommendation, and pack resources";
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
