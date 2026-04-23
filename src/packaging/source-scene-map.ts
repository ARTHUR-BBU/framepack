import type {
  AssetPlan,
  ScenePlan,
  SourceManifest,
  SourceSceneMap,
} from "../core/types.js";

function slugifyAssetName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "source";
}

function getThreadRecommendedSceneIds(postIndex: number, postCount: number) {
  if (postCount <= 1 || postIndex === 0) {
    return ["scene-1", "scene-2"];
  }

  if (postIndex >= postCount - 1) {
    return ["scene-4", "scene-5", "scene-6"];
  }

  return ["scene-2", "scene-3", "scene-4"];
}

export function buildSourceSceneMap(input: {
  scenePlan: ScenePlan;
  assetPlan: AssetPlan;
  sourceManifest?: SourceManifest;
}): SourceSceneMap {
  const sources =
    input.sourceManifest?.sourceType === "website"
      ? input.assetPlan.captureTargets.map((target) => ({
          sourceType: "website" as const,
          sourceLabel: target.sectionTitle,
          sourceText: target.sectionBody,
          suggestedAsset: target.suggestedAsset,
          assetForm: target.assetForm,
          recommendedSceneIds: [...target.recommendedSceneIds],
          rationale: target.rationale,
        }))
      : input.sourceManifest?.sourceType === "thread"
        ? input.sourceManifest.posts.map((post, index, posts) => ({
            sourceType: "thread" as const,
            sourceLabel: `Post ${post.index}`,
            sourceText: post.text,
            suggestedAsset: `post-${post.index}-card`,
            assetForm: "text-card",
            recommendedSceneIds: getThreadRecommendedSceneIds(index, posts.length),
            rationale:
              index === 0
                ? "Use this post for the opening problem or framing beats."
                : index >= posts.length - 1
                  ? "Use this post for late proof, takeaway, or ending beats."
                  : "Use this post for middle beats that explain the workflow or core argument.",
          }))
        : [];

  const scenes = input.scenePlan.scenes.map((scene) => ({
    sceneId: scene.sceneId,
    linkedSources: sources
      .filter((source) => source.recommendedSceneIds.includes(scene.sceneId))
      .map((source) => ({
        sourceType: source.sourceType,
        sourceLabel: source.sourceLabel,
        suggestedAsset: source.suggestedAsset,
        assetForm: source.assetForm,
        rationale: source.rationale,
      })),
  }));

  return {
    scenes,
    sources,
  };
}
