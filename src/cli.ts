import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
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

export function parseCliArgs(args: string[]): CliOptions {
  const input = getRequiredArg(args, "--input");
  const outputDir = getRequiredArg(args, "--output-dir");
  const goal = getRequiredArg(args, "--goal");
  const audience = getRequiredArg(args, "--audience");
  const format = (getOptionalArg(args, "--format") ?? "16:9") as "16:9" | "9:16";

  if (format !== "16:9" && format !== "9:16") {
    throw new Error("Invalid --format value. Use 16:9 or 9:16.");
  }

  return {
    input,
    outputDir,
    goal,
    audience,
    projectName: getOptionalArg(args, "--project-name") ?? deriveProjectName(input),
    format,
  };
}

export function runCli(args: string[], io: CliIo = DEFAULT_IO): number {
  try {
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
