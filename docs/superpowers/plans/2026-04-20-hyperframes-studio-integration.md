# HyperFrames Studio Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Studio-to-HyperFrames integration path for mixed-input case explainer videos that produces reusable, flywheel-governed project packages.

**Architecture:** Add a Studio-owned planning pipeline above HyperFrames. Normalize raw inputs into `VideoBrief`, generate a reviewable `ScenePlan`, compile that into a `CompositionSpec`, then emit a HyperFrames-compatible project package with flywheel files. Keep HyperFrames isolated behind a render adapter boundary.

**Tech Stack:** TypeScript, JSON schemas or typed domain models, file-based project package generation, HyperFrames CLI integration, Markdown and JSON artifacts

---

## File Structure

Create or modify the following files with these responsibilities:

- Create: `F:\hyperframes\docs\architecture\video-brief-schema.md`
  - Define the `VideoBrief` contract and field semantics.
- Create: `F:\hyperframes\docs\architecture\scene-plan-schema.md`
  - Define the `ScenePlan` contract and scene catalog.
- Create: `F:\hyperframes\docs\architecture\composition-spec-schema.md`
  - Define the internal compile target before HyperFrames emission.
- Create: `F:\hyperframes\docs\architecture\flywheel-video-workflow.md`
  - Document the Studio flywheel and output-package flywheel.
- Create: `F:\hyperframes\src\video\types.ts`
  - Shared TypeScript types for `VideoBrief`, `ScenePlan`, `CompositionSpec`, and project package metadata.
- Create: `F:\hyperframes\src\video\brief\normalize.ts`
  - Normalize structured and Markdown inputs into `VideoBrief`.
- Create: `F:\hyperframes\src\video\brief\markdown.ts`
  - Parse Markdown and map sections into source material blocks.
- Create: `F:\hyperframes\src\video\planning\scene-planner.ts`
  - Generate `ScenePlan` entries for case explainer videos.
- Create: `F:\hyperframes\src\video\planning\scene-validators.ts`
  - Validate timing, density, required sections, and asset gaps.
- Create: `F:\hyperframes\src\video\compile\composition-spec.ts`
  - Convert `ScenePlan` into `CompositionSpec`.
- Create: `F:\hyperframes\src\video\render\hyperframes-adapter.ts`
  - Emit HyperFrames composition files and CLI command descriptors.
- Create: `F:\hyperframes\src\video\package\project-package.ts`
  - Generate reusable output package files such as `FLYWHEEL.md`, `VIDEO_BRIEF.json`, and `SCENE_PLAN.json`.
- Create: `F:\hyperframes\src\video\index.ts`
  - Public entry point for the video pipeline.
- Create: `F:\hyperframes\src\video\templates\case-explainer.ts`
  - First-version scene template set for case explainer output.
- Create: `F:\hyperframes\test\video\brief-normalize.test.ts`
  - Tests for mixed-input normalization.
- Create: `F:\hyperframes\test\video\scene-planner.test.ts`
  - Tests for case explainer scene planning.
- Create: `F:\hyperframes\test\video\scene-validators.test.ts`
  - Tests for review-stage validation.
- Create: `F:\hyperframes\test\video\composition-spec.test.ts`
  - Tests for plan-to-spec compilation.
- Create: `F:\hyperframes\test\video\project-package.test.ts`
  - Tests for generated package structure and required artifacts.
- Create: `F:\hyperframes\examples\case-explainer-input.md`
  - Example source document for a full pipeline test.
- Create: `F:\hyperframes\examples\generated-case-video\README.md`
  - Document expected output package layout.

## Task 1: Define the Contracts

**Files:**
- Create: `F:\hyperframes\docs\architecture\video-brief-schema.md`
- Create: `F:\hyperframes\docs\architecture\scene-plan-schema.md`
- Create: `F:\hyperframes\docs\architecture\composition-spec-schema.md`
- Create: `F:\hyperframes\src\video\types.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from "vitest";
import type { VideoBrief, ScenePlan, CompositionSpec } from "../../src/video/types";

describe("video contracts", () => {
  it("exposes the first-version video pipeline types", () => {
    const brief: VideoBrief = {
      goal: "Explain the case",
      audience: "Founders",
      format: "16:9",
      style: { tone: "direct", pacing: "medium", brandName: "Studio" },
      sourceMaterials: [],
      constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
      outputType: "case-explainer",
    };

    const scenePlan: ScenePlan = {
      totalDurationSec: 60,
      scenes: [],
    };

    const spec: CompositionSpec = {
      width: 1920,
      height: 1080,
      fps: 30,
      durationSec: 60,
      scenes: [],
      theme: { palette: "default" },
    };

    expect(brief.outputType).toBe("case-explainer");
    expect(scenePlan.scenes).toEqual([]);
    expect(spec.fps).toBe(30);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video\brief-normalize.test.ts`
Expected: FAIL because `src/video/types.ts` and the referenced types do not exist yet.

- [ ] **Step 3: Write the contracts and schema docs**

```ts
export type VideoFormat = "16:9" | "9:16";
export type OutputType = "case-explainer" | "product-demo" | "social-short";

export interface VideoStyle {
  tone: string;
  pacing: "slow" | "medium" | "fast";
  brandName: string;
}

export interface VideoConstraintSet {
  maxDurationSec: number;
  requiredPoints: string[];
  bannedTerms: string[];
}

export interface SourceMaterial {
  kind: "markdown" | "structured";
  title: string;
  body: string;
}

export interface VideoBrief {
  goal: string;
  audience: string;
  format: VideoFormat;
  style: VideoStyle;
  sourceMaterials: SourceMaterial[];
  constraints: VideoConstraintSet;
  outputType: OutputType;
}

export interface Scene {
  sceneId: string;
  purpose: string;
  startTimeSec: number;
  durationSec: number;
  narration: string;
  onScreenText: string[];
  visualType:
    | "cover"
    | "problem"
    | "solution"
    | "workflow"
    | "highlights"
    | "ending";
  assets: string[];
  transition: string;
  validationNotes: string[];
}

export interface ScenePlan {
  totalDurationSec: number;
  scenes: Scene[];
}

export interface CompositionScene {
  sceneId: string;
  htmlTemplate: string;
  cssClassNames: string[];
  assetRefs: string[];
}

export interface CompositionSpec {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  scenes: CompositionScene[];
  theme: {
    palette: string;
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video\brief-normalize.test.ts`
Expected: PASS with one passing contract test.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture/video-brief-schema.md docs/architecture/scene-plan-schema.md docs/architecture/composition-spec-schema.md src/video/types.ts test/video/brief-normalize.test.ts
git commit -m "feat: define video pipeline contracts"
```

## Task 2: Normalize Mixed Inputs into VideoBrief

**Files:**
- Create: `F:\hyperframes\src\video\brief\normalize.ts`
- Create: `F:\hyperframes\src\video\brief\markdown.ts`
- Modify: `F:\hyperframes\src\video\types.ts`
- Test: `F:\hyperframes\test\video\brief-normalize.test.ts`
- Create: `F:\hyperframes\examples\case-explainer-input.md`

- [ ] **Step 1: Write the failing normalization test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeVideoBriefInput } from "../../src/video/brief/normalize";

describe("normalizeVideoBriefInput", () => {
  it("converts markdown input into a case-explainer VideoBrief", () => {
    const brief = normalizeVideoBriefInput({
      inputType: "markdown",
      markdown: "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
      defaults: {
        goal: "Explain the solution",
        audience: "Internal team",
        format: "16:9",
        outputType: "case-explainer",
      },
    });

    expect(brief.outputType).toBe("case-explainer");
    expect(brief.sourceMaterials[0]?.kind).toBe("markdown");
    expect(brief.goal).toBe("Explain the solution");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video\brief-normalize.test.ts`
Expected: FAIL because `normalizeVideoBriefInput` does not exist.

- [ ] **Step 3: Write the minimal normalization implementation**

```ts
import type { OutputType, VideoBrief, VideoFormat } from "../types";

interface NormalizeMarkdownInput {
  inputType: "markdown";
  markdown: string;
  defaults: {
    goal: string;
    audience: string;
    format: VideoFormat;
    outputType: OutputType;
  };
}

export function normalizeVideoBriefInput(input: NormalizeMarkdownInput): VideoBrief {
  return {
    goal: input.defaults.goal,
    audience: input.defaults.audience,
    format: input.defaults.format,
    style: {
      tone: "direct",
      pacing: "medium",
      brandName: "Studio",
    },
    sourceMaterials: [
      {
        kind: "markdown",
        title: "Imported Markdown",
        body: input.markdown,
      },
    ],
    constraints: {
      maxDurationSec: 60,
      requiredPoints: [],
      bannedTerms: [],
    },
    outputType: input.defaults.outputType,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video\brief-normalize.test.ts`
Expected: PASS with normalization behavior covered.

- [ ] **Step 5: Commit**

```bash
git add src/video/brief/normalize.ts src/video/brief/markdown.ts src/video/types.ts test/video/brief-normalize.test.ts examples/case-explainer-input.md
git commit -m "feat: normalize mixed input into video briefs"
```

## Task 3: Generate the First-Version ScenePlan

**Files:**
- Create: `F:\hyperframes\src\video\templates\case-explainer.ts`
- Create: `F:\hyperframes\src\video\planning\scene-planner.ts`
- Test: `F:\hyperframes\test\video\scene-planner.test.ts`

- [ ] **Step 1: Write the failing scene planning test**

```ts
import { describe, expect, it } from "vitest";
import { planCaseExplainerScenes } from "../../src/video/planning/scene-planner";

describe("planCaseExplainerScenes", () => {
  it("creates the fixed first-version scene sequence", () => {
    const plan = planCaseExplainerScenes({
      goal: "Explain the case",
      audience: "Founders",
      format: "16:9",
      style: { tone: "direct", pacing: "medium", brandName: "Studio" },
      sourceMaterials: [{ kind: "markdown", title: "Case", body: "# Problem\nA\n# Solution\nB" }],
      constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
      outputType: "case-explainer",
    });

    expect(plan.scenes.map((scene) => scene.visualType)).toEqual([
      "cover",
      "problem",
      "solution",
      "workflow",
      "highlights",
      "ending",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video\scene-planner.test.ts`
Expected: FAIL because the planner does not exist.

- [ ] **Step 3: Implement the minimal case explainer planner**

```ts
import type { ScenePlan, VideoBrief } from "../types";

const VISUAL_SEQUENCE = ["cover", "problem", "solution", "workflow", "highlights", "ending"] as const;

export function planCaseExplainerScenes(brief: VideoBrief): ScenePlan {
  const durationPerScene = Math.floor(brief.constraints.maxDurationSec / VISUAL_SEQUENCE.length);

  return {
    totalDurationSec: durationPerScene * VISUAL_SEQUENCE.length,
    scenes: VISUAL_SEQUENCE.map((visualType, index) => ({
      sceneId: `scene-${index + 1}`,
      purpose: visualType,
      startTimeSec: index * durationPerScene,
      durationSec: durationPerScene,
      narration: `${brief.goal} - ${visualType}`,
      onScreenText: [brief.goal, visualType],
      visualType,
      assets: [],
      transition: "fade",
      validationNotes: [],
    })),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video\scene-planner.test.ts`
Expected: PASS with the first-version sequence locked in.

- [ ] **Step 5: Commit**

```bash
git add src/video/templates/case-explainer.ts src/video/planning/scene-planner.ts test/video/scene-planner.test.ts
git commit -m "feat: add first-version case explainer planner"
```

## Task 4: Add Review-Stage Scene Validators

**Files:**
- Create: `F:\hyperframes\src\video\planning\scene-validators.ts`
- Test: `F:\hyperframes\test\video\scene-validators.test.ts`

- [ ] **Step 1: Write the failing validator test**

```ts
import { describe, expect, it } from "vitest";
import { validateScenePlan } from "../../src/video/planning/scene-validators";

describe("validateScenePlan", () => {
  it("flags scenes that exceed the max duration", () => {
    const result = validateScenePlan(
      {
        totalDurationSec: 80,
        scenes: [],
      },
      { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
    );

    expect(result).toContain("total duration exceeds maxDurationSec");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video\scene-validators.test.ts`
Expected: FAIL because the validator does not exist.

- [ ] **Step 3: Implement the minimal review validator**

```ts
import type { ScenePlan, VideoConstraintSet } from "../types";

export function validateScenePlan(plan: ScenePlan, constraints: VideoConstraintSet): string[] {
  const issues: string[] = [];

  if (plan.totalDurationSec > constraints.maxDurationSec) {
    issues.push("total duration exceeds maxDurationSec");
  }

  if (plan.scenes.length === 0) {
    issues.push("scene plan must include at least one scene");
  }

  return issues;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video\scene-validators.test.ts`
Expected: PASS with review-stage failure conditions covered.

- [ ] **Step 5: Commit**

```bash
git add src/video/planning/scene-validators.ts test/video/scene-validators.test.ts
git commit -m "feat: add scene plan review validators"
```

## Task 5: Compile ScenePlan into CompositionSpec

**Files:**
- Create: `F:\hyperframes\src\video\compile\composition-spec.ts`
- Test: `F:\hyperframes\test\video\composition-spec.test.ts`

- [ ] **Step 1: Write the failing composition compile test**

```ts
import { describe, expect, it } from "vitest";
import { compileCompositionSpec } from "../../src/video/compile/composition-spec";

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

    expect(spec.width).toBe(1920);
    expect(spec.height).toBe(1080);
    expect(spec.scenes[0]?.sceneId).toBe("scene-1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video\composition-spec.test.ts`
Expected: FAIL because the compiler does not exist.

- [ ] **Step 3: Implement the minimal composition compiler**

```ts
import type { CompositionSpec, ScenePlan, VideoFormat } from "../types";

export function compileCompositionSpec(input: ScenePlan & { format: VideoFormat }): CompositionSpec {
  const dimensions =
    input.format === "16:9"
      ? { width: 1920, height: 1080 }
      : { width: 1080, height: 1920 };

  return {
    ...dimensions,
    fps: 30,
    durationSec: input.totalDurationSec,
    scenes: input.scenes.map((scene) => ({
      sceneId: scene.sceneId,
      htmlTemplate: `<section data-scene-id="${scene.sceneId}"></section>`,
      cssClassNames: [scene.visualType],
      assetRefs: scene.assets,
    })),
    theme: {
      palette: "default",
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video\composition-spec.test.ts`
Expected: PASS with dimensions and scene mapping verified.

- [ ] **Step 5: Commit**

```bash
git add src/video/compile/composition-spec.ts test/video/composition-spec.test.ts
git commit -m "feat: compile scene plans into composition specs"
```

## Task 6: Emit HyperFrames-Compatible Output

**Files:**
- Create: `F:\hyperframes\src\video\render\hyperframes-adapter.ts`
- Test: `F:\hyperframes\test\video\project-package.test.ts`

- [ ] **Step 1: Write the failing adapter test**

```ts
import { describe, expect, it } from "vitest";
import { emitHyperframesComposition } from "../../src/video/render/hyperframes-adapter";

describe("emitHyperframesComposition", () => {
  it("emits a composition HTML string with the composition root attributes", () => {
    const output = emitHyperframesComposition({
      width: 1920,
      height: 1080,
      fps: 30,
      durationSec: 60,
      scenes: [{ sceneId: "scene-1", htmlTemplate: "<section>Intro</section>", cssClassNames: ["cover"], assetRefs: [] }],
      theme: { palette: "default" },
    });

    expect(output.html).toContain('data-composition-id="case-explainer"');
    expect(output.html).toContain("<section>Intro</section>");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video\project-package.test.ts`
Expected: FAIL because the adapter does not exist.

- [ ] **Step 3: Implement the minimal HyperFrames adapter**

```ts
import type { CompositionSpec } from "../types";

export function emitHyperframesComposition(spec: CompositionSpec) {
  const html = [
    `<div id="stage" data-composition-id="case-explainer" data-width="${spec.width}" data-height="${spec.height}">`,
    ...spec.scenes.map((scene) => scene.htmlTemplate),
    "</div>",
  ].join("");

  return {
    html,
    commands: {
      preview: "npx hyperframes preview",
      lint: "npx hyperframes lint",
      validate: "npx hyperframes validate",
      render: "npx hyperframes render",
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video\project-package.test.ts`
Expected: PASS with HTML output and command descriptors verified.

- [ ] **Step 5: Commit**

```bash
git add src/video/render/hyperframes-adapter.ts test/video/project-package.test.ts
git commit -m "feat: emit hyperframes-compatible compositions"
```

## Task 7: Generate the Reusable Project Package

**Files:**
- Create: `F:\hyperframes\src\video\package\project-package.ts`
- Modify: `F:\hyperframes\test\video\project-package.test.ts`
- Create: `F:\hyperframes\examples\generated-case-video\README.md`

- [ ] **Step 1: Write the failing project package test**

```ts
import { describe, expect, it } from "vitest";
import { createVideoProjectPackage } from "../../src/video/package/project-package";

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
      compositionHtml: "<div></div>",
    });

    expect(Object.keys(result.files)).toEqual(
      expect.arrayContaining([
        "FLYWHEEL.md",
        "VIDEO_BRIEF.json",
        "SCENE_PLAN.json",
        "COMMANDS.md",
        "GUARDRAILS.md",
        "RETRO_LOG.md",
        "composition.html",
      ]),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video\project-package.test.ts`
Expected: FAIL because the package generator does not exist.

- [ ] **Step 3: Implement the minimal package generator**

```ts
import type { ScenePlan, VideoBrief } from "../types";

export function createVideoProjectPackage(input: {
  projectName: string;
  brief: VideoBrief;
  scenePlan: ScenePlan;
  compositionHtml: string;
}) {
  return {
    projectName: input.projectName,
    files: {
      "FLYWHEEL.md": "# Flywheel\n\nIntake -> Plan -> Review -> Compose -> Render -> Retro\n",
      "VIDEO_BRIEF.json": JSON.stringify(input.brief, null, 2),
      "SCENE_PLAN.json": JSON.stringify(input.scenePlan, null, 2),
      "COMMANDS.md": "npx hyperframes preview\nnpx hyperframes lint\nnpx hyperframes validate\nnpx hyperframes render\n",
      "GUARDRAILS.md": "# Guardrails\n\nReview ScenePlan before render.\n",
      "RETRO_LOG.md": "# Retro Log\n\n- Initial generation\n",
      "composition.html": input.compositionHtml,
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video\project-package.test.ts`
Expected: PASS with all required project files present.

- [ ] **Step 5: Commit**

```bash
git add src/video/package/project-package.ts test/video/project-package.test.ts examples/generated-case-video/README.md
git commit -m "feat: generate reusable video project packages"
```

## Task 8: Wire the First-Version Pipeline Entry Point

**Files:**
- Create: `F:\hyperframes\src\video\index.ts`
- Modify: `F:\hyperframes\src\video\brief\normalize.ts`
- Modify: `F:\hyperframes\src\video\planning\scene-planner.ts`
- Modify: `F:\hyperframes\src\video\compile\composition-spec.ts`
- Modify: `F:\hyperframes\src\video\render\hyperframes-adapter.ts`
- Modify: `F:\hyperframes\src\video\package\project-package.ts`

- [ ] **Step 1: Write the failing end-to-end pipeline test**

```ts
import { describe, expect, it } from "vitest";
import { buildCaseExplainerVideoProject } from "../../src/video";

describe("buildCaseExplainerVideoProject", () => {
  it("runs the first-version pipeline from markdown input to project package", () => {
    const result = buildCaseExplainerVideoProject({
      inputType: "markdown",
      markdown: "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
      defaults: {
        goal: "Explain the system",
        audience: "Internal team",
        format: "16:9",
        outputType: "case-explainer",
      },
      projectName: "case-video",
    });

    expect(result.package.files["VIDEO_BRIEF.json"]).toContain("\"goal\": \"Explain the system\"");
    expect(result.package.files["composition.html"]).toContain("data-composition-id");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test F:\hyperframes\test\video`
Expected: FAIL because the public entry point does not exist.

- [ ] **Step 3: Implement the minimal first-version pipeline**

```ts
import { normalizeVideoBriefInput } from "./brief/normalize";
import { compileCompositionSpec } from "./compile/composition-spec";
import { createVideoProjectPackage } from "./package/project-package";
import { planCaseExplainerScenes } from "./planning/scene-planner";
import { validateScenePlan } from "./planning/scene-validators";
import { emitHyperframesComposition } from "./render/hyperframes-adapter";

export function buildCaseExplainerVideoProject(input: {
  inputType: "markdown";
  markdown: string;
  defaults: {
    goal: string;
    audience: string;
    format: "16:9" | "9:16";
    outputType: "case-explainer";
  };
  projectName: string;
}) {
  const brief = normalizeVideoBriefInput(input);
  const scenePlan = planCaseExplainerScenes(brief);
  const reviewIssues = validateScenePlan(scenePlan, brief.constraints);

  if (reviewIssues.length > 0) {
    throw new Error(`Scene plan validation failed: ${reviewIssues.join(", ")}`);
  }

  const spec = compileCompositionSpec({ ...scenePlan, format: brief.format });
  const composition = emitHyperframesComposition(spec);
  const projectPackage = createVideoProjectPackage({
    projectName: input.projectName,
    brief,
    scenePlan,
    compositionHtml: composition.html,
  });

  return {
    brief,
    scenePlan,
    spec,
    composition,
    package: projectPackage,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test F:\hyperframes\test\video`
Expected: PASS with the first-version pipeline verified end-to-end.

- [ ] **Step 5: Commit**

```bash
git add src/video/index.ts src/video/brief/normalize.ts src/video/planning/scene-planner.ts src/video/compile/composition-spec.ts src/video/render/hyperframes-adapter.ts src/video/package/project-package.ts test/video
git commit -m "feat: wire first-version studio video pipeline"
```

## Self-Review Checklist

- Spec coverage:
  - Studio-owned planning layer: covered in Tasks 1-4 and 8.
  - HyperFrames as render backend: covered in Tasks 5-6.
  - Reusable package with flywheel files: covered in Task 7.
  - Narrow first-version scope for case explainer videos: covered in Tasks 3 and 8.
- Placeholder scan:
  - No `TODO`, `TBD`, or deferred implementation placeholders remain in task steps.
- Type consistency:
  - `VideoBrief`, `ScenePlan`, and `CompositionSpec` names are used consistently throughout the plan.
