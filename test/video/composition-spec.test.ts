import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compileCompositionSpec } from "../../src/video/compile/composition-spec.js";

describe("compileCompositionSpec", () => {
  it("maps 16:9 scene plans into a 1920x1080 composition spec", () => {
    const spec = compileCompositionSpec({
      format: "16:9",
      totalDurationSec: 60,
      scenes: [
        {
          sceneId: "scene-1",
          purpose: "cover",
          startTimeSec: 0,
          durationSec: 10,
          narration: "Intro",
          onScreenText: ["Intro"],
          visualType: "cover",
          assets: [],
          transition: "fade",
          validationNotes: [],
        },
      ],
    });

    assert.equal(spec.width, 1920);
    assert.equal(spec.height, 1080);
    assert.equal(spec.fps, 30);
    assert.equal(spec.durationSec, 60);
    assert.deepEqual(spec.scenes[0], {
      sceneId: "scene-1",
      htmlTemplate: '<section data-scene-id="scene-1"></section>',
      cssClassNames: ["cover"],
      assetRefs: [],
    });
    assert.deepEqual(spec.theme, { palette: "default" });
  });

  it("maps 9:16 scene plans into a 1080x1920 composition spec", () => {
    const spec = compileCompositionSpec({
      format: "9:16",
      totalDurationSec: 45,
      scenes: [
        {
          sceneId: "scene-2",
          purpose: "problem",
          startTimeSec: 0,
          durationSec: 15,
          narration: "Problem",
          onScreenText: ["Problem"],
          visualType: "problem",
          assets: ["asset-1"],
          transition: "fade",
          validationNotes: [],
        },
      ],
    });

    assert.equal(spec.width, 1080);
    assert.equal(spec.height, 1920);
    assert.deepEqual(spec.scenes[0]?.assetRefs, ["asset-1"]);
  });
});
