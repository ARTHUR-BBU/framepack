import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

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

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);
const TEXT_EXTENSIONS = new Set([".md", ".txt", ".json", ".csv"]);

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

  return {
    "framepack.json": JSON.stringify(
      {
        version: "framepack.workbench.v1",
        mode: "hyperframes-creative-workbench",
        projectName: input.projectName,
        format: input.format,
        durationSec: input.durationSec,
        entrypoints: {
          assets: "ASSET_LIBRARY.md",
          creativeBrief: "prompts/creative-brief.md",
          hyperframesPrompt: "prompts/hyperframes-prompt.md",
          compositionPlan: "hyperframes/composition-plan.md",
          iterationLog: "iterations/v001.md",
        },
      },
      null,
      2,
    ),
    "ASSET_LIBRARY.md": [
      "# Asset Library",
      "",
      "User-provided assets are treated as intentional source material. Do not judge them by default; arrange them around the user's creative goal.",
      "",
      assetList,
      "",
    ].join("\n"),
    "prompts/creative-brief.md": [
      "# Creative Brief",
      "",
      `Idea: ${input.idea}`,
      `Style: ${input.style}`,
      `Format: ${input.format}`,
      `Duration: ${input.durationSec} seconds`,
      "",
      "Creative task: turn the user's idea and assets into a commercially useful programmed-video direction with clear scenes, tension, rhythm, and payoff.",
      "",
    ].join("\n"),
    "prompts/hyperframes-prompt.md": [
      "# HyperFrames Prompt",
      "",
      `Use HyperFrames to create a ${input.durationSec}-second ${input.format} programmed commercial video.`,
      "",
      "Do not judge user-provided assets. Use them according to the user's intent, and only suggest improvements in the review loop if they block clarity, pacing, or render quality.",
      "",
      "User idea:",
      input.idea,
      "",
      "Asset library:",
      assetList,
      "",
      "Composition direction:",
      `- Style: ${input.style}`,
      "- Build a real composition, not a static slide deck.",
      "- Use visible hierarchy, camera rhythm, kinetic text, and asset-led transitions.",
      "- Keep agent-facing notes out of visible rendered text.",
      "- Use HyperFrames preview, lint, inspect, snapshot, and render feedback during iteration.",
      "",
    ].join("\n"),
    "hyperframes/composition-plan.md": [
      "# HyperFrames Composition Plan",
      "",
      `Target: ${input.durationSec} seconds, ${input.format}.`,
      "",
      "1. Open with a strong visual promise.",
      "2. Build tension around the user's problem or opportunity.",
      "3. Use supplied assets as proof, texture, or product signal.",
      "4. Add programmed motion with readable pacing.",
      "5. End with a clear payoff or next action.",
      "",
    ].join("\n"),
    "iterations/v001.md": [
      "# Iteration v001",
      "",
      "Initial creative package.",
      "",
      "- Review the asset library with the user.",
      "- Refine the creative direction through conversation.",
      "- Generate or update the HyperFrames composition.",
      "- Record render feedback and next changes here.",
      "",
    ].join("\n"),
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

  for (const directory of ["prompts", "hyperframes", "iterations"]) {
    mkdirSync(join(projectDir, directory), { recursive: true });
  }

  for (const [filePath, content] of Object.entries(files)) {
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
