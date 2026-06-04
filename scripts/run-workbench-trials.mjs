import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "../dist/cli.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(repoRoot, "out", "workbench-trials-v0.6", "latest");

const cases = [
  {
    id: "saas-launch",
    title: "SaaS Launch",
    template: "saas-launch",
    idea: "A premium 30 second vertical launch video for an AI workflow SaaS. Business-grade, fast, confident, large readable text, product screenshots.",
    style: "premium dynamic business large text",
  },
  {
    id: "course-promo",
    title: "Course Promo",
    template: "course-promo",
    idea: "A short course promo for founders. Energetic and trustworthy, direct founder invitation, high information density without clutter.",
    style: "energetic trustworthy high-density social",
  },
  {
    id: "data-news-explainer",
    title: "Data / News Explainer",
    template: "data-shock",
    idea: "A punchy industry data explainer. Hook in the first three seconds, moving numbers, and a strong thesis ending.",
    style: "impact data clarity fast rhythm strong thesis",
  },
];

function collectIo() {
  const stdout = [];
  const stderr = [];
  return {
    io: {
      stdout: (message) => stdout.push(String(message)),
      stderr: (message) => stderr.push(String(message)),
    },
    stdout,
    stderr,
  };
}

async function runStep(args, dependencies = {}) {
  const capture = collectIo();
  const exitCode = await runCli(args, capture.io, dependencies);
  return {
    args,
    exitCode,
    stdout: capture.stdout.join("\n"),
    stderr: capture.stderr.join("\n"),
  };
}

function requiredFileChecks(projectDir) {
  const files = [
    "FRAMEPACK.md",
    "HUMAN.md",
    "ASSETS.md",
    "ASSET_GAPS.md",
    "STYLE.md",
    "DESIGN.md",
    "DESIGN_TOKENS.md",
    "DIRECTION.md",
    "COMPOSITION.md",
    "ITERATIONS.md",
    "index.html",
    "meta.json",
    ".framepack/preferences.json",
  ];
  return files.map((file) => ({ file, exists: existsSync(join(projectDir, file)) }));
}

function parseJsonMaybe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function runCase(item) {
  const projectDir = join(outputRoot, item.id);
  const steps = [];
  steps.push(await runStep([
    "create",
    "--idea", item.idea,
    "--output-dir", outputRoot,
    "--project-name", item.id,
    "--format", "9:16",
    "--style", item.style,
  ]));
  steps.push(await runStep(["workbench", "brief", "--project-dir", projectDir]));
  steps.push(await runStep(["workbench", "preferences", "--project-dir", projectDir]));
  steps.push(await runStep([
    "templates", "recommend",
    "--project-dir", projectDir,
    "--idea", item.idea,
    "--style", item.style,
    "--format", "9:16",
    "--json",
  ]));
  steps.push(await runStep([
    "catalog", "recommend",
    "--project-dir", projectDir,
    "--template", item.template,
    "--idea", item.idea,
    "--style", item.style,
    "--format", "9:16",
    "--json",
  ]));
  steps.push(await runStep(["workbench", "audit", "--phase", "all", "--project-dir", projectDir, "--json"]));
  steps.push(await runStep(["build", "--project-dir", projectDir]));
  steps.push(await runStep(["preview", "--project-dir", projectDir, "--json"], {
    detectRuntimeCapabilities: () => ({
      available: true,
      binary: "hyperframes",
      version: "0.6.0",
      detectedAt: "2026-06-05T00:00:00.000Z",
      supportedCommands: ["preview", "render"],
      supportedCatalogFeatures: [],
      supportedRenderOptions: [],
      fallbackNotes: [],
    }),
    executeRuntimeCommand: () => ({
      success: true,
      exitCode: 0,
      stdout: "Preview ready for internal trial.",
      stderr: "",
      summary: "preview-ready",
    }),
  }));
  steps.push(await runStep(["workbench", "friction", "--project-dir", projectDir, "--json"]));
  steps.push(await runStep(["workbench", "learnings", "--project-dir", projectDir, "--json"]));

  const audit = parseJsonMaybe(steps.find((step) => step.args.includes("audit"))?.stdout ?? "");
  const preview = parseJsonMaybe(steps.find((step) => step.args[0] === "preview")?.stdout ?? "");
  const friction = parseJsonMaybe(steps.find((step) => step.args[1] === "friction")?.stdout ?? "");
  const checks = requiredFileChecks(projectDir);
  const missingFiles = checks.filter((check) => !check.exists).map((check) => check.file);
  const failedSteps = steps.filter((step) => step.exitCode !== 0);
  const blockers = audit?.reports?.flatMap((report) => report.issues ?? [])
    ?.filter((issue) => issue.priority === "P0" || issue.priority === "P1") ?? [];
  const recurringRisks = friction?.recurringRisks ?? [];

  return {
    id: item.id,
    title: item.title,
    projectDir,
    status: failedSteps.length === 0 && missingFiles.length === 0 && blockers.length === 0 && recurringRisks.length === 0
      ? "passed"
      : "needs-review",
    template: item.template,
    missingFiles,
    failedSteps: failedSteps.map((step) => ({ args: step.args, exitCode: step.exitCode, stderr: step.stderr })),
    blockers,
    recurringRisks,
    previewStatus: preview?.status ?? "unknown",
    interventionContext: preview?.interventionContext?.status ?? "missing",
    steps,
  };
}

function renderMarkdown(results) {
  const passed = results.filter((item) => item.status === "passed").length;
  return [
    "# Framepack 0.6 Workbench Trial Report",
    "",
    `Version: 0.6.0-alpha.3`,
    `Generated: ${new Date().toISOString()}`,
    `Result: ${passed}/${results.length} passed`,
    "",
    "## Plain-Language Summary",
    "",
    "Framepack created three customer-style video workbenches: SaaS launch, course promo, and data/news explainer. Each one was checked for readable planning files, preferences, template/Catalog recommendations, audit output, build output, preview JSON, friction, and learnings.",
    "",
    "## Trials",
    "",
    ...results.flatMap((item) => [
      `### ${item.title}`,
      "",
      `- projectDir: ${item.projectDir}`,
      `- status: ${item.status}`,
      `- template: ${item.template}`,
      `- previewStatus: ${item.previewStatus}`,
      `- interventionContext: ${item.interventionContext}`,
      `- missingFiles: ${item.missingFiles.length === 0 ? "none" : item.missingFiles.join(", ")}`,
      `- failedSteps: ${item.failedSteps.length}`,
      `- P0/P1 blockers: ${item.blockers.length}`,
      `- recurringRisks: ${item.recurringRisks.length}`,
      "",
    ]),
    "## Beta Gate",
    "",
    passed === results.length
      ? "All required internal workbench trials passed the structural beta gate."
      : "At least one trial needs review before beta/customer handoff.",
    "",
  ].join("\n");
}

rmSync(outputRoot, { recursive: true, force: true });
mkdirSync(outputRoot, { recursive: true });

const results = [];
for (const item of cases) {
  results.push(await runCase(item));
}

const report = {
  version: "0.6.0-alpha.3",
  generatedAt: new Date().toISOString(),
  outputRoot,
  results,
};
writeFileSync(join(outputRoot, "workbench-trials.json"), JSON.stringify(report, null, 2), "utf8");
writeFileSync(join(outputRoot, "WORKBENCH_TRIAL_REPORT.md"), renderMarkdown(results), "utf8");

const passed = results.filter((item) => item.status === "passed").length;
console.log(`Framepack Workbench Trials: ${passed}/${results.length} passed`);
console.log(`Report: ${join(outputRoot, "WORKBENCH_TRIAL_REPORT.md")}`);
if (passed !== results.length) {
  for (const item of results.filter((result) => result.status !== "passed")) {
    console.error(`${item.id}: ${item.status}`);
  }
  process.exitCode = 1;
}
