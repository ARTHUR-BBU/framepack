import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { buildCaseExplainerVideoProject } from "../../src/video/index.js";
import {
  createVideoProjectPackage,
  writeVideoProjectPackage,
} from "../../src/video/package/project-package.js";
import { emitHyperframesComposition } from "../../src/video/render/hyperframes-adapter.js";

describe("emitHyperframesComposition", () => {
  it("emits a composition HTML string with the composition root attributes", () => {
    const output = emitHyperframesComposition({
      width: 1920,
      height: 1080,
      fps: 30,
      durationSec: 60,
      scenes: [
        {
          sceneId: "scene-1",
          htmlTemplate: "<section>Intro</section>",
          cssClassNames: ["cover"],
          assetRefs: [],
        },
      ],
      theme: { palette: "default" },
    });

    assert.match(output.html, /data-composition-id="case-explainer"/);
    assert.match(output.html, /<section>Intro<\/section>/);
    assert.deepEqual(output.commands, {
      preview: "npx hyperframes preview",
      lint: "npx hyperframes lint",
      validate: "npx hyperframes validate",
      render: "npx hyperframes render",
    });
  });
});

describe("createVideoProjectPackage", () => {
  it("produces the required flywheel-governed package files", () => {
    const result = createVideoProjectPackage({
      projectName: "case-video",
      brief: {
        goal: "Explain the case",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      },
      scenePlan: { totalDurationSec: 60, scenes: [] },
      validationReport: {
        projectName: "case-video",
        status: "passed",
        sceneCount: 0,
        totalDurationSec: 60,
        issues: [],
        generatedAt: "2026-04-21T00:00:00.000Z",
      },
      compositionHtml: "<div></div>",
    });

    assert.deepEqual(Object.keys(result.files).sort(), [
      "COMMANDS.md",
      "FLYWHEEL.md",
      "GUARDRAILS.md",
      "RETRO_LOG.md",
      "SCENE_PLAN.json",
      "VALIDATION_REPORT.json",
      "VALIDATION_REPORT.md",
      "VIDEO_BRIEF.json",
      "composition.html",
    ]);
    assert.equal(result.projectName, "case-video");
  });

  it("writes the generated project package to disk", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-"));

    try {
      const result = createVideoProjectPackage({
        projectName: "case-video",
        brief: {
          goal: "Explain the case",
          audience: "Founders",
          format: "16:9",
          style: { tone: "direct", pacing: "medium", brandName: "Studio" },
          sourceMaterials: [],
          constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
          outputType: "case-explainer",
        },
        scenePlan: { totalDurationSec: 60, scenes: [] },
        validationReport: {
          projectName: "case-video",
          status: "passed",
          sceneCount: 0,
          totalDurationSec: 60,
          issues: [],
          generatedAt: "2026-04-21T00:00:00.000Z",
        },
        compositionHtml: "<div></div>",
      });

      const writtenDir = writeVideoProjectPackage(tempRoot, result);

      assert.match(readFileSync(join(writtenDir, "FLYWHEEL.md"), "utf8"), /Intake -> Plan/);
      assert.match(readFileSync(join(writtenDir, "VALIDATION_REPORT.md"), "utf8"), /Validation passed/);
      assert.equal(readFileSync(join(writtenDir, "composition.html"), "utf8"), "<div></div>");
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});

describe("buildCaseExplainerVideoProject", () => {
  it("runs the first-version pipeline from markdown input to project package", () => {
    const result = buildCaseExplainerVideoProject({
      inputType: "markdown",
      markdown:
        "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
      defaults: {
        goal: "Explain the system",
        audience: "Internal team",
        format: "16:9",
        outputType: "case-explainer",
      },
      projectName: "case-video",
    });

    assert.match(result.package.files["VIDEO_BRIEF.json"], /"goal": "Explain the system"/);
    assert.match(result.package.files["VALIDATION_REPORT.json"], /"status": "passed"/);
    assert.match(result.package.files["composition.html"], /data-composition-id/);
    assert.equal(result.scenePlan.scenes.length, 6);
    assert.equal(result.spec.width, 1920);
  });
});
