import { spawnSync } from "node:child_process";
import type { RuntimeCapabilities } from "./types.js";

interface VersionProbeResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

interface DetectLocalHyperframesCapabilitiesInput {
  binary?: string;
  now?: () => string;
  runner?: (binary: string, args: string[]) => VersionProbeResult;
}

const DEFAULT_BINARY = "hyperframes";
const DEFAULT_SUPPORTED_COMMANDS = ["preview", "lint", "validate", "render"];

function runVersionProbe(binary: string, args: string[]): VersionProbeResult {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error,
  };
}

export function parseHyperframesVersion(output: string): string {
  const normalized = output.trim();

  if (normalized.length === 0) {
    return "unknown";
  }

  const versionMatch = normalized.match(/(\d+\.\d+\.\d+)/);
  return versionMatch?.[1] ?? "unknown";
}

export function createMissingHyperframesCapabilities(input?: {
  binary?: string;
  now?: () => string;
  reason?: string;
}): RuntimeCapabilities {
  const binary = input?.binary ?? DEFAULT_BINARY;
  const detectedAt = input?.now?.() ?? new Date().toISOString();
  const reason = input?.reason ?? `HyperFrames runtime is not installed or not available on PATH for "${binary}".`;

  return {
    available: false,
    binary,
    detectedAt,
    version: "unknown",
    supportedCommands: DEFAULT_SUPPORTED_COMMANDS,
    supportedCatalogFeatures: [],
    supportedRenderOptions: [],
    fallbackNotes: [reason],
  };
}

export function detectLocalHyperframesCapabilities(
  input?: DetectLocalHyperframesCapabilitiesInput,
): RuntimeCapabilities {
  const binary = input?.binary ?? DEFAULT_BINARY;
  const now = input?.now ?? (() => new Date().toISOString());
  const runner = input?.runner ?? runVersionProbe;
  const probeResult = runner(binary, ["--version"]);

  if (probeResult.error || probeResult.status !== 0) {
    const stderr = probeResult.stderr.trim();
    return createMissingHyperframesCapabilities({
      binary,
      now,
      reason:
        stderr.length > 0
          ? `HyperFrames runtime probe failed for "${binary}": ${stderr}`
          : `HyperFrames runtime is not installed or not available on PATH for "${binary}".`,
    });
  }

  return {
    available: true,
    binary,
    detectedAt: now(),
    version: parseHyperframesVersion(probeResult.stdout),
    supportedCommands: DEFAULT_SUPPORTED_COMMANDS,
    supportedCatalogFeatures: [],
    supportedRenderOptions: [],
    fallbackNotes: [],
  };
}
