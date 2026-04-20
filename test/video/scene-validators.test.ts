import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateScenePlan } from "../../src/video/planning/scene-validators.js";

describe("validateScenePlan", () => {
  it("flags scenes that exceed the max duration", () => {
    const result = validateScenePlan(
      {
        totalDurationSec: 80,
        scenes: [
          {
            sceneId: "scene-1",
            purpose: "cover",
            startTimeSec: 0,
            durationSec: 80,
            narration: "Intro",
            onScreenText: ["Intro"],
            visualType: "cover",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
        ],
      },
      { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
    );

    assert.ok(result.includes("total duration exceeds maxDurationSec"));
  });

  it("flags empty scene plans", () => {
    const result = validateScenePlan(
      {
        totalDurationSec: 60,
        scenes: [],
      },
      { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
    );

    assert.ok(result.includes("scene plan must include at least one scene"));
  });

  it("flags mismatched total duration and scene duration sum", () => {
    const result = validateScenePlan(
      {
        totalDurationSec: 60,
        scenes: [
          {
            sceneId: "scene-1",
            purpose: "cover",
            startTimeSec: 0,
            durationSec: 20,
            narration: "Intro",
            onScreenText: ["Intro"],
            visualType: "cover",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
          {
            sceneId: "scene-2",
            purpose: "problem",
            startTimeSec: 20,
            durationSec: 20,
            narration: "Problem",
            onScreenText: ["Problem"],
            visualType: "problem",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
        ],
      },
      { maxDurationSec: 120, requiredPoints: [], bannedTerms: [] },
    );

    assert.ok(result.includes("total duration does not match sum of scene durations"));
  });

  it("flags max duration when scene durations exceed the limit but the reported total does not", () => {
    const result = validateScenePlan(
      {
        totalDurationSec: 60,
        scenes: [
          {
            sceneId: "scene-1",
            purpose: "cover",
            startTimeSec: 0,
            durationSec: 40,
            narration: "Intro",
            onScreenText: ["Intro"],
            visualType: "cover",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
          {
            sceneId: "scene-2",
            purpose: "problem",
            startTimeSec: 40,
            durationSec: 30,
            narration: "Problem",
            onScreenText: ["Problem"],
            visualType: "problem",
            assets: [],
            transition: "fade",
            validationNotes: [],
          },
        ],
      },
      { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
    );

    assert.ok(result.includes("total duration exceeds maxDurationSec"));
  });
});
