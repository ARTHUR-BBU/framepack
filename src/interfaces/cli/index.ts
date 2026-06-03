import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initAgentProject, type AgentTarget, type PackageSource } from "../../agent/init-agent.js";
import {
  getCapabilityAtlasNode,
  listCapabilityAtlasNodes,
  listRecommendedCapabilityStacks,
  recommendCapabilityStack,
} from "../../capabilities/atlas.js";
import { materializeProjectAssets } from "../../capture/index.js";
import { syncAssetExecutionProject } from "../../packaging/asset-execution.js";
import { repairProjectPackage } from "../../packaging/package-repair.js";
import {
  formatProjectPackageStatus,
  getProjectPackageStatus,
} from "../../packaging/package-status.js";
import {
  validateProjectPackage,
  writeProjectPackageValidationReport,
} from "../../packaging/package-validation.js";
import {
  ensureProjectValidationPassed,
} from "../../compiler/index.js";
import {
  compileVideoProjectFromSource,
  type CompilerSourceInput,
} from "../../compiler/pipeline-registry.js";
import {
  createHyperframesRuntimeAdapter,
  detectHyperframesCapabilities,
} from "../../runtime/hyperframes/adapter.js";
import { executeHyperframesCommand } from "../../runtime/hyperframes/execution.js";
import type { RuntimeCapabilities } from "../../runtime/hyperframes/types.js";
import { writeVideoProjectPackage } from "../../video/package/project-package.js";
import { writeValidationReport } from "../../video/validation/validation-report.js";
import { runFramepackMcpServer } from "../../mcp/server.js";
import { describeFramepackMcpSurface } from "../../mcp/surface.js";
import { runFramepackReleaseSmoke } from "../../release-smoke.js";
import {
  describeFramepackPackRegistry,
  listFramepackCreativeDirectionPacks,
  listFramepackWorkflowPacks,
  recommendFramepackPacks,
  resolveFramepackPackSelection,
} from "../../workflow-packs/registry.js";
import {
  createWorkbenchProject,
  buildWorkbenchInterventionContext,
  buildWorkbenchProject,
  defaultWorkbenchProjectName,
  formatWorkbenchHumanBrief,
  auditWorkbenchProject,
  type WorkbenchAuditPhase,
  listHyperframesCatalogPrefabs,
  listHyperframesPromptTemplates,
  listTemplateMarket,
  recommendHyperframesCatalogPrefabs,
  recommendHyperframesPromptTemplate,
  recommendTemplateRoute,
  scaffoldWorkbenchProject,
  validateWorkbenchProject,
} from "../../workbench/index.js";
import {
  appendForceSummary,
  checkWorkbenchLifecycleGate,
  recordGateResult,
  type WorkbenchLifecycleAction,
} from "../../workbench/interventions.js";
import {
  createWorkbenchFrictionPayload,
  formatWorkbenchFriction,
  formatWorkbenchLearnings,
  recordWorkbenchBypassSignal,
  recordWorkbenchCommandFailure,
  recordWorkbenchFriction,
} from "../../workbench/friction.js";
import {
  formatWorkbenchPreferences,
  preferenceStyleSuffix,
  writeWorkbenchPreferences,
} from "../../workbench/preferences.js";
import {
  loadAllTemplates,
  matchSceneTemplates,
  getTemplateStats,
  saveAgentTemplate,
  fetchRegistryIndex,
  installExternalTemplate,
  listRegistries,
  type SceneTemplateQuery,
  type SceneTemplateCategory,
  type ExternalTemplateEntry,
} from "../../workbench/scene-templates.js";

export interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

interface CliOptions {
  configPath?: string;
  input?: string;
  threadFile?: string;
  url?: string;
  gameAdDescription?: string;
  outputDir: string;
  goal: string;
  audience: string;
  projectName: string;
  format: "16:9" | "9:16";
  style: {
    tone: string;
    pacing: "slow" | "medium" | "fast";
    brandName: string;
  };
  theme: {
    palette: string;
  };
  constraints: {
    maxDurationSec: number;
    requiredPoints: string[];
    bannedTerms: string[];
  };
  workflowPackId?: string;
  creativeDirectionPackId?: string;
  autoRecommendPacks: boolean;
}

type CliCommandName =
  | "help"
  | "version"
  | "create"
  | "init"
  | "init-agent"
  | "mcp"
  | "atlas"
  | "catalog"
  | "packs"
  | "templates"
  | "workbench"
  | "release-smoke"
  | "generate"
  | "status"
  | "validate"
  | "repair"
  | "capture"
  | "lint"
  | "preview"
  | "render"
  | "runtime-doctor"
  | "runtime-lint"
  | "runtime-inspect"
  | "runtime-snapshot"
  | "runtime-upgrade-check"
  | "sync-captures"
  | "sync-assets"
  | "scaffold"
  | "scene-templates"
  | "template"
  | "build";

interface CliDependencies {
  captureProject?: typeof materializeProjectAssets;
  detectRuntimeCapabilities?: () => RuntimeCapabilities;
  executeRuntimeCommand?: typeof executeHyperframesCommand;
}

interface CliContext {
  cwd?: string;
  platform?: NodeJS.Platform;
}

interface CliConfigFile {
  projectName: string;
  goal: string;
  audience: string;
  format: "16:9" | "9:16";
  outputType: "case-explainer";
  input: string;
  style?: {
    tone?: string;
    pacing?: "slow" | "medium" | "fast";
    brandName?: string;
  };
  theme?: {
    palette?: string;
  };
  constraints?: {
    maxDurationSec?: number;
    requiredPoints?: string[];
    bannedTerms?: string[];
  };
  workflowPackId?: string;
  creativeDirectionPackId?: string;
  autoRecommendPacks?: boolean;
}

const DEFAULT_IO: CliIo = {
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
};

const FRAMEPACK_CLI_VERSION = "0.6.0-alpha.2";

const FRAMEPACK_CLI_HELP = [
  "Framepack CLI",
  "",
  "Usage:",
  "  framepack --help",
  "  framepack --version",
  "  framepack create --idea <idea> --assets <dir> --output-dir <dir>",
  "  framepack mcp --describe",
  "  framepack catalog",
  "  framepack catalog recommend --template <template-id> --idea <idea>",
  "  framepack templates",
  "  framepack templates prompt",
  "  framepack templates recommend --idea <idea> --style <style>",
  "  framepack workbench check --project-dir <dir>",
  "  framepack workbench audit --phase <preflight|design|composition|preview|render> --project-dir <dir>",
  "  framepack workbench brief --project-dir <dir>",
  "  framepack workbench friction --project-dir <dir>",
  "  framepack workbench learnings --project-dir <dir>",
  "  framepack workbench preferences --project-dir <dir> [--refresh]",
  "  framepack scaffold --project-dir <dir>",
  "  framepack build --project-dir <dir>",
  "  framepack preview --project-dir <dir> [--open]",
  "  framepack render --project-dir <dir> [--audio <file>]",
  "  framepack packs",
  "  framepack atlas --json",
  "  framepack generate --input <file> --output-dir <dir> --goal <goal> --audience <audience>",
  "  framepack generate --thread-file <file> --output-dir <dir> --goal <goal> --audience <audience>",
  "  framepack generate --game-ad-description <text> --output-dir <dir> --goal <goal> --audience <audience> --format 9:16 --auto-pack",
  "  framepack status --project-dir <package>",
  "  framepack validate --project-dir <package>",
  "  framepack scene-templates list [--category <cat>] [--format <16:9|9:16>]",
  "  framepack scene-templates recommend --category <cat> --tags <tags>",
  "  framepack scene-templates stats",
  "  framepack scene-templates registries",
  "  framepack scene-templates search [--registry <id>] [--category <cat>]",
  "  framepack scene-templates install --id <template-id> [--registry <id>] [--project-dir <dir>]",
  "  framepack template save --name <id> --category <cat> [--tags <tags>]",
  "  framepack runtime doctor --project-dir <package>",
  "",
  "Agent-first install check:",
  "  npx -y -p framepack@alpha framepack --version",
  "  npx -y -p framepack@alpha framepack --help",
  "  npm exec --yes --package=framepack@alpha -- framepack mcp --describe",
  "",
  "Release checks:",
  "  npm run release:scenarios",
  "  npm run release:gate",
].join("\n");

function getRequiredArg(args: string[], name: string): string {
  const index = args.indexOf(name);

  if (index === -1 || index === args.length - 1) {
    throw new Error(`Missing required argument: ${name}`);
  }

  return args[index + 1];
}

function getOptionalArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);

  if (index === -1 || index === args.length - 1) {
    return undefined;
  }

  return args[index + 1];
}

function countDefinedSources(input: {
  configPath?: string;
  input?: string;
  threadFile?: string;
  url?: string;
  gameAdDescription?: string;
}) {
  return [input.configPath, input.input, input.threadFile, input.url, input.gameAdDescription].filter(
    (value) => value !== undefined,
  ).length;
}

function deriveProjectName(inputPath: string): string {
  const extension = extname(inputPath);
  return basename(inputPath, extension);
}

function stripUtf8Bom(value: string): string {
  return value.replace(/^\uFEFF/, "");
}

function createDefaultStyle() {
  return {
    tone: "direct" as const,
    pacing: "medium" as const,
    brandName: "Studio",
  };
}

function createDefaultTheme() {
  return {
    palette: "default",
  };
}

function createDefaultConstraints() {
  return {
    maxDurationSec: 60,
    requiredPoints: [] as string[],
    bannedTerms: [] as string[],
  };
}

function getCommandName(args: string[]): CliCommandName {
  const [command, subcommand] = args;

  if (command === undefined || command === "--help" || command === "-h" || command === "help") {
    return "help";
  }

  if (command === "--version" || command === "-v" || command === "version") {
    return "version";
  }

  if (command === "runtime" && subcommand === "doctor") {
    return "runtime-doctor";
  }

  if (command === "runtime" && subcommand === "lint") {
    return "runtime-lint";
  }

  if (command === "runtime" && subcommand === "inspect") {
    return "runtime-inspect";
  }

  if (command === "runtime" && subcommand === "snapshot") {
    return "runtime-snapshot";
  }

  if (command === "runtime" && subcommand === "upgrade-check") {
    return "runtime-upgrade-check";
  }

  if (
    command === "create" ||
    command === "init" ||
    command === "init-agent" ||
    command === "mcp" ||
    command === "atlas" ||
    command === "catalog" ||
    command === "packs" ||
    command === "templates" ||
    command === "workbench" ||
    command === "release-smoke" ||
    command === "generate" ||
    command === "status" ||
    command === "validate" ||
    command === "repair" ||
    command === "capture" ||
    command === "lint" ||
    command === "preview" ||
    command === "render" ||
    command === "sync-captures" ||
    command === "sync-assets" ||
    command === "scaffold" ||
    command === "scene-templates" ||
    command === "template" ||
    command === "build"
  ) {
    return command;
  }

  throw new Error("Missing or invalid command. Use --help, --version, create, init, init-agent, mcp, atlas, catalog, packs, templates, workbench, release-smoke, generate, status, validate, repair, capture, runtime doctor, runtime lint, runtime inspect, runtime snapshot, runtime upgrade-check, lint, preview, render, scaffold, scene-templates, sync-assets, or sync-captures.");
}

function getCommandArgs(args: string[]): string[] {
  const [first, second] = args;

  if (
    first === "runtime" &&
    (second === "doctor" ||
      second === "lint" ||
      second === "inspect" ||
      second === "snapshot" ||
      second === "upgrade-check")
  ) {
    return args.slice(2);
  }

  if (
    first === "create" ||
    first === "init" ||
    first === "init-agent" ||
    first === "mcp" ||
    first === "atlas" ||
    first === "catalog" ||
    first === "packs" ||
    first === "templates" ||
    first === "workbench" ||
    first === "release-smoke" ||
    first === "generate" ||
    first === "status" ||
    first === "validate" ||
    first === "repair" ||
    first === "capture" ||
    first === "preview" ||
    first === "render" ||
    first === "sync-captures" ||
    first === "sync-assets" ||
    first === "scene-templates" ||
    first === "template"
  ) {
    return args.slice(1);
  }

  return args;
}

export function parseCliArgs(args: string[]): CliOptions {
  const commandArgs = getCommandArgs(args);
  const outputDir = getRequiredArg(commandArgs, "--output-dir");
  const configPath = getOptionalArg(commandArgs, "--config");
  const input = getOptionalArg(commandArgs, "--input");
  const threadFile = getOptionalArg(commandArgs, "--thread-file");
  const url = getOptionalArg(commandArgs, "--url");
  const gameAdDescription = getOptionalArg(commandArgs, "--game-ad-description");

  if (countDefinedSources({ configPath, input, threadFile, url, gameAdDescription }) !== 1) {
    throw new Error("Use exactly one source input: --config, --input, --thread-file, --url, or --game-ad-description.");
  }

  if (configPath) {
    const rawConfig = stripUtf8Bom(readFileSync(configPath, "utf8"));
    const config = JSON.parse(rawConfig) as CliConfigFile;
    const configDir = dirname(configPath);
    const input = resolve(configDir, config.input);
    const style = {
      ...createDefaultStyle(),
      ...(config.style ?? {}),
    };
    const theme = {
      ...createDefaultTheme(),
      ...(config.theme ?? {}),
    };
    const constraints = {
      ...createDefaultConstraints(),
      ...(config.constraints ?? {}),
      requiredPoints: [...(config.constraints?.requiredPoints ?? [])],
      bannedTerms: [...(config.constraints?.bannedTerms ?? [])],
    };

    return {
      configPath,
      input,
      threadFile: undefined,
      url: undefined,
      gameAdDescription: undefined,
      outputDir,
      goal: config.goal,
      audience: config.audience,
      projectName: config.projectName,
      format: config.format,
      style,
      theme,
      constraints,
      workflowPackId: config.workflowPackId,
      creativeDirectionPackId: config.creativeDirectionPackId,
      autoRecommendPacks: config.autoRecommendPacks ?? false,
    };
  }

  const goal = getRequiredArg(commandArgs, "--goal");
  const audience = getRequiredArg(commandArgs, "--audience");
  const format = (getOptionalArg(commandArgs, "--format") ?? "16:9") as "16:9" | "9:16";

  if (format !== "16:9" && format !== "9:16") {
    throw new Error("Invalid --format value. Use 16:9 or 9:16.");
  }

  return {
    configPath,
    input,
    threadFile,
    url,
    gameAdDescription,
    outputDir,
    goal,
    audience,
    projectName:
      getOptionalArg(commandArgs, "--project-name") ??
      (input
        ? deriveProjectName(input)
        : threadFile
          ? deriveProjectName(threadFile)
          : gameAdDescription
            ? "game-ad-demo"
            : "website-case-video"),
    format,
    style: {
      ...createDefaultStyle(),
      tone: getOptionalArg(commandArgs, "--tone") ?? "direct",
      pacing: (getOptionalArg(commandArgs, "--pacing") ?? "medium") as "slow" | "medium" | "fast",
      brandName: getOptionalArg(commandArgs, "--brand-name") ?? "Studio",
    },
    theme: {
      ...createDefaultTheme(),
      palette: getOptionalArg(commandArgs, "--palette") ?? "default",
    },
    constraints: createDefaultConstraints(),
    workflowPackId: getOptionalArg(commandArgs, "--workflow-pack"),
    creativeDirectionPackId: getOptionalArg(commandArgs, "--creative-direction-pack"),
    autoRecommendPacks: commandArgs.includes("--auto-pack"),
  };
}

function createPackSelectionForOptions(
  options: CliOptions,
  sourceType: ReturnType<typeof createCompilerSourceInput>["sourceType"],
  outputType: "case-explainer" | "game-ad",
) {
  return resolveFramepackPackSelection({
    workflowPackId: options.workflowPackId,
    creativeDirectionPackId: options.creativeDirectionPackId,
    autoRecommendPacks: options.autoRecommendPacks,
    sourceType,
    outputType,
    goal: options.goal,
    audience: options.audience,
    format: options.format,
  });
}

async function runGenerateCommand(args: string[], io: CliIo): Promise<number> {
  const options = parseCliArgs(args);
  const source = createCompilerSourceInput(options);
  const outputType = source.sourceType === "game-ad" ? "game-ad" : "case-explainer";
  const baseDefaults = {
    goal: options.goal,
    audience: options.audience,
    format: options.format,
    style: options.style,
    constraints: options.constraints,
    theme: options.theme,
    packSelection: createPackSelectionForOptions(options, source.sourceType, outputType),
  };
  const result = await compileVideoProjectFromSource({
    source,
    defaults: {
      ...baseDefaults,
      outputType,
    },
    projectName: options.projectName,
  });
  ensureProjectValidationPassed(result.validationReport);

  const writtenDir = writeVideoProjectPackage(options.outputDir, result.package);

  io.stdout(`Generated video project package at ${writtenDir}`);
  return 0;
}

async function runValidateCommand(args: string[], io: CliIo): Promise<number> {
  const commandArgs = getCommandArgs(args);
  const projectDir = getOptionalArg(commandArgs, "--project-dir");

  if (projectDir) {
    const resolvedProjectDir = resolve(projectDir);
    const report = validateProjectPackage({
      projectDir: resolvedProjectDir,
    });
    writeProjectPackageValidationReport({
      projectDir: resolvedProjectDir,
      report,
    });

    if (report.status === "failed") {
      io.stderr(`Package validation failed for ${resolvedProjectDir}: ${report.issues.join(", ")}`);
      return 1;
    }

    io.stdout(`Package validation passed for ${resolvedProjectDir}. Report written to ${resolvedProjectDir}`);
    return 0;
  }

  const options = parseCliArgs(args);
  const source = createCompilerSourceInput(options);
  const outputType = source.sourceType === "game-ad" ? "game-ad" : "case-explainer";
  const baseDefaults = {
    goal: options.goal,
    audience: options.audience,
    format: options.format,
    style: options.style,
    constraints: options.constraints,
    theme: options.theme,
    packSelection: createPackSelectionForOptions(options, source.sourceType, outputType),
  };
  const result = await compileVideoProjectFromSource({
    source,
    defaults: {
      ...baseDefaults,
      outputType,
    },
    projectName: options.projectName,
  });
  const writtenDir = writeValidationReport(options.outputDir, result.validationReport);

  if (result.validationReport.status === "failed") {
    io.stderr(
      `Validation failed for ${options.projectName}: ${result.validationReport.issues.join(", ")}`,
    );
    return 1;
  }

  io.stdout(
    `Validation passed for ${options.projectName} with ${result.scenePlan.scenes.length} scenes. Report written to ${writtenDir}`,
  );
  return 0;
}

function runInitCommand(args: string[], io: CliIo): number {
  const outputDir = getRequiredArg(args, "--output-dir");
  const projectName = getOptionalArg(args, "--project-name") ?? "case-video";
  const format = (getOptionalArg(args, "--format") ?? "16:9") as "16:9" | "9:16";

  if (format !== "16:9" && format !== "9:16") {
    throw new Error("Invalid --format value. Use 16:9 or 9:16.");
  }

  const targetDir = resolve(outputDir, projectName);
  const configPath = resolve(targetDir, "hyperframes-studio.json");
  const markdownPath = resolve(targetDir, "input.md");

  mkdirSync(targetDir, { recursive: true });
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        projectName,
        goal: "Explain the case",
        audience: "Founders",
        format,
        outputType: "case-explainer",
        input: "input.md",
        style: {
          ...createDefaultStyle(),
        },
        constraints: {
          ...createDefaultConstraints(),
        },
        theme: {
          ...createDefaultTheme(),
        },
      },
      null,
      2,
    ),
    "utf8",
  );
  writeFileSync(
    markdownPath,
    "# Problem\nDescribe the case problem here.\n\n# Solution\nDescribe the solution here.\n",
    "utf8",
  );

  io.stdout(`Initialized project template at ${targetDir}`);
  return 0;
}

function runCreateCommand(args: string[], io: CliIo): number {
  const dnaPath = getOptionalArg(args, "--dna");
  let idea = getOptionalArg(args, "--idea") ?? "";
  let style = getOptionalArg(args, "--style");
  let durationSec = Number(getOptionalArg(args, "--duration") ?? "0");
  let format = (getOptionalArg(args, "--format") ?? "16:9") as "16:9" | "9:16";
  const brandColors = getOptionalArg(args, "--brand-colors");

  // Load VIDEO_DNA metadata when provided.
  if (dnaPath) {
    const dnaContent = readFileSync(resolve(dnaPath), "utf8");
    const durationMatch = dnaContent.match(/\*\*时长\*\*:\s*(\d+)s|\*\*Duration\*\*:\s*\[?(\d+)/);
    if (durationMatch) durationSec = durationSec || parseInt(durationMatch[1] ?? durationMatch[2], 10);
    const resMatch = dnaContent.match(/(\d+)×(\d+)/);
    if (resMatch && !args.includes("--format")) {
      const w = parseInt(resMatch[1], 10);
      const h = parseInt(resMatch[2], 10);
      if (h > w) format = "9:16";
    }
    const typeMatch = dnaContent.match(/\*\*类型\*\*:\s*(.+)|\*\*Type\*\*:\s*\[?(.+?)[\]\n]/);
    if (typeMatch && !idea) idea = `Video based on reference DNA: ${(typeMatch[1] ?? typeMatch[2]).trim()}`;
    if (!idea) idea = `Video based on reference DNA from ${dnaPath}`;
    if (!style) {
      const colorMatches = [...dnaContent.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => m[0]);
      if (colorMatches.length > 0) style = `DNA-driven with ${colorMatches.slice(0, 3).join(", ")}`;
    }
  }

  if (!idea) throw new Error("Missing --idea or --dna argument. Provide a creative idea or a VIDEO_DNA.md file path.");

  // Extract duration from idea text when not explicitly set.
  if (!durationSec || durationSec < 5) {
    const durMatch = idea.match(/(\d+)\s*[-]?\s*(?:秒|seconds?|sec|s\b)/i);
    if (durMatch) durationSec = parseInt(durMatch[1], 10);
  }

  if (format !== "16:9" && format !== "9:16") {
    throw new Error("Invalid --format value. Use 16:9 or 9:16.");
  }

  if (!durationSec || durationSec < 5) durationSec = 45;
  if (!Number.isFinite(durationSec) || durationSec < 5) {
    throw new Error("Invalid --duration value. Use a number of at least 5 seconds.");
  }

  const project = createWorkbenchProject({
    projectName: getOptionalArg(args, "--project-name") ?? defaultWorkbenchProjectName(idea),
    idea,
    outputDir: getRequiredArg(args, "--output-dir"),
    assetDir: getOptionalArg(args, "--assets"),
    style,
    format,
    durationSec,
    brandColors,
  });
  const preferences = writeWorkbenchPreferences({
    projectDir: project.projectDir,
    idea,
    style,
  });

  // Copy VIDEO_DNA.md into the project if provided.
  if (dnaPath) {
    const targetDir = resolve(getRequiredArg(args, "--output-dir"), getOptionalArg(args, "--project-name") ?? defaultWorkbenchProjectName(idea));
    const dnaTarget = resolve(targetDir, "VIDEO_DNA.md");
    try {
      copyFileSync(resolve(dnaPath), dnaTarget);
    } catch { /* best effort */ }
  }

  if (args.includes("--json")) {
    io.stdout(JSON.stringify({
      projectDir: project.projectDir,
      assets: project.assets,
      copiedDna: Boolean(dnaPath),
      preferences,
      interventionContext: buildWorkbenchInterventionContext({
        command: "create",
        projectDir: project.projectDir,
      }),
    }, null, 2));
    return 0;
  }

  io.stdout(
    [
      `Created Framepack workbench at ${project.projectDir}`,
      dnaPath ? "VIDEO_DNA.md copied into project." : null,
      `assets: ${project.assets.length}`,
      `preferences: ${preferences.fieldForces.length} field forces recorded`,
      "next: open FRAMEPACK.md with your agent, then refine COMPOSITION.md and build the HyperFrames composition.",
    ].filter(Boolean).join("\n"),
  );
  return 0;
}

function runInitAgentCommand(args: string[], io: CliIo, context: CliContext = {}): number {
  const target = (getOptionalArg(args, "--target") ?? "auto") as AgentTarget;
  const scope = getOptionalArg(args, "--scope") ?? "project";
  const packageSource = (getOptionalArg(args, "--package-source") ?? "npm") as PackageSource;

  if (target !== "codex" && target !== "claude-code" && target !== "auto") {
    throw new Error("Invalid --target value. Use codex, claude-code, or auto.");
  }

  if (scope !== "project") {
    throw new Error("Invalid --scope value. Use project.");
  }

  if (packageSource !== "npm" && packageSource !== "github") {
    throw new Error("Invalid --package-source value. Use npm or github.");
  }

  const result = initAgentProject({
    cwd: context.cwd,
    target,
    scope: "project",
    packageSource,
    force: args.includes("--force"),
    platform: context.platform,
  });

  io.stdout(
    [
      `Initialized Framepack agent workflow at ${result.projectDir}`,
      `target: ${result.target}`,
      "files:",
      ...result.writtenFiles.map((file) => `- ${file}`),
    ].join("\n"),
  );
  return 0;
}

async function runMcpCommand(args: string[], io: CliIo): Promise<number> {
  if (args.includes("--describe")) {
    io.stdout(describeFramepackMcpSurface());
    return 0;
  }

  await runFramepackMcpServer();
  return 0;
}

function runPacksCommand(args: string[], io: CliIo): number {
  if (args[0] === "recommend") {
    const sourceType = getRequiredArg(args, "--source-type") as CompilerSourceInput["sourceType"];
    const outputType = getRequiredArg(args, "--output-type") as "case-explainer" | "game-ad";
    const format = getOptionalArg(args, "--format") as "16:9" | "9:16" | undefined;
    const recommendation = recommendFramepackPacks({
      sourceType,
      outputType,
      goal: getOptionalArg(args, "--goal"),
      audience: getOptionalArg(args, "--audience"),
      format,
    });

    if (args.includes("--json")) {
      io.stdout(JSON.stringify(recommendation, null, 2));
      return 0;
    }

    io.stdout(
      [
        "Framepack pack recommendation",
        "",
        `Workflow pack: ${recommendation.workflowPack.id} (${recommendation.workflowPack.label})`,
        `Creative direction pack: ${recommendation.creativeDirectionPack.id} (${recommendation.creativeDirectionPack.label})`,
        `Reason: ${recommendation.reason}`,
      ].join("\n"),
    );
    return 0;
  }

  const payload = {
    workflowPacks: listFramepackWorkflowPacks(),
    creativeDirectionPacks: listFramepackCreativeDirectionPacks(),
  };

  if (args.includes("--json")) {
    io.stdout(JSON.stringify(payload, null, 2));
    return 0;
  }

  io.stdout(describeFramepackPackRegistry());
  return 0;
}

function runTemplatesCommand(args: string[], io: CliIo): number {
  if (args[0] === "prompt") {
    if (args[1] === "recommend") {
      const durationArg = getOptionalArg(args, "--duration");
      const durationSec = durationArg ? Number(durationArg) : 45;
      const projectDir = resolve(getOptionalArg(args, "--project-dir") ?? process.cwd());
      const preferenceSuffix = preferenceStyleSuffix(projectDir);
      const recommendation = recommendHyperframesPromptTemplate({
        idea: getRequiredArg(args, "--idea"),
        style: [getOptionalArg(args, "--style"), preferenceSuffix].filter(Boolean).join("; ") || undefined,
        format: getOptionalArg(args, "--format") as "16:9" | "9:16" | undefined,
        durationSec,
      });

      if (args.includes("--json")) {
        io.stdout(JSON.stringify({
          recommendation,
          interventionContext: buildWorkbenchInterventionContext({
            command: "prompt-template-recommend",
            projectDir,
          }),
        }, null, 2));
        return 0;
      }

      io.stdout(
        [
          "Framepack HyperFrames prompt-template recommendation",
          "",
          `Template: ${recommendation.template.id} (${recommendation.template.title})`,
          `Reason: ${recommendation.reason}`,
          "",
          "Scene shape:",
          ...recommendation.template.sceneShape.map((scene) => `- ${scene}`),
        ].join("\n"),
      );
      return 0;
    }

    const payload = { promptTemplates: listHyperframesPromptTemplates() };

    if (args.includes("--json")) {
      io.stdout(JSON.stringify(payload, null, 2));
      return 0;
    }

    io.stdout(
      [
        "Framepack HyperFrames Prompt Templates",
        "",
        ...payload.promptTemplates.map((template) => `- ${template.id}: ${template.title} (${template.aspect}, ${template.category})`),
      ].join("\n"),
    );
    return 0;
  }

  if (args[0] === "recommend") {
    const durationArg = getOptionalArg(args, "--duration");
    const durationSec = durationArg ? Number(durationArg) : 45;
    const projectDir = resolve(getOptionalArg(args, "--project-dir") ?? process.cwd());
    const preferenceSuffix = preferenceStyleSuffix(projectDir);

    if (!Number.isFinite(durationSec) || durationSec < 5) {
      throw new Error("Invalid --duration value. Use a number of at least 5 seconds.");
    }

    const recommendation = recommendTemplateRoute({
      idea: getRequiredArg(args, "--idea"),
      style: [getOptionalArg(args, "--style"), preferenceSuffix].filter(Boolean).join("; ") || undefined,
      format: getOptionalArg(args, "--format") as "16:9" | "9:16" | undefined,
      durationSec,
    });

    if (args.includes("--json")) {
      io.stdout(JSON.stringify({
        recommendation,
        interventionContext: buildWorkbenchInterventionContext({
          command: "template-recommend",
          projectDir,
        }),
      }, null, 2));
      return 0;
    }

    io.stdout(
      [
        "Framepack template recommendation",
        "",
        `Template: ${recommendation.template.id} (${recommendation.template.label})`,
        `Access: ${recommendation.template.access}`,
        `Reason: ${recommendation.reason}`,
        "",
        "Implementation routes:",
        ...recommendation.template.implementationRoutes.map((route) => `- ${route}`),
      ].join("\n"),
    );
    return 0;
  }

  const payload = { templates: listTemplateMarket() };

  if (args.includes("--json")) {
    io.stdout(JSON.stringify(payload, null, 2));
    return 0;
  }

  io.stdout(
    [
      "Framepack Template Market",
      "",
      ...payload.templates.map((template) => `- ${template.id}: ${template.label} (${template.access}, ${template.license})`),
    ].join("\n"),
  );
  return 0;
}

function runCatalogCommand(args: string[], io: CliIo): number {
  if (args[0] === "install") {
    return runCatalogInstallCommand(args.slice(1), io);
  }

  if (args[0] === "recommend") {
    const projectDir = resolve(getOptionalArg(args, "--project-dir") ?? process.cwd());
    const preferenceSuffix = preferenceStyleSuffix(projectDir);
    const recommendation = recommendHyperframesCatalogPrefabs({
      templateId: getRequiredArg(args, "--template") as Parameters<typeof recommendHyperframesCatalogPrefabs>[0]["templateId"],
      idea: getRequiredArg(args, "--idea"),
      style: [getOptionalArg(args, "--style"), preferenceSuffix].filter(Boolean).join("; ") || undefined,
      format: getOptionalArg(args, "--format") as "16:9" | "9:16" | undefined,
    });

    if (args.includes("--json")) {
      io.stdout(JSON.stringify({
        recommendation,
        interventionContext: buildWorkbenchInterventionContext({
          command: "catalog-recommend",
          projectDir,
        }),
      }, null, 2));
      return 0;
    }

    io.stdout(
      [
        "HyperFrames Catalog recommendation",
        "",
        `Template route: ${recommendation.templateId}`,
        "",
        "Prefabs:",
        ...recommendation.prefabs.map((prefab) => `- ${prefab.id} (${prefab.kind}): ${prefab.bestUse}`),
        "",
        "Agent instructions:",
        ...recommendation.agentInstructions.map((instruction) => `- ${instruction}`),
      ].join("\n"),
    );
    return 0;
  }

  const payload = { prefabs: listHyperframesCatalogPrefabs() };

  if (args.includes("--json")) {
    io.stdout(JSON.stringify(payload, null, 2));
    return 0;
  }

  io.stdout(
    [
      "HyperFrames Catalog Bridge",
      "",
      ...payload.prefabs.map((prefab) => `- ${prefab.id}: ${prefab.label} (${prefab.kind})`),
      "",
      "Install all catalog components: npx framepack catalog install",
      "Inspect the live official Catalog: npx hyperframes catalog --json",
    ].join("\n"),
  );
  return 0;
}

function runCatalogInstallCommand(args: string[], io: CliIo): number {
  const maxRetries = args.includes("--retries") ? parseInt(getRequiredArg(args, "--retries"), 10) || 3 : 3;
  const timeout = 30000;
  const projectDir = process.cwd();
  const componentsDir = join(projectDir, "compositions", "components");

  // Phase 1: Install bundled components (local, zero network)
  const bundledDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "templates", "catalog", "components");
  const succeeded: string[] = [];
  const failed: string[] = [];

  if (existsSync(bundledDir)) {
    const manifests = readdirSync(bundledDir).filter(f => f.endsWith(".json"));
    if (manifests.length > 0) {
      io.stdout(`Installing ${manifests.length} bundled components (offline)...\n`);
      mkdirSync(componentsDir, { recursive: true });

      for (const mf of manifests) {
        try {
          const manifest = JSON.parse(readFileSync(join(bundledDir, mf), "utf8"));
          const name = manifest.name ?? mf.replace(".json", "");
          for (const file of manifest.files ?? []) {
            const src = join(bundledDir, file.path);
            const dest = join(componentsDir, basename(file.target ?? file.path));
            if (existsSync(src)) {
              copyFileSync(src, dest);
            }
          }
          succeeded.push(name);
          io.stdout(`  ✓ ${name} (component, bundled)`);
        } catch {
          const name = mf.replace(".json", "");
          failed.push(name);
          io.stderr(`  ✗ ${name} — bundled copy failed`);
        }
      }
    }
  }

  // Phase 2: Install blocks via HyperFrames CLI (requires network)
  io.stdout("\nFetching block catalog from HyperFrames...");
  let blockCount = 0;
  try {
    const raw = execSync("npx hyperframes catalog --type block --json 2>/dev/null", { encoding: "utf8", timeout: 20000 });
    const blocks: { name: string }[] = JSON.parse(raw);
    if (blocks.length > 0) {
      io.stdout(`\nInstalling ${blocks.length} blocks (network, ${maxRetries} retries each)...\n`);
      for (const block of blocks) {
        let installed = false;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            execSync(`npx hyperframes add ${block.name} 2>/dev/null`, { encoding: "utf8", timeout });
            installed = true;
            break;
          } catch {
            if (attempt < maxRetries) io.stdout(`  ${block.name} retry ${attempt}/${maxRetries}...`);
          }
        }
        if (installed) {
          succeeded.push(block.name);
          blockCount++;
          io.stdout(`  ✓ ${block.name} (block)`);
        } else {
          failed.push(block.name);
          io.stderr(`  ✗ ${block.name} (block) — failed after ${maxRetries} retries`);
        }
      }
    } else {
      io.stdout("No blocks in catalog.");
    }
  } catch {
    io.stdout("HyperFrames CLI not available — skipping blocks. Components still installed.");
  }

  const componentCount = succeeded.filter(id => !failed.includes(id)).length;
  const total = succeeded.length + failed.length;
  io.stdout([
    "",
    `Components (bundled): ${componentCount} installed`,
    `Blocks (network): ${blockCount} installed`,
    `Total: ${succeeded.length}/${total} installed`,
    ...(failed.length > 0 ? [``, `Failed: ${failed.join(", ")}`, "Retry blocks: npx hyperframes add <name>"] : []),
  ].join("\n"));

  return failed.length > 0 ? 1 : 0;
}

function runScaffoldCommand(args: string[], io: CliIo): number {
  const projectDir = getRequiredArg(args, "--project-dir");
  try {
    const result = scaffoldWorkbenchProject(projectDir);
    io.stdout([
      `Scaffolded ${result.sceneCount} scenes to ${result.htmlPath}`,
      `Design tokens applied: ${result.tokensApplied ? "yes" : "default"}`,
      `Assets referenced: ${result.assetsReferenced}`,
      "",
      "Next: npx hyperframes preview --port 3002",
    ].join("\n"));
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runBuildCommand(args: string[], io: CliIo): number {
  const projectDir = getRequiredArg(args, "--project-dir");
  try {
    const gate = checkWorkbenchLifecycleGate({
      projectDir,
      action: "build",
      force: args.includes("--force"),
    });
    recordGateResult({ projectDir, action: "build", gate });
    appendForceSummary({ projectDir, action: "build", gate });

    if (gate.status === "blocked") {
      const interventionContext = buildWorkbenchInterventionContext({
        command: "build",
        projectDir: resolve(projectDir),
        phase: "composition",
        report: gate.reports.find((report) => report.status === "failed"),
      });
      recordWorkbenchFriction({
        version: "framepack.friction-event.v1",
        timestamp: new Date().toISOString(),
        projectDir: resolve(projectDir),
        type: "audit-blocker",
        category: "workflow-friction",
        summary: gate.message,
        evidence: gate.blockers,
      });
      if (args.includes("--json")) {
        io.stdout(JSON.stringify({ projectDir: resolve(projectDir), gate, interventionContext }, null, 2));
      } else {
        io.stderr([gate.message, ...gate.blockers.map((blocker) => `- ${blocker}`), "Use --force only if you accept the rework risk."].join("\n"));
      }
      return 1;
    }

    const result = buildWorkbenchProject(projectDir);
    if (args.includes("--json")) {
      io.stdout(JSON.stringify({
        projectDir: resolve(projectDir),
        result,
        gate,
        interventionContext: buildWorkbenchInterventionContext({
          command: "build",
          projectDir: resolve(projectDir),
        }),
      }, null, 2));
      return 0;
    }

    io.stdout([
      `Built ${result.sceneCount} scenes to ${result.htmlPath}`,
      `Design tokens applied: ${result.tokensApplied ? "yes" : "default"}`,
      `Assets referenced: ${result.assetsReferenced}`,
      result.templatesUsed.length > 0
        ? `Scene templates used: ${result.templatesUsed.join(", ")}`
        : "Scene templates: none matched (using built-in content)",
      "",
      "Next: npx framepack preview --project-dir . --open",
    ].join("\n"));
    return 0;
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function runSceneTemplatesCommand(args: string[], io: CliIo): number {
  const subcommand = args[0];

  if (subcommand === "list" || !subcommand) {
    const category = getOptionalArg(args, "--category");
    const format = getOptionalArg(args, "--format");
    const query: SceneTemplateQuery = {};
    if (category) query.category = category as SceneTemplateQuery["category"];
    if (format) query.format = format;

    const templates = query.category || query.format
      ? matchSceneTemplates(query)
      : loadAllTemplates();

    const stats = getTemplateStats();

    io.stdout([
      `Scene Templates (${stats.total}: ${stats.builtin} builtin, ${stats.blocks} blocks, ${stats.agentCreated} agent)`,
      "",
      "By category:",
      ...Object.entries(stats.byCategory).map(([cat, count]) => `  ${cat}: ${count}`),
      "",
      ...templates.map(t => `  [${t.source}] ${t.id} (${t.category}, ${t.minDuration}-${t.maxDuration}s, ${t.format})`),
    ].join("\n"));
    return 0;
  }

  if (subcommand === "recommend") {
    const category = getOptionalArg(args, "--category");
    const tags = getOptionalArg(args, "--tags");
    const format = getOptionalArg(args, "--format");
    const query: SceneTemplateQuery = {};
    if (category) query.category = category as SceneTemplateQuery["category"];
    if (tags) query.tags = tags.split(",");
    if (format) query.format = format;

    const results = matchSceneTemplates(query);
    io.stdout([
      `Recommended templates for: ${category || "any"}${tags ? ` [${tags}]` : ""}`,
      "",
      ...results.slice(0, 5).map((t, i) => [
        `${i + 1}. ${t.id} (${t.category}, ${t.source})`,
        `   Tags: ${t.tags.join(", ")}`,
        `   Duration: ${t.minDuration}-${t.maxDuration}s | Format: ${t.format}`,
        `   Required tokens: ${t.requiredTokens.join(", ") || "none"}`,
      ].join("\n")),
    ].join("\n"));
    return 0;
  }

  if (subcommand === "stats") {
    const stats = getTemplateStats();
    io.stdout(JSON.stringify(stats, null, 2));
    return 0;
  }

  throw new Error("Invalid scene-templates subcommand. Use: list, recommend, stats, search, registries, install");
}

async function runSceneTemplatesAsync(args: string[], io: CliIo): Promise<number> {
  const subcommand = args[0];

  if (subcommand === "registries") {
    const registries = listRegistries();
    io.stdout([
      "Template Registries:",
      "",
      ...registries.map(r => [
        `  ${r.id} (${r.name})`,
        `    Format: ${r.format}`,
        `    URL: ${r.baseUrl}`,
      ].join("\n")),
    ].join("\n"));
    return 0;
  }

  if (subcommand === "search") {
    const registryId = getOptionalArg(args, "--registry") ?? "hyperframes-blocks";
    const category = getOptionalArg(args, "--category");

    io.stdout(`Searching registry: ${registryId}...`);
    try {
      const entries = await fetchRegistryIndex(registryId);
      const filtered = category
        ? entries.filter(e => e.category === category)
        : entries;

      if (filtered.length === 0) {
        io.stdout("No external templates found.");
        return 0;
      }

      io.stdout([
        "",
        `Found ${filtered.length} templates in ${registryId}:`,
        "",
        ...filtered.map((e, i) => [
          `${i + 1}. ${e.name} (${e.id})`,
          `   Category: ${e.category} | Tags: ${e.tags.join(", ")}`,
          `   Duration: ${e.minDuration}-${e.maxDuration}s`,
          `   URL: ${e.url}`,
        ].join("\n")),
      ].join("\n"));
    } catch (err) {
      io.stderr(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    return 0;
  }

  if (subcommand === "install") {
    const entryId = getRequiredArg(args, "--id");
    const registryId = getOptionalArg(args, "--registry") ?? "hyperframes-blocks";
    const projectDir = getOptionalArg(args, "--project-dir");

    io.stdout(`Installing template '${entryId}' from ${registryId}...`);
    try {
      const entries = await fetchRegistryIndex(registryId);
      const entry = entries.find(e => e.id === entryId);
      if (!entry) {
        io.stderr(`Template '${entryId}' not found in registry '${registryId}'.`);
        io.stderr(`Available: ${entries.map(e => e.id).join(", ")}`);
        return 1;
      }

      const path = await installExternalTemplate(entry, projectDir);
      io.stdout([
        `Installed: ${entry.id}`,
        `  Category: ${entry.category}`,
        `  Tags: ${entry.tags.join(", ")}`,
        `  Path: ${path}`,
        "",
        "Template is now available in scene-templates list.",
      ].join("\n"));
    } catch (err) {
      io.stderr(`Install failed: ${err instanceof Error ? err.message : String(err)}`);
      return 1;
    }
    return 0;
  }

  io.stderr("Unknown async subcommand. Use: registries, search, install");
  return 1;
}

function runTemplateCommand(args: string[], io: CliIo): number {
  const subcommand = args[0];

  if (subcommand === "save") {
    const name = getRequiredArg(args, "--name");
    const category = getRequiredArg(args, "--category") as SceneTemplateCategory;
    const tagsStr = getOptionalArg(args, "--tags");
    const projectDir = getOptionalArg(args, "--project-dir");

    const validCategories = new Set(["opening", "name-reveal", "stats", "footage", "cta", "transition", "overlay"]);
    if (!validCategories.has(category)) {
      throw new Error(`Invalid --category '${category}'. Use: ${[...validCategories].join(", ")}`);
    }

    // Read HTML from stdin or a file
    const htmlFile = getOptionalArg(args, "--html-file");
    let html: string;
    if (htmlFile) {
      try {
        html = readFileSync(resolve(htmlFile), "utf-8");
      } catch (err) {
        throw new Error(`Cannot read --html-file '${htmlFile}': ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // Generate a basic template from the name and category
      html = [
        `<!-- Agent-created template: ${name} -->`,
        `<div class="scene clip" data-start="{{sceneStart}}" data-duration="{{sceneDuration}}" style="background:var(--bg-primary);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">`,
        `  <div class="scene-content">`,
        `    <h2 class="scene-title" style="font-size:clamp(48px,10vw,140px);font-weight:900;color:var(--text-primary);">{{entityName}}</h2>`,
        `  </div>`,
        `</div>`,
      ].join("\n");
    }

    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()) : [];

    const savedPath = saveAgentTemplate(
      {
        id: name,
        category,
        tags,
        format: "any",
        html,
        requiredTokens: ["--bg-primary", "--text-primary"],
        minDuration: 2,
        maxDuration: 15,
      },
      projectDir,
    );

    io.stdout([
      `Template saved: ${name}`,
      `  Category: ${category}`,
      `  Tags: ${tags.join(", ") || "(none)"}`,
      `  Path: ${savedPath}`,
      "",
      "This template is now available to the matching engine and will be",
      "returned by `framepack scene-templates list` and MCP querySceneTemplate.",
    ].join("\n"));

    return 0;
  }

  throw new Error("Invalid template subcommand. Use: save");
}

function runWorkbenchCommand(args: string[], io: CliIo): number {
  if (args[0] !== "check" && args[0] !== "audit" && args[0] !== "brief" && args[0] !== "friction" && args[0] !== "learnings" && args[0] !== "preferences") {
    throw new Error("Invalid workbench command. Use: framepack workbench check|audit|brief|friction|learnings|preferences --project-dir <dir>");
  }

  if (args[0] === "brief") {
    const projectDir = resolve(getRequiredArg(args, "--project-dir"));
    const brief = formatWorkbenchHumanBrief(projectDir);
    if (args.includes("--json")) {
      io.stdout(JSON.stringify({
        projectDir,
        brief,
        interventionContext: buildWorkbenchInterventionContext({
          command: "brief",
          projectDir,
        }),
      }, null, 2));
      return 0;
    }
    io.stdout(brief);
    return 0;
  }

  const projectDir = resolve(getRequiredArg(args, "--project-dir"));

  if (args[0] === "friction") {
    if (args.includes("--record-bypass")) {
      const summary = getRequiredArg(args, "--summary");
      const evidence = getOptionalArg(args, "--evidence");
      const event = recordWorkbenchBypassSignal({
        projectDir,
        summary,
        evidence: evidence ? evidence.split("|").map((item) => item.trim()).filter(Boolean) : [],
      });
      if (args.includes("--json")) {
        io.stdout(JSON.stringify({ projectDir, event, friction: createWorkbenchFrictionPayload(projectDir) }, null, 2));
      } else {
        io.stdout(`Recorded Framepack bypass signal: ${event.summary}`);
      }
      return 0;
    }
    if (args.includes("--json")) {
      io.stdout(JSON.stringify(createWorkbenchFrictionPayload(projectDir), null, 2));
      return 0;
    }
    io.stdout(formatWorkbenchFriction(projectDir));
    return 0;
  }

  if (args[0] === "learnings") {
    if (args.includes("--json")) {
      io.stdout(JSON.stringify(createWorkbenchFrictionPayload(projectDir), null, 2));
      return 0;
    }
    io.stdout(formatWorkbenchLearnings(projectDir));
    return 0;
  }

  if (args[0] === "preferences") {
    if (args.includes("--refresh")) {
      writeWorkbenchPreferences({ projectDir });
    }
    io.stdout(formatWorkbenchPreferences(projectDir));
    return 0;
  }

  if (args[0] === "audit") {
    const phase = (getOptionalArg(args, "--phase") ?? "all") as WorkbenchAuditPhase;
    if (!["all", "preflight", "design", "composition", "preview", "render"].includes(phase)) {
      throw new Error("Invalid --phase value. Use all, preflight, design, composition, preview, or render.");
    }
    const report = auditWorkbenchProject(projectDir, phase);

    if (args.includes("--json")) {
      io.stdout(JSON.stringify({
        projectDir,
        report,
        interventionContext: buildWorkbenchInterventionContext({
          command: "audit",
          phase,
          projectDir,
          report,
        }),
      }, null, 2));
    } else {
      io.stdout(
        [
          `Framepack workbench audit: ${report.status}`,
          `projectDir: ${projectDir}`,
          "",
          ...report.checks.map((check) => `- ${check.status}: ${check.priority} ${check.id} - ${check.summary}`),
          "",
          "Corrections:",
          ...(report.corrections.length > 0 ? report.corrections.map((item) => `- ${item}`) : ["- No correction required."]),
        ].join("\n"),
      );
    }

    return report.status === "passed" ? 0 : 1;
  }

  const report = validateWorkbenchProject(projectDir);

  if (args.includes("--json")) {
    io.stdout(JSON.stringify({
      projectDir,
      report,
      interventionContext: buildWorkbenchInterventionContext({
        command: "check",
        projectDir,
        report,
      }),
    }, null, 2));
  } else {
    io.stdout(
      [
        `Framepack workbench check: ${report.status}`,
        `projectDir: ${projectDir}`,
        "",
        ...report.checks.map((check) => `- ${check.status}: ${check.id} - ${check.summary}`),
      ].join("\n"),
    );
  }

  return report.status === "passed" ? 0 : 1;
}

function describeCapabilityAtlas(): string {
  const nodes = listCapabilityAtlasNodes();
  const stacks = listRecommendedCapabilityStacks();

  return [
    "Framepack Animation Capability Atlas",
    "",
    "Capability nodes:",
    ...nodes.map((node) => `- ${node.id} (${node.domain}/${node.layer}, score ${node.score})`),
    "",
    "Recommended stacks:",
    ...stacks.map((stack) => `- ${stack.id}: ${stack.name}`),
  ].join("\n");
}

function runAtlasCommand(args: string[], io: CliIo): number {
  if (args[0] === "get") {
    const id = args[1];

    if (!id || id.startsWith("--")) {
      throw new Error("Missing required atlas node id.");
    }

    const node = getCapabilityAtlasNode(id);

    if (!node) {
      throw new Error(`Unknown capability atlas node: ${id}`);
    }

    if (args.includes("--json")) {
      io.stdout(JSON.stringify({ node }, null, 2));
      return 0;
    }

    io.stdout(`${node.id}: ${node.name}\nDomain: ${node.domain}\nLayer: ${node.layer}\nScore: ${node.score}`);
    return 0;
  }

  if (args[0] === "recommend") {
    const stack = recommendCapabilityStack({
      workflowPackId: getOptionalArg(args, "--workflow-pack"),
      creativeDirectionPackId: getOptionalArg(args, "--creative-direction-pack"),
      outputType: getOptionalArg(args, "--output-type"),
      format: getOptionalArg(args, "--format"),
      goal: getOptionalArg(args, "--goal"),
    });

    if (!stack) {
      throw new Error("No capability stack recommendation matched the supplied atlas context.");
    }

    if (args.includes("--json")) {
      io.stdout(JSON.stringify({ stack }, null, 2));
      return 0;
    }

    io.stdout(
      [
        `${stack.id}: ${stack.name}`,
        "",
        "Capabilities:",
        ...stack.nodes.map((node) => `- ${node.capabilityId} (${node.role}${node.required ? ", required" : ""})`),
        "",
        "Rationale:",
        ...stack.rationale.map((reason) => `- ${reason}`),
      ].join("\n"),
    );
    return 0;
  }

  const payload = {
    capabilityAtlas: {
      nodes: listCapabilityAtlasNodes(),
      recommendedStacks: listRecommendedCapabilityStacks(),
    },
  };

  if (args.includes("--json")) {
    io.stdout(JSON.stringify(payload, null, 2));
    return 0;
  }

  io.stdout(describeCapabilityAtlas());
  return 0;
}

async function runReleaseSmokeCommand(args: string[], io: CliIo, context: CliContext = {}): Promise<number> {
  const report = await runFramepackReleaseSmoke({
    outputDir: getRequiredArg(args, "--output-dir"),
    platform: context.platform,
  });

  if (args.includes("--json")) {
    io.stdout(JSON.stringify(report, null, 2));
  } else {
    io.stdout(
      [
        `Framepack release smoke: ${report.status}`,
        `roundId: ${report.roundId}`,
        `outputDir: ${report.outputDir}`,
        report.generatedProjectDir ? `generatedProjectDir: ${report.generatedProjectDir}` : undefined,
        "",
        ...report.checks.map((check) => `- ${check.status}: ${check.id} - ${check.summary}`),
      ].filter((line): line is string => line !== undefined).join("\n"),
    );
  }

  return report.status === "passed" ? 0 : 1;
}

function getRequiredProjectDir(args: string[]): string {
  return resolve(getRequiredArg(args, "--project-dir"));
}

function collectKnownOptionArgs(
  args: string[],
  valueOptions: string[],
  booleanOptions: string[],
): string[] {
  const passthroughArgs: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (booleanOptions.includes(arg)) {
      passthroughArgs.push(arg);
      continue;
    }

    if (valueOptions.includes(arg)) {
      const value = args[index + 1];

      if (value !== undefined) {
        passthroughArgs.push(arg, value);
        index += 1;
      }
    }
  }

  return passthroughArgs;
}

function collectRuntimePassthroughArgs(
  action: "preview" | "render" | "inspect" | "snapshot" | "lint" | "upgrade-check",
  args: string[],
): string[] {
  if (action === "preview") {
    return collectKnownOptionArgs(args, ["--port"], []);
  }

  if (action === "inspect") {
    return collectKnownOptionArgs(
      args,
      ["--samples", "--at", "--tolerance", "--timeout", "--max-issues"],
      ["--json", "--collapse-static", "--no-collapse-static", "--strict"],
    );
  }

  if (action === "snapshot") {
    return collectKnownOptionArgs(args, ["--frames", "--at", "--timeout"], []);
  }

  if (action === "render") {
    return collectKnownOptionArgs(
      args,
      ["--output", "--format", "--fps", "--quality", "--workers", "--crf", "--video-bitrate", "--max-concurrent-renders"],
      ["--docker", "--hdr", "--gpu", "--quiet", "--strict", "--strict-all"],
    );
  }

  return [];
}

function createCompilerSourceInput(options: CliOptions): CompilerSourceInput {
  if (options.gameAdDescription) {
    return {
      sourceType: "game-ad",
      description: options.gameAdDescription,
    };
  }

  if (options.url) {
    return {
      sourceType: "website",
      url: options.url,
    };
  }

  if (options.threadFile) {
    return {
      sourceType: "thread",
      text: readFileSync(options.threadFile, "utf8"),
    };
  }

  return {
    sourceType: "markdown",
    markdown: readFileSync(options.input!, "utf8"),
  };
}

function loadProjectRuntimeInfo(projectDir: string) {
  const metaPath = resolve(projectDir, "meta.json");
  const rawMeta = stripUtf8Bom(readFileSync(metaPath, "utf8"));
  const meta = JSON.parse(rawMeta) as {
    rootEntry: string;
    compositionDirectory: string;
    assetDirectory: string;
  };

  return {
    rootEntry: meta.rootEntry,
    compositionDirectory: meta.compositionDirectory,
    assetDirectory: meta.assetDirectory,
  };
}

function runRuntimeDoctorCommand(args: string[], io: CliIo): number {
  const capabilities = detectHyperframesCapabilities();
  const projectDir = getOptionalArg(args, "--project-dir");
  const outputLines = [
    "HyperFrames runtime",
    `available: ${capabilities.available}`,
    `binary: ${capabilities.binary}`,
    `version: ${capabilities.version}`,
    `detectedAt: ${capabilities.detectedAt}`,
    `fallbackNotes: ${capabilities.fallbackNotes.join(" | ") || "none"}`,
  ];

  if (projectDir) {
    const resolvedProjectDir = resolve(projectDir);
    const packageReport = validateProjectPackage({
      projectDir: resolvedProjectDir,
    });

    outputLines.push(
      "",
      "Package protocol",
      `projectDir: ${resolvedProjectDir}`,
      `packageStatus: ${packageReport.status}`,
      `sceneCount: ${packageReport.sceneCount}`,
      `issueCount: ${packageReport.issues.length}`,
    );

    io.stdout(outputLines.join("\n"));

    if (packageReport.status === "failed") {
      io.stderr(`Package protocol failed for ${resolvedProjectDir}: ${packageReport.issues.join(", ")}`);
      return 1;
    }

    return 0;
  }

  io.stdout(outputLines.join("\n"));

  return 0;
}

function runRuntimeActionCommand(
  action: "preview" | "render" | "lint" | "inspect" | "snapshot" | "upgrade-check",
  args: string[],
  io: CliIo,
  dependencies: CliDependencies = {},
): number {
  const projectDir = action === "upgrade-check" ? undefined : getRequiredProjectDir(args);
  const detectRuntime = dependencies.detectRuntimeCapabilities ?? detectHyperframesCapabilities;
  const executeRuntime = dependencies.executeRuntimeCommand ?? executeHyperframesCommand;
  const capabilities = detectRuntime();

  if (!capabilities.available) {
    io.stderr(`HyperFrames runtime is unavailable: ${capabilities.fallbackNotes.join(" | ")}`);
    return 1;
  }

  const runtimeAdapter = createHyperframesRuntimeAdapter();
  const runtimeInfo = projectDir
    ? loadProjectRuntimeInfo(projectDir)
    : runtimeAdapter.describePackage({ projectName: "runtime-upgrade-check" });
  const command = runtimeAdapter.buildCommand({
    action,
    packageDirectory: projectDir,
    packageRuntimeInfo: runtimeInfo,
    capabilities,
    passthroughArgs: collectRuntimePassthroughArgs(action, args),
  });
  const result = executeRuntime({
    command,
  });

  if (!result.success) {
    io.stderr(result.stderr.length > 0 ? result.stderr : `${action} failed: ${result.summary}`);
    return result.exitCode || 1;
  }

  io.stdout(result.stdout.length > 0 ? result.stdout : `${action} completed: ${result.summary}`);
  return 0;
}

function runRenderCommand(
  args: string[],
  io: CliIo,
  dependencies: CliDependencies = {},
): number {
  const audioFile = getOptionalArg(args, "--audio") ?? getOptionalArg(args, "--with-audio");
  const projectDir = getRequiredProjectDir(args);
  const json = args.includes("--json");

  const gate = checkWorkbenchLifecycleGate({
    projectDir,
    action: "render",
    force: args.includes("--force"),
  });
  recordGateResult({ projectDir, action: "render", gate });
  appendForceSummary({ projectDir, action: "render", gate });

  if (gate.status === "blocked") {
    const interventionContext = buildWorkbenchInterventionContext({
      command: "render",
      projectDir: resolve(projectDir),
      phase: "render",
      report: gate.reports.find((report) => report.status === "failed"),
    });
    recordWorkbenchFriction({
      version: "framepack.friction-event.v1",
      timestamp: new Date().toISOString(),
      projectDir: resolve(projectDir),
      type: "audit-blocker",
      category: "workflow-friction",
      summary: gate.message,
      evidence: gate.blockers,
    });
    if (json) {
      io.stdout(JSON.stringify({ projectDir: resolve(projectDir), gate, interventionContext }, null, 2));
    } else {
      io.stderr([gate.message, ...gate.blockers.map((blocker) => `- ${blocker}`), "Use --force only if you accept the rework risk."].join("\n"));
    }
    return 1;
  }

  // Step 1: Run hyperframes render
  const runtimeStdout: string[] = [];
  const runtimeStderr: string[] = [];
  const runtimeIo = json
    ? { stdout: (message: string) => runtimeStdout.push(message), stderr: (message: string) => runtimeStderr.push(message) }
    : io;
  const renderExit = runRuntimeActionCommand("render", args, runtimeIo, dependencies);
  if (renderExit !== 0) {
    recordWorkbenchCommandFailure({
      projectDir,
      action: "render",
      summary: runtimeStderr.join("\n") || "HyperFrames render returned a non-zero exit code.",
      evidence: [runtimeStdout.join("\n"), runtimeStderr.join("\n")].filter(Boolean),
    });
    return renderExit;
  }

  // Step 2: If no audio requested, we're done
  if (!audioFile) {
    if (json) {
      io.stdout(JSON.stringify({
        projectDir: resolve(projectDir),
        status: "rendered",
        gate,
        runtimeOutput: runtimeStdout.join("\n"),
        runtimeErrors: runtimeStderr.join("\n"),
        interventionContext: buildWorkbenchInterventionContext({
          command: "render",
          projectDir: resolve(projectDir),
        }),
      }, null, 2));
    }
    return 0;
  }

  // Step 3: Find the rendered video
  const rendersDir = join(projectDir, "renders");
  if (!existsSync(rendersDir)) {
    io.stderr("No renders/ directory found. Run render without --audio first to check output.");
    recordWorkbenchCommandFailure({
      projectDir,
      action: "render-audio",
      summary: "No renders/ directory found for audio merge.",
      evidence: ["Run render without --audio first to check output."],
    });
    return 1;
  }

  const renderedFiles = readdirSync(rendersDir)
    .filter(f => f.endsWith(".mp4"))
    .sort()
    .reverse();

  if (renderedFiles.length === 0) {
    io.stderr("No .mp4 files found in renders/. Run render first.");
    recordWorkbenchCommandFailure({
      projectDir,
      action: "render-audio",
      summary: "No .mp4 files found in renders/ for audio merge.",
      evidence: [`rendersDir: ${rendersDir}`],
    });
    return 1;
  }

  const videoFile = join(rendersDir, renderedFiles[0]);
  const audioPath = resolve(audioFile);

  if (!existsSync(audioPath)) {
    io.stderr(`Audio file not found: ${audioPath}`);
    recordWorkbenchCommandFailure({
      projectDir,
      action: "render-audio",
      summary: `Audio file not found: ${audioPath}`,
      evidence: [audioPath],
    });
    return 1;
  }

  // Step 4: Check ffmpeg availability
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    io.stderr([
      "ffmpeg is required for audio merge. Install it first:",
      "  Windows: winget install ffmpeg",
      "  macOS:   brew install ffmpeg",
      "  Linux:   sudo apt install ffmpeg",
      "",
      "Then re-run: npx framepack render --project-dir . --audio bgm.mp3",
    ].join("\n"));
    recordWorkbenchCommandFailure({
      projectDir,
      action: "render-audio",
      summary: "ffmpeg is required for audio merge but was not available.",
      evidence: ["Install ffmpeg before audio merge."],
    });
    return 1;
  }

  // Step 5: Merge audio with ffmpeg
  const outputFile = videoFile.replace(".mp4", "-with-audio.mp4");
  io.stdout(`Merging audio: ${audioFile} → ${basename(outputFile)}`);

  try {
    execSync(
      `ffmpeg -y -i "${videoFile}" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${outputFile}"`,
      { stdio: "pipe" },
    );
    io.stdout([
      `Audio merged successfully: ${outputFile}`,
      `Video: ${basename(videoFile)}`,
      `Audio: ${basename(audioPath)}`,
    ].join("\n"));
    return 0;
  } catch (err) {
    io.stderr(`ffmpeg merge failed: ${err instanceof Error ? err.message : String(err)}`);
    recordWorkbenchCommandFailure({
      projectDir,
      action: "render-audio",
      summary: err instanceof Error ? err.message : String(err),
      evidence: [outputFile],
    });
    return 1;
  }
}

function runPreviewCommand(
  args: string[],
  io: CliIo,
  dependencies: CliDependencies = {},
): number {
  const shouldOpen = args.includes("--open") || args.includes("-o");
  const port = getOptionalArg(args, "--port") ?? "3002";
  const projectDir = getRequiredProjectDir(args);
  const json = args.includes("--json");

  const gate = checkWorkbenchLifecycleGate({
    projectDir,
    action: "preview",
    force: args.includes("--force"),
  });
  recordGateResult({ projectDir, action: "preview", gate });
  appendForceSummary({ projectDir, action: "preview", gate });

  if (gate.status === "blocked") {
    const interventionContext = buildWorkbenchInterventionContext({
      command: "preview",
      projectDir: resolve(projectDir),
      phase: "preview",
      report: gate.reports.find((report) => report.status === "failed"),
    });
    recordWorkbenchFriction({
      version: "framepack.friction-event.v1",
      timestamp: new Date().toISOString(),
      projectDir: resolve(projectDir),
      type: "audit-blocker",
      category: "workflow-friction",
      summary: gate.message,
      evidence: gate.blockers,
    });
    if (json) {
      io.stdout(JSON.stringify({ projectDir: resolve(projectDir), gate, interventionContext }, null, 2));
    } else {
      io.stderr([gate.message, ...gate.blockers.map((blocker) => `- ${blocker}`), "Use --force only if you accept the rework risk."].join("\n"));
    }
    return 1;
  }

  // Run hyperframes preview
  const runtimeStdout: string[] = [];
  const runtimeStderr: string[] = [];
  const runtimeIo = json
    ? { stdout: (message: string) => runtimeStdout.push(message), stderr: (message: string) => runtimeStderr.push(message) }
    : io;
  const exitCode = runRuntimeActionCommand("preview", args, runtimeIo, dependencies);

  if (exitCode !== 0) {
    recordWorkbenchCommandFailure({
      projectDir,
      action: "preview",
      summary: runtimeStderr.join("\n") || "HyperFrames preview returned a non-zero exit code.",
      evidence: [runtimeStdout.join("\n"), runtimeStderr.join("\n")].filter(Boolean),
    });
    return exitCode;
  }

  if (json) {
    io.stdout(JSON.stringify({
      projectDir: resolve(projectDir),
      status: "preview-started",
      gate,
      port,
      runtimeOutput: runtimeStdout.join("\n"),
      runtimeErrors: runtimeStderr.join("\n"),
      interventionContext: buildWorkbenchInterventionContext({
        command: "preview",
        projectDir: resolve(projectDir),
      }),
    }, null, 2));
    return 0;
  }

  // Auto-open browser if requested
  if (shouldOpen) {
    const url = `http://localhost:${port}`;
    io.stdout(`Opening preview: ${url}`);
    const openCmd = process.platform === "win32" ? "start"
      : process.platform === "darwin" ? "open"
      : "xdg-open";
    try {
      execSync(`${openCmd} "${url}"`, { stdio: "pipe" });
    } catch {
      io.stdout(`Could not auto-open browser. Open manually: ${url}`);
    }
  }

  return 0;
}

function runSyncAssetsCommand(args: string[], io: CliIo): number {
  const projectDir = getRequiredProjectDir(args);
  const result = syncAssetExecutionProject({
    projectDir,
  });

  io.stdout(
    `Asset sync updated ${result.projectDir}: ${result.availableCount} available, ${result.pendingCount} pending`,
  );
  return 0;
}

function runRepairCommand(args: string[], io: CliIo): number {
  const projectDir = getRequiredProjectDir(args);
  const result = repairProjectPackage({
    projectDir,
  });
  const repairedList = result.repairedFiles.length > 0 ? result.repairedFiles.join(", ") : "no files";

  if (result.afterStatus === "failed") {
    io.stderr(
      `Package repair updated ${result.projectDir}: ${repairedList}. Validation reports written. Remaining issues: ${result.remainingIssues.join(", ")}`,
    );
    return 1;
  }

  io.stdout(`Package repair updated ${result.projectDir}: ${repairedList}. Validation reports written.`);
  return 0;
}

function runStatusCommand(args: string[], io: CliIo): number {
  const projectDir = getRequiredProjectDir(args);
  const summary = getProjectPackageStatus({
    projectDir,
  });

  if (args.includes("--json")) {
    io.stdout(JSON.stringify(summary, null, 2));
  } else {
    io.stdout(formatProjectPackageStatus(summary));
  }

  return summary.protocolStatus === "passed" ? 0 : 1;
}

async function runCaptureCommand(
  args: string[],
  io: CliIo,
  dependencies: CliDependencies,
): Promise<number> {
  const projectDir = getRequiredProjectDir(args);
  const captureProject = dependencies.captureProject ?? materializeProjectAssets;
  const result = await captureProject({
    projectDir,
  });

  io.stdout(
    `Materialized ${("capturedCount" in result ? result.capturedCount : result.composedCount)} source assets for ${result.projectDir}: ${result.availableCount} available, ${result.pendingCount} pending`,
  );
  return 0;
}

export async function runCli(
  args: string[],
  io: CliIo = DEFAULT_IO,
  dependencies: CliDependencies = {},
  context: CliContext = {},
): Promise<number> {
  try {
    const command = getCommandName(args);

    if (command === "help") {
      io.stdout(FRAMEPACK_CLI_HELP);
      return 0;
    }

    if (command === "version") {
      io.stdout(FRAMEPACK_CLI_VERSION);
      return 0;
    }

    if (command === "create") {
      return runCreateCommand(args.slice(1), io);
    }

    if (command === "init") {
      return runInitCommand(args.slice(1), io);
    }

    if (command === "init-agent") {
      return runInitAgentCommand(args.slice(1), io, context);
    }

    if (command === "mcp") {
      return await runMcpCommand(args.slice(1), io);
    }

    if (command === "atlas") {
      return runAtlasCommand(args.slice(1), io);
    }

    if (command === "catalog") {
      return runCatalogCommand(args.slice(1), io);
    }

    if (command === "packs") {
      return runPacksCommand(args.slice(1), io);
    }

    if (command === "templates") {
      return runTemplatesCommand(args.slice(1), io);
    }

    if (command === "workbench") {
      return runWorkbenchCommand(args.slice(1), io);
    }

    if (command === "release-smoke") {
      return await runReleaseSmokeCommand(args.slice(1), io, context);
    }

    if (command === "validate") {
      return await runValidateCommand(args, io);
    }

    if (command === "status") {
      return runStatusCommand(args.slice(1), io);
    }

    if (command === "repair") {
      return runRepairCommand(args.slice(1), io);
    }

    if (command === "runtime-doctor") {
      return runRuntimeDoctorCommand(args.slice(2), io);
    }

    if (command === "lint") {
      return runRuntimeActionCommand("lint", args.slice(1), io, dependencies);
    }

    if (command === "runtime-lint") {
      return runRuntimeActionCommand("lint", args.slice(2), io, dependencies);
    }

    if (command === "runtime-inspect") {
      return runRuntimeActionCommand("inspect", args.slice(2), io, dependencies);
    }

    if (command === "runtime-snapshot") {
      return runRuntimeActionCommand("snapshot", args.slice(2), io, dependencies);
    }

    if (command === "runtime-upgrade-check") {
      return runRuntimeActionCommand("upgrade-check", args.slice(2), io, dependencies);
    }

    if (command === "capture") {
      return await runCaptureCommand(args.slice(1), io, dependencies);
    }

    if (command === "sync-captures" || command === "sync-assets") {
      return runSyncAssetsCommand(args.slice(1), io);
    }

    if (command === "preview") {
      return runPreviewCommand(args.slice(1), io, dependencies);
    }

    if (command === "render") {
      return runRenderCommand(args.slice(1), io, dependencies);
    }

    if (command === "scaffold") {
      return runScaffoldCommand(args.slice(1), io);
    }

    if (command === "scene-templates") {
      const stArgs = args.slice(1);
      const asyncSubs = new Set(["search", "registries", "install"]);
      if (asyncSubs.has(stArgs[0])) {
        return await runSceneTemplatesAsync(stArgs, io);
      }
      return runSceneTemplatesCommand(stArgs, io);
    }

    if (command === "template") {
      return runTemplateCommand(args.slice(1), io);
    }

    if (command === "build") {
      return runBuildCommand(args.slice(1), io);
    }

    return await runGenerateCommand(args, io);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(message);
    return 1;
  }
}
