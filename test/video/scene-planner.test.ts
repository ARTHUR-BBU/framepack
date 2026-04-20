import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planCaseExplainerScenes } from "../../src/video/planning/scene-planner.js";

describe("planCaseExplainerScenes", () => {
  it("creates the fixed first-version scene sequence with floor-based timing", () => {
    const plan = planCaseExplainerScenes({
      goal: "Explain the case",
      audience: "Founders",
      format: "16:9",
      style: { tone: "direct", pacing: "medium", brandName: "Studio" },
      sourceMaterials: [{ kind: "markdown", title: "Case", body: "# Problem\nA\n# Solution\nB" }],
      constraints: { maxDurationSec: 61, requiredPoints: [], bannedTerms: [] },
      outputType: "case-explainer",
    });

    assert.equal(plan.totalDurationSec, 60);
    assert.equal(plan.scenes.length, 6);
    assert.deepEqual(
      plan.scenes.map((scene: { visualType: string }) => scene.visualType),
      ["cover", "problem", "solution", "workflow", "highlights", "ending"],
    );
    assert.deepEqual(
      plan.scenes.map((scene: { durationSec: number }) => scene.durationSec),
      [10, 10, 10, 10, 10, 10],
    );
    assert.deepEqual(
      plan.scenes.map((scene: { startTimeSec: number }) => scene.startTimeSec),
      [0, 10, 20, 30, 40, 50],
    );
    assert.deepEqual(plan.scenes[0], {
      sceneId: "scene-1",
      purpose: "cover",
      startTimeSec: 0,
      durationSec: 10,
      narration: "Explain the case - cover",
      onScreenText: ["Explain the case", "cover"],
      visualType: "cover",
      assets: [],
      transition: "fade",
      validationNotes: [],
    });
    assert.deepEqual(plan.scenes[5], {
      sceneId: "scene-6",
      purpose: "ending",
      startTimeSec: 50,
      durationSec: 10,
      narration: "Explain the case - ending",
      onScreenText: ["Explain the case", "ending"],
      visualType: "ending",
      assets: [],
      transition: "fade",
      validationNotes: [],
    });
  });

  it("rejects unsupported output types", () => {
    assert.throws(
      () =>
        planCaseExplainerScenes({
          goal: "Explain the case",
          audience: "Founders",
          format: "16:9",
          style: { tone: "direct", pacing: "medium", brandName: "Studio" },
          sourceMaterials: [{ kind: "markdown", title: "Case", body: "# Problem\nA\n# Solution\nB" }],
          constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
          outputType: "product-demo",
        }),
      /planCaseExplainerScenes only supports case-explainer briefs/,
    );
  });

  it("rejects too-short durations", () => {
    assert.throws(
      () =>
        planCaseExplainerScenes({
          goal: "Explain the case",
          audience: "Founders",
          format: "16:9",
          style: { tone: "direct", pacing: "medium", brandName: "Studio" },
          sourceMaterials: [{ kind: "markdown", title: "Case", body: "# Problem\nA\n# Solution\nB" }],
          constraints: { maxDurationSec: 5, requiredPoints: [], bannedTerms: [] },
          outputType: "case-explainer",
        }),
      /case explainer scene plan requires at least 1 second per scene/,
    );
  });
});
