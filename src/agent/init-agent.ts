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

interface ProjectSkill {
  name: string;
  description: string;
  body: string;
}

const PROJECT_SKILLS: ProjectSkill[] = [
  {
    name: "framepack-director",
    description: "Use when a user gives fuzzy video taste words, rough creative intent, reference direction, or asks for a better HyperFrames or Remotion video concept.",
    body: `# Framepack Director

Turn fuzzy user language into a professional video direction before implementation.

## Workflow

1. Read \`FRAMEPACK.md\`, \`HUMAN.md\`, \`STYLE.md\`, and \`DIRECTION.md\` if they exist.
2. Translate ordinary phrases like more business, cooler, faster, bigger text, more animated, cinematic, or like this reference into structure, visual language, motion language, risk, and acceptance criteria.
3. Keep the user's business goal and assets as the source of truth.
4. Write or update the plain-language explanation in \`HUMAN.md\`.
5. Write or update the professional direction in \`DIRECTION.md\`.

## Output

- A clear video structure.
- A user-readable decision point.
- Specific visual and motion language an agent can execute.`,
  },
  {
    name: "framepack-template-fuser",
    description: "Use when user assets, workflow templates, HyperFrames prompt templates, Catalog candidates, or style requirements must become a custom composition plan.",
    body: `# Framepack Template Fuser

Fuse templates with user assets and requirements. Templates are director blueprints, not finished videos.

## Workflow

1. Read \`FRAMEPACK.md\`, \`ASSETS.md\`, \`DIRECTION.md\`, \`STYLE.md\`, and \`COMPOSITION.md\`.
2. Preserve user assets, offer, proof, audience, and CTA as the source of truth.
3. Use the selected HyperFrames prompt template for scene rhythm, Catalog candidates, motion rules, and QA checks.
4. Replace generic template copy with user-specific content.
5. Write the result into \`COMPOSITION.md\` under \`Template Fusion Plan\`.

## Output

- A custom scene plan.
- Catalog candidates with install commands treated as optional.
- Acceptance criteria for the fused composition.`,
  },
  {
    name: "framepack-hyperframes-builder",
    description: "Use when turning a Framepack composition plan into HyperFrames code, debugging HyperFrames output, or preparing lint, inspect, snapshot, and render checks.",
    body: `# Framepack HyperFrames Builder

Turn \`COMPOSITION.md\` into HyperFrames code without breaking render safety.

## Workflow

1. Read \`FRAMEPACK.md\`, \`COMPOSITION.md\`, \`ASSETS.md\`, and \`ITERATIONS.md\`.
2. Keep the first frame visible in CSS before JavaScript animation runs.
3. Register timelines on \`window.__timelines\`.
4. Use \`tl.set()\` for scene switches.
5. Do not drive the same element with multiple animation engines.
6. Run \`npx hyperframes lint\`, \`npx hyperframes inspect\`, and snapshot checks before final render when HyperFrames is available.
7. Record render feedback and next actions in \`ITERATIONS.md\`.

## Output

- HyperFrames-safe composition code.
- Verification notes tied to visible frames and readable text.`,
  },
  {
    name: "framepack-reference-miner",
    description: "Use when a user provides a finished video, reference video, competitor example, or wants to turn an existing result into a reusable Framepack or HyperFrames template.",
    body: `# Framepack Reference Miner

Extract reusable video structure from a reference or finished render.

## Workflow

1. Read \`FRAMEPACK.md\` and any existing \`DIRECTION.md\`, \`COMPOSITION.md\`, and \`ITERATIONS.md\`.
2. Identify hook, scene rhythm, pacing, typography, camera motion, transitions, proof devices, CTA, and visual rules.
3. Write the observed structure into \`VIDEO_DNA.md\`.
4. Convert reusable production rules into \`TEMPLATE_BLUEPRINT.md\`.
5. Update \`DIRECTION.md\` and \`COMPOSITION.md\` only after the blueprint is clear.

## Output

- \`VIDEO_DNA.md\` for reference analysis.
- \`TEMPLATE_BLUEPRINT.md\` for reusable template logic.
- A short user-facing explanation of what was borrowed and what was changed.`,
  },
];

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

function skillMarkdown(skill: ProjectSkill): string {
  return `---
name: ${skill.name}
description: ${skill.description}
---

${skill.body}
`;
}

function writeProjectSkills(rootDir: string, prefix: string): string[] {
  return PROJECT_SKILLS.map((skill) => {
    const relativePath = join(prefix, skill.name, "SKILL.md").replace(/\\/g, "/");
    const skillDir = join(rootDir, prefix, skill.name);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), skillMarkdown(skill), "utf8");
    return relativePath;
  });
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
- Project skills are installed under \`.framepack/agent/codex/skills\`; use the matching Framepack skill when the task is director work, template fusion, HyperFrames building, or reference mining.

${skillPlaybooks()}
`;
}

function claudeInstructions(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `# Framepack Claude Code Instructions

Framepack is available through the project MCP server.

Project skills are installed under \`.claude/skills\`. Use \`framepack-director\`, \`framepack-template-fuser\`, \`framepack-hyperframes-builder\`, and \`framepack-reference-miner\` when the task matches their descriptions.

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
    const skillFiles = writeProjectSkills(projectDir, join(".framepack", "agent", "codex", "skills"));
    writeManagedMarkdown(join(projectDir, "AGENTS.md"), "# Project Agent Guide", codexAgentsBlock(packageSource), force);
    writtenFiles.push("AGENTS.md", ".framepack/agent/codex/SKILL.md", ".framepack/agent/codex/INSTALL.md", ...skillFiles);
  }

  if (targetsFor(target).includes("claude-code")) {
    writeManagedMarkdown(join(projectDir, "CLAUDE.md"), "# Claude Code Project Guide", claudeInstructions(packageSource), force);
    writeMcpConfig(join(projectDir, ".mcp.json"), createMcpServerConfig(packageSource, platform));
    const skillFiles = writeProjectSkills(projectDir, join(".claude", "skills"));
    writtenFiles.push("CLAUDE.md", ".mcp.json", ...skillFiles);
  }

  return { projectDir, target, writtenFiles };
}
