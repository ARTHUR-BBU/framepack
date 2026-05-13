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
  target: Exclude<AgentTarget, "auto">;
  writtenFiles: string[];
}

const MANAGED_START = "<!-- FRAMEPACK MANAGED BLOCK START -->";
const MANAGED_END = "<!-- FRAMEPACK MANAGED BLOCK END -->";

function resolveTarget(target: AgentTarget | undefined): Exclude<AgentTarget, "auto"> {
  if (target === "claude-code") {
    return "claude-code";
  }

  return "codex";
}

function packageCommand(packageSource: PackageSource): string {
  return packageSource === "github"
    ? "npx -y github:ARTHUR-BBU/framepack"
    : "npx -y framepack";
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
    if (!force) {
      return;
    }

    const next = `${current.slice(0, start)}${block}${current.slice(end + MANAGED_END.length).replace(/^\s*/, "")}`;
    writeFileSync(path, next, "utf8");
    return;
  }

  writeFileSync(path, `${current.trimEnd()}\n\n${block}`, "utf8");
}

function codexSkill(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `---
name: framepack
description: Use Framepack to compile content into executable video project packages for agents and HyperFrames.
---

# Framepack Codex Skill

Use Framepack when the user asks for a video project package, case explainer, thread video, website video, game-style ad, or HyperFrames-ready project.

## Workflow

1. Prefer the Framepack MCP server. If it is not configured, run \`${command} mcp --describe\` to inspect the surface.
2. Use \`generateProject\` to create the package.
3. Use \`getStatus\` and \`validatePackage\` immediately after generation.
4. Read \`readiness\` and \`nextActionItems\`; do not parse human status text.
5. If \`readiness\` is \`needs-assets\`, use \`captureAssets\` for source captures or inspect forge tasks for manual/custom/skill-backed production.
6. If the package is ready, run \`runtimeLint\`; run \`runtimeSnapshot\` when visual evidence is useful.

For game-ad packages, read \`FORGE_TASKS.md\`. For agent-sprite-forge tasks, use $generate2dsprite for character, sprite, prop, and FX packs, and $generate2dmap for maps when those skills are installed. Do not auto-install external forge skills.
`;
}

function codexInstall(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `# Install Framepack With Codex

Ask Codex:

\`\`\`text
Read the Framepack repository or project instructions, install Framepack for this project, configure the Framepack MCP server, then generate and validate a video project package from my content.
\`\`\`

Agent checklist:

1. Install or use Framepack with \`${command}\`.
2. Verify \`${command} mcp --describe\`.
3. Generate a package with the Framepack MCP \`generateProject\` tool.
4. Run \`getStatus\` and \`validatePackage\`.
5. Continue from \`nextActionItems\`.
`;
}

function codexAgentsBlock(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `## Framepack Agent Workflow

Framepack is installed as an agent-native video project compiler for this project.

- Prefer MCP tools over memorized shell commands.
- Start by checking \`${command} mcp --describe\` if MCP is not already connected.
- For content-to-video requests, generate a package, then run status and validation.
- Treat \`readiness\` as the phase gate: \`blocked\`, \`needs-assets\`, \`needs-runtime\`, or \`ready\`.
- Use \`nextActionItems\` for dispatch.
- For game-ad packages, inspect \`FORGE_TASKS.md\` and preserve backend-neutral forge contracts.
`;
}

function claudeInstructions(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `# Framepack Claude Code Preview

Framepack is available through the project MCP server.

Use Framepack when the user asks to turn markdown, threads, websites, or product descriptions into executable video project packages.

Suggested flow:

1. Use the Framepack MCP \`generateProject\` tool.
2. Use \`getStatus\` and \`validatePackage\`.
3. Follow \`nextActionItems\`.
4. Use \`runtimeLint\` and \`runtimeSnapshot\` before preview or render.

Fallback command surface: \`${command} mcp --describe\`.
`;
}

function createMcpConfig(packageSource: PackageSource, platform: NodeJS.Platform): object {
  if (packageSource === "github") {
    return {
      mcpServers: {
        framepack: {
          command: "npx",
          args: ["-y", "github:ARTHUR-BBU/framepack", "mcp"],
        },
      },
    };
  }

  if (platform === "win32") {
    return {
      mcpServers: {
        framepack: {
          command: "cmd",
          args: ["/c", "npx", "-y", "framepack", "mcp"],
        },
      },
    };
  }

  return {
    mcpServers: {
      framepack: {
        command: "npx",
        args: ["-y", "framepack", "mcp"],
      },
    },
  };
}

export function initAgentProject(options: InitAgentOptions = {}): InitAgentResult {
  const projectDir = resolve(options.cwd ?? process.cwd());
  const target = resolveTarget(options.target);
  const packageSource = options.packageSource ?? "npm";
  const platform = options.platform ?? process.platform;
  const force = options.force ?? false;
  const writtenFiles: string[] = [];

  mkdirSync(projectDir, { recursive: true });

  if (target === "codex") {
    const agentDir = join(projectDir, ".framepack", "agent", "codex");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "SKILL.md"), codexSkill(packageSource), "utf8");
    writeFileSync(join(agentDir, "INSTALL.md"), codexInstall(packageSource), "utf8");
    writeManagedMarkdown(join(projectDir, "AGENTS.md"), "# Project Agent Guide", codexAgentsBlock(packageSource), force);
    writtenFiles.push("AGENTS.md", ".framepack/agent/codex/SKILL.md", ".framepack/agent/codex/INSTALL.md");
  }

  if (target === "claude-code") {
    writeManagedMarkdown(join(projectDir, "CLAUDE.md"), "# Claude Code Project Guide", claudeInstructions(packageSource), force);
    writeFileSync(join(projectDir, ".mcp.json"), `${JSON.stringify(createMcpConfig(packageSource, platform), null, 2)}\n`, "utf8");
    writtenFiles.push("CLAUDE.md", ".mcp.json");
  }

  return {
    projectDir,
    target,
    writtenFiles,
  };
}
