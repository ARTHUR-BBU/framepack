import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
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
      "- npx framepack --version",
      "- npx framepack --help",
      "- npx framepack mcp --describe",
      "- npx framepack atlas --json",
      "- npx framepack atlas recommend --json",
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

  const installedVersion = runFramepack("version", ["--version"]).trim();
  if (installedVersion !== "0.4.0-alpha.3") {
    throw new Error(`Installed CLI version mismatch: ${installedVersion}`);
  }

  const installedHelp = runFramepack("help", ["--help"]);
  if (
    !installedHelp.includes("Framepack CLI") ||
    !installedHelp.includes("npx -y -p framepack@alpha framepack --version") ||
    !installedHelp.includes("npx -y -p framepack@alpha framepack --help") ||
    !installedHelp.includes("npm exec --yes --package=framepack@alpha -- framepack mcp --describe")
  ) {
    throw new Error("Installed CLI help is missing first-run guidance");
  }

  const mcpSurface = runFramepack("mcp-describe", ["mcp", "--describe"]);
  if (
    !mcpSurface.includes("releaseSmoke") ||
    !mcpSurface.includes("recommendPacks") ||
    !mcpSurface.includes("listCapabilityAtlas") ||
    !mcpSurface.includes("framepack://capabilities/atlas")
  ) {
    throw new Error("Installed MCP surface is missing releaseSmoke, recommendPacks, or capability atlas entries");
  }

  const atlas = parseJsonOutput("parse-atlas-json", runFramepack("atlas-json", ["atlas", "--json"]));
  if (!atlas.capabilityAtlas?.nodes?.some((node) => node.id === "library.animejs")) {
    throw new Error(`Installed atlas is missing Anime.js: ${JSON.stringify(atlas)}`);
  }

  const atlasRecommendation = parseJsonOutput(
    "parse-atlas-recommend-json",
    runFramepack("atlas-recommend", [
      "atlas",
      "recommend",
      "--workflow-pack",
      "game-ad-sprite-video",
      "--creative-direction-pack",
      "game-ad-retro-arcade",
      "--output-type",
      "game-ad",
      "--format",
      "9:16",
      "--json",
    ]),
  );
  if (atlasRecommendation.stack?.id !== "game-ad-sprite-video-stack") {
    throw new Error(`Installed atlas recommendation did not return game-ad stack: ${JSON.stringify(atlasRecommendation)}`);
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
  const videoBrief = parseJsonOutput(
    "parse-generated-video-brief",
    readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"),
  );
  checks.push({
    id: "read-generated-video-brief",
    status: "passed",
    command: "read generated VIDEO_BRIEF.json",
  });

  if (status.protocolStatus !== "passed") {
    throw new Error(`Installed package protocol did not pass: ${JSON.stringify(status)}`);
  }

  if (videoBrief.capabilityStackSelection?.id !== "game-ad-sprite-video-stack") {
    throw new Error(`Generated package is missing capabilityStackSelection: ${JSON.stringify(videoBrief)}`);
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
