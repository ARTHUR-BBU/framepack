import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const pkgPath = resolve(scriptDir, "..", "package.json");
  const version = JSON.parse(readFileSync(pkgPath, "utf8")).version ?? "unknown";

  // Check HyperFrames availability.
  let hfStatus = "\x1b[33mnot found\x1b[0m — install with: \x1b[1mnpm install hyperframes\x1b[0m";
  try {
    const hfOut = execSync("npx hyperframes --version 2>/dev/null", { encoding: "utf8", timeout: 15000 }).trim();
    if (hfOut) hfStatus = `\x1b[32m${hfOut}\x1b[0m`;
  } catch {}

  // Always print a welcome message so the user knows Framepack was installed.
  console.log([
    "",
    `\x1b[1m\x1b[36mFramepack ${version}\x1b[0m installed!`,
    "",
    "  HyperFrames: " + hfStatus,
    "",
    "  Quick start:",
    '    npx framepack create --idea "your video idea" --assets ./assets --output-dir ./out',
    "    npx framepack workbench brief --project-dir ./out/<project-name>",
    "    npx framepack catalog install   # batch-install Catalog components",
    "",
    "  Docs: https://github.com/ARTHUR-BBU/framepack",
    "",
  ].join("\n"));

  if (process.env.FRAMEPACK_SKIP_AGENT_INSTALL === "1") return;

  // Try to install agent workflow files in the project directory.
  let projectDir = process.env.INIT_CWD;
  if (!projectDir) {
    const cwd = process.cwd();
    if (!cwd.includes("node_modules")) {
      projectDir = cwd;
    }
  }
  if (!projectDir || projectDir.includes("node_modules")) return;

  const distPath = resolve(scriptDir, "..", "dist", "agent", "init-agent.js");
  if (!existsSync(distPath)) return;

  const { initAgentProject } = await import(pathToFileURL(distPath).href);
  const result = initAgentProject({
    cwd: projectDir,
    target: "auto",
    packageSource: "npm",
    force: true,
    platform: process.platform,
  });
  const skills = result.writtenFiles.filter((f) => f.includes("SKILL.md")).map((f) => f.split("/").slice(-2)[0]);
  const hasMcp = result.writtenFiles.some((f) => f.includes(".mcp.json"));

  if (skills.length > 0 || hasMcp) {
    console.log([
      `  Agent files: ${result.writtenFiles.length} written`,
      `  Skills: ${skills.join(", ")}`,
      hasMcp ? "  MCP: .mcp.json" : null,
      "  Restart your coding agent to activate skills.",
      "",
    ].filter(Boolean).join("\n"));
  }
}

main().catch((error) => {
  console.warn(`Framepack agent workflow install skipped: ${error instanceof Error ? error.message : String(error)}`);
});
