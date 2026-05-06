export function getThreadRecommendedSceneIds(postIndex: number, postCount: number) {
  if (postCount <= 1 || postIndex === 0) {
    return ["scene-1", "scene-2"];
  }

  if (postIndex >= postCount - 1) {
    return ["scene-4", "scene-5", "scene-6"];
  }

  return ["scene-2", "scene-3", "scene-4"];
}
