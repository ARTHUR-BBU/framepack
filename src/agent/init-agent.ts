import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

## Design System Index

Before deciding colors, fonts, or visual style, match user intent to a design system and **read the corresponding file** from \`references/designs/\`. Each file contains exact hex codes, typography scales, and visual rules; use them as source of truth.

| User intent keywords | Load file |
|---|---|
| space, dark, cinematic, futuristic | [references/designs/spacex.md](references/designs/spacex.md) |
| electric, automotive, clean, photography | [references/designs/tesla.md](references/designs/tesla.md) |
| AI, tech, green, dark, data | [references/designs/nvidia.md](references/designs/nvidia.md) |
| premium, elegant, minimal | [references/designs/apple.md](references/designs/apple.md) |
| fintech, professional, purple, corporate | [references/designs/stripe.md](references/designs/stripe.md) |
| sport, athletic, energy, bold | [references/designs/nike.md](references/designs/nike.md) |
| luxury, automotive, red, editorial | [references/designs/ferrari.md](references/designs/ferrari.md) |
| aggressive, luxury, dark, performance | [references/designs/lamborghini.md](references/designs/lamborghini.md) |
| ultra-luxury, exclusive, dark | [references/designs/bugatti.md](references/designs/bugatti.md) |
| performance, dynamic, bold | [references/designs/bmw-m.md](references/designs/bmw-m.md) |
| developer, dark, minimal | [references/designs/vercel.md](references/designs/vercel.md) |
| SaaS, clean, purple, productivity | [references/designs/linear-app.md](references/designs/linear-app.md) |
| entertainment, dark, green, music | [references/designs/spotify.md](references/designs/spotify.md) |
| social, gaming, community, purple | [references/designs/discord.md](references/designs/discord.md) |
| creative, design, collaboration | [references/designs/figma.md](references/designs/figma.md) |
| gaming, dark, blue, console | [references/designs/playstation.md](references/designs/playstation.md) |
| e-commerce, green, retail | [references/designs/shopify.md](references/designs/shopify.md) |
| social, blue, platform | [references/designs/meta.md](references/designs/meta.md) |
| transport, modern, clean | [references/designs/uber.md](references/designs/uber.md) |
| productivity, dark, developer | [references/designs/raycast.md](references/designs/raycast.md) |
| AI, minimal, clean, research | [references/designs/openai.md](references/designs/openai.md) |
| productivity, clean, workspace | [references/designs/notion.md](references/designs/notion.md) |

## Workflow

1. Read \`FRAMEPACK.md\`, \`HUMAN.md\`, \`STYLE.md\`, and \`DIRECTION.md\` if they exist.
2. Match user intent to a design system above and load the corresponding file.
3. Translate fuzzy phrases into structure, visual language, motion language, risk, and acceptance criteria using the design system's exact colors and typography.
4. Keep the user's business goal and assets as the source of truth.
5. Write or update \`HUMAN.md\` and \`DIRECTION.md\`.`,
  },
  {
    name: "framepack-template-fuser",
    description: "Use when user assets, workflow templates, HyperFrames prompt templates, Catalog candidates, or style requirements must become a custom composition plan.",
    body: `# Framepack Template Fuser

Fuse templates with user assets and requirements. Templates are director blueprints, not finished videos.

## References (loaded on demand)

- **[references/catalog-usage.md](references/catalog-usage.md)** - Catalog component install, block vs component usage, and pre-flight checklist. **Always read before writing custom code.**

## Workflow

1. Read \`FRAMEPACK.md\`, \`ASSETS.md\`, \`DIRECTION.md\`, \`STYLE.md\`, and \`COMPOSITION.md\`.
2. Read [references/catalog-usage.md](references/catalog-usage.md) and follow the Catalog pre-flight steps.
3. Preserve user assets, offer, proof, audience, and CTA as the source of truth.
4. Use the selected HyperFrames prompt template for scene rhythm, Catalog candidates, motion rules, and QA checks.
5. Replace generic template copy with user-specific content.
6. Write the result into \`COMPOSITION.md\` under \`Template Fusion Plan\`.`,
  },
  {
    name: "framepack-hyperframes-builder",
    description: "Use when turning a Framepack composition plan into HyperFrames code, debugging HyperFrames output, or preparing lint, inspect, snapshot, and render checks.",
    body: `# Framepack HyperFrames Builder

Turn \`COMPOSITION.md\` into HyperFrames code without breaking render safety.

## Quick Rules

- First scene visible via CSS. Register timeline on \`window.__timelines\`. Use \`tl.set()\` for scene switches. No \`Math.random()\`, no \`repeat: -1\`, no async timeline construction.
- **Always read the full compatibility rules before writing code.**

## References (loaded on demand)

- **[references/compatibility-rules.md](references/compatibility-rules.md)** - 15 mandatory HyperFrames render rules derived from real failures. **Always read before building.**
- **[references/code-templates.md](references/code-templates.md)** - Reusable GSAP patterns: impact pop, kinetic type, hard snap, smooth dissolve, scale reveal, number counter, sweep line. Read when writing scene animations.

## Workflow

1. Read \`FRAMEPACK.md\`, \`COMPOSITION.md\`, \`ASSETS.md\`, and \`ITERATIONS.md\`.
2. If the project has a \`design.md\` or \`DESIGN.md\`, read it; its colors and fonts are source of truth.
3. Read [references/compatibility-rules.md](references/compatibility-rules.md). Apply all rules when writing code.
4. Read [references/code-templates.md](references/code-templates.md) for animation building blocks.
5. Run \`npx hyperframes lint\` and \`npx hyperframes inspect\` before render.
6. Run \`npx hyperframes preview\` and wait for user approval before rendering.
7. Record render feedback and next actions in \`ITERATIONS.md\`.`,
  },
  {
    name: "framepack-reference-miner",
    description: "Use when a user provides a finished video, reference video, competitor example, or wants to turn an existing result into a reusable Framepack or HyperFrames template.",
    body: `# Framepack Reference Miner

Extract a **VIDEO_DNA.md** technical blueprint from a reference video for HyperFrames reproduction.

## When to Use

- User says "like this reference video" or "make it look like this"
- User provides a competitor video to study
- User wants to turn a finished render into a reusable template

## Output

\`VIDEO_DNA.md\` - a segment-by-second technical blueprint with:
- Per-second GSAP/CSS HOW-TO code (not vague descriptions)
- Design tokens extracted from the video (hex colors, font sizes)
- ASCII layout diagrams for complex segments
- Asset checklist with BLOCKING / RECOMMENDED / OPTIONAL priorities
- HyperFrames feasibility assessment per segment

After DNA extraction, also produce \`TEMPLATE_BLUEPRINT.md\` with abstracted slots.

## References

- [video-dna-template.md](references/video-dna-template.md) - required output format and extraction workflow
- [video-dna-example.md](references/video-dna-example.md) - complete worked example (8 segments, 63s video)

## Workflow

1. Read \`FRAMEPACK.md\` and any existing \`DIRECTION.md\`, \`COMPOSITION.md\`, \`ITERATIONS.md\`, and \`ASSETS.md\`.
2. Watch the reference video **twice**: first pass for rhythm, second pass for per-second detail.
3. Read the template, then extract DNA following the required format.
4. Study the example if you need to calibrate extraction granularity.
5. Write \`VIDEO_DNA.md\`; every second must have specific GSAP code, not descriptions.
6. Extract design tokens (hex colors, font sizes) into the DNA's Design Tokens section.
7. Build the asset checklist and compare against user's \`ASSETS.md\`.
8. Update \`ASSET_GAPS.md\` with DNA-derived blocking gaps.
9. Convert reusable rules into \`TEMPLATE_BLUEPRINT.md\`.
10. Update \`DIRECTION.md\` and \`COMPOSITION.md\` only after the DNA and blueprint are clear.`,
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

function writeManagedMarkdown(path: string, _title: string, managedContent: string, force: boolean): void {
  const block = `${MANAGED_START}\n${managedContent.trim()}\n${MANAGED_END}\n`;

  if (!existsSync(path)) {
    writeFileSync(path, `${block}`, "utf8");
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

function copySkillReferences(skillDir: string, skillName: string, prefix: string, written: string[]): void {
  const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const refsSource = join(pkgRoot, "templates", "skills", skillName, "references");
  if (!existsSync(refsSource)) return;

  const refsTarget = join(skillDir, "references");
  copyDirRecursive(refsSource, refsTarget);

  for (const file of readdirSync(refsTarget, { recursive: true })) {
    if (typeof file === "string" && file.endsWith(".md")) {
      written.push(join(prefix, skillName, "references", file).replace(/\\/g, "/"));
    }
  }
}

function copyDirRecursive(source: string, target: string): void {
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const srcPath = join(source, entry.name);
    const destPath = join(target, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function writeProjectSkills(rootDir: string, prefix: string): string[] {
  const designSourceDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "designs");
  const written: string[] = [];

  for (const skill of PROJECT_SKILLS) {
    const skillDir = join(rootDir, prefix, skill.name);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), skillMarkdown(skill), "utf8");
    written.push(join(prefix, skill.name, "SKILL.md").replace(/\\/g, "/"));

    if (skill.name === "framepack-director" && existsSync(designSourceDir)) {
      const refsDir = join(skillDir, "references", "designs");
      mkdirSync(refsDir, { recursive: true });
      for (const file of readdirSync(designSourceDir)) {
        if (file.endsWith(".md")) {
          copyFileSync(join(designSourceDir, file), join(refsDir, file));
          written.push(join(prefix, skill.name, "references", "designs", file).replace(/\\/g, "/"));
        }
      }
    }

    copySkillReferences(skillDir, skill.name, prefix, written);
  }

  return written;
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
3. Read \`FRAMEPACK.md\` first, then \`HUMAN.md\`, \`ASSETS.md\`, \`ASSET_GAPS.md\`, \`DESIGN.md\`, \`DESIGN_TOKENS.md\`, \`DIRECTION.md\`, \`COMPOSITION.md\`, and \`ITERATIONS.md\`.
4. Run \`${command} workbench audit --phase preflight --project-dir <dir>\`. If P0/P1 blockers exist, stop and correct them or ask the user.
5. Run phase gates as work advances: \`${command} workbench audit --phase design --project-dir <dir>\`, \`${command} workbench audit --phase composition --project-dir <dir>\`, \`${command} workbench audit --phase preview --project-dir <dir>\`, then \`${command} workbench audit --phase render --project-dir <dir>\`.
6. Translate fuzzy user taste into concrete visual language, motion language, template route, and HyperFrames/Remotion implementation choices.
7. Keep project state in the workbench files; do not rely on model memory.
8. Use HyperFrames-safe rules: CSS first frame visible, scene switches with \`tl.set()\`, no timed video inside timed scene containers, one animation engine per element, and timeline registration on \`window.__timelines\`.

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
5. Run \`${command} workbench audit --phase preflight --project-dir <dir>\` before creative or code work.
6. Run \`${command} workbench audit --phase design|composition|preview|render --project-dir <dir>\` at the matching stage; do not proceed through P0/P1 blockers.
7. Use \`framepack workbench brief --project-dir <dir>\` when the user needs a plain-language progress recap.
8. Use MCP/CLI only when files need to be created, inspected, or refreshed.
`;
}

function codexAgentsBlock(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `## Framepack Agent Workflow

Framepack is installed as an agent-native video creative workbench for this project.

- Trigger Framepack for vague video requests, asset-to-video work, HyperFrames composition, template selection, or polish direction.
- Prefer MCP tools over memorized shell commands; check \`${command} mcp --describe\` if MCP is not connected.
- Create workbenches with \`${command} create --idea "<idea>" --assets <dir> --output-dir <dir>\`.
- Start every Framepack project by reading \`FRAMEPACK.md\`.
- Use \`HUMAN.md\`, \`ASSETS.md\`, \`ASSET_GAPS.md\`, \`DESIGN.md\`, \`DESIGN_TOKENS.md\`, \`STYLE.md\`, \`DIRECTION.md\`, \`COMPOSITION.md\`, and \`ITERATIONS.md\` as durable context. Do not rely on model memory.
- Run \`${command} workbench audit --phase preflight --project-dir <dir>\` before starting, then \`${command} workbench audit --phase design|composition|preview|render --project-dir <dir>\` at each lifecycle gate. Stop on P0/P1 blockers.
- Recommend animation libraries, templates, game-asset tools, HyperFrames, or Remotion only when the current project needs them.
- Project skills are installed under \`.framepack/agent/codex/skills\`; each skill contains detailed references. Use the matching Framepack skill for: director work, template fusion, HyperFrames building, or reference mining.
`;
}

function claudeInstructions(packageSource: PackageSource): string {
  const command = packageCommand(packageSource);

  return `# Framepack Claude Code Instructions

Framepack is available through the project MCP server.

Project skills are installed under \`.claude/skills\`. Use \`framepack-director\`, \`framepack-template-fuser\`, \`framepack-hyperframes-builder\`, and \`framepack-reference-miner\` when the task matches their descriptions. Each skill has a \`SKILL.md\` index and \`references/\` with detailed rules, templates, and code patterns; load on demand, do not read all at once.

Use Framepack when the user asks for a polished video, HyperFrames composition, asset-to-video planning, template selection, or vague creative improvements such as cooler, more business, more dynamic, bigger text, faster pacing, or like this reference.

Required flow:

1. Create a workbench with \`${command} create --idea "<idea>" --assets <dir> --output-dir <dir>\`.
2. Read \`FRAMEPACK.md\`, then \`HUMAN.md\`, \`ASSETS.md\`, \`ASSET_GAPS.md\`, \`DESIGN.md\`, \`DESIGN_TOKENS.md\`, \`STYLE.md\`, \`DIRECTION.md\`, \`COMPOSITION.md\`, and \`ITERATIONS.md\`.
3. Run \`${command} workbench audit --phase preflight --project-dir <dir>\`. If P0/P1 blockers exist, stop and correct them or ask the user.
4. Run phase gates as work advances: \`${command} workbench audit --phase design --project-dir <dir>\`, \`${command} workbench audit --phase composition --project-dir <dir>\`, \`${command} workbench audit --phase preview --project-dir <dir>\`, then \`${command} workbench audit --phase render --project-dir <dir>\`.
5. Check \`ASSET_GAPS.md\` for blocking gaps before writing code. If blocking gaps exist, tell the user what assets are needed.
6. Translate fuzzy user intent into concrete visual language, motion language, template route, and implementation plan.
7. Use HyperFrames-safe rules: CSS first frame visible, scene switches with \`tl.set()\`, no timed video inside timed scene containers, one animation engine per element, and timeline registration on \`window.__timelines\`.
8. Record render feedback and next actions in \`ITERATIONS.md\`.
9. Use \`framepack workbench brief --project-dir <dir>\` when the user needs a plain-language progress recap.

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
    try {
      const agentDir = join(projectDir, ".framepack", "agent", "codex");
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(join(agentDir, "SKILL.md"), codexSkill(packageSource), "utf8");
      writeFileSync(join(agentDir, "INSTALL.md"), codexInstall(packageSource), "utf8");
      const skillFiles = writeProjectSkills(projectDir, join(".framepack", "agent", "codex", "skills"));
      writeManagedMarkdown(join(projectDir, "AGENTS.md"), "# Project Agent Guide", codexAgentsBlock(packageSource), force);
      writtenFiles.push("AGENTS.md", ".framepack/agent/codex/SKILL.md", ".framepack/agent/codex/INSTALL.md", ...skillFiles);
    } catch (error) {
      console.warn(`Framepack codex init warning: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (targetsFor(target).includes("claude-code")) {
    try {
      writeManagedMarkdown(join(projectDir, "CLAUDE.md"), "# Claude Code Project Guide", claudeInstructions(packageSource), force);
      writeMcpConfig(join(projectDir, ".mcp.json"), createMcpServerConfig(packageSource, platform));
      const skillFiles = writeProjectSkills(projectDir, join(".claude", "skills"));
      writtenFiles.push("CLAUDE.md", ".mcp.json", ...skillFiles);
    } catch (error) {
      console.warn(`Framepack claude-code init warning: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { projectDir, target, writtenFiles };
}
