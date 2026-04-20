import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseMarkdownSourceMaterials } from "../../src/video/brief/markdown.js";
import { normalizeVideoBriefInput } from "../../src/video/brief/normalize.js";

const fixturePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../examples/case-explainer-input.md",
);

describe("normalizeVideoBriefInput", () => {
  it("converts markdown input into a case-explainer VideoBrief", () => {
    const brief = normalizeVideoBriefInput({
      inputType: "markdown",
      markdown:
        "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
      defaults: {
        goal: "Explain the solution",
        audience: "Internal team",
        format: "16:9",
        outputType: "case-explainer",
      },
    });

    assert.equal(brief.outputType, "case-explainer");
    assert.equal(brief.goal, "Explain the solution");
    assert.equal(brief.audience, "Internal team");
    assert.equal(brief.format, "16:9");
    assert.deepEqual(brief.style, {
      tone: "direct",
      pacing: "medium",
      brandName: "Studio",
    });
    assert.deepEqual(brief.constraints, {
      maxDurationSec: 60,
      requiredPoints: [],
      bannedTerms: [],
    });
    assert.equal(brief.sourceMaterials.length, 2);
    assert.deepEqual(brief.sourceMaterials[0], {
      kind: "markdown",
      title: "Problem",
      body: "Teams need reusable video output.",
    });
  });

  it("rejects unsupported output types in the markdown path", () => {
    assert.throws(
      () =>
        normalizeVideoBriefInput({
          inputType: "markdown",
          markdown: "# Problem\nTeams need reusable video output.",
          defaults: {
            goal: "Explain the solution",
            audience: "Internal team",
            format: "16:9",
            outputType: "product-demo",
          },
        }),
      /Markdown normalization only supports case-explainer outputType/,
    );
  });

  it("normalizes the case explainer fixture markdown into source materials", () => {
    const markdown = readFileSync(fixturePath, "utf8");

    const brief = normalizeVideoBriefInput({
      inputType: "markdown",
      markdown,
      defaults: {
        goal: "Explain the case",
        audience: "Founders",
        format: "16:9",
        outputType: "case-explainer",
      },
    });

    assert.equal(brief.sourceMaterials.length, 3);
    assert.deepEqual(
      brief.sourceMaterials.map((material: { title: string }) => material.title),
      ["Problem", "Solution", "Success Criteria"],
    );
  });
});

describe("parseMarkdownSourceMaterials", () => {
  it("skips empty titled sections", () => {
    const materials = parseMarkdownSourceMaterials(
      "# Problem\n\n# Solution\nUse Studio plus HyperFrames.",
    );

    assert.equal(materials.length, 1);
    assert.deepEqual(materials[0], {
      kind: "markdown",
      title: "Solution",
      body: "Use Studio plus HyperFrames.",
    });
  });
});
