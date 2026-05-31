import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "dist", "cli.js");
const defaultOutputDir = join(repoRoot, "out", "sandbox-benchmark", "latest");
const BENCHMARK_MAX_SCORE = 100;
const COMMAND_TIMEOUT_MS = 90000;
const MCP_TIMEOUT_MS = 30000;

function argValue(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function hasFlag(args, name) {
  return args.includes(name);
}

function runNodeCli(args, options = {}) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    timeout: COMMAND_TIMEOUT_MS,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function runHyperframes(args, cwd) {
  const cmd = process.platform === "win32"
    ? join(repoRoot, "node_modules", ".bin", "hyperframes.cmd")
    : join(repoRoot, "node_modules", ".bin", "hyperframes");
  return execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: COMMAND_TIMEOUT_MS,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function scoreCheck({ id, label, weight, passed, score, evidence = [], warnings = [], priority = "P2" }) {
  const value = score ?? (passed ? weight : 0);
  return {
    id,
    label,
    weight,
    score: Math.max(0, Math.min(weight, value)),
    status: value >= weight ? "passed" : value > 0 ? "partial" : "failed",
    evidence,
    warnings,
    priority,
  };
}

function parseJson(text) {
  return JSON.parse(text.replace(/^\uFEFF/, ""));
}

function assertContains(text, pattern) {
  return pattern.test(text);
}

function collectLintWarnings(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("\u26A0") || line.startsWith("!"))
    .map((line) => line.replace(/^\u26A0\s*/, "").replace(/^!\s*/, ""));
}

async function smokeMcpCallability() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cliPath, "mcp"],
    cwd: repoRoot,
  });
  const client = new Client({ name: "framepack-sandbox-benchmark", version: "0.0.0" });
  await withTimeout(client.connect(transport), MCP_TIMEOUT_MS, "MCP connect");
  try {
    const tools = await withTimeout(client.listTools(), MCP_TIMEOUT_MS, "MCP listTools");
    const toolNames = tools.tools.map((tool) => tool.name);
    const calls = [];
    for (const item of [
      { name: "listWorkflowPacks", arguments: {} },
      {
        name: "recommendPacks",
        arguments: {
          sourceType: "markdown",
          outputType: "case-explainer",
          goal: "Explain a product",
          audience: "Founders",
          format: "9:16",
        },
      },
      { name: "runtimeDoctor", arguments: {} },
    ]) {
      const result = await withTimeout(client.callTool(item), MCP_TIMEOUT_MS, `MCP callTool ${item.name}`);
      calls.push({ name: item.name, ok: Array.isArray(result.content) && result.content.length > 0 });
    }
    return { toolNames, calls };
  } finally {
    await client.close();
  }
}

function createAssets(assetDir) {
  mkdirSync(assetDir, { recursive: true });
  writeFileSync(join(assetDir, "logo.png"), "framepack sandbox placeholder logo\n", "utf8");
  writeFileSync(join(assetDir, "hero.mp4"), "framepack sandbox placeholder video\n", "utf8");
  writeFileSync(join(assetDir, "voice.wav"), "framepack sandbox placeholder audio\n", "utf8");
}

function readProjectFile(projectDir, fileName) {
  return readFileSync(join(projectDir, fileName), "utf8");
}

function buildMarkdown(report) {
  const blockerChecks = report.priorityBlockers;
  const warningLines = report.coreCapabilities.flatMap((check) => check.warnings.map((warning) => `- ${check.id}: ${warning}`));
  const tableValue = (value) => String(value).replaceAll("|", "\\|").replaceAll("\n", "<br>");
  return [
    "# Framepack Sandbox Benchmark",
    "",
    `Run ID: ${report.runId}`,
    `Version: ${report.version}`,
    `Score: ${report.score}/${report.maxScore} (${report.grade}/10)`,
    `Project: ${report.projectDir}`,
    "",
    "## Core Capability Scores",
    "",
    "| Capability | Status | Score | Evidence |",
    "| --- | --- | ---: | --- |",
    ...report.coreCapabilities.map((check) => `| ${check.id} | ${check.status} | ${check.score}/${check.weight} | ${check.evidence.map(tableValue).join("<br>")} |`),
    "",
    "## Blockers",
    "",
    ...(blockerChecks.length === 0
      ? ["No blocker detected by the sandbox benchmark."]
      : blockerChecks.map((check) => `- ${check.priority} ${check.id}: ${check.label}`)),
    "",
    "## Warnings",
    "",
    ...(warningLines.length === 0 ? ["No warning detected."] : warningLines),
    "",
    "## Next Test Recommendation",
    "",
    report.nextRecommendation,
    "",
    "## Xiaobai Summary",
    "",
    "This sandbox checks whether Framepack can turn a rough idea and user assets into an agent-readable video workbench, then compile it into a HyperFrames-safe HTML skeleton. It also checks whether MCP tools are truly callable, whether templates and Catalog recommendations are visible, and whether the generated composition passes lint before a real customer test.",
    "",
  ].join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const outputDir = resolve(argValue(args, "--output-dir", defaultOutputDir));
  const jsonToStdout = hasFlag(args, "--json");
  const keep = hasFlag(args, "--keep");
  const clean = hasFlag(args, "--clean") || outputDir === defaultOutputDir;

  if (!keep && existsSync(outputDir)) {
    const sandboxRoot = resolve(repoRoot, "out", "sandbox-benchmark");
    if (!clean || !(outputDir === sandboxRoot || outputDir.startsWith(`${sandboxRoot}\\`) || outputDir.startsWith(`${sandboxRoot}/`))) {
      throw new Error("Refusing to clean a custom output directory. Pass --keep to reuse it, or use an output path under out/sandbox-benchmark with --clean.");
    }
    rmSync(outputDir, { recursive: true, force: true });
  }
  mkdirSync(outputDir, { recursive: true });

  const runId = `SANDBOX-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const assetsDir = join(outputDir, "assets");
  const projectsDir = join(outputDir, "projects");
  createAssets(assetsDir);
  mkdirSync(projectsDir, { recursive: true });

  const version = runNodeCli(["--version"]).trim();
  const help = runNodeCli(["--help"]);
  const mcp = await smokeMcpCallability();
  const templateStats = parseJson(runNodeCli(["scene-templates", "stats", "--json"]));
  const catalog = parseJson(runNodeCli(["catalog", "--json"]));
  const catalogRecommendation = parseJson(runNodeCli([
    "catalog",
    "recommend",
    "--template",
    "saas-launch",
    "--idea",
    "A premium launch video for an agent-native video workflow",
    "--style",
    "business dynamic kinetic",
    "--format",
    "9:16",
    "--json",
  ]));

  runNodeCli([
    "create",
    "--idea",
    "A premium 30 second SaaS launch video for founders, with big text, fast pacing, business polish, product proof, and a strong CTA",
    "--assets",
    assetsDir,
    "--output-dir",
    projectsDir,
    "--project-name",
    "sandbox-launch",
    "--format",
    "9:16",
    "--duration",
    "30",
    "--style",
    "premium business dynamic kinetic",
  ]);

  const projectDir = join(projectsDir, "sandbox-launch");
  const workbenchBrief = runNodeCli(["workbench", "brief", "--project-dir", projectDir]);
  const workbenchCheck = runNodeCli(["workbench", "check", "--project-dir", projectDir, "--json"]);
  const workbenchAudit = parseJson(runNodeCli(["workbench", "audit", "--project-dir", projectDir, "--json"]));
  runNodeCli(["build", "--project-dir", projectDir]);

  const indexHtml = readProjectFile(projectDir, "index.html");
  const compositionMd = readProjectFile(projectDir, "COMPOSITION.md");
  const directionMd = readProjectFile(projectDir, "DIRECTION.md");
  const humanMd = readProjectFile(projectDir, "HUMAN.md");
  const assetGapsMd = readProjectFile(projectDir, "ASSET_GAPS.md");
  const designTokensMd = readProjectFile(projectDir, "DESIGN_TOKENS.md");
  const iterationsMd = readProjectFile(projectDir, "ITERATIONS.md");
  const state = parseJson(readProjectFile(projectDir, ".framepack/state.json"));
  const meta = parseJson(readProjectFile(projectDir, "meta.json"));

  let lintOutput = "";
  let lintOk = false;
  let lintWarning = "";
  try {
    lintOutput = runHyperframes(["lint"], projectDir);
    lintOk = /0 error/.test(lintOutput) || /0 errors/.test(lintOutput);
  } catch (error) {
    lintOutput = `${error.stdout ?? ""}\n${error.stderr ?? ""}`.trim();
    lintWarning = error instanceof Error ? error.message : String(error);
  }
  const lintWarnings = collectLintWarnings(lintOutput);

  const coreCapabilities = [
    scoreCheck({
      id: "install-cli-surface",
      label: "CLI version/help expose the public workbench path.",
      weight: 6,
      passed: version.length > 0 && assertContains(help, /create/) && assertContains(help, /build/) && assertContains(help, /preview/) && assertContains(help, /mcp --describe/),
      evidence: [`version ${version}`, "help has create/build/preview/mcp"],
      priority: "P1",
    }),
    scoreCheck({
      id: "mcp-callability",
      label: "MCP tools are not only described; selected tools are callable through the SDK.",
      weight: 12,
      passed: mcp.toolNames.includes("recommendPacks") && mcp.calls.every((call) => call.ok),
      evidence: [`tools ${mcp.toolNames.length}`, `called ${mcp.calls.map((call) => call.name).join(", ")}`],
      priority: "P0",
    }),
    scoreCheck({
      id: "workbench-mainline",
      label: "The mainline create workflow writes agent-readable workbench files.",
      weight: 10,
      passed: ["FRAMEPACK.md", "HUMAN.md", "ASSETS.md", "ASSET_GAPS.md", "DESIGN_TOKENS.md", "STYLE.md", "DIRECTION.md", "COMPOSITION.md", "ITERATIONS.md", ".framepack/state.json"].every((file) => existsSync(join(projectDir, file))),
      evidence: ["core markdown files exist", `workbench check ${parseJson(workbenchCheck).report.status}`],
      priority: "P0",
    }),
    scoreCheck({
      id: "plain-language-review",
      label: "The workbench exposes a human-readable current summary.",
      weight: 6,
      passed: /Current Summary/.test(humanMd) && /Framepack human brief/.test(workbenchBrief),
      evidence: ["HUMAN.md has Current Summary", "workbench brief returns a readable summary"],
      priority: "P1",
    }),
    scoreCheck({
      id: "design-token-contract",
      label: "DESIGN.md/DESIGN_TOKENS.md give agents an executable visual source of truth.",
      weight: 10,
      passed: existsSync(join(projectDir, "DESIGN.md")) && /Design Tokens/.test(designTokensMd) && /#[0-9a-fA-F]{6}|Colors|Palette/.test(designTokensMd) && /--accent-primary/.test(indexHtml),
      evidence: ["DESIGN.md present", "DESIGN_TOKENS.md has usable visual tokens", "HTML consumes CSS design variables"],
      priority: "P0",
    }),
    scoreCheck({
      id: "asset-gap-intelligence",
      label: "ASSET_GAPS.md exposes blocking and optional material gaps before composition work.",
      weight: 8,
      passed: /Gaps found|No critical gaps detected/.test(assetGapsMd) && /Blocking|Optional|Next Step|Catalog/.test(assetGapsMd),
      evidence: ["ASSET_GAPS.md has gap status", "asset recommendations are actionable"],
      priority: "P1",
    }),
    scoreCheck({
      id: "skill-install-surface",
      label: "The package tells agents how Framepack skills and instructions must be installed or triggered.",
      weight: 8,
      passed: /framepack init-agent/.test(readProjectFile(projectDir, "FRAMEPACK.md")) && /Project skills|Skill\/instructions/.test(readProjectFile(projectDir, "FRAMEPACK.md")),
      evidence: ["FRAMEPACK.md includes init-agent instruction", "skill trigger surface is visible"],
      priority: "P1",
    }),
    scoreCheck({
      id: "harness-compliance-audit",
      label: "Framepack can audit and correct workflow drift instead of trusting model memory.",
      weight: 10,
      passed: workbenchAudit.report.status === "passed" && /HITL Loop/.test(iterationsMd) && Array.isArray(workbenchAudit.report.priorityBlockers),
      evidence: [`workbench audit ${workbenchAudit.report.status}`, "HITL loop present", "priority blockers are machine-readable"],
      priority: "P0",
    }),
    scoreCheck({
      id: "template-arsenal",
      label: "Built-in scene templates and route recommendations are available.",
      weight: 8,
      passed: templateStats.builtin >= 20 && templateStats.blocks >= 8 && /HyperFrames Prompt Template/.test(compositionMd),
      evidence: [`builtin ${templateStats.builtin ?? 0}`, `blocks ${templateStats.blocks ?? 0}`, "COMPOSITION.md has prompt-template plan"],
      priority: "P1",
    }),
    scoreCheck({
      id: "catalog-bridge",
      label: "Official Catalog candidates are exposed and written into the production plan.",
      weight: 6,
      passed: Array.isArray(catalog.prefabs) && catalog.prefabs.length >= 8 && catalogRecommendation.recommendation?.prefabs?.length > 0 && /Catalog Pre-Flight/.test(compositionMd),
      evidence: [`catalog prefabs ${catalog.prefabs?.length ?? 0}`, `recommended ${catalogRecommendation.recommendation?.prefabs?.length ?? 0}`, "COMPOSITION.md has Catalog Pre-Flight"],
      priority: "P1",
    }),
    scoreCheck({
      id: "composition-build-contract",
      label: "Build emits a HyperFrames-safe HTML skeleton and runtime metadata.",
      weight: 10,
      passed: /data-composition-id/.test(indexHtml) && /data-start="0"/.test(indexHtml) && /data-width="1080"/.test(indexHtml) && /data-height="1920"/.test(indexHtml) && /window\.__timelines/.test(indexHtml) && meta.rootEntry === "index.html" && !/<section[\s\S]*?<video/.test(indexHtml),
      evidence: ["root data attrs present", "timeline registered", "video elements stay outside timed scenes", `rootEntry ${meta.rootEntry}`],
      priority: "P0",
    }),
    scoreCheck({
      id: "hyperframes-lint",
      label: "Generated composition passes HyperFrames lint.",
      weight: 6,
      passed: lintOk,
      evidence: [lintOk ? "lint has 0 errors" : "lint failed"],
      warnings: [...lintWarnings, ...(lintWarning ? [lintWarning] : [])],
      priority: "P0",
    }),
  ];

  const score = coreCapabilities.reduce((sum, check) => sum + check.score, 0);
  const maxScore = coreCapabilities.reduce((sum, check) => sum + check.weight, 0);
  if (maxScore !== BENCHMARK_MAX_SCORE) {
    throw new Error(`Sandbox benchmark weights must total ${BENCHMARK_MAX_SCORE}; got ${maxScore}.`);
  }
  const priorityBlockers = coreCapabilities.filter(
    (check) => (check.priority === "P0" || check.priority === "P1") && check.status !== "passed",
  );
  const report = {
    title: "Framepack Sandbox Benchmark",
    runId,
    generatedAt: new Date().toISOString(),
    version,
    outputDir,
    projectDir,
    score,
    maxScore,
    grade: Number(((score / maxScore) * 10).toFixed(1)),
    priorityBlockers,
    nextRecommendation: priorityBlockers.length === 0 && score >= 90
      ? "Proceed to joint tester/user trials with one real customer-style project."
      : "Fix failed or partial P0/P1 checks before asking the test group to run customer-style trials.",
    coreCapabilities,
    evidence: {
      mcpCalls: mcp.calls,
      templateStats,
      catalogPrefabs: catalog.prefabs?.length ?? 0,
      workbenchAuditStatus: workbenchAudit.report.status,
      workbenchAuditBlockers: workbenchAudit.report.priorityBlockers,
      stateKeys: Object.keys(state),
      lintOutput,
      lintWarnings,
      directionHasDirectorTranslation: /Director Translation/.test(directionMd),
    },
  };

  writeFileSync(join(outputDir, "sandbox-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(join(outputDir, "SANDBOX_REPORT.md"), buildMarkdown(report), "utf8");

  if (jsonToStdout) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Framepack Sandbox Benchmark: ${report.score}/${report.maxScore} (${report.grade}/10)`);
    console.log(`Report: ${join(outputDir, "SANDBOX_REPORT.md")}`);
  }

  if (priorityBlockers.length > 0) {
    process.exitCode = 1;
  }
}

await main();
