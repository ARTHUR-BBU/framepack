import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runCli } from "../dist/interfaces/cli/index.js";
import { compileMarkdownSourceBundle } from "../dist/ingest/markdown/index.js";
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
import {
  createMissingHyperframesCapabilities,
  detectLocalHyperframesCapabilities,
  parseHyperframesVersion,
} from "../dist/runtime/hyperframes/discovery.js";
import { planCaseExplainerScenes } from "../dist/video/planning/scene-planner.js";
import { validateScenePlan } from "../dist/video/planning/scene-validators.js";
import { emitHyperframesComposition } from "../dist/video/render/hyperframes-adapter.js";
import { buildCaseExplainerVideoProject } from "../dist/video/index.js";

const fixturePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../examples/case-explainer-input.md",
);

const tests = [
  {
    name: "parse and normalize detected HyperFrames versions",
    run: () => {
      assert.equal(parseHyperframesVersion("hyperframes/0.4.11\n"), "0.4.11");
      assert.equal(parseHyperframesVersion("0.4.12"), "0.4.12");
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
    name: "detect local runtime capabilities from a version probe",
    run: () => {
      const capabilities = detectLocalHyperframesCapabilities({
        binary: "hyperframes",
        now: () => "2026-04-22T09:00:00.000Z",
        runner: () => ({
          status: 0,
          stdout: "hyperframes/0.4.11\n",
          stderr: "",
        }),
      });

      assert.equal(capabilities.available, true);
      assert.equal(capabilities.binary, "hyperframes");
      assert.equal(capabilities.version, "0.4.11");
      assert.equal(capabilities.detectedAt, "2026-04-22T09:00:00.000Z");
      assert.ok(capabilities.supportedCommands.includes("preview"));
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
        /Markdown normalization only supports case-explainer outputType/,
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

      assert.match(output.html, /data-composition-id="case-explainer"/);
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

      assert.equal(capabilities.version, "unknown");
      assert.equal(capabilities.available, false);
      assert.equal(capabilities.binary, "hyperframes");
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
      });

      assert.equal(commandSpec.executable, "hyperframes");
      assert.deepEqual(commandSpec.args, ["preview", "index.html"]);
      assert.equal(commandSpec.cwd, "/tmp/case-video");
      assert.match(commandSpec.summary, /hyperframes preview index.html/);
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
          assetPlan: { availableAssets: [], placeholderAssets: [], missingAssets: [] },
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
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"rootEntry": "index.html"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"runtime": "hyperframes"/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"supportedCommands": \[/);
        assert.match(readFileSync(join(writtenDir, "meta.json"), "utf8"), /"binary": "hyperframes"/);
        assert.equal(existsSync(join(writtenDir, "assets")), true);
        assert.equal(existsSync(join(writtenDir, "compositions")), true);
        assert.match(readFileSync(join(writtenDir, "GUARDRAILS.md"), "utf8"), /Max duration: 60s/);
        assert.match(readFileSync(join(writtenDir, "GUARDRAILS.md"), "utf8"), /Latest validation: passed/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /# Runtime Commands/);
        assert.match(readFileSync(join(writtenDir, "COMMANDS.md"), "utf8"), /hyperframes preview index.html/);
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
    name: "generate a package from the CLI",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-cli-"));

      try {
        const stdout = [];
        const stderr = [];

        const exitCode = runCli(
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
    name: "fail the CLI when required arguments are missing",
    run: () => {
      const stdout = [];
      const stderr = [];

      const exitCode = runCli(["generate"], {
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-init-"));

      try {
        const stdout = [];
        const stderr = [];

        const exitCode = runCli(
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-validate-"));
      const stdout = [];
      const stderr = [];

      try {
        const exitCode = runCli(
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
    name: "generate from a project config file",
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-generate-"));

      try {
        const initExitCode = runCli(
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

        const generateExitCode = runCli(
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-validate-"));

      try {
        const initExitCode = runCli(
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

        const validateExitCode = runCli(
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-required-"));

      try {
        const initExitCode = runCli(
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
        const validateExitCode = runCli(
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-banned-"));

      try {
        const initExitCode = runCli(
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
        const validateExitCode = runCli(
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-duration-"));

      try {
        const initExitCode = runCli(
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
        const generateExitCode = runCli(
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-brand-"));

      try {
        const initExitCode = runCli(
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

        const generateExitCode = runCli(
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
    run: () => {
      const tempRoot = mkdtempSync(join(tmpdir(), "hyperframes-config-defaults-"));

      try {
        const initExitCode = runCli(
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

        const generateExitCode = runCli(
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
  test.run();
  passed += 1;
  console.log(`PASS ${test.name}`);
}

console.log(`\n${passed}/${tests.length} checks passed`);
