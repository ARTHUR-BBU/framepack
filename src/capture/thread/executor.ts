import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type {
  AssetExecutionPlan,
  AssetPlan,
  SourceManifest,
} from "../../core/types.js";
import { syncAssetExecutionProject } from "../../packaging/asset-execution.js";
import { loadChromium } from "../playwright.js";

interface ThreadCardMetadata {
  suggestedAsset: string;
  sourceLabel: string;
  sourceText: string;
  recommendedSceneIds: string[];
  rationale?: string;
  outputPath: string;
  metadataPath: string;
  composedAt: string;
  renderMode: "text-card";
}

interface RenderThreadCardInput {
  suggestedAsset: string;
  sourceLabel: string;
  text: string;
  outputPath: string;
}

interface RenderThreadCardResult {
  image: Uint8Array;
  renderMode: "text-card";
}

type RenderThreadCardFn = (
  input: RenderThreadCardInput,
) => Promise<RenderThreadCardResult>;

function readJsonFile<T>(projectDir: string, fileName: string): T {
  return JSON.parse(readFileSync(resolve(projectDir, fileName), "utf8")) as T;
}

function createThreadOutputPath(suggestedAsset: string) {
  return join("assets", "generated", `${suggestedAsset}.png`);
}

function createThreadMetadataPath(suggestedAsset: string) {
  return join("assets", "generated", `${suggestedAsset}.json`);
}

function createThreadHtml(input: { sourceLabel: string; text: string }) {
  const escapedLabel = input.sourceLabel
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const escapedText = input.text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        width: 1280px;
        height: 720px;
        background: #0f172a;
        color: #f8fafc;
        font-family: Arial, sans-serif;
      }
      body {
        display: flex;
        align-items: stretch;
        justify-content: stretch;
      }
      .card {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 24px;
        padding: 72px;
        background:
          linear-gradient(180deg, rgba(56, 189, 248, 0.16), transparent),
          linear-gradient(135deg, #0f172a, #111827 60%, #1f2937);
      }
      .eyebrow {
        font-size: 28px;
        font-weight: 700;
        text-transform: uppercase;
        color: #38bdf8;
      }
      .body {
        font-size: 48px;
        line-height: 1.2;
        font-weight: 700;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <section class="card">
      <div class="eyebrow">${escapedLabel}</div>
      <div class="body">${escapedText}</div>
    </section>
  </body>
</html>`;
}

async function createDefaultThreadCardRenderer(
  input: RenderThreadCardInput,
): Promise<RenderThreadCardResult> {
  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1280,
        height: 720,
      },
    });

    try {
      await page.setContent(
        createThreadHtml({
          sourceLabel: input.sourceLabel,
          text: input.text,
        }),
      );

      const image = await page.screenshot();

      return {
        image,
        renderMode: "text-card",
      };
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

function writeThreadArtifact(input: {
  projectDir: string;
  suggestedAsset: string;
  sourceLabel: string;
  sourceText: string;
  recommendedSceneIds: string[];
  rationale?: string;
  image: Uint8Array;
  renderMode: "text-card";
  composedAt: string;
}) {
  const outputPath = createThreadOutputPath(input.suggestedAsset);
  const metadataPath = createThreadMetadataPath(input.suggestedAsset);
  const outputFile = resolve(input.projectDir, outputPath);
  const metadataFile = resolve(input.projectDir, metadataPath);
  const metadata: ThreadCardMetadata = {
    suggestedAsset: input.suggestedAsset,
    sourceLabel: input.sourceLabel,
    sourceText: input.sourceText,
    recommendedSceneIds: [...input.recommendedSceneIds],
    rationale: input.rationale,
    outputPath,
    metadataPath,
    composedAt: input.composedAt,
    renderMode: input.renderMode,
  };

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, input.image);
  writeFileSync(metadataFile, JSON.stringify(metadata, null, 2), "utf8");
}

export async function composeThreadProject(input: {
  projectDir: string;
  now?: () => string;
  renderCard?: RenderThreadCardFn;
}) {
  const projectDir = resolve(input.projectDir);
  const sourceManifest = readJsonFile<SourceManifest>(projectDir, "SOURCE_MANIFEST.json");
  const assetPlan = readJsonFile<AssetPlan>(projectDir, "ASSET_PLAN.json");

  if (sourceManifest.sourceType !== "thread") {
    throw new Error("Thread composition only supports thread project packages.");
  }

  const now = input.now ?? (() => new Date().toISOString());
  const renderCard = input.renderCard ?? createDefaultThreadCardRenderer;
  const assetExecutionPlan = readJsonFile<AssetExecutionPlan>(
    projectDir,
    "ASSET_EXECUTION_PLAN.json",
  );
  const executionEntries = new Map(
    assetExecutionPlan.items.map((item) => [item.suggestedAsset, item] as const),
  );
  const pendingPosts = sourceManifest.posts.filter((post) =>
    assetPlan.missingAssets.includes(`compose:post-${post.index}-card`),
  );

  for (const post of pendingPosts) {
    const suggestedAsset = `post-${post.index}-card`;
    const result = await renderCard({
      suggestedAsset,
      sourceLabel: `Post ${post.index}`,
      text: post.text,
      outputPath: resolve(projectDir, createThreadOutputPath(suggestedAsset)),
    });

    writeThreadArtifact({
      projectDir,
      suggestedAsset,
      sourceLabel: `Post ${post.index}`,
      sourceText: post.text,
      recommendedSceneIds: [...(executionEntries.get(suggestedAsset)?.recommendedSceneIds ?? [])],
      rationale: executionEntries.get(suggestedAsset)?.rationale,
      image: result.image,
      renderMode: result.renderMode,
      composedAt: now(),
    });
  }

  const availableAssets = Array.from(
    new Set([
      ...assetPlan.availableAssets,
      ...sourceManifest.posts
        .map((post) => `post-${post.index}-card`)
        .filter((asset) => existsSync(resolve(projectDir, createThreadOutputPath(asset)))),
    ]),
  );

  writeFileSync(
    resolve(projectDir, "ASSET_PLAN.json"),
    JSON.stringify(
      {
        ...assetPlan,
        availableAssets,
        missingAssets: assetPlan.missingAssets.filter(
          (entry) => !availableAssets.some((asset) => entry === `compose:${asset}`),
        ),
      } satisfies AssetPlan,
      null,
      2,
    ),
    "utf8",
  );

  const syncResult = syncAssetExecutionProject({
    projectDir,
    now,
  });

  return {
    projectDir,
    composedCount: pendingPosts.length,
    availableCount: syncResult.availableCount,
    pendingCount: syncResult.pendingCount,
  };
}
