import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCaseExplainerVideoProject } from "./video/index.js";
import { writeVideoProjectPackage } from "./video/package/project-package.js";

interface CliIo {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

interface CliOptions {
  input: string;
  outputDir: string;
  goal: string;
  audience: string;
  projectName: string;
  format: "16:9" | "9:16";
}

type CliCommandName = "init" | "generate" | "validate";

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

function deriveProjectName(inputPath: string): string {
  const extension = extname(inputPath);
  return basename(inputPath, extension);
}

function getCommandName(args: string[]): CliCommandName {
  const [command] = args;

  if (command === "init" || command === "generate" || command === "validate") {
    return command;
  }

  throw new Error("Missing or invalid command. Use init, generate, or validate.");
}

function getCommandArgs(args: string[]): string[] {
  const [first] = args;

  if (first === "init" || first === "generate" || first === "validate") {
    return args.slice(1);
  }

  return args;
}

export function parseCliArgs(args: string[]): CliOptions {
  const commandArgs = getCommandArgs(args);
  const input = getRequiredArg(commandArgs, "--input");
  const outputDir = getRequiredArg(commandArgs, "--output-dir");
  const goal = getRequiredArg(commandArgs, "--goal");
  const audience = getRequiredArg(commandArgs, "--audience");
  const format = (getOptionalArg(commandArgs, "--format") ?? "16:9") as "16:9" | "9:16";

  if (format !== "16:9" && format !== "9:16") {
    throw new Error("Invalid --format value. Use 16:9 or 9:16.");
  }

  return {
    input,
    outputDir,
    goal,
    audience,
    projectName: getOptionalArg(commandArgs, "--project-name") ?? deriveProjectName(input),
    format,
  };
}

function runGenerateCommand(args: string[], io: CliIo): number {
  const options = parseCliArgs(args);
  const markdown = readFileSync(options.input, "utf8");

  const result = buildCaseExplainerVideoProject({
    inputType: "markdown",
    markdown,
    defaults: {
      goal: options.goal,
      audience: options.audience,
      format: options.format,
      outputType: "case-explainer",
    },
    projectName: options.projectName,
  });

  const writtenDir = writeVideoProjectPackage(options.outputDir, result.package);

  io.stdout(`Generated video project package at ${writtenDir}`);
  return 0;
}

function runValidateCommand(args: string[], io: CliIo): number {
  const options = parseCliArgs(args);
  const markdown = readFileSync(options.input, "utf8");

  const result = buildCaseExplainerVideoProject({
    inputType: "markdown",
    markdown,
    defaults: {
      goal: options.goal,
      audience: options.audience,
      format: options.format,
      outputType: "case-explainer",
    },
    projectName: options.projectName,
  });

  io.stdout(
    `Validation passed for ${options.projectName} with ${result.scenePlan.scenes.length} scenes.`,
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

export function runCli(args: string[], io: CliIo = DEFAULT_IO): number {
  try {
    const command = getCommandName(args);

    if (command === "init") {
      return runInitCommand(args.slice(1), io);
    }

    if (command === "validate") {
      return runValidateCommand(args, io);
    }

    return runGenerateCommand(args, io);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    io.stderr(message);
    return 1;
  }
}

const isDirectExecution =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  process.exitCode = runCli(process.argv.slice(2));
}
