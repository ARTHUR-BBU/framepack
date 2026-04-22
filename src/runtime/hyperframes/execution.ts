import { spawnSync } from "node:child_process";
import type { HyperframesCommandSpec, RuntimeExecutionResult } from "./types.js";

interface ExecutionProbeResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

function runCommand(
  command: HyperframesCommandSpec,
  args: string[],
): ExecutionProbeResult {
  const result = spawnSync(command.executable, args, {
    cwd: command.cwd,
    encoding: "utf8",
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
  };
}

export function executeHyperframesCommand(input: {
  command: HyperframesCommandSpec;
  runner?: (command: HyperframesCommandSpec, args: string[]) => ExecutionProbeResult;
}): RuntimeExecutionResult {
  const runner = input.runner ?? runCommand;
  const result = runner(input.command, input.command.args);
  const exitCode = result.status ?? 1;
  const stderr = result.error ? `${result.stderr}${result.error.message}` : result.stderr;

  return {
    action: input.command.action,
    success: exitCode === 0,
    outputPaths: [],
    warnings: [],
    summary: input.command.summary,
    exitCode,
    stdout: result.stdout,
    stderr,
  };
}
