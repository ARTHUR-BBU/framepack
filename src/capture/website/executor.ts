import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  AssetExecutionPlan,
  AssetPlan,
  CaptureTarget,
  SourceManifest,
} from "../../core/types.js";
import { syncAssetExecutionProject } from "../../packaging/asset-execution.js";
import { loadChromium } from "../playwright.js";

interface CaptureArtifactMetadata {
  suggestedAsset: string;
  sourceUrl: string;
  sectionTitle: string;
  sectionBody: string;
  purposeTag: CaptureTarget["purposeTag"];
  assetForm: CaptureTarget["assetForm"];
  recommendedSceneIds: string[];
  outputPath: string;
  metadataPath: string;
  capturedAt: string;
  captureMode: "section-clip" | "full-page";
}

interface CaptureScreenshotResult {
  image: Uint8Array;
  captureMode: CaptureArtifactMetadata["captureMode"];
}

interface CaptureScreenshotInput {
  url: string;
  sectionTitle: string;
  suggestedAsset: string;
  outputPath: string;
}

type CaptureScreenshotFn = (
  input: CaptureScreenshotInput,
) => Promise<CaptureScreenshotResult>;

function readJsonFile<T>(projectDir: string, fileName: string): T {
  return JSON.parse(readFileSync(resolve(projectDir, fileName), "utf8")) as T;
}

async function createDefaultCaptureScreenshot(
  input: CaptureScreenshotInput,
): Promise<CaptureScreenshotResult> {
  const chromium = await loadChromium();

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: {
        width: 1440,
        height: 1080,
      },
    });

    try {
      await page.goto(input.url, { waitUntil: "networkidle" });
      const heading = page
        .locator("h1, h2, h3, [role='heading']")
        .filter({ hasText: input.sectionTitle })
        .first();

      if ((await heading.count()) > 0) {
        await heading.scrollIntoViewIfNeeded();
        const box = await heading.boundingBox();

        if (box) {
          const clip = {
            x: Math.max(0, box.x - 40),
            y: Math.max(0, box.y - 40),
            width: Math.min(1360, box.width + 80),
            height: Math.min(720, Math.max(280, box.height + 360)),
          };

          const image = await page.screenshot({
            clip,
          });

          return {
            image,
            captureMode: "section-clip",
          };
        }
      }

      const image = await page.screenshot({
        fullPage: true,
      });

      return {
        image,
        captureMode: "full-page",
      };
    } finally {
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

function writeCaptureArtifact(input: {
  projectDir: string;
  item: AssetExecutionPlan["items"][number];
  target: CaptureTarget;
  screenshot: CaptureScreenshotResult;
  capturedAt: string;
}) {
  const outputFile = resolve(input.projectDir, input.item.outputPath);
  const metadataFile = resolve(input.projectDir, input.item.metadataPath);
  const metadata: CaptureArtifactMetadata = {
    suggestedAsset: input.item.suggestedAsset,
    sourceUrl: input.target.sourceUrl,
    sectionTitle: input.target.sectionTitle,
    sectionBody: input.target.sectionBody,
    purposeTag: input.target.purposeTag,
    assetForm: input.target.assetForm,
    recommendedSceneIds: [...input.target.recommendedSceneIds],
    outputPath: input.item.outputPath,
    metadataPath: input.item.metadataPath,
    capturedAt: input.capturedAt,
    captureMode: input.screenshot.captureMode,
  };

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, input.screenshot.image);
  writeFileSync(metadataFile, JSON.stringify(metadata, null, 2), "utf8");
}

export async function captureWebsiteProject(input: {
  projectDir: string;
  now?: () => string;
  captureScreenshot?: CaptureScreenshotFn;
}) {
  const projectDir = resolve(input.projectDir);
  const sourceManifest = readJsonFile<SourceManifest>(projectDir, "SOURCE_MANIFEST.json");
  const assetPlan = readJsonFile<AssetPlan>(projectDir, "ASSET_PLAN.json");
  const assetExecutionPlan = readJsonFile<AssetExecutionPlan>(
    projectDir,
    "ASSET_EXECUTION_PLAN.json",
  );

  if (sourceManifest.sourceType !== "website") {
    throw new Error("Automated capture only supports website project packages.");
  }

  const now = input.now ?? (() => new Date().toISOString());
  const captureScreenshot = input.captureScreenshot ?? createDefaultCaptureScreenshot;
  const captureTargetsByAsset = new Map(
    assetPlan.captureTargets.map((target) => [target.suggestedAsset, target] as const),
  );
  const pendingItems = assetExecutionPlan.items.filter(
    (item) => item.status === "pending" && item.executionKind === "capture-screenshot",
  );

  for (const item of pendingItems) {
    const target = captureTargetsByAsset.get(item.suggestedAsset);

    if (!target) {
      throw new Error(`Missing capture target for asset: ${item.suggestedAsset}`);
    }

    const screenshot = await captureScreenshot({
      url: sourceManifest.url,
      sectionTitle: target.sectionTitle,
      suggestedAsset: target.suggestedAsset,
      outputPath: resolve(projectDir, item.outputPath),
    });

    writeCaptureArtifact({
      projectDir,
      item,
      target,
      screenshot,
      capturedAt: now(),
    });
  }

  const syncResult = syncAssetExecutionProject({
    projectDir,
    now,
  });

  return {
    projectDir,
    capturedCount: pendingItems.length,
    availableCount: syncResult.availableCount,
    pendingCount: syncResult.pendingCount,
  };
}
