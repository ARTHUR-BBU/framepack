import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

async function main() {
  if (process.env.FRAMEPACK_SKIP_AGENT_INSTALL === "1") return;

  const projectDir = process.env.INIT_CWD;
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

  console.log(`Framepack agent workflow installed in ${result.projectDir}`);
}

main().catch((error) => {
  console.warn(`Framepack agent workflow install skipped: ${error instanceof Error ? error.message : String(error)}`);
});
