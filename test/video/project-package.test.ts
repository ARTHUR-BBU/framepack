import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import type {
  AssetPlan,
  RuntimeCapabilities,
  ScenePlan as CompilerScenePlan,
  Script,
  SourceBundle,
  Storyboard,
  ValidationReport as CompilerValidationReport,
  VideoBrief as CompilerVideoBrief,
} from "../../src/core/types.js";
import { buildCaseExplainerVideoProject } from "../../src/video/index.js";
import {
  createVideoProjectPackage,
  writeVideoProjectPackage,
} from "../../src/video/package/project-package.js";
import { emitHyperframesComposition } from "../../src/video/render/hyperframes-adapter.js";

describe("compiler types", () => {
  it("exposes compiler-level source, planning, and runtime contracts", () => {
    const sourceBundle: SourceBundle = {
      sourceType: "markdown",
      rawInputs: { markdown: "# Problem\nA" },
      collectedArtifacts: [],
      ingestMetadata: { collectedAt: "2026-04-21T00:00:00.000Z" },
    };

    const brief: CompilerVideoBrief = {
      goal: "Explain the case",
      audience: "Founders",
      format: "16:9",
      style: { tone: "direct", pacing: "medium", brandName: "Studio" },
      sourceMaterials: [],
      constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
      outputType: "case-explainer",
    };

    const scenePlan: CompilerScenePlan = {
      totalDurationSec: 60,
      scenes: [],
    };

    const script: Script = {
      scenes: [],
    };

    const storyboard: Storyboard = {
      scenes: [],
    };

    const assetPlan: AssetPlan = {
      availableAssets: [],
      placeholderAssets: [],
      missingAssets: [],
      captureTargets: [],
    };

    const validationReport: CompilerValidationReport = {
      projectName: "case-video",
      status: "passed",
      sceneCount: 0,
      totalDurationSec: 60,
      issues: [],
      generatedAt: "2026-04-21T00:00:00.000Z",
    };

    const runtimeCapabilities: RuntimeCapabilities = {
      version: "0.0.0",
      supportedCommands: [],
      supportedCatalogFeatures: [],
      supportedRenderOptions: [],
      fallbackNotes: [],
    };

    assert.equal(sourceBundle.sourceType, "markdown");
    assert.equal(brief.outputType, "case-explainer");
    assert.equal(scenePlan.scenes.length, 0);
    assert.equal(script.scenes.length, 0);
    assert.equal(storyboard.scenes.length, 0);
    assert.equal(assetPlan.missingAssets.length, 0);
    assert.equal(validationReport.status, "passed");
    assert.equal(runtimeCapabilities.version, "0.0.0");
  });
});

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
      script: { scenes: [] },
      storyboard: { scenes: [] },
      assetPlan: { availableAssets: [], placeholderAssets: [], missingAssets: [], captureTargets: [] },
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
        "ASSET_PLAN.json",
        "CAPTURE_EXECUTION_PLAN.json",
        "COMMANDS.md",
        "FLYWHEEL.md",
        "GUARDRAILS.md",
      "HANDOFF.md",
      "RETRO_LOG.md",
      "SCENE_ASSET_MAP.json",
      "SCENE_PLAN.json",
      "SCRIPT.md",
        "VALIDATION_REPORT.json",
        "VALIDATION_REPORT.md",
        "VIDEO_BRIEF.json",
        "compositions/scene-root.html",
        "STORYBOARD.md",
        "index.html",
        "meta.json",
      ]);
    assert.deepEqual(result.directories.sort(), ["assets", "assets/captures", "compositions"]);
    assert.equal(result.projectName, "case-video");
    assert.match(result.files["GUARDRAILS.md"], /Max duration: 60s/);
    assert.match(result.files["GUARDRAILS.md"], /Latest validation: passed/);
    assert.match(result.files["HANDOFF.md"], /Validation status: passed/);
    assert.match(result.files["SCENE_ASSET_MAP.json"], /"scenes": \[/);
    assert.match(result.files["CAPTURE_EXECUTION_PLAN.json"], /"items": \[/);
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
        script: { scenes: [] },
        storyboard: { scenes: [] },
        assetPlan: { availableAssets: [], placeholderAssets: [], missingAssets: [], captureTargets: [] },
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
      assert.match(readFileSync(join(writtenDir, "GUARDRAILS.md"), "utf8"), /Banned terms:\n- None/);
      assert.match(readFileSync(join(writtenDir, "VALIDATION_REPORT.md"), "utf8"), /Validation passed/);
      assert.match(readFileSync(join(writtenDir, "SCENE_ASSET_MAP.json"), "utf8"), /"captures": \[/);
      assert.match(readFileSync(join(writtenDir, "CAPTURE_EXECUTION_PLAN.json"), "utf8"), /"items": \[/);
      assert.equal(readFileSync(join(writtenDir, "index.html"), "utf8"), "<div></div>");
      assert.equal(existsSync(join(writtenDir, "assets")), true);
      assert.equal(existsSync(join(writtenDir, "assets", "captures")), true);
      assert.equal(existsSync(join(writtenDir, "compositions")), true);
      assert.equal(existsSync(join(writtenDir, "compositions", "scene-root.html")), true);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it("renders configured constraints and failed validation state into GUARDRAILS.md", () => {
    const result = createVideoProjectPackage({
      projectName: "case-video",
      brief: {
        goal: "Explain the case",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [],
        constraints: {
          maxDurationSec: 45,
          requiredPoints: ["repeatable"],
          bannedTerms: ["cheap"],
        },
        outputType: "case-explainer",
      },
      scenePlan: { totalDurationSec: 45, scenes: [] },
      script: { scenes: [] },
      storyboard: { scenes: [] },
      assetPlan: { availableAssets: [], placeholderAssets: [], missingAssets: [], captureTargets: [] },
      validationReport: {
        projectName: "case-video",
        status: "failed",
        sceneCount: 0,
        totalDurationSec: 45,
        issues: ["required point missing: repeatable"],
        generatedAt: "2026-04-21T00:00:00.000Z",
      },
      compositionHtml: "<div></div>",
    });

    assert.match(result.files["GUARDRAILS.md"], /Max duration: 45s/);
    assert.match(result.files["GUARDRAILS.md"], /Required points:\n- repeatable/);
    assert.match(result.files["GUARDRAILS.md"], /Banned terms:\n- cheap/);
    assert.match(result.files["GUARDRAILS.md"], /Latest validation: failed/);
    assert.match(result.files["GUARDRAILS.md"], /Latest issues:\n- required point missing: repeatable/);
  });

  it("renders capture-target planning hints into HANDOFF.md", () => {
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
      script: { scenes: [] },
      storyboard: { scenes: [] },
      assetPlan: {
        availableAssets: [],
        placeholderAssets: [],
        missingAssets: ["capture:hero-capture"],
        captureTargets: [
          {
            sourceType: "website",
            sourceUrl: "https://example.com/product",
            sectionTitle: "Hero",
            sectionBody: "Launch faster.",
            suggestedAsset: "hero-capture",
            purposeTag: "hero",
            assetForm: "screenshot",
            recommendedSceneIds: ["scene-1", "scene-2"],
            rationale: "Use this capture for early story beats.",
          },
        ],
      },
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

    assert.match(result.files["HANDOFF.md"], /Hero -> hero-capture/);
    assert.match(result.files["HANDOFF.md"], /scene-1, scene-2/);
    assert.match(result.files["HANDOFF.md"], /\[hero \/ screenshot\]/);
    assert.match(result.files["HANDOFF.md"], /SCENE_ASSET_MAP.json/);
    assert.match(result.files["HANDOFF.md"], /CAPTURE_EXECUTION_PLAN.json/);
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
    assert.match(result.package.files["index.html"], /data-composition-id/);
    assert.equal(result.scenePlan.scenes.length, 6);
    assert.equal(result.spec.width, 1920);
  });
});
