import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function main() {
  if (process.env.FRAMEPACK_SKIP_AGENT_INSTALL === "1") return;

  let projectDir = process.env.INIT_CWD;
  if (!projectDir) {
    const cwd = process.cwd();
    if (!cwd.includes("node_modules")) {
      projectDir = cwd;
    }
  }
  if (!projectDir || projectDir.includes("node_modules")) return;

  const distPath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist", "agent", "init-agent.js");
  if (!existsSync(distPath)) return;

  const { initAgentProject } = await import(pathToFileURL(distPath).href);
  const result = initAgentProject({
    cwd: projectDir,
    target: "auto",
    packageSource: "npm",
    force: true,
    platform: process.platform,
  });

  const version = result.writtenFiles.length > 0 ? "0.5.0-alpha.9" : "unknown";
  const skills = result.writtenFiles.filter((f) => f.includes("SKILL.md")).map((f) => f.split("/").slice(-2)[0]);
  const hasMcp = result.writtenFiles.some((f) => f.includes(".mcp.json"));
  const hasClaude = result.writtenFiles.some((f) => f.includes("CLAUDE.md"));
  const hasAgents = result.writtenFiles.some((f) => f.includes("AGENTS.md"));

  console.log([
    "",
    `Framepack ${version} installed!`,
    "",
    `  Skills: ${skills.join(", ") || "none"}`,
    hasMcp ? "  MCP: .mcp.json" : null,
    hasClaude ? "  Agent guide: CLAUDE.md" : null,
    hasAgents ? "  Agent guide: AGENTS.md" : null,
    "",
    "  Next: restart Claude Code to activate skills.",
    '  Quick start: npx framepack create --idea "your video idea" --assets ./assets --output-dir ./out',
    "",
  ].filter(Boolean).join("\n"));
}

main().catch((error) => {
  console.warn(`Framepack agent workflow install skipped: ${error instanceof Error ? error.message : String(error)}`);
});
