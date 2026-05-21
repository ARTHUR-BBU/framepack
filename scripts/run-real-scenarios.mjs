import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const keepOutput = process.argv.includes("--keep");
const outputDirArgIndex = process.argv.indexOf("--output-dir");
const tempRoot =
  outputDirArgIndex >= 0 && process.argv[outputDirArgIndex + 1]
    ? resolve(process.argv[outputDirArgIndex + 1])
    : mkdtempSync(join(tmpdir(), "framepack-real-scenarios-"));

const checks = [];

function runStep(id, commandLabel, args) {
  try {
    const stdout = execFileSync("node", [join(repoRoot, "dist", "cli.js"), ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    checks.push({
      id,
      status: "passed",
      command: commandLabel,
    });

    return stdout;
  } catch (error) {
    checks.push({
      id,
      status: "failed",
      command: commandLabel,
      error: error instanceof Error ? error.message : String(error),
      stdout: typeof error.stdout === "string" ? error.stdout : undefined,
      stderr: typeof error.stderr === "string" ? error.stderr : undefined,
    });
    throw error;
  }
}

function parseJson(id, value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    checks.push({
      id,
      status: "failed",
      command: "parse JSON output",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function readPackageJson(projectDir, fileName) {
  return parseJson(`parse-${fileName}`, readFileSync(join(projectDir, fileName), "utf8"));
}

const scenarios = [
  {
    id: "markdown-product-explainer",
    projectName: "markdown-product-explainer",
    args: [
      "generate",
      "--input",
      "examples/case-explainer-input.md",
      "--output-dir",
      tempRoot,
      "--goal",
      "Explain the product case",
      "--audience",
      "Founders",
      "--project-name",
      "markdown-product-explainer",
      "--auto-pack",
    ],
    assertions: (projectDir) => {
      const manifest = readPackageJson(projectDir, "PACKAGE_MANIFEST.json");
      if (!manifest.artifacts?.planning?.includes("SCENE_PLAN.json")) {
        throw new Error("Markdown scenario package is missing SCENE_PLAN.json in planning artifacts");
      }
    },
  },
  {
    id: "thread-editorial-video",
    projectName: "thread-editorial-video",
    args: [
      "generate",
      "--thread-file",
      "examples/thread.txt",
      "--output-dir",
      tempRoot,
      "--goal",
      "Explain the thread",
      "--audience",
      "Founders",
      "--project-name",
      "thread-editorial-video",
      "--auto-pack",
    ],
    assertions: (projectDir) => {
      const manifest = readPackageJson(projectDir, "PACKAGE_MANIFEST.json");
      if (!manifest.artifacts?.planning?.includes("SOURCE_SCENE_MAP.json")) {
        throw new Error("Thread scenario package is missing SOURCE_SCENE_MAP.json in planning artifacts");
      }
    },
  },
  {
    id: "game-ad-sprite-video",
    projectName: "game-ad-sprite-video",
    args: [
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
      "game-ad-sprite-video",
      "--format",
      "9:16",
      "--auto-pack",
    ],
    assertions: (projectDir) => {
      const videoBrief = readPackageJson(projectDir, "VIDEO_BRIEF.json");
      const assetExecutionPlan = readPackageJson(projectDir, "ASSET_EXECUTION_PLAN.json");
      if (videoBrief.capabilityStackSelection?.id !== "game-ad-sprite-video-stack") {
        throw new Error("Game-ad scenario did not persist capabilityStackSelection");
      }
      if (!assetExecutionPlan.items?.some((item) => item.executionKind === "forge-character-pack")) {
        throw new Error("Game-ad scenario is missing forge-character-pack execution items");
      }
      if (!assetExecutionPlan.items?.some((item) => item.executionKind === "forge-map-pack")) {
        throw new Error("Game-ad scenario is missing forge-map-pack execution items");
      }
      if (!assetExecutionPlan.items?.some((item) => item.executionKind === "forge-fx-pack")) {
        throw new Error("Game-ad scenario is missing forge-fx-pack execution items");
      }
    },
  },
];

try {
  const scenarioReports = scenarios.map((scenario) => {
    runStep(
      `generate-${scenario.id}`,
      `framepack ${scenario.args.join(" ")}`,
      scenario.args,
    );

    const projectDir = join(tempRoot, scenario.projectName);
    if (!existsSync(projectDir)) {
      throw new Error(`Scenario project was not generated: ${projectDir}`);
    }

    runStep(
      `validate-${scenario.id}`,
      `framepack validate --project-dir ${projectDir}`,
      ["validate", "--project-dir", projectDir],
    );

    const status = parseJson(
      `parse-status-${scenario.id}`,
      runStep(
        `status-${scenario.id}`,
        `framepack status --project-dir ${projectDir} --json`,
        ["status", "--project-dir", projectDir, "--json"],
      ),
    );

    if (status.protocolStatus !== "passed") {
      throw new Error(`Scenario package protocol did not pass: ${scenario.id}`);
    }

    scenario.assertions(projectDir);

    return {
      id: scenario.id,
      projectDir,
      protocolStatus: status.protocolStatus,
      readiness: status.readiness,
      nextActionItems: status.nextActionItems?.map((item) => item.id) ?? [],
    };
  });

  const report = {
    name: "Framepack v0.4 alpha real scenario tests",
    status: "passed",
    outputDir: tempRoot,
    scenarios: scenarioReports,
    checks,
  };

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  const report = {
    name: "Framepack v0.4 alpha real scenario tests",
    status: "failed",
    outputDir: tempRoot,
    error: error instanceof Error ? error.message : String(error),
    checks,
  };

  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  if (!keepOutput && outputDirArgIndex < 0 && process.exitCode !== 1) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
