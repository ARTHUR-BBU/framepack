import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type AgentTarget = "codex" | "claude-code" | "auto";
export type AgentScope = "project";
export type PackageSource = "npm" | "github";

export interface InitAgentOptions {
  cwd?: string;
  target?: AgentTarget;
  scope?: AgentScope;
  packageSource?: PackageSource;
  force?: boolean;
  platform?: NodeJS.Platform;
}

export interface InitAgentResult {
  projectDir: string;
  target: AgentTarget;
  writtenFiles: string[];
}

const MANAGED_START = "<!-- FRAMEPACK MANAGED BLOCK START -->";
const MANAGED_END = "<!-- FRAMEPACK MANAGED BLOCK END -->";

function targetsFor(target: AgentTarget | undefined): Exclude<AgentTarget, "auto">[] {
  if (target === "codex") return ["codex"];
  if (target === "claude-code") return ["claude-code"];
  return ["codex", "claude-code"];
}

function packageCommand(packageSource: PackageSource): string {
  return packageSource === "github" ? "npx -y github:ARTHUR-BBU/framepack" : "npx -y framepack";
}

function writeManagedMarkdown(path: string, title: string, managedContent: string, force: boolean): void {
  const block = `${MANAGED_START}\n${managedContent.trim()}\n${MANAGED_END}\n`;

  if (!existsSync(path)) {
    writeFileSync(path, `${title}\n\n${block}`, "utf8");
    return;
  }

  const current = readFileSync(path, "utf8");
  const start = current.indexOf(MANAGED_START);
  const end = current.indexOf(MANAGED_END);

  if (start !== -1 && end !== -1 && end > start) {
    if (!force) return;
    writeFileSync(path, `${current.slice(0, start)}${block}${current.slice(end + MANAGED_END.length).replace(/^\s*/, "")}`, "utf8");
    return;
  }

  writeFileSync(path, `${current.trimEnd()}\n\n${block}`, "utf8");
}

function stripUtf8Bom(value: string): string {
  return value.replace(/^\uFEFF+/, "");
}

function writeMcpConfig(path: string, framepackConfig: object): void {
  const current = existsSync(path) ? JSON.parse(stripUtf8Bom(readFileSync(path, "utf8"))) as Record<string, unknown> : {};
  const mcpServers = current.mcpServers && typeof current.mcpServers === "object" && !Array.isArray(current.mcpServers)
    ? current.mcpServers as Record<string, unknown>
    : {};

  writeFileSync(
    path,
    `${JSON.stringify({ ...current, mcpServers: { ...mcpServers, framepack: framepackConfig } }, null, 2)}\n`,
    "utf8",
  );
}

function skillPlaybooks(): string {
  return `## Framepack Playbooks

### framepack-director

Use when the user gives fuzzy taste words, a rough idea, or a reference. Translate the request into audience, story structure, visual language, motion language, template route, risks, and acceptance criteria. Explain the current choice in \`HUMAN.md\` before locking a direction.

### framepack-template-fuser

Use when a template, user assets, and user requirements must become a custom video plan. Treat templates as director blueprints, not finished videos. Keep user assets and intent as source of truth, then write the adapted scene rhythm, Catalog candidates, copy roles, and acceptance criteria into \`COMPOSITION.md\`.

### framepack-hyperframes-builder

Use when turning \`COMPOSITION.md\` into HyperFrames code. Keep the first frame visible, switch scenes with \`tl.set()\`, register timelines on \`window.__timelines\`, avoid multiple animation engines on one element, then run lint, inspect, and snapshot checks before final render.

### framepack-reference-miner

Use when the user provides a finished video, reference video, or wants to turn a result into a reusable template. Extract the structure into \`VIDEO_DNA.md\`, convert reusable production rules into \`TEMPLATE_BLUEPRINT.md\`, then update \`DIRECTION.md\` and \`COMPOSITION.md\` from that blueprint.`;
}

function codexSkill(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `---
name: framepack
description: Use Framepack when a user wants a polished HyperFrames or Remotion video from vague creative intent, assets, references, or prompt/composition work.
---

# Framepack Codex Skill

Use Framepack when the user asks for video creative work, asset-to-video planning, HyperFrames or Remotion composition, more polish, more motion, a business-looking video, a game-style ad, or a result inspired by a reference.

## Trigger

If the user says things like cool, premium, business, dynamic, polished, bigger text, faster, more animated, or like this reference, call Framepack instead of asking the user to name libraries or templates.

## Workflow

1. Prefer the MCP server. If unavailable, inspect \`${command} mcp --describe\`.
2. Create the workbench with \`${command} create --idea "<idea>" --assets <dir> --output-dir <dir>\`.
3. Read \`FRAMEPACK.md\` first, then \`ASSETS.md\`, \`DIRECTION.md\`, \`COMPOSITION.md\`, and \`ITERATIONS.md\`.
4. Translate fuzzy user taste into concrete visual language, motion language, template route, and HyperFrames/Remotion implementation choices.
5. Keep project state in the workbench files; do not rely on model memory.
6. Use HyperFrames-safe rules: CSS first frame visible, scene switches with \`tl.set()\`, one animation engine per element, and timeline registration on \`window.__timelines\`.

${skillPlaybooks()}
`;
}

function codexInstall(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `# Install Framepack With Codex

Ask Codex:

\`\`\`text
Read the Framepack project instructions, install Framepack for this project, configure the MCP server, then create a workbench from my idea and assets.
\`\`\`

Agent checklist:

1. Install or use Framepack with \`${command}\`.
2. Verify \`${command} mcp --describe\`.
3. Create a workbench with \`${command} create --idea "<idea>" --assets <dir> --output-dir <dir>\`.
4. Read \`FRAMEPACK.md\` and continue from the workbench files.
5. Use \`framepack workbench brief --project-dir <dir>\` when the user needs a plain-language progress recap.
6. Use MCP/CLI only when files need to be created, inspected, or refreshed.
`;
}

function codexAgentsBlock(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `## Framepack Agent Workflow

Framepack is installed as an agent-native video creative workbench for this project.

- Trigger Framepack for vague video requests, asset-to-video work, HyperFrames/Remotion composition, template selection, or polish direction.
- Prefer MCP tools over memorized shell commands; check \`${command} mcp --describe\` if MCP is not connected.
- Create workbenches with \`${command} create --idea "<idea>" --assets <dir> --output-dir <dir>\`.
- Start every Framepack project by reading \`FRAMEPACK.md\`.
- Use \`HUMAN.md\`, \`ASSETS.md\`, \`STYLE.md\`, \`DIRECTION.md\`, \`COMPOSITION.md\`, and \`ITERATIONS.md\` as durable context. Do not rely on model memory.
- Recommend animation libraries, templates, game-asset tools, HyperFrames, or Remotion only when the current project needs them.

${skillPlaybooks()}
`;
}

function claudeInstructions(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `# Framepack Claude Code Instructions

Framepack is available through the project MCP server.

Use Framepack when the user asks for a polished video, HyperFrames or Remotion composition, asset-to-video planning, template selection, or vague creative improvements such as cooler, more business, more dynamic, bigger text, faster pacing, or like this reference.

Suggested flow:

1. Create a workbench with \`${command} create --idea "<idea>" --assets <dir> --output-dir <dir>\`.
2. Read \`FRAMEPACK.md\`, then \`HUMAN.md\`, \`ASSETS.md\`, \`STYLE.md\`, \`DIRECTION.md\`, \`COMPOSITION.md\`, and \`ITERATIONS.md\`.
3. Translate fuzzy user intent into concrete visual language, motion language, template route, and implementation plan.
4. Use HyperFrames-safe rules: CSS first frame visible, scene switches with \`tl.set()\`, one animation engine per element, and timeline registration on \`window.__timelines\`.
5. Record render feedback and next actions in \`ITERATIONS.md\`.
6. Use \`framepack workbench brief --project-dir <dir>\` when the user needs a plain-language progress recap.

${skillPlaybooks()}

Fallback command surface: \`${command} mcp --describe\`.
`;
}

function createMcpServerConfig(packageSource: PackageSource, platform: NodeJS.Platform): object {
  if (packageSource === "github") {
    return { command: "npx", args: ["-y", "github:ARTHUR-BBU/framepack", "mcp"] };
  }

  if (platform === "win32") {
    return { command: "cmd", args: ["/c", "npx", "-y", "framepack", "mcp"] };
  }

  return { command: "npx", args: ["-y", "framepack", "mcp"] };
}

export function initAgentProject(options: InitAgentOptions = {}): InitAgentResult {
  const projectDir = resolve(options.cwd ?? process.cwd());
  const target = options.target ?? "auto";
  const packageSource = options.packageSource ?? "npm";
  const platform = options.platform ?? process.platform;
  const force = options.force ?? false;
  const writtenFiles: string[] = [];

  mkdirSync(projectDir, { recursive: true });

  if (targetsFor(target).includes("codex")) {
    const agentDir = join(projectDir, ".framepack", "agent", "codex");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "SKILL.md"), codexSkill(packageSource), "utf8");
    writeFileSync(join(agentDir, "INSTALL.md"), codexInstall(packageSource), "utf8");
    writeManagedMarkdown(join(projectDir, "AGENTS.md"), "# Project Agent Guide", codexAgentsBlock(packageSource), force);
    writtenFiles.push("AGENTS.md", ".framepack/agent/codex/SKILL.md", ".framepack/agent/codex/INSTALL.md");
  }

  if (targetsFor(target).includes("claude-code")) {
    writeManagedMarkdown(join(projectDir, "CLAUDE.md"), "# Claude Code Project Guide", claudeInstructions(packageSource), force);
    writeMcpConfig(join(projectDir, ".mcp.json"), createMcpServerConfig(packageSource, platform));
    writtenFiles.push("CLAUDE.md", ".mcp.json");
  }

  return { projectDir, target, writtenFiles };
}
