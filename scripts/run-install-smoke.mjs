import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const keepOutput = process.argv.includes("--keep");
const tempRoot = mkdtempSync(join(tmpdir(), "framepack-install-smoke-"));
const appDir = join(tempRoot, "consumer");
const packDir = join(tempRoot, "pack");
const outDir = join(appDir, "out");
const checks = [];

function commandName(name) {
  return name;
}

function runStep(id, commandLabel, cwd, command, args, options = {}) {
  try {
    const stdout = execFileSync(command, args, {
      cwd,
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    checks.push({
      id,
      status: "passed",
      command: commandLabel,
    });

    return stdout;
  } catch (error) {
    checks.push({
      id,
      status: "failed",
      command: commandLabel,
      error: error instanceof Error ? error.message : String(error),
      stdout: typeof error.stdout === "string" ? error.stdout : undefined,
      stderr: typeof error.stderr === "string" ? error.stderr : undefined,
    });
    throw error;
  }
}

function runFramepack(id, args) {
  return runStep(
    id,
    `npx framepack ${args.join(" ")}`,
    appDir,
    commandName("npm"),
    ["exec", "--", "framepack", ...args],
  );
}

function parseJsonOutput(id, value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    checks.push({
      id,
      status: "failed",
      command: "parse JSON output",
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

try {
  mkdirSync(packDir, { recursive: true });
  const npm = commandName("npm");
  const packJson = runStep(
    "npm-pack",
    "npm pack --pack-destination <temp> --json",
    repoRoot,
    npm,
    ["pack", "--pack-destination", packDir, "--json"],
  );
  const packResult = parseJsonOutput("parse-pack-json", packJson);
  const tarball = join(packDir, packResult[0].filename);

  if (!existsSync(tarball)) {
    throw new Error(`Packed tarball was not found: ${tarball}`);
  }

  writeFileSync(
    join(tempRoot, "consumer-package.json"),
    `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(tempRoot, "README.md"),
    [
      "Framepack install smoke workspace.",
      "Commands covered:",
      "- npm pack",
      "- npm install",
      "- npx framepack mcp --describe",
      "- npx framepack release-smoke --json",
      "- npx framepack generate --auto-pack",
      "- npx framepack validate",
      "- npx framepack status --json",
    ].join("\n"),
    "utf8",
  );

  mkdirSync(appDir, { recursive: true });
  renameSync(join(tempRoot, "consumer-package.json"), join(appDir, "package.json"));

  runStep(
    "npm-install",
    `npm install ${basename(tarball)} --no-audit --no-fund`,
    appDir,
    npm,
    ["install", tarball, "--no-audit", "--no-fund"],
  );

  const mcpSurface = runFramepack("mcp-describe", ["mcp", "--describe"]);
  if (!mcpSurface.includes("releaseSmoke") || !mcpSurface.includes("recommendPacks")) {
    throw new Error("Installed MCP surface is missing releaseSmoke or recommendPacks");
  }

  const releaseSmoke = parseJsonOutput(
    "parse-release-smoke-json",
    runFramepack("release-smoke", ["release-smoke", "--output-dir", join(outDir, "release-smoke"), "--json"]),
  );
  if (releaseSmoke.status !== "passed") {
    throw new Error(`Installed release-smoke failed: ${JSON.stringify(releaseSmoke)}`);
  }

  runFramepack("generate-auto-pack", [
    "generate",
    "--game-ad-description",
    "A course that teaches founders to ship agent-native video systems.",
    "--output-dir",
    outDir,
    "--goal",
    "Promote the course",
    "--audience",
    "Founders",
    "--project-name",
    "sprite-video-demo",
    "--format",
    "9:16",
    "--auto-pack",
  ]);

  const projectDir = join(outDir, "sprite-video-demo");
  runFramepack("validate-package", ["validate", "--project-dir", projectDir]);
  const status = parseJsonOutput("parse-status-json", runFramepack("status-json", ["status", "--project-dir", projectDir, "--json"]));

  if (status.protocolStatus !== "passed") {
    throw new Error(`Installed package protocol did not pass: ${JSON.stringify(status)}`);
  }

  const report = {
    status: "passed",
    tempRoot,
    tarball,
    installedPackage: "framepack",
    generatedProjectDir: projectDir,
    checks,
  };

  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  const report = {
    status: "failed",
    tempRoot,
    error: error instanceof Error ? error.message : String(error),
    checks,
  };

  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} finally {
  if (!keepOutput && process.exitCode !== 1) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
