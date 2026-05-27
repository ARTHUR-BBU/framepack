import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
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
  defaultWorkbenchProjectName,
  formatWorkbenchHumanBrief,
  listHyperframesCatalogPrefabs,
  listTemplateMarket,
  recommendHyperframesCatalogPrefabs,
  recommendTemplateRoute,
  validateWorkbenchProject,
} from "../../workbench/index.js";

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
  | "preview"
  | "render"
  | "runtime-doctor"
  | "runtime-lint"
  | "runtime-inspect"
  | "runtime-snapshot"
  | "runtime-upgrade-check"
  | "sync-captures"
  | "sync-assets";

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

const FRAMEPACK_CLI_VERSION = "0.5.0-alpha.4";

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
  "  framepack templates recommend --idea <idea> --style <style>",
  "  framepack workbench check --project-dir <dir>",
  "  framepack workbench brief --project-dir <dir>",
  "  framepack packs",
  "  framepack atlas --json",
  "  framepack generate --input <file> --output-dir <dir> --goal <goal> --audience <audience>",
  "  framepack generate --thread-file <file> --output-dir <dir> --goal <goal> --audience <audience>",
  "  framepack generate --game-ad-description <text> --output-dir <dir> --goal <goal> --audience <audience> --format 9:16 --auto-pack",
  "  framepack status --project-dir <package>",
  "  framepack validate --project-dir <package>",
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
    command === "preview" ||
    command === "render" ||
    command === "sync-captures" ||
    command === "sync-assets"
  ) {
    return command;
  }

  throw new Error("Missing or invalid command. Use --help, --version, create, init, init-agent, mcp, atlas, catalog, packs, templates, workbench, release-smoke, generate, status, validate, repair, capture, runtime doctor, runtime lint, runtime inspect, runtime snapshot, runtime upgrade-check, preview, render, sync-assets, or sync-captures.");
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
    first === "sync-assets"
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
  const idea = getRequiredArg(args, "--idea");
  const outputDir = getRequiredArg(args, "--output-dir");
  const format = (getOptionalArg(args, "--format") ?? "16:9") as "16:9" | "9:16";
  const durationSec = Number(getOptionalArg(args, "--duration") ?? "45");

  if (format !== "16:9" && format !== "9:16") {
    throw new Error("Invalid --format value. Use 16:9 or 9:16.");
  }

  if (!Number.isFinite(durationSec) || durationSec < 5) {
    throw new Error("Invalid --duration value. Use a number of at least 5 seconds.");
  }

  const project = createWorkbenchProject({
    projectName: getOptionalArg(args, "--project-name") ?? defaultWorkbenchProjectName(idea),
    idea,
    outputDir,
    assetDir: getOptionalArg(args, "--assets"),
    style: getOptionalArg(args, "--style"),
    format,
    durationSec,
  });

  io.stdout(
    [
      `Created Framepack workbench at ${project.projectDir}`,
      `assets: ${project.assets.length}`,
      "next: open FRAMEPACK.md with your agent, then refine COMPOSITION.md and build the HyperFrames or Remotion composition.",
    ].join("\n"),
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
  if (args[0] === "recommend") {
    const durationArg = getOptionalArg(args, "--duration");
    const durationSec = durationArg ? Number(durationArg) : 45;

    if (!Number.isFinite(durationSec) || durationSec < 5) {
      throw new Error("Invalid --duration value. Use a number of at least 5 seconds.");
    }

    const recommendation = recommendTemplateRoute({
      idea: getRequiredArg(args, "--idea"),
      style: getOptionalArg(args, "--style"),
      format: getOptionalArg(args, "--format") as "16:9" | "9:16" | undefined,
      durationSec,
    });

    if (args.includes("--json")) {
      io.stdout(JSON.stringify({ recommendation }, null, 2));
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
  if (args[0] === "recommend") {
    const recommendation = recommendHyperframesCatalogPrefabs({
      templateId: getRequiredArg(args, "--template") as Parameters<typeof recommendHyperframesCatalogPrefabs>[0]["templateId"],
      idea: getRequiredArg(args, "--idea"),
      style: getOptionalArg(args, "--style"),
      format: getOptionalArg(args, "--format") as "16:9" | "9:16" | undefined,
    });

    if (args.includes("--json")) {
      io.stdout(JSON.stringify({ recommendation }, null, 2));
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
      "Inspect the live official Catalog before installing: npx hyperframes catalog --json",
    ].join("\n"),
  );
  return 0;
}

function runWorkbenchCommand(args: string[], io: CliIo): number {
  if (args[0] !== "check" && args[0] !== "brief") {
    throw new Error("Invalid workbench command. Use: framepack workbench check --project-dir <dir> or framepack workbench brief --project-dir <dir>");
  }

  if (args[0] === "brief") {
    io.stdout(formatWorkbenchHumanBrief(getRequiredArg(args, "--project-dir")));
    return 0;
  }

  const projectDir = resolve(getRequiredArg(args, "--project-dir"));
  const report = validateWorkbenchProject(projectDir);

  if (args.includes("--json")) {
    io.stdout(JSON.stringify({ projectDir, report }, null, 2));
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

    if (command === "preview" || command === "render") {
      return runRuntimeActionCommand(command, args.slice(1), io, dependencies);
    }

    return await runGenerateCommand(args, io);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(message);
    return 1;
  }
}
