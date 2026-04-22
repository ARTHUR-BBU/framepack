import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "../dist/interfaces/cli/index.js";
import { compileMarkdownSourceBundle } from "../dist/ingest/markdown/index.js";
import {
  compileWebsiteSourceBundle,
  extractWebsiteContent,
  fetchWebsiteSourceBundle,
} from "../dist/ingest/website/index.js";
import { compileVideoBrief } from "../dist/planning/brief/index.js";
import { buildAssetPlan } from "../dist/planning/assets/index.js";
import { normalizeVideoBriefInput } from "../dist/video/brief/normalize.js";
import { buildScript } from "../dist/planning/script/index.js";
import { buildStoryboard } from "../dist/planning/storyboard/index.js";
import { parseMarkdownSourceMaterials } from "../dist/video/brief/markdown.js";
import { compileCompositionSpec } from "../dist/video/compile/composition-spec.js";
import {
  createVideoProjectPackage,
  writeVideoProjectPackage,
} from "../dist/video/package/project-package.js";
import {
  createHyperframesRuntimeAdapter,
  detectHyperframesCapabilities,
} from "../dist/runtime/hyperframes/adapter.js";
import { buildHyperframesCommandSpec } from "../dist/runtime/hyperframes/commands.js";
import { executeHyperframesCommand } from "../dist/runtime/hyperframes/execution.js";
import {
  createMissingHyperframesCapabilities,
  detectLocalHyperframesCapabilities,
  parseHyperframesVersion,
  resolveHyperframesBinary,
} from "../dist/runtime/hyperframes/discovery.js";
import { planCaseExplainerScenes } from "../dist/video/planning/scene-planner.js";
import { validateScenePlan } from "../dist/video/planning/scene-validators.js";
import { emitHyperframesComposition } from "../dist/video/render/hyperframes-adapter.js";
import { buildCaseExplainerVideoProject } from "../dist/video/index.js";
import {
  compileWebsiteCaseExplainerProject,
  compileWebsiteVideoBrief,
} from "../dist/compiler/index.js";

const fixturePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../examples/case-explainer-input.md",
);
const readmePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../README.md",
);

const tests = [
  {
    name: "parse and normalize detected HyperFrames versions",
    run: () => {
      assert.equal(parseHyperframesVersion("hyperframes/0.4.11\n"), "0.4.11");
      assert.equal(parseHyperframesVersion("0.4.12"), "0.4.12");
      assert.equal(parseHyperframesVersion("F:/repo/node_modules/.bin/hyperframes.cmd 0.4.11\n"), "0.4.11");
      assert.equal(parseHyperframesVersion(""), "unknown");
    },
  },
  {
    name: "create missing runtime capabilities with actionable fallback notes",
    run: () => {
      const capabilities = createMissingHyperframesCapabilities({
        binary: "hyperframes",
      });

      assert.equal(capabilities.available, false);
      assert.equal(capabilities.binary, "hyperframes");
      assert.equal(capabilities.version, "unknown");
      assert.ok(capabilities.fallbackNotes.some((note) => note.includes("not installed")));
      assert.ok(capabilities.detectedAt.length > 0);
    },
  },
  {
    name: "resolve local HyperFrames binary from node_modules bin directory",
    run: () => {
      const binary = resolveHyperframesBinary({
        cwd: "F:/repo",
        platform: "win32",
        exists: (candidate) =>
          candidate.replaceAll("\\", "/") === "F:/repo/node_modules/.bin/hyperframes.cmd",
      });

      assert.match(binary.replaceAll("\\", "/"), /F:\/repo\/node_modules\/\.bin\/hyperframes\.cmd$/);
    },
  },
  {
    name: "detect local runtime capabilities from a version probe",
    run: () => {
      const capabilities = detectLocalHyperframesCapabilities({
        cwd: "F:/repo",
        now: () => "2026-04-22T09:00:00.000Z",
        exists: (candidate) =>
          candidate.replaceAll("\\", "/") === "F:/repo/node_modules/.bin/hyperframes.cmd",
        runner: (binary) => ({
          status: 0,
          stdout: `${binary} 0.4.11\n`,
          stderr: "",
        }),
      });

      assert.equal(capabilities.available, true);
      assert.match(
        capabilities.binary.replaceAll("\\", "/"),
        /F:\/repo\/node_modules\/\.bin\/hyperframes\.cmd$/,
      );
      assert.equal(capabilities.version, "0.4.11");
      assert.equal(capabilities.detectedAt, "2026-04-22T09:00:00.000Z");
      assert.ok(capabilities.supportedCommands.includes("preview"));
    },
  },
  {
    name: "fallback to plain hyperframes binary when no local install exists",
    run: () => {
      const capabilities = detectLocalHyperframesCapabilities({
        binary: "hyperframes",
        cwd: "F:/repo",
        now: () => "2026-04-22T09:00:00.000Z",
        exists: () => false,
        runner: (binary) => ({
          status: 0,
          stdout: `${binary} 0.4.12\n`,
          stderr: "",
        }),
      });

      assert.equal(capabilities.available, true);
      assert.equal(capabilities.binary, "hyperframes");
      assert.equal(capabilities.version, "0.4.12");
    },
  },
  {
    name: "detect runtime capabilities from the real local install",
    run: () => {
      const capabilities = detectLocalHyperframesCapabilities({
        cwd: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
      });

      assert.match(capabilities.binary, /hyperframes(\.cmd)?$/);
      assert.ok(capabilities.available === true || capabilities.available === false);
      assert.ok(capabilities.version === "0.4.12" || capabilities.version === "unknown");
    },
  },
  {
    name: "extract structured website content from HTML",
    run: () => {
      const extracted = extractWebsiteContent({
        url: "https://example.com/product",
        html: `
          <!doctype html>
          <html>
            <head>
              <title>Example Product</title>
              <meta name="description" content="A product landing page for founders." />
            </head>
            <body>
              <h1>Launch faster</h1>
              <p>Ship reusable video workflows.</p>
              <h2>Review gates</h2>
              <p>Keep output quality stable.</p>
            </body>
          </html>
        `,
      });

      assert.equal(extracted.title, "Example Product");
      assert.equal(extracted.summary, "A product landing page for founders.");
      assert.equal(extracted.sections.length, 2);
      assert.equal(extracted.sections[0]?.title, "Launch faster");
      assert.match(extracted.sections[0]?.body ?? "", /Ship reusable video workflows/);
    },
  },
  {
    name: "fetch and compile website input from a URL",
    run: async () => {
      const sourceBundle = await fetchWebsiteSourceBundle({
        url: "https://example.com/product",
        fetchImpl: async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Example Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          ),
      });

      assert.equal(sourceBundle.sourceType, "website");
      assert.equal(sourceBundle.rawInputs.title, "Example Product");
      assert.equal(sourceBundle.collectedArtifacts.length, 2);
    },
  },
  {
    name: "fail website fetch when extracted content is empty",
    run: async () => {
      await assert.rejects(
        () =>
          fetchWebsiteSourceBundle({
            url: "https://example.com/empty",
            fetchImpl: async () =>
              new Response("<html><head></head><body></body></html>", {
                status: 200,
                headers: { "Content-Type": "text/html" },
              }),
          }),
        /Extracted website content is empty/,
      );
    },
  },
  {
    name: "fail website fetch when response is not HTML",
    run: async () => {
      await assert.rejects(
        () =>
          fetchWebsiteSourceBundle({
            url: "https://example.com/data.json",
            fetchImpl: async () =>
              new Response('{"ok":true}', {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }),
          }),
        /Expected HTML content/,
      );
    },
  },
  {
    name: "compile website input into a SourceBundle",
    run: () => {
      const sourceBundle = compileWebsiteSourceBundle({
        url: "https://example.com/product",
        title: "Example Product",
        summary: "A product landing page for founders.",
        sections: [
          { title: "Hero", body: "Launch faster with a reusable workflow." },
          { title: "Features", body: "Templates, video output, and review gates." },
        ],
      });

      assert.equal(sourceBundle.sourceType, "website");
      assert.equal(sourceBundle.rawInputs.url, "https://example.com/product");
      assert.equal(sourceBundle.collectedArtifacts.length, 2);
      assert.equal(sourceBundle.collectedArtifacts[0]?.title, "Hero");
    },
  },
  {
    name: "compile a VideoBrief from a website SourceBundle",
    run: () => {
      const sourceBundle = compileWebsiteSourceBundle({
        url: "https://example.com/product",
        title: "Example Product",
        summary: "A product landing page for founders.",
        sections: [
          { title: "Hero", body: "Launch faster with a reusable workflow." },
          { title: "Features", body: "Templates, video output, and review gates." },
        ],
      });

      const brief = compileVideoBrief({
        sourceBundle,
        defaults: {
          goal: "Explain the product",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(brief.goal, "Explain the product");
      assert.equal(brief.sourceMaterials.length, 2);
      assert.equal(brief.sourceMaterials[0]?.kind, "structured");
      assert.match(brief.sourceMaterials[0]?.body ?? "", /https:\/\/example\.com\/product/);
    },
  },
  {
    name: "compile website input through the compiler entrypoint",
    run: () => {
      const result = compileWebsiteVideoBrief({
        url: "https://example.com/product",
        title: "Example Product",
        summary: "A product landing page for founders.",
        sections: [
          { title: "Hero", body: "Launch faster with a reusable workflow." },
        ],
        defaults: {
          goal: "Explain the product",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(result.sourceBundle.sourceType, "website");
      assert.equal(result.brief.goal, "Explain the product");
      assert.equal(result.brief.sourceMaterials.length, 1);
    },
  },
  {
    name: "compile website input into a case-explainer project package",
    run: async () => {
      const result = await compileWebsiteCaseExplainerProject({
        url: "https://example.com/product",
        projectName: "website-case-video",
        defaults: {
          goal: "Explain the product",
          audience: "Founders",
          format: "16:9",
          outputType: "case-explainer",
        },
        fetchImpl: async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Example Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          ),
      });

      assert.equal(result.brief.goal, "Explain the product");
      assert.equal(result.validationReport.status, "passed");
      assert.match(result.package.files["SOURCE_MANIFEST.json"], /"sourceType": "website"/);
      assert.match(result.package.files["SOURCE_MANIFEST.json"], /"url": "https:\/\/example.com\/product"/);
      assert.match(result.package.files["ASSET_PLAN.json"], /"captureTargets": \[/);
      assert.match(result.package.files["ASSET_PLAN.json"], /"purposeTag": "hero"/);
      assert.match(result.package.files["ASSET_PLAN.json"], /"assetForm": "screenshot"/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"scenes": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"captures": \[/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"sceneId": "scene-1"/);
      assert.match(result.package.files["SCENE_ASSET_MAP.json"], /"suggestedAsset": "launch-faster-capture"/);
      assert.match(result.package.files["HANDOFF.md"], /Capture targets:/);
      assert.match(result.package.files["HANDOFF.md"], /SCENE_ASSET_MAP.json/);
      assert.match(result.package.files["HANDOFF.md"], /scene-1, scene-2/);
      assert.match(result.package.files["HANDOFF.md"], /hero/);
      assert.match(result.package.files["HANDOFF.md"], /screenshot/);
    },
  },
  {
    name: "fail website project compilation when fetch fails",
    run: async () => {
      await assert.rejects(
        () =>
          compileWebsiteCaseExplainerProject({
            url: "https://example.com/missing",
            projectName: "website-case-video",
            defaults: {
              goal: "Explain the product",
              audience: "Founders",
              format: "16:9",
              outputType: "case-explainer",
            },
            fetchImpl: async () =>
              new Response("nope", {
                status: 404,
              }),
          }),
        /Failed to fetch website/,
      );
    },
  },
  {
    name: "compile markdown into a SourceBundle",
    run: () => {
      const sourceBundle = compileMarkdownSourceBundle({
        markdown: "# Problem\nTeams need reusable video output.",
      });

      assert.equal(sourceBundle.sourceType, "markdown");
      assert.equal(sourceBundle.rawInputs.markdown, "# Problem\nTeams need reusable video output.");
      assert.equal(sourceBundle.collectedArtifacts.length, 1);
    },
  },
  {
    name: "compile a VideoBrief from a SourceBundle",
    run: () => {
      const sourceBundle = compileMarkdownSourceBundle({
        markdown:
          "# Problem\nTeams need reusable video output.\n\n# Solution\nUse Studio plus HyperFrames.",
      });

      const brief = compileVideoBrief({
        sourceBundle,
        defaults: {
          goal: "Explain the solution",
          audience: "Internal team",
          format: "16:9",
          outputType: "case-explainer",
        },
      });

      assert.equal(brief.goal, "Explain the solution");
      assert.equal(brief.outputType, "case-explainer");
      assert.equal(brief.sourceMaterials.length, 2);
      assert.deepEqual(brief.constraints, {
        maxDurationSec: 60,
        requiredPoints: [],
        bannedTerms: [],
      });
    },
  },
  {
    name: "normalize markdown into a case-explainer VideoBrief",
    run: () => {
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
      assert.equal(brief.sourceMaterials.length, 2);
      assert.deepEqual(brief.style, {
        tone: "direct",
        pacing: "medium",
        brandName: "Studio",
      });
    },
  },
  {
    name: "reject unsupported output types in markdown normalization",
    run: () => {
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
        /Video brief compilation only supports case-explainer outputType/,
      );
    },
  },
  {
    name: "reject unsupported output types in website brief compilation",
    run: () => {
      assert.throws(
        () =>
          compileWebsiteVideoBrief({
            url: "https://example.com/product",
            title: "Example Product",
            summary: "A product landing page for founders.",
            sections: [
              { title: "Hero", body: "Launch faster with a reusable workflow." },
            ],
            defaults: {
              goal: "Explain the product",
              audience: "Founders",
              format: "16:9",
              outputType: "product-demo",
            },
          }),
        /Video brief compilation only supports case-explainer outputType/,
      );
    },
  },
  {
    name: "parse fixture markdown into three source materials",
    run: () => {
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

      assert.deepEqual(
        brief.sourceMaterials.map((material) => material.title),
        ["Problem", "Solution", "Success Criteria"],
      );
    },
  },
  {
    name: "skip empty titled markdown sections",
    run: () => {
      const materials = parseMarkdownSourceMaterials(
        "# Problem\n\n# Solution\nUse Studio plus HyperFrames.",
      );

      assert.equal(materials.length, 1);
      assert.equal(materials[0]?.title, "Solution");
    },
  },
  {
    name: "plan the fixed first-version scene sequence",
    run: () => {
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
      assert.deepEqual(plan.scenes.map((scene) => scene.visualType), [
        "cover",
        "problem",
        "solution",
        "workflow",
        "highlights",
        "ending",
      ]);
    },
  },
  {
    name: "build script, storyboard, and asset plan from a scene plan",
    run: () => {
      const scenePlan = planCaseExplainerScenes({
        goal: "Explain the case",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [{ kind: "markdown", title: "Case", body: "# Problem\nA\n# Solution\nB" }],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      const script = buildScript({ scenePlan });
      const storyboard = buildStoryboard({ scenePlan });
      const assetPlan = buildAssetPlan({ scenePlan });

      assert.equal(script.scenes.length, scenePlan.scenes.length);
      assert.equal(storyboard.scenes.length, scenePlan.scenes.length);
      assert.equal(assetPlan.availableAssets.length, 0);
      assert.equal(assetPlan.placeholderAssets.length, scenePlan.scenes.length);
      assert.equal(assetPlan.captureTargets.length, 0);
    },
  },
  {
    name: "build website asset plan with capture targets from source manifest",
    run: () => {
      const scenePlan = planCaseExplainerScenes({
        goal: "Explain the site",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [{ kind: "structured", title: "Hero", body: "Launch faster" }],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      const assetPlan = buildAssetPlan({
        scenePlan,
        sourceManifest: {
          sourceType: "website",
          url: "https://example.com/product",
          title: "Example Product",
          summary: "A product landing page for founders.",
          sections: [
            { title: "Hero", body: "Launch faster with reusable workflows." },
            { title: "Review gates", body: "Keep output quality stable." },
          ],
          collectedAt: "2026-04-22T12:00:00.000Z",
        },
      });

      assert.equal(assetPlan.captureTargets.length, 2);
      assert.equal(assetPlan.captureTargets[0]?.sourceUrl, "https://example.com/product");
      assert.match(assetPlan.captureTargets[0]?.suggestedAsset ?? "", /hero/i);
      assert.equal(assetPlan.captureTargets[0]?.purposeTag, "hero");
      assert.equal(assetPlan.captureTargets[0]?.assetForm, "screenshot");
      assert.deepEqual(assetPlan.captureTargets[0]?.recommendedSceneIds, ["scene-1", "scene-2"]);
      assert.match(assetPlan.captureTargets[0]?.rationale ?? "", /early story beats/i);
      assert.equal(assetPlan.captureTargets[1]?.purposeTag, "proof");
      assert.equal(assetPlan.captureTargets[1]?.assetForm, "text-overlay");
      assert.deepEqual(assetPlan.captureTargets[1]?.recommendedSceneIds, ["scene-3", "scene-4", "scene-5"]);
      assert.ok(assetPlan.missingAssets.some((item) => item.includes("capture:hero")));
    },
  },
  {
    name: "fall back website capture tags conservatively when no strong rule matches",
    run: () => {
      const scenePlan = planCaseExplainerScenes({
        goal: "Explain the site",
        audience: "Founders",
        format: "16:9",
        style: { tone: "direct", pacing: "medium", brandName: "Studio" },
        sourceMaterials: [{ kind: "structured", title: "Overview", body: "General overview" }],
        constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
        outputType: "case-explainer",
      });

      const assetPlan = buildAssetPlan({
        scenePlan,
        sourceManifest: {
          sourceType: "website",
          url: "https://example.com/product",
          title: "Example Product",
          summary: "A product landing page for founders.",
          sections: [
            { title: "Overview", body: "General overview and positioning." },
            { title: "More details", body: "Additional information without special signals." },
            { title: "Closing note", body: "A general closing section." },
          ],
          collectedAt: "2026-04-22T12:00:00.000Z",
        },
      });

      assert.equal(assetPlan.captureTargets[1]?.purposeTag, "highlight");
      assert.equal(assetPlan.captureTargets[1]?.assetForm, "section-card");
    },
  },
  {
    name: "reject unsupported scene-planning output types",
    run: () => {
      assert.throws(
        () =>
          planCaseExplainerScenes({
            goal: "Explain the case",
            audience: "Founders",
            format: "16:9",
            style: { tone: "direct", pacing: "medium", brandName: "Studio" },
            sourceMaterials: [],
            constraints: { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] },
            outputType: "product-demo",
          }),
        /planCaseExplainerScenes only supports case-explainer briefs/,
      );
    },
  },
  {
    name: "validate scene plans",
    run: () => {
      const issues = validateScenePlan(
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

      assert.ok(issues.includes("total duration exceeds maxDurationSec"));
      assert.ok(issues.includes("total duration does not match sum of scene durations"));
    },
  },
  {
    name: "compile composition specs for 16:9 and 9:16",
    run: () => {
      const wide = compileCompositionSpec({
        format: "16:9",
        totalDurationSec: 60,
        scenes: [],
      });
      const tall = compileCompositionSpec({
        format: "9:16",
        totalDurationSec: 45,
        scenes: [],
      });

      assert.equal(wide.width, 1920);
      assert.equal(wide.height, 1080);
      assert.equal(tall.width, 1080);
      assert.equal(tall.height, 1920);
    },
  },
  {
    name: "emit HyperFrames composition HTML and commands",
    run: () => {
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

      assert.match(output.html, /<!doctype html>/i);
      assert.match(output.html, /data-composition-id="case-explainer"/);
      assert.match(output.html, /data-start="0"/);
      assert.match(output.html, /data-duration="60"/);
      assert.match(output.html, /window\.__timelines/);
      assert.match(output.html, /window\.__timelines\["case-explainer"\]/);
      assert.deepEqual(output.commands, {
        preview: "npx hyperframes preview",
        lint: "npx hyperframes lint",
        validate: "npx hyperframes validate",
        render: "npx hyperframes render",
      });
    },
  },
  {
    name: "detect runtime capabilities and map package metadata",
    run: () => {
      const capabilities = detectHyperframesCapabilities();
      const adapter = createHyperframesRuntimeAdapter();
      const runtimeInfo = adapter.describePackage({
        projectName: "case-video",
      });

      assert.ok(capabilities.available === true || capabilities.available === false);
      assert.match(capabilities.binary, /hyperframes(\.cmd)?$/);
      assert.ok(capabilities.version === "0.4.12" || capabilities.version === "unknown");
      assert.ok(capabilities.detectedAt.length > 0);
      assert.ok(capabilities.supportedCommands.includes("preview"));
      assert.equal(runtimeInfo.rootEntry, "index.html");
      assert.equal(runtimeInfo.compositionDirectory, "compositions");
      assert.equal(runtimeInfo.assetDirectory, "assets");
    },
  },
  {
    name: "build runtime command specs from package metadata",
    run: () => {
      const commandSpec = buildHyperframesCommandSpec({
        action: "preview",
        packageDirectory: "/tmp/case-video",
        packageRuntimeInfo: {
          rootEntry: "index.html",
          compositionDirectory: "compositions",
          assetDirectory: "assets",
        },
        capabilities: {
          available: true,
          binary: "hyperframes",
          detectedAt: "2026-04-22T09:00:00.000Z",
          version: "0.4.11",
          supportedCommands: ["preview", "lint", "validate", "render"],
          supportedCatalogFeatures: [],
          supportedRenderOptions: [],
          fallbackNotes: [],
        },
        passthroughArgs: ["--port", "3010"],
      });

      assert.equal(commandSpec.executable, "hyperframes");
      assert.deepEqual(commandSpec.args, ["preview", "--port", "3010", "/tmp/case-video"]);
      assert.equal(commandSpec.cwd, "/tmp/case-video");
      assert.match(commandSpec.summary, /hyperframes preview --port 3010 \/tmp\/case-video/);
    },
  },
  {
    name: "build render command specs with output passthrough",
    run: () => {
      const commandSpec = buildHyperframesCommandSpec({
        action: "render",
        packageDirectory: "/tmp/case-video",
        packageRuntimeInfo: {
          rootEntry: "index.html",
          compositionDirectory: "compositions",
          assetDirectory: "assets",
        },
        capabilities: {
          available: true,
          binary: "hyperframes",
          detectedAt: "2026-04-22T09:00:00.000Z",
          version: "0.4.11",
          supportedCommands: ["preview", "lint", "validate", "render"],
          supportedCatalogFeatures: [],
          supportedRenderOptions: [],
          fallbackNotes: [],
        },
        passthroughArgs: ["--output", "renders/out.mp4"],
      });

      assert.deepEqual(commandSpec.args, ["render", "--output", "renders/out.mp4", "/tmp/case-video"]);
      assert.match(commandSpec.summary, /hyperframes render --output renders\/out\.mp4 \/tmp\/case-video/);
    },
  },
  {
    name: "normalize runtime execution results",
    run: () => {
      const result = executeHyperframesCommand({
        command: {
          action: "render",
          executable: "hyperframes",
          args: ["render", "index.html"],
          cwd: "/tmp/case-video",
          summary: "hyperframes render index.html",
        },
        runner: () => ({
          status: 0,
          stdout: "render complete",
          stderr: "",
        }),
      });

      assert.equal(result.action, "render");
      assert.equal(result.success, true);
      assert.equal(result.exitCode, 0);
      assert.equal(result.summary, "hyperframes render index.html");
      assert.equal(result.stdout, "render complete");
    },
  },
  {
    name: "create and write the video project package",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-package-"));

      try {
        const projectPackage = createVideoProjectPackage({
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

        const writtenDir = writeVideoProjectPackage(tempRoot, projectPackage);

        assert.equal(projectPackage.projectName, "case-video");
        assert.match(readFileSync(join(writtenDir, "FLYWHEEL.md"), "utf8"), /Intake -> Plan/);
        assert.match(readFileSync(join(writtenDir, "SCRIPT.md"), "utf8"), /# Script/);
        assert.match(readFileSync(join(writtenDir, "STORYBOARD.md"), "utf8"), /# Storyboard/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /Validation status: passed/);
        assert.match(readFileSync(join(writtenDir, "HANDOFF.md"), "utf8"), /Runtime available: (true|false)/);
        assert.match(readFileSync(join(writtenDir, "hyperframes.json"), "utf8"), /"assets": "assets"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"rootEntry": "index.html"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"runtime": "hyperframes"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"supportedCommands": \[/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"binary": ".*hyperframes(\.cmd)?"/);
        assert.equal(existsSync(join(writtenDir, "assets")), true);
        assert.equal(existsSync(join(writtenDir, "compositions")), true);
        assert.match(readFileSync(join(writtenDir, "GUARDRAILS.md"), "utf8"), /Max duration: 60s/);
        assert.match(readFileSync(join(writtenDir, "GUARDRAILS.md"), "utf8"), /Latest validation: passed/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /# Runtime Commands/);
        assert.match(
          readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"),
          /hyperframes(\.cmd)? preview case-video/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "run the full first-version pipeline",
    run: () => {
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

      assert.equal(result.scenePlan.scenes.length, 6);
      assert.equal(result.script.scenes.length, 6);
      assert.equal(result.storyboard.scenes.length, 6);
      assert.equal(result.assetPlan.placeholderAssets.length, 6);
      assert.equal(result.spec.width, 1920);
      assert.equal(result.validationReport.status, "passed");
      assert.match(result.package.files["index.html"], /data-composition-id/);
      assert.match(result.package.files["VALIDATION_REPORT.json"], /"status": "passed"/);
    },
  },
  {
    name: "document runtime prerequisites in the README",
    run: () => {
      const readme = readFileSync(readmePath, "utf8");

      assert.match(readme, /HyperFrames is required for runtime execution/);
      assert.match(readme, /runtime doctor/);
      assert.match(readme, /preview/);
      assert.match(readme, /render/);
      assert.match(readme, /generate --url/);
      assert.match(readme, /validate --url/);
      assert.match(readme, /SOURCE_MANIFEST\.json/);
      assert.match(readme, /captureTargets/);
    },
  },
  {
    name: "report runtime availability from the CLI doctor command",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(["runtime", "doctor"], {
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      });

      assert.equal(exitCode, 0);
      assert.equal(stderr.length, 0);
      assert.match(stdout.join("\n"), /HyperFrames runtime/);
      assert.match(stdout.join("\n"), /available: (true|false)/);
      assert.match(stdout.join("\n"), /version: (0\.4\.12|unknown)/);
    },
  },
  {
    name: "generate a package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-cli-"));

      try {
        const stdout = [];
        const stderr = [];

        const exitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "cli-case-video",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const packageDir = join(tempRoot, "cli-case-video");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(readFileSync(join(packageDir, "VIDEO_BRIEF.json"), "utf8"), /"goal": "Explain the case"/);
        assert.match(readFileSync(join(packageDir, "index.html"), "utf8"), /data-composition-id/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "generate a website package from the CLI",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-cli-url-"));
      const originalFetch = globalThis.fetch;

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                  <h2>Review gates</h2>
                  <p>Keep output quality stable.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const stdout = [];
        const stderr = [];
        const exitCode = await runCli(
          [
            "generate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            "cli-website-video",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const packageDir = join(tempRoot, "cli-website-video");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(readFileSync(join(packageDir, "SOURCE_MANIFEST.json"), "utf8"), /"sourceType": "website"/);
        assert.match(readFileSync(join(packageDir, "SOURCE_MANIFEST.json"), "utf8"), /"Website Product"/);
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail preview when runtime is unavailable",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-preview-"));
      const previousCwd = process.cwd();

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "preview-case",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const stdout = [];
        const stderr = [];
        process.chdir(tempRoot);
        const previewExitCode = await runCli(
          ["preview", "--project-dir", join(tempRoot, "preview-case")],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(previewExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /HyperFrames runtime is unavailable/);
      } finally {
        process.chdir(previousCwd);
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail render when runtime is unavailable",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-render-"));
      const previousCwd = process.cwd();

      try {
        const generateExitCode = await runCli(
          [
            "generate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "render-case",
          ],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);

        const stdout = [];
        const stderr = [];
        process.chdir(tempRoot);
        const renderExitCode = await runCli(
          ["render", "--project-dir", join(tempRoot, "render-case")],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(renderExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /HyperFrames runtime is unavailable/);
      } finally {
        process.chdir(previousCwd);
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail the CLI when required arguments are missing",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(["generate"], {
        stdout: (message) => stdout.push(message),
        stderr: (message) => stderr.push(message),
      });

      assert.equal(exitCode, 1);
      assert.equal(stdout.length, 0);
      assert.match(stderr.join("\n"), /Missing required argument: --output-dir/);
    },
  },
  {
    name: "initialize a CLI project template",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-init-"));

      try {
        const stdout = [];
        const stderr = [];

        const exitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "starter", "--format", "9:16"],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const projectDir = join(tempRoot, "starter");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Initialized project template/);
        assert.match(readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"), /"format": "9:16"/);
        assert.match(
          readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"),
          /"brandName": "Studio"/,
        );
        assert.match(
          readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"),
          /"palette": "default"/,
        );
        assert.match(
          readFileSync(join(projectDir, "hyperframes-studio.json"), "utf8"),
          /"maxDurationSec": 60/,
        );
        assert.match(readFileSync(join(projectDir, "input.md"), "utf8"), /# Problem/);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate CLI input without writing a package",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validate-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = await runCli(
          [
            "validate",
            "--input",
            fixturePath,
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the case",
            "--audience",
            "Founders",
            "--project-name",
            "validated-case",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const reportDir = join(tempRoot, "validated-case");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Validation passed/);
        assert.equal(existsSync(join(reportDir, "VIDEO_BRIEF.json")), false);
        assert.match(
          readFileSync(join(reportDir, "VALIDATION_REPORT.json"), "utf8"),
          /"status": "passed"/,
        );
        assert.match(
          readFileSync(join(reportDir, "VALIDATION_REPORT.md"), "utf8"),
          /# Validation Report/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate website CLI input without writing a package",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validate-url-"));
      const originalFetch = globalThis.fetch;
      const stdout = [];
      const stderr = [];

      try {
        globalThis.fetch = async () =>
          new Response(
            `
              <!doctype html>
              <html>
                <head>
                  <title>Website Product</title>
                  <meta name="description" content="A product landing page for founders." />
                </head>
                <body>
                  <h1>Launch faster</h1>
                  <p>Ship reusable video workflows.</p>
                </body>
              </html>
            `,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            },
          );

        const exitCode = await runCli(
          [
            "validate",
            "--url",
            "https://example.com/product",
            "--output-dir",
            tempRoot,
            "--goal",
            "Explain the site",
            "--audience",
            "Founders",
            "--project-name",
            "validated-website",
          ],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        const reportDir = join(tempRoot, "validated-website");

        assert.equal(exitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Validation passed/);
        assert.equal(existsSync(join(reportDir, "VIDEO_BRIEF.json")), false);
        assert.equal(existsSync(join(reportDir, "SOURCE_MANIFEST.json")), false);
        assert.match(readFileSync(join(reportDir, "VALIDATION_REPORT.json"), "utf8"), /"status": "passed"/);
      } finally {
        globalThis.fetch = originalFetch;
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "reject conflicting CLI source arguments",
    run: async () => {
      const stdout = [];
      const stderr = [];

      const exitCode = await runCli(
        [
          "generate",
          "--input",
          fixturePath,
          "--url",
          "https://example.com/product",
          "--output-dir",
          "out",
          "--goal",
          "Explain the site",
          "--audience",
          "Founders",
        ],
        {
          stdout: (message) => stdout.push(message),
          stderr: (message) => stderr.push(message),
        },
      );

      assert.equal(exitCode, 1);
      assert.equal(stdout.length, 0);
      assert.match(stderr.join("\n"), /Use exactly one source input: --config, --input, or --url/);
    },
  },
  {
    name: "generate from a project config file",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-generate-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "config-project"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "config-project");
        const stdout = [];
        const stderr = [];

        const generateExitCode = await runCli(
          ["generate", "--config", join(projectDir, "hyperframes-studio.json"), "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Generated video project package/);
        assert.match(
          readFileSync(join(tempRoot, "config-project", "VIDEO_BRIEF.json"), "utf8"),
          /"audience": "Founders"/,
        );
        assert.match(
          readFileSync(join(tempRoot, "config-project", "VIDEO_BRIEF.json"), "utf8"),
          /"brandName": "Studio"/,
        );
        assert.match(
          readFileSync(join(tempRoot, "config-project", "VIDEO_BRIEF.json"), "utf8"),
          /"maxDurationSec": 60/,
        );
        assert.match(
          readFileSync(join(tempRoot, "config-project", "index.html"), "utf8"),
          /data-palette="default"/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "validate from a project config file",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-validate-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "config-validate"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "config-validate");
        const stdout = [];
        const stderr = [];

        const validateExitCode = await runCli(
          ["validate", "--config", join(projectDir, "hyperframes-studio.json"), "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(validateExitCode, 0);
        assert.equal(stderr.length, 0);
        assert.match(stdout.join("\n"), /Validation passed/);
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /"sceneCount": 6/,
        );
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.md"), "utf8"),
          /Validation passed for config-validate/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail validation from config when required points are missing",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-required-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "required-points"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "required-points");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));
        config.constraints ??= { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] };
        config.constraints.requiredPoints = ["Nonexistent proof point"];
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const stdout = [];
        const stderr = [];
        const validateExitCode = await runCli(
          ["validate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /Validation failed/);
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /"status": "failed"/,
        );
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /required point missing: Nonexistent proof point/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "fail validation from config when banned terms are present",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-banned-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "banned-terms"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "banned-terms");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));
        config.constraints ??= { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] };
        config.constraints.bannedTerms = ["solution"];
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const stdout = [];
        const stderr = [];
        const validateExitCode = await runCli(
          ["validate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(validateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /Validation failed/);
        assert.match(
          readFileSync(join(projectDir, "VALIDATION_REPORT.json"), "utf8"),
          /banned term present: solution/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "block generate when config max duration is too small",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-duration-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "duration-limit"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "duration-limit");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));
        config.constraints ??= { maxDurationSec: 60, requiredPoints: [], bannedTerms: [] };
        config.constraints.maxDurationSec = 5;
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const stdout = [];
        const stderr = [];
        const generateExitCode = await runCli(
          ["generate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: (message) => stdout.push(message),
            stderr: (message) => stderr.push(message),
          },
        );

        assert.equal(generateExitCode, 1);
        assert.equal(stdout.length, 0);
        assert.match(stderr.join("\n"), /case explainer scene plan requires at least 1 second per scene/);
        assert.equal(existsSync(join(projectDir, "VIDEO_BRIEF.json")), false);
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "carry custom brand and palette values from config into output",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-brand-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "brand-project"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "brand-project");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));

        config.style.brandName = "HyperBrand";
        config.style.tone = "bold";
        config.style.pacing = "fast";
        config.theme.palette = "sunset";

        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const generateExitCode = await runCli(
          ["generate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);
        assert.match(
          readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"),
          /"brandName": "HyperBrand"/,
        );
        assert.match(
          readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"),
          /"tone": "bold"/,
        );
        assert.match(
          readFileSync(join(projectDir, "index.html"), "utf8"),
          /data-palette="sunset"/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
  {
    name: "apply default style and theme when config omits them",
    run: async () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-defaults-"));

      try {
        const initExitCode = await runCli(
          ["init", "--output-dir", tempRoot, "--project-name", "legacy-project"],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(initExitCode, 0);

        const projectDir = join(tempRoot, "legacy-project");
        const configPath = join(projectDir, "hyperframes-studio.json");
        const config = JSON.parse(readFileSync(configPath, "utf8"));

        delete config.style;
        delete config.theme;

        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");

        const generateExitCode = await runCli(
          ["generate", "--config", configPath, "--output-dir", tempRoot],
          {
            stdout: () => {},
            stderr: (message) => {
              throw new Error(message);
            },
          },
        );

        assert.equal(generateExitCode, 0);
        assert.match(
          readFileSync(join(projectDir, "VIDEO_BRIEF.json"), "utf8"),
          /"brandName": "Studio"/,
        );
        assert.match(
          readFileSync(join(projectDir, "index.html"), "utf8"),
          /data-palette="default"/,
        );
      } finally {
        rmSync(tempRoot, { recursive: true, force: true });
      }
    },
  },
];

let passed = 0;

for (const test of tests) {
  await test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}

console.log(`\n${passed}/${tests.length} checks passed`);
