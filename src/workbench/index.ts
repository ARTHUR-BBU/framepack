import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import {
  listTemplateMarket,
  recommendTemplateRoute,
  type TemplateMarketItem,
  type TemplateRouteId,
} from "./template-market.js";

export type WorkbenchAssetKind = "image" | "video" | "audio" | "text" | "other";

export interface WorkbenchAsset {
  path: string;
  name: string;
  kind: WorkbenchAssetKind;
}

export interface WorkbenchProject {
  projectDir: string;
  assets: WorkbenchAsset[];
  files: Record<string, string>;
}

export type WorkbenchTemplateId = TemplateRouteId;

export type WorkbenchTemplate = TemplateMarketItem;

export interface PolishArsenalRecommendation {
  template: WorkbenchTemplate;
  professionalCreativeLanguage: string;
  animationTechniques: string[];
  aestheticDirection: string[];
  avoid: string[];
  acceptanceCriteria: string[];
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);
const TEXT_EXTENSIONS = new Set([".md", ".txt", ".json", ".csv"]);

export function listWorkbenchTemplates(): WorkbenchTemplate[] {
  return listTemplateMarket();
}

export function recommendPolishArsenal(input: {
  idea: string;
  style?: string;
  format: "16:9" | "9:16";
  durationSec: number;
}): PolishArsenalRecommendation {
  const style = input.style ?? "";
  const template = recommendTemplateRoute({ ...input, style }).template;
  const signal = `${input.idea} ${style}`.toLowerCase();
  const fast = signal.includes("fast") || signal.includes("dynamic") || input.durationSec <= 35;
  const premium = signal.includes("premium") || signal.includes("business") || signal.includes("polished");
  const mobile = input.format === "9:16";

  return {
    template,
    professionalCreativeLanguage: `${template.visualLanguage[0]} with ${premium ? "premium commercial restraint" : "clear editorial confidence"} and ${fast ? "compressed high-energy pacing" : "measured narrative pacing"}.`,
    animationTechniques: [
      ...new Set([
        ...template.motionLanguage,
        "kinetic typography",
        mobile ? "vertical focal framing" : "wide composition staging",
        fast ? "hard scene snaps" : "smooth scene dissolves",
      ]),
    ],
    aestheticDirection: [
      ...template.visualLanguage,
      premium ? "restrained color with sharp contrast" : "direct contrast with readable hierarchy",
      mobile ? "oversized mobile-safe type" : "balanced headline and proof layout",
    ],
    avoid: [
      "tiny text or dense subtitles",
      "mixing animation engines on the same element",
      "invisible first frames",
      "decorative motion that does not clarify the offer",
    ],
    acceptanceCriteria: [
      ...template.acceptanceCriteria,
      "first frame is visible without waiting for JavaScript animation",
      "main message is readable within three seconds",
      "each motion choice supports attention, proof, or transition",
    ],
  };
}

export { listTemplateMarket, recommendTemplateRoute };

function bulletList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function assetKind(fileName: string): WorkbenchAssetKind {
  const extension = extname(fileName).toLowerCase();

  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (TEXT_EXTENSIONS.has(extension)) return "text";
  return "other";
}

function scanAssets(assetDir?: string): WorkbenchAsset[] {
  if (!assetDir || !existsSync(assetDir)) return [];

  return readdirSync(assetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      path: resolve(assetDir, entry.name),
      name: entry.name,
      kind: assetKind(entry.name),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function formatAssets(assets: WorkbenchAsset[]) {
  if (assets.length === 0) {
    return "- No user assets scanned yet. Ask the user before inventing asset needs.";
  }

  return assets.map((asset) => `- ${asset.name} (${asset.kind})`).join("\n");
}

function buildFiles(input: {
  projectName: string;
  idea: string;
  style: string;
  format: "16:9" | "9:16";
  durationSec: number;
  assets: WorkbenchAsset[];
}) {
  const assetList = formatAssets(input.assets);
  const recommendation = recommendPolishArsenal(input);
  const recommendedStack = [
    "- Runtime: HyperFrames first; Remotion is a good route for reusable social/template video.",
    "- Motion: GSAP timeline for HyperFrames-safe scene control.",
    `- Template: ${recommendation.template.id} (${recommendation.template.label}).`,
    `- Professional translation: ${recommendation.professionalCreativeLanguage}`,
    `- Animation techniques: ${recommendation.animationTechniques.join(", ")}.`,
    `- Aesthetic direction: ${recommendation.aestheticDirection.join(", ")}.`,
    `- Avoid: ${recommendation.avoid.join(", ")}.`,
    "- Verification: CSS first scene visible, scene switches with tl.set(), timeline registered on window.__timelines.",
  ].join("\n");

  return {
    "FRAMEPACK.md": [
      "# Framepack Workbench",
      "",
      "Start here. This folder is the durable context for Codex, Claude Code, and other coding agents.",
      "",
      "## Agent Workflow",
      "",
      "1. Read `ASSETS.md`, `DIRECTION.md`, and `COMPOSITION.md` before writing code.",
      "2. Discuss unclear creative choices with the user in natural language.",
      "3. Use Framepack recommendations as a production brief, not as rigid rails.",
      "4. Build or refine the HyperFrames or Remotion composition.",
      "5. Record each render/review loop in `ITERATIONS.md`.",
      "",
      "## Three Layers",
      "",
      "- Skill/instructions: trigger Framepack for vague video, asset, prompt, template, or composition work.",
      "- MCP/CLI: call Framepack tools when files need to be created or refreshed.",
      "- Workbench files: keep the state in markdown so agents can resume without relying on model memory.",
      "",
    ].join("\n"),
    "ASSETS.md": [
      "# Assets",
      "",
      "User-provided assets are intentional source material. Do not judge them by default; arrange them around the user's creative goal.",
      "",
      assetList,
      "",
    ].join("\n"),
    "DIRECTION.md": [
      "# Creative Direction",
      "",
      `Idea: ${input.idea}`,
      `Style words: ${input.style}`,
      `Format: ${input.format}`,
      `Duration: ${input.durationSec} seconds`,
      "",
      "## Translation",
      "",
      "Turn vague user language such as cool, premium, business, dynamic, cinematic, polished, bigger text, tighter pacing, more animation, or like this reference into concrete visual and motion decisions.",
      "",
      "## Polish Arsenal",
      "",
      recommendedStack,
      "",
      "## Professional Creative Translation",
      "",
      `Template: ${recommendation.template.id} (${recommendation.template.label})`,
      "",
      recommendation.professionalCreativeLanguage,
      "",
      "## Motion Language",
      "",
      bulletList(recommendation.animationTechniques),
      "",
      "## Aesthetic Direction",
      "",
      bulletList(recommendation.aestheticDirection),
      "",
      "## Avoid",
      "",
      bulletList(recommendation.avoid),
      "",
    ].join("\n"),
    "COMPOSITION.md": [
      "# Composition Plan",
      "",
      `Use HyperFrames to create a ${input.durationSec}-second ${input.format} programmed commercial video.`,
      "",
      "Do not judge user-provided assets. Use them according to the user's intent, and only suggest improvements in the review loop if they block clarity, pacing, or render quality.",
      "",
      "## User Idea",
      "",
      input.idea,
      "",
      "## Asset Library",
      "",
      assetList,
      "",
      "## Recommended Stack",
      "",
      recommendedStack,
      "",
      "## Recommended Template",
      "",
      `Use the ${recommendation.template.id} route: ${recommendation.template.templateGuidance.join(" ")}`,
      "",
      "## Acceptance Criteria",
      "",
      bulletList(recommendation.acceptanceCriteria),
      "",
      "## Scene Shape",
      "",
      "1. Open with a strong visual promise.",
      "2. Build tension around the user's problem or opportunity.",
      "3. Use supplied assets as proof, texture, or product signal.",
      "4. Add programmed motion with readable pacing.",
      "5. End with a clear payoff or next action.",
      "",
    ].join("\n"),
    "ITERATIONS.md": [
      "# Iterations",
      "",
      "## v001",
      "",
      "Initial creative package.",
      "",
      "- Review the asset library with the user.",
      "- Refine the creative direction through conversation.",
      "- Generate or update the HyperFrames or Remotion composition.",
      "- Record render feedback and next changes here.",
      "",
    ].join("\n"),
    ".framepack/state.json": JSON.stringify(
      {
        version: "framepack.workbench.v1",
        mode: "hyperframes-creative-workbench",
        projectName: input.projectName,
        format: input.format,
        durationSec: input.durationSec,
        entrypoints: {
          guide: "FRAMEPACK.md",
          assets: "ASSETS.md",
          direction: "DIRECTION.md",
          composition: "COMPOSITION.md",
          iterations: "ITERATIONS.md",
        },
      },
      null,
      2,
    ),
  };
}

export function createWorkbenchProject(input: {
  projectName: string;
  idea: string;
  outputDir: string;
  assetDir?: string;
  style?: string;
  format?: "16:9" | "9:16";
  durationSec?: number;
}): WorkbenchProject {
  const projectDir = resolve(input.outputDir, input.projectName);
  const assets = scanAssets(input.assetDir);
  const files = buildFiles({
    projectName: input.projectName,
    idea: input.idea,
    style: input.style ?? "high-quality commercial programmed motion",
    format: input.format ?? "16:9",
    durationSec: input.durationSec ?? 45,
    assets,
  });

  for (const [filePath, content] of Object.entries(files)) {
    mkdirSync(dirname(join(projectDir, filePath)), { recursive: true });
    writeFileSync(join(projectDir, filePath), content, "utf8");
  }

  return { projectDir, assets, files };
}

export function defaultWorkbenchProjectName(idea: string) {
  return (
    basename(idea)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "framepack-workbench"
  );
}
