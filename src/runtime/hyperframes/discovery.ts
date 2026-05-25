import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { RuntimeCapabilities } from "./types.js";

interface VersionProbeResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

interface DetectLocalHyperframesCapabilitiesInput {
  binary?: string;
  cwd?: string;
  now?: () => string;
  exists?: (candidate: string) => boolean;
  platform?: NodeJS.Platform;
  runner?: (binary: string, args: string[]) => VersionProbeResult;
}

const DEFAULT_BINARY = "hyperframes";
const DEFAULT_SUPPORTED_COMMANDS = [
  "preview",
  "lint",
  "validate",
  "render",
  "inspect",
  "snapshot",
  "upgrade",
  "skills",
  "capture",
  "remove-background",
];
const DEFAULT_SUPPORTED_RENDER_OPTIONS = [
  "format",
  "fps",
  "quality",
  "workers",
  "docker",
  "hdr",
  "crf",
  "video-bitrate",
  "gpu",
  "quiet",
  "strict",
  "strict-all",
  "max-concurrent-renders",
];

function quoteWindowsCommandArg(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function resolveHyperframesBinary(input?: {
  binary?: string;
  cwd?: string;
  exists?: (candidate: string) => boolean;
  platform?: NodeJS.Platform;
}): string {
  const binary = input?.binary ?? DEFAULT_BINARY;
  const cwd = input?.cwd ?? process.cwd();
  const exists = input?.exists ?? existsSync;
  const platform = input?.platform ?? process.platform;
  const candidates =
    platform === "win32"
      ? [
          join(cwd, "node_modules", ".bin", `${binary}.cmd`),
          join(cwd, "node_modules", ".bin", `${binary}.ps1`),
          join(cwd, "node_modules", ".bin", binary),
        ]
      : [join(cwd, "node_modules", ".bin", binary)];

  return candidates.find((candidate) => exists(candidate)) ?? binary;
}

function runVersionProbe(binary: string, args: string[]): VersionProbeResult {
  const isWindowsCmd = process.platform === "win32" && binary.toLowerCase().endsWith(".cmd");
  const result = isWindowsCmd
    ? spawnSync([quoteWindowsCommandArg(binary), ...args.map(quoteWindowsCommandArg)].join(" "), {
        encoding: "utf8",
        shell: true,
      })
    : spawnSync(binary, args, {
        encoding: "utf8",
        shell: false,
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
    supportedRenderOptions: DEFAULT_SUPPORTED_RENDER_OPTIONS,
    fallbackNotes: [reason],
  };
}

export function detectLocalHyperframesCapabilities(
  input?: DetectLocalHyperframesCapabilitiesInput,
): RuntimeCapabilities {
  const binary = resolveHyperframesBinary({
    binary: input?.binary,
    cwd: input?.cwd,
    exists: input?.exists,
    platform: input?.platform,
  });
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
    supportedRenderOptions: DEFAULT_SUPPORTED_RENDER_OPTIONS,
    fallbackNotes: [],
  };
}
