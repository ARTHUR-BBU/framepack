import type { AssetPlan, ScenePlan, SourceManifest } from "../../core/types.js";

function slugifyAssetName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "section";
}

function getRecommendedSceneIds(sectionIndex: number, sectionCount: number): string[] {
  if (sectionCount <= 1 || sectionIndex === 0) {
    return ["scene-1", "scene-2"];
  }

  if (sectionIndex >= sectionCount - 1) {
    return ["scene-3", "scene-4", "scene-5"];
  }

  return ["scene-2", "scene-3", "scene-4"];
}

function getCaptureRationale(sectionIndex: number, sectionCount: number): string {
  if (sectionCount <= 1 || sectionIndex === 0) {
    return "Use this capture for early story beats, especially the cover and problem setup.";
  }

  if (sectionIndex >= sectionCount - 1) {
    return "Use this capture for middle-to-late story beats, especially the solution and highlights.";
  }

  return "Use this capture for middle story beats where the workflow or core proof needs support.";
}

function inferPurposeTag(input: { sectionIndex: number; sectionCount: number; title: string; body: string }) {
  const normalized = `${input.title} ${input.body}`.toLowerCase();

  if (input.sectionCount <= 1 || input.sectionIndex === 0) {
    return "hero" as const;
  }

  if (/\b(how|process|steps|workflow|flow)\b/.test(normalized)) {
    return "workflow" as const;
  }

  if (/\b(proof|result|metric|review|customer|evidence|testimonial)\b/.test(normalized)) {
    return "proof" as const;
  }

  return "highlight" as const;
}

function inferAssetForm(purposeTag: "hero" | "proof" | "workflow" | "highlight") {
  if (purposeTag === "hero") {
    return "screenshot" as const;
  }

  if (purposeTag === "workflow") {
    return "section-card" as const;
  }

  if (purposeTag === "proof") {
    return "text-overlay" as const;
  }

  return "section-card" as const;
}

export function buildAssetPlan(input: {
  scenePlan: ScenePlan;
  sourceManifest?: SourceManifest;
}): AssetPlan {
  const websiteSourceManifest =
    input.sourceManifest?.sourceType === "website" ? input.sourceManifest : undefined;

  const captureTargets =
    websiteSourceManifest
      ? websiteSourceManifest.sections.map((section, index, sections) => {
          const purposeTag = inferPurposeTag({
            sectionIndex: index,
            sectionCount: sections.length,
            title: section.title,
            body: section.body,
          });

          return {
            sourceType: "website" as const,
            sourceUrl: websiteSourceManifest.url,
            sectionTitle: section.title,
            sectionBody: section.body,
            suggestedAsset: `${slugifyAssetName(section.title)}-capture`,
            purposeTag,
            assetForm: inferAssetForm(purposeTag),
            recommendedSceneIds: getRecommendedSceneIds(index, sections.length),
            rationale: getCaptureRationale(index, sections.length),
          };
        })
      : [];

  const threadPlaceholderAssets =
    input.sourceManifest?.sourceType === "thread"
      ? input.sourceManifest.posts.map((post) => `post-${post.index}-card`)
      : [];

  const threadMissingAssets =
    input.sourceManifest?.sourceType === "thread"
      ? input.sourceManifest.posts.map((post) => `compose:post-${post.index}-card`)
      : [];

  return {
    availableAssets: [],
    placeholderAssets:
      threadPlaceholderAssets.length > 0
        ? threadPlaceholderAssets
        : input.scenePlan.scenes.map((scene) => `${scene.sceneId}-placeholder`),
    missingAssets:
      threadMissingAssets.length > 0
        ? threadMissingAssets
        : captureTargets.map((target) => `capture:${target.suggestedAsset}`),
    captureTargets,
  };
}
