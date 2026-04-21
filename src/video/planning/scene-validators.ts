import type { Scene, ScenePlan, VideoConstraintSet } from "../types.js";

export function validateScenePlan(plan: ScenePlan, constraints: VideoConstraintSet): string[] {
  const issues: string[] = [];
  const totalSceneDurationSec = plan.scenes.reduce(
    (sum: number, scene: Scene) => sum + scene.durationSec,
    0,
  );

  if (Math.max(plan.totalDurationSec, totalSceneDurationSec) > constraints.maxDurationSec) {
    issues.push("total duration exceeds maxDurationSec");
  }

  if (plan.scenes.length === 0) {
    issues.push("scene plan must include at least one scene");
  }

  if (plan.totalDurationSec !== totalSceneDurationSec) {
    issues.push("total duration does not match sum of scene durations");
  }

  const searchableSceneText = plan.scenes
    .flatMap((scene) => [scene.narration, ...scene.onScreenText])
    .join(" ")
    .toLowerCase();

  for (const requiredPoint of constraints.requiredPoints) {
    if (!searchableSceneText.includes(requiredPoint.toLowerCase())) {
      issues.push(`required point missing: ${requiredPoint}`);
    }
  }

  for (const bannedTerm of constraints.bannedTerms) {
    if (searchableSceneText.includes(bannedTerm.toLowerCase())) {
      issues.push(`banned term present: ${bannedTerm}`);
    }
  }

  return issues;
}
