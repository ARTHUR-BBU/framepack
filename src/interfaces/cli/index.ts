import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { captureWebsiteProject } from "../../capture/website/executor.js";
import { syncCaptureExecutionProject } from "../../packaging/capture-execution.js";
import {
  compileMarkdownCaseExplainerProject,
  compileWebsiteCaseExplainerProject,
  ensureProjectValidationPassed,
} from "../../compiler/index.js";
import {
  createHyperframesRuntimeAdapter,
  detectHyperframesCapabilities,
} from "../../runtime/hyperframes/adapter.js";
import { executeHyperframesCommand } from "../../runtime/hyperframes/execution.js";
import { writeVideoProjectPackage } from "../../video/package/project-package.js";
import { writeValidationReport } from "../../video/validation/validation-report.js";

export interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

interface CliOptions {
  configPath?: string;
  input?: string;
  url?: string;
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
}

type CliCommandName =
  | "init"
  | "generate"
  | "validate"
  | "capture"
  | "preview"
  | "render"
  | "runtime-doctor"
  | "sync-captures";

interface CliDependencies {
  captureProject?: typeof captureWebsiteProject;
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
}

const DEFAULT_IO: CliIo = {
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
};

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
  url?: string;
}) {
  return [input.configPath, input.input, input.url].filter((value) => value !== undefined).length;
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

  if (command === "runtime" && subcommand === "doctor") {
    return "runtime-doctor";
  }

  if (
    command === "init" ||
    command === "generate" ||
    command === "validate" ||
    command === "capture" ||
    command === "preview" ||
    command === "render" ||
    command === "sync-captures"
  ) {
    return command;
  }

  throw new Error("Missing or invalid command. Use init, generate, validate, capture, runtime doctor, preview, render, or sync-captures.");
}

function getCommandArgs(args: string[]): string[] {
  const [first, second] = args;

  if (first === "runtime" && second === "doctor") {
    return args.slice(2);
  }

  if (
    first === "init" ||
    first === "generate" ||
    first === "validate" ||
    first === "capture" ||
    first === "preview" ||
    first === "render" ||
    first === "sync-captures"
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
  const url = getOptionalArg(commandArgs, "--url");

  if (countDefinedSources({ configPath, input, url }) !== 1) {
    throw new Error("Use exactly one source input: --config, --input, or --url.");
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
      url: undefined,
      outputDir,
      goal: config.goal,
      audience: config.audience,
      projectName: config.projectName,
      format: config.format,
      style,
      theme,
      constraints,
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
    url,
    outputDir,
    goal,
    audience,
    projectName:
      getOptionalArg(commandArgs, "--project-name") ??
      (input ? deriveProjectName(input) : "website-case-video"),
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
  };
}

async function runGenerateCommand(args: string[], io: CliIo): Promise<number> {
  const options = parseCliArgs(args);
  const defaults = {
    goal: options.goal,
    audience: options.audience,
    format: options.format,
    outputType: "case-explainer" as const,
    style: options.style,
    constraints: options.constraints,
    theme: options.theme,
  };
  const result = options.url
    ? await compileWebsiteCaseExplainerProject({
        url: options.url,
        defaults,
        projectName: options.projectName,
      })
    : compileMarkdownCaseExplainerProject({
        markdown: readFileSync(options.input!, "utf8"),
        defaults,
        projectName: options.projectName,
      });
  ensureProjectValidationPassed(result.validationReport);

  const writtenDir = writeVideoProjectPackage(options.outputDir, result.package);

  io.stdout(`Generated video project package at ${writtenDir}`);
  return 0;
}

async function runValidateCommand(args: string[], io: CliIo): Promise<number> {
  const options = parseCliArgs(args);
  const defaults = {
    goal: options.goal,
    audience: options.audience,
    format: options.format,
    outputType: "case-explainer" as const,
    style: options.style,
    constraints: options.constraints,
    theme: options.theme,
  };
  const result = options.url
    ? await compileWebsiteCaseExplainerProject({
        url: options.url,
        defaults,
        projectName: options.projectName,
      })
    : compileMarkdownCaseExplainerProject({
        markdown: readFileSync(options.input!, "utf8"),
        defaults,
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

function getRequiredProjectDir(args: string[]): string {
  return resolve(getRequiredArg(args, "--project-dir"));
}

function collectRuntimePassthroughArgs(
  action: "preview" | "render",
  args: string[],
): string[] {
  const passthroughArgs: string[] = [];
  const port = getOptionalArg(args, "--port");
  const output = getOptionalArg(args, "--output");

  if (action === "preview" && port) {
    passthroughArgs.push("--port", port);
  }

  if (action === "render" && output) {
    passthroughArgs.push("--output", output);
  }

  return passthroughArgs;
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

function runRuntimeDoctorCommand(io: CliIo): number {
  const capabilities = detectHyperframesCapabilities();
  io.stdout(
    [
      "HyperFrames runtime",
      `available: ${capabilities.available}`,
      `binary: ${capabilities.binary}`,
      `version: ${capabilities.version}`,
      `detectedAt: ${capabilities.detectedAt}`,
      `fallbackNotes: ${capabilities.fallbackNotes.join(" | ") || "none"}`,
    ].join("\n"),
  );

  return 0;
}

function runRuntimeActionCommand(
  action: "preview" | "render",
  args: string[],
  io: CliIo,
): number {
  const projectDir = getRequiredProjectDir(args);
  const capabilities = detectHyperframesCapabilities();

  if (!capabilities.available) {
    io.stderr(`HyperFrames runtime is unavailable: ${capabilities.fallbackNotes.join(" | ")}`);
    return 1;
  }

  const runtimeAdapter = createHyperframesRuntimeAdapter();
  const runtimeInfo = loadProjectRuntimeInfo(projectDir);
  const command = runtimeAdapter.buildCommand({
    action,
    packageDirectory: projectDir,
    packageRuntimeInfo: runtimeInfo,
    capabilities,
    passthroughArgs: collectRuntimePassthroughArgs(action, args),
  });
  const result = executeHyperframesCommand({
    command,
  });

  if (!result.success) {
    io.stderr(result.stderr.length > 0 ? result.stderr : `${action} failed: ${result.summary}`);
    return result.exitCode || 1;
  }

  io.stdout(result.stdout.length > 0 ? result.stdout : `${action} completed: ${result.summary}`);
  return 0;
}

function runSyncCapturesCommand(args: string[], io: CliIo): number {
  const projectDir = getRequiredProjectDir(args);
  const result = syncCaptureExecutionProject({
    projectDir,
  });

  io.stdout(
    `Capture sync updated ${result.projectDir}: ${result.availableCount} available, ${result.pendingCount} pending`,
  );
  return 0;
}

async function runCaptureCommand(
  args: string[],
  io: CliIo,
  dependencies: CliDependencies,
): Promise<number> {
  const projectDir = getRequiredProjectDir(args);
  const captureProject = dependencies.captureProject ?? captureWebsiteProject;
  const result = await captureProject({
    projectDir,
  });

  io.stdout(
    `Captured ${result.capturedCount} website assets for ${result.projectDir}: ${result.availableCount} available, ${result.pendingCount} pending`,
  );
  return 0;
}

export async function runCli(
  args: string[],
  io: CliIo = DEFAULT_IO,
  dependencies: CliDependencies = {},
): Promise<number> {
  try {
    const command = getCommandName(args);

    if (command === "init") {
      return runInitCommand(args.slice(1), io);
    }

    if (command === "validate") {
      return await runValidateCommand(args, io);
    }

    if (command === "runtime-doctor") {
      return runRuntimeDoctorCommand(io);
    }

    if (command === "capture") {
      return await runCaptureCommand(args.slice(1), io, dependencies);
    }

    if (command === "sync-captures") {
      return runSyncCapturesCommand(args.slice(1), io);
    }

    if (command === "preview" || command === "render") {
      return runRuntimeActionCommand(command, args.slice(1), io);
    }

    return await runGenerateCommand(args, io);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(message);
    return 1;
  }
}
