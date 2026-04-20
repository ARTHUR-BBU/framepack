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

  return issues;
}
