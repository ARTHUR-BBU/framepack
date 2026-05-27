import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import {
  listTemplateMarket,
  recommendTemplateRoute,
  type TemplateMarketItem,
  type TemplateRouteId,
} from "./template-market.js";
import {
  listHyperframesCatalogPrefabs,
  recommendHyperframesCatalogPrefabs,
  type HyperframesCatalogRecommendation,
} from "./hyperframes-catalog.js";

export type WorkbenchAssetKind = "image" | "video" | "audio" | "text" | "other";

export interface WorkbenchAsset {
  path: string;
  name: string;
  kind: WorkbenchAssetKind;
}

export interface WorkbenchProject {
  projectDir: string;
  assets: WorkbenchAsset[];
  files: Record<string, string>;
}

export type WorkbenchTemplateId = TemplateRouteId;

export type WorkbenchTemplate = TemplateMarketItem;

export interface PolishArsenalRecommendation {
  template: WorkbenchTemplate;
  directorTranslation: DirectorTranslation;
  catalogRecommendation: HyperframesCatalogRecommendation;
  professionalCreativeLanguage: string;
  animationTechniques: string[];
  aestheticDirection: string[];
  avoid: string[];
  acceptanceCriteria: string[];
}

export interface DirectorTranslation {
  creativeIntent: string;
  narrativePattern: string;
  emotionalEnergy: string[];
  visualLanguage: string[];
  motionLanguage: string[];
  technicalModules: string[];
  humanCheckpoints: string[];
}

export interface HitlLoop {
  currentPhase: "proposal";
  nextAction: string;
  proposalOptions: string[];
  decisionLog: string[];
  feedbackPrompts: string[];
}

export interface TuningParameter {
  id: "pace" | "textDensity" | "motionIntensity" | "catalogUsage" | "businessPolish";
  label: string;
  type: "scale" | "choice";
  defaultValue: string;
  options: string[];
  agentUse: string;
}

export interface HumanDigest {
  currentSummary: string;
  currentPhase: string;
  videoStructure: string[];
  nextUserDecision: string;
  progress: string[];
  technologyPlainWords: string[];
}

export interface WorkbenchQaCheck {
  id: string;
  status: "passed" | "failed";
  summary: string;
}

export interface WorkbenchQaReport {
  version: "framepack.workbench-qa.v1";
  status: "passed" | "failed";
  checks: WorkbenchQaCheck[];
  findings: string[];
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".mkv"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);
const TEXT_EXTENSIONS = new Set([".md", ".txt", ".json", ".csv"]);

export function listWorkbenchTemplates(): WorkbenchTemplate[] {
  return listTemplateMarket();
}

function createDirectorTranslation(input: {
  idea: string;
  style: string;
  format: "16:9" | "9:16";
  durationSec: number;
  template: WorkbenchTemplate;
  fast: boolean;
  premium: boolean;
}): DirectorTranslation {
  const narrativePatterns: Record<TemplateRouteId, string> = {
    "saas-launch": "hook-product-proof-cta",
    "news-explainer": "headline-context-implication",
    "course-promo": "promise-path-proof-cta",
    "game-ad": "action-progression-reward",
    "founder-story": "tension-origin-conviction",
    "data-shock": "number-context-action",
  };

  return {
    creativeIntent: `Turn the user's idea into a ${input.durationSec}-second ${input.format} ${input.template.label} video that feels ${input.premium ? "premium and commercially credible" : "clear and audience-focused"} with ${input.fast ? "compressed momentum" : "controlled pacing"}.`,
    narrativePattern: narrativePatterns[input.template.id],
    emotionalEnergy: [
      input.premium ? "premium restraint" : "direct clarity",
      input.fast ? "forward momentum" : "measured confidence",
      "credible payoff",
    ],
    visualLanguage: [...input.template.visualLanguage],
    motionLanguage: [...input.template.motionLanguage],
    technicalModules: [
      "HyperFrames timeline composition",
      "HyperFrames Catalog prefabs where they fit",
      "custom brand-critical scenes",
      input.fast ? "kinetic caption emphasis" : "controlled transition pacing",
    ],
    humanCheckpoints: [
      "Direction choice: confirm whether this route should feel more premium, faster, more cinematic, or more proof-heavy.",
      "Asset choice: confirm which user assets are mandatory and which gaps can use Catalog, generated, or custom assets.",
      "Preview feedback: translate user reactions into timing, text, motion, and prefab substitutions.",
    ],
  };
}

function createHitlLoop(template: WorkbenchTemplate): HitlLoop {
  return {
    currentPhase: "proposal",
    nextAction: "Ask the user to choose or modify the direction before building the first HyperFrames composition.",
    proposalOptions: [
      `A: ${template.label} with premium polish and controlled business pacing.`,
      `B: ${template.label} with faster social-first momentum and bigger focal text.`,
      `C: ${template.label} with proof-heavy structure and stronger technical credibility.`,
    ],
    decisionLog: ["v001 initialized: direction options prepared; user decision pending."],
    feedbackPrompts: [
      "Should the next pass feel more premium, faster, more cinematic, or more proof-heavy?",
      "Which assets are mandatory, and which gaps may use Catalog, generated, or custom assets?",
      "After preview, what should change first: pacing, text, motion, visuals, or CTA?",
    ],
  };
}

function createTuningParameters(input: {
  format: "16:9" | "9:16";
  fast: boolean;
  premium: boolean;
  catalogCount: number;
}): TuningParameter[] {
  return [
    {
      id: "pace",
      label: "Pace",
      type: "scale",
      defaultValue: input.fast ? "fast" : "medium",
      options: ["slow", "medium", "fast"],
      agentUse: "Adjust scene duration, transition speed, and caption reveal density.",
    },
    {
      id: "textDensity",
      label: "Text Density",
      type: "scale",
      defaultValue: input.format === "9:16" ? "large-sparse" : "balanced",
      options: ["minimal", "balanced", "large-sparse"],
      agentUse: "Control headline size, subtitle count, and mobile readability.",
    },
    {
      id: "motionIntensity",
      label: "Motion Intensity",
      type: "scale",
      defaultValue: input.fast ? "medium-high" : "medium",
      options: ["low", "medium", "medium-high", "high"],
      agentUse: "Tune kinetic typography, camera push, transition force, and animation overlap.",
    },
    {
      id: "catalogUsage",
      label: "Catalog Usage",
      type: "choice",
      defaultValue: input.catalogCount > 0 ? "balanced" : "inspect-first",
      options: ["minimal", "balanced", "catalog-forward", "inspect-first"],
      agentUse: "Decide how aggressively to use HyperFrames Catalog blocks/components versus custom composition.",
    },
    {
      id: "businessPolish",
      label: "Business Polish",
      type: "scale",
      defaultValue: input.premium ? "high" : "medium",
      options: ["low", "medium", "high"],
      agentUse: "Tune restraint, whitespace, contrast, and proof-first hierarchy.",
    },
  ];
}

function createHumanDigest(input: {
  idea: string;
  assets: WorkbenchAsset[];
  recommendation: PolishArsenalRecommendation;
  hitlLoop: HitlLoop;
  tuningParameters: TuningParameter[];
}): HumanDigest {
  const template = input.recommendation.template;
  const catalogNames = input.recommendation.catalogRecommendation.prefabs.map((prefab) => prefab.label);
  const pace = input.tuningParameters.find((parameter) => parameter.id === "pace")?.defaultValue ?? "medium";
  const motion = input.tuningParameters.find((parameter) => parameter.id === "motionIntensity")?.defaultValue ?? "medium";

  return {
    currentSummary: `We are turning the idea "${input.idea}" into a ${template.label} video plan. Framepack has translated the rough request into structure, style, assets, motion direction, and production checks that a coding agent can execute.`,
    currentPhase: "proposal",
    videoStructure: [
      "Open with a clear promise so the viewer understands the point immediately.",
      `Build the middle around the ${template.id} route: ${template.templateGuidance.join(" ")}`,
      "Use supplied assets as proof or texture, then fill gaps with Catalog, custom composition, or generated material only after user approval.",
      "End with a concrete payoff, CTA, or memorable takeaway.",
    ],
    nextUserDecision: input.hitlLoop.nextAction,
    progress: [
      "Creative route selected.",
      "Visual and motion language drafted.",
      "Asset library scanned.",
      "Composition route prepared for HyperFrames or Remotion.",
    ],
    technologyPlainWords: [
      `Template route: ${template.label} means the video has a proven story shape instead of random scenes.`,
      `Pace is currently ${pace}; motion intensity is ${motion}. These are the main knobs for making the video calmer, faster, more premium, or more explosive.`,
      catalogNames.length > 0
        ? `HyperFrames Catalog candidates: ${catalogNames.join(", ")}. These are reusable video blocks/components, not mandatory installs.`
        : "No strong Catalog match yet. The agent should inspect the live Catalog before building custom pieces.",
      "HyperFrames/Remotion are the production targets; Framepack is the planning and agentic workflow layer.",
    ],
  };
}

export function recommendPolishArsenal(input: {
  idea: string;
  style?: string;
  format: "16:9" | "9:16";
  durationSec: number;
}): PolishArsenalRecommendation {
  const style = input.style ?? "";
  const template = recommendTemplateRoute({ ...input, style }).template;
  const signal = `${input.idea} ${style}`.toLowerCase();
  const fast = signal.includes("fast") || signal.includes("dynamic") || input.durationSec <= 35;
  const premium = signal.includes("premium") || signal.includes("business") || signal.includes("polished");
  const mobile = input.format === "9:16";
  const directorTranslation = createDirectorTranslation({ ...input, style, template, fast, premium });
  const catalogRecommendation = recommendHyperframesCatalogPrefabs({
    templateId: template.id,
    idea: input.idea,
    style,
    format: input.format,
  });

  return {
    template,
    directorTranslation,
    catalogRecommendation,
    professionalCreativeLanguage: `${template.visualLanguage[0]} with ${premium ? "premium commercial restraint" : "clear editorial confidence"} and ${fast ? "compressed high-energy pacing" : "measured narrative pacing"}.`,
    animationTechniques: [
      ...new Set([
        ...template.motionLanguage,
        "kinetic typography",
        mobile ? "vertical focal framing" : "wide composition staging",
        fast ? "hard scene snaps" : "smooth scene dissolves",
      ]),
    ],
    aestheticDirection: [
      ...template.visualLanguage,
      premium ? "restrained color with sharp contrast" : "direct contrast with readable hierarchy",
      mobile ? "oversized mobile-safe type" : "balanced headline and proof layout",
    ],
    avoid: [
      "tiny text or dense subtitles",
      "mixing animation engines on the same element",
      "invisible first frames",
      "decorative motion that does not clarify the offer",
    ],
    acceptanceCriteria: [
      ...template.acceptanceCriteria,
      "first frame is visible without waiting for JavaScript animation",
      "main message is readable within three seconds",
      "each motion choice supports attention, proof, or transition",
    ],
  };
}

export {
  listHyperframesCatalogPrefabs,
  listTemplateMarket,
  recommendHyperframesCatalogPrefabs,
  recommendTemplateRoute,
};

function bulletList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function assetKind(fileName: string): WorkbenchAssetKind {
  const extension = extname(fileName).toLowerCase();

  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (TEXT_EXTENSIONS.has(extension)) return "text";
  return "other";
}

function scanAssets(assetDir?: string): WorkbenchAsset[] {
  if (!assetDir || !existsSync(assetDir)) return [];

  return readdirSync(assetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      path: resolve(assetDir, entry.name),
      name: entry.name,
      kind: assetKind(entry.name),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function formatAssets(assets: WorkbenchAsset[]) {
  if (assets.length === 0) {
    return "- No user assets scanned yet. Ask the user before inventing asset needs.";
  }

  return assets.map((asset) => `- ${asset.name} (${asset.kind})`).join("\n");
}

function catalogPlan(recommendation: HyperframesCatalogRecommendation) {
  const prefabLines = recommendation.prefabs.length > 0
    ? recommendation.prefabs.map((prefab) => `- ${prefab.id} (${prefab.kind}): ${prefab.bestUse} Install: \`${prefab.installCommand}\`.`).join("\n")
    : "- No strong Catalog prefab match. Keep the route custom and inspect the live Catalog before writing from scratch.";

  return [
    "## HyperFrames Catalog Plan",
    "",
    "Official Catalog check:",
    "",
    "- Run `npx hyperframes catalog --json` before installing any prefab.",
    "- Treat recommendations as candidates; do not auto-install without an agent/user execution decision.",
    "- Use blocks as mounted composition segments and components as copied CSS/GSAP snippets.",
    "",
    "Recommended prefabs:",
    "",
    prefabLines,
    "",
    "Fallback:",
    "",
    recommendation.fallbackStrategy,
  ].join("\n");
}

function numberedList(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function formatTuningParameters(parameters: TuningParameter[]) {
  return parameters
    .map((parameter) => [
      `- ${parameter.id} (${parameter.label})`,
      `  - default: ${parameter.defaultValue}`,
      `  - options: ${parameter.options.join(", ")}`,
      `  - agent use: ${parameter.agentUse}`,
    ].join("\n"))
    .join("\n");
}

function formatHumanDigest(digest: HumanDigest) {
  return [
    "# Human Brief",
    "",
    "## Current Summary",
    "",
    digest.currentSummary,
    "",
    "## Current Phase",
    "",
    digest.currentPhase,
    "",
    "## Video Structure",
    "",
    numberedList(digest.videoStructure),
    "",
    "## Next user decision",
    "",
    digest.nextUserDecision,
    "",
    "## Progress",
    "",
    bulletList(digest.progress),
    "",
    "## Technology in plain words",
    "",
    bulletList(digest.technologyPlainWords),
    "",
    "## What I need from you",
    "",
    "Tell the agent what feels wrong or right in ordinary language: faster, calmer, more premium, bigger text, more action, less clutter, stronger opening, clearer CTA, or closer to a reference video.",
    "",
  ].join("\n");
}

function validateContains(input: {
  files: Record<string, string>;
  file: string;
  pattern: RegExp;
  id: string;
  summary: string;
  finding: string;
}): WorkbenchQaCheck {
  const content = input.files[input.file] ?? "";
  const passed = input.pattern.test(content);
  return {
    id: input.id,
    status: passed ? "passed" : "failed",
    summary: passed ? input.summary : input.finding,
  };
}

export function validateWorkbenchFiles(files: Record<string, string>): WorkbenchQaReport {
  const checks = [
    validateContains({
      files,
      file: "DIRECTION.md",
      pattern: /Director Translation/,
      id: "director-translation",
      summary: "DIRECTION.md includes a Director Translation section.",
      finding: "DIRECTION.md is missing Director Translation.",
    }),
    validateContains({
      files,
      file: "DIRECTION.md",
      pattern: /Proposal Options/,
      id: "proposal-options",
      summary: "DIRECTION.md includes proposal options for HITL choice.",
      finding: "DIRECTION.md is missing Proposal Options.",
    }),
    validateContains({
      files,
      file: "ITERATIONS.md",
      pattern: /HITL Loop/,
      id: "hitl-loop",
      summary: "ITERATIONS.md includes the HITL Loop.",
      finding: "ITERATIONS.md is missing HITL Loop.",
    }),
    validateContains({
      files,
      file: "COMPOSITION.md",
      pattern: /HyperFrames Catalog Plan/,
      id: "catalog-plan",
      summary: "COMPOSITION.md includes a HyperFrames Catalog Plan.",
      finding: "COMPOSITION.md is missing HyperFrames Catalog Plan.",
    }),
    validateContains({
      files,
      file: ".framepack/state.json",
      pattern: /"hitlLoop"/,
      id: "state-hitl-loop",
      summary: "State JSON includes hitlLoop.",
      finding: ".framepack/state.json is missing hitlLoop.",
    }),
    validateContains({
      files,
      file: "STYLE.md",
      pattern: /Brand Direction/,
      id: "style-direction",
      summary: "STYLE.md includes Brand Direction.",
      finding: "STYLE.md is missing Brand Direction.",
    }),
    validateContains({
      files,
      file: ".framepack/state.json",
      pattern: /"tuningParameters"/,
      id: "tuning-parameters",
      summary: "State JSON includes tuningParameters.",
      finding: ".framepack/state.json is missing tuningParameters.",
    }),
    validateContains({
      files,
      file: "HUMAN.md",
      pattern: /Current Summary/,
      id: "human-digest",
      summary: "HUMAN.md includes a Current Summary for user-facing review.",
      finding: "HUMAN.md is missing Current Summary.",
    }),
    validateContains({
      files,
      file: "DIRECTION.md",
      pattern: /Structure Summary/,
      id: "structure-summary",
      summary: "DIRECTION.md includes a user-readable Structure Summary.",
      finding: "DIRECTION.md is missing Structure Summary.",
    }),
  ];
  const findings = checks
    .filter((check) => check.status === "failed")
    .map((check) => check.summary);

  return {
    version: "framepack.workbench-qa.v1",
    status: findings.length === 0 ? "passed" : "failed",
    checks,
    findings,
  };
}

export function validateWorkbenchProject(projectDir: string): WorkbenchQaReport {
  const files = Object.fromEntries(
    ["FRAMEPACK.md", "ASSETS.md", "HUMAN.md", "STYLE.md", "DIRECTION.md", "COMPOSITION.md", "ITERATIONS.md", ".framepack/state.json"]
      .map((filePath) => [
        filePath,
        existsSync(join(projectDir, filePath)) ? readFileSync(join(projectDir, filePath), "utf8") : "",
      ]),
  );

  return validateWorkbenchFiles(files);
}

function buildFiles(input: {
  projectName: string;
  idea: string;
  style: string;
  format: "16:9" | "9:16";
  durationSec: number;
  assets: WorkbenchAsset[];
}) {
  const assetList = formatAssets(input.assets);
  const recommendation = recommendPolishArsenal(input);
  const direction = recommendation.directorTranslation;
  const hitlLoop = createHitlLoop(recommendation.template);
  const tuningParameters = createTuningParameters({
    format: input.format,
    fast: direction.emotionalEnergy.includes("forward momentum"),
    premium: direction.emotionalEnergy.includes("premium restraint"),
    catalogCount: recommendation.catalogRecommendation.prefabs.length,
  });
  const humanDigest = createHumanDigest({
    idea: input.idea,
    assets: input.assets,
    recommendation,
    hitlLoop,
    tuningParameters,
  });
  const humanDigestMarkdown = formatHumanDigest(humanDigest);
  const recommendedStack = [
    "- Runtime: HyperFrames first; Remotion is a good route for reusable social/template video.",
    "- Motion: GSAP timeline for HyperFrames-safe scene control.",
    `- Template: ${recommendation.template.id} (${recommendation.template.label}).`,
    `- Professional translation: ${recommendation.professionalCreativeLanguage}`,
    `- Animation techniques: ${recommendation.animationTechniques.join(", ")}.`,
    `- Aesthetic direction: ${recommendation.aestheticDirection.join(", ")}.`,
    `- Catalog prefabs: ${recommendation.catalogRecommendation.prefabs.map((prefab) => prefab.id).join(", ") || "inspect live Catalog before custom work"}.`,
    `- Avoid: ${recommendation.avoid.join(", ")}.`,
    "- Verification: CSS first scene visible, scene switches with tl.set(), timeline registered on window.__timelines.",
  ].join("\n");

  return {
    "FRAMEPACK.md": [
      "# Framepack Workbench",
      "",
      "Start here. This folder is the durable context for Codex, Claude Code, and other coding agents.",
      "",
      "## For Human",
      "",
      humanDigest.currentSummary,
      "",
      "Next user decision:",
      "",
      humanDigest.nextUserDecision,
      "",
      "## Agent Workflow",
      "",
      "1. Read `HUMAN.md`, `ASSETS.md`, `STYLE.md`, `DIRECTION.md`, and `COMPOSITION.md` before writing code.",
      "2. Discuss unclear creative choices with the user in natural language.",
      "3. Use Framepack recommendations as a production brief, not as rigid rails.",
      "4. Build or refine the HyperFrames or Remotion composition.",
      "5. Record each render/review loop in `ITERATIONS.md`.",
      "6. Use the HITL loop before committing to a composition direction when the user's taste is fuzzy.",
      "",
      "## Current Agentic Loop",
      "",
      `Phase: ${hitlLoop.currentPhase}`,
      "",
      `Next action: ${hitlLoop.nextAction}`,
      "",
      "## Three Layers",
      "",
      "- Skill/instructions: trigger Framepack for vague video, asset, prompt, template, or composition work.",
      "- MCP/CLI: call Framepack tools when files need to be created or refreshed.",
      "- Workbench files: keep the state in markdown so agents can resume without relying on model memory.",
      "",
    ].join("\n"),
    "ASSETS.md": [
      "# Assets",
      "",
      "User-provided assets are intentional source material. Do not judge them by default; arrange them around the user's creative goal.",
      "",
      assetList,
      "",
    ].join("\n"),
    "HUMAN.md": humanDigestMarkdown,
    "STYLE.md": [
      "# Style Direction",
      "",
      "This file is the stable visual and motion constraint layer for agents. Treat it like a lightweight video DESIGN.md.",
      "",
      "## Brand Direction",
      "",
      `- Route: ${recommendation.template.id} (${recommendation.template.label})`,
      `- Format: ${input.format}`,
      `- Duration: ${input.durationSec} seconds`,
      `- User style words: ${input.style}`,
      "",
      "## Visual Tokens",
      "",
      bulletList(recommendation.aestheticDirection),
      "",
      "## Motion Tokens",
      "",
      bulletList(recommendation.animationTechniques),
      "",
      "## Tuning Parameters",
      "",
      formatTuningParameters(tuningParameters),
      "",
      "## Guardrails",
      "",
      bulletList(recommendation.avoid),
      "",
    ].join("\n"),
    "DIRECTION.md": [
      "# Creative Direction",
      "",
      `Idea: ${input.idea}`,
      `Style words: ${input.style}`,
      `Format: ${input.format}`,
      `Duration: ${input.durationSec} seconds`,
      "",
      "## Translation",
      "",
      "Turn vague user language such as cool, premium, business, dynamic, cinematic, polished, bigger text, tighter pacing, more animation, or like this reference into concrete visual and motion decisions.",
      "",
      "## Polish Arsenal",
      "",
      recommendedStack,
      "",
      "## Professional Creative Translation",
      "",
      `Template: ${recommendation.template.id} (${recommendation.template.label})`,
      "",
      recommendation.professionalCreativeLanguage,
      "",
      "## Structure Summary",
      "",
      numberedList(humanDigest.videoStructure),
      "",
      "## Director Translation",
      "",
      `Creative intent: ${direction.creativeIntent}`,
      "",
      `Narrative pattern: ${direction.narrativePattern}`,
      "",
      "Emotional energy:",
      "",
      bulletList(direction.emotionalEnergy),
      "",
      "Technical modules:",
      "",
      bulletList(direction.technicalModules),
      "",
      "## Human Checkpoints",
      "",
      bulletList(direction.humanCheckpoints),
      "",
      "## Proposal Options",
      "",
      bulletList(hitlLoop.proposalOptions),
      "",
      "## Motion Language",
      "",
      bulletList(recommendation.animationTechniques),
      "",
      "## Aesthetic Direction",
      "",
      bulletList(recommendation.aestheticDirection),
      "",
      "## Avoid",
      "",
      bulletList(recommendation.avoid),
      "",
    ].join("\n"),
    "COMPOSITION.md": [
      "# Composition Plan",
      "",
      `Use HyperFrames to create a ${input.durationSec}-second ${input.format} programmed commercial video.`,
      "",
      "Do not judge user-provided assets. Use them according to the user's intent, and only suggest improvements in the review loop if they block clarity, pacing, or render quality.",
      "",
      "## User Idea",
      "",
      input.idea,
      "",
      "## Asset Library",
      "",
      assetList,
      "",
      "## Recommended Stack",
      "",
      recommendedStack,
      "",
      "## Human Explanation",
      "",
      bulletList(humanDigest.technologyPlainWords),
      "",
      "## Tuning Parameters",
      "",
      formatTuningParameters(tuningParameters),
      "",
      "## Recommended Template",
      "",
      `Use the ${recommendation.template.id} route: ${recommendation.template.templateGuidance.join(" ")}`,
      "",
      catalogPlan(recommendation.catalogRecommendation),
      "",
      "## Acceptance Criteria",
      "",
      bulletList(recommendation.acceptanceCriteria),
      "",
      "## Scene Shape",
      "",
      "1. Open with a strong visual promise.",
      "2. Build tension around the user's problem or opportunity.",
      "3. Use supplied assets as proof, texture, or product signal.",
      "4. Add programmed motion with readable pacing.",
      "5. End with a clear payoff or next action.",
      "",
    ].join("\n"),
    "ITERATIONS.md": [
      "# Iterations",
      "",
      "## Human Review Notes",
      "",
      "After each preview or render, explain changes to the user in plain language: what changed, why it changed, what to review, and what decision is needed next.",
      "",
      "## v001",
      "",
      "Initial creative package.",
      "",
      "- Review the asset library with the user.",
      "- Refine the creative direction through conversation.",
      "- Generate or update the HyperFrames or Remotion composition.",
      "- Record render feedback and next changes here.",
      "",
      "## HITL Loop",
      "",
      `Current phase: ${hitlLoop.currentPhase}`,
      "",
      `Next action: ${hitlLoop.nextAction}`,
      "",
      "### Proposal Options",
      "",
      numberedList(hitlLoop.proposalOptions),
      "",
      "### Decision Log",
      "",
      bulletList(hitlLoop.decisionLog),
      "",
      "### Feedback Prompts",
      "",
      bulletList(hitlLoop.feedbackPrompts),
      "",
    ].join("\n"),
    ".framepack/state.json": JSON.stringify(
      {
        version: "framepack.workbench.v1",
        mode: "hyperframes-creative-workbench",
        projectName: input.projectName,
        format: input.format,
        durationSec: input.durationSec,
        entrypoints: {
          guide: "FRAMEPACK.md",
          human: "HUMAN.md",
          assets: "ASSETS.md",
          style: "STYLE.md",
          direction: "DIRECTION.md",
          composition: "COMPOSITION.md",
          iterations: "ITERATIONS.md",
        },
        directorTranslation: recommendation.directorTranslation,
        catalogRecommendation: recommendation.catalogRecommendation,
        hitlLoop,
        tuningParameters,
        humanDigest,
      },
      null,
      2,
    ),
  };
}

export function formatWorkbenchHumanBrief(projectDir: string): string {
  const resolvedProjectDir = resolve(projectDir);
  const humanPath = join(resolvedProjectDir, "HUMAN.md");
  const statePath = join(resolvedProjectDir, ".framepack", "state.json");

  if (existsSync(humanPath)) {
    return [
      "Framepack human brief",
      `projectDir: ${resolvedProjectDir}`,
      "",
      readFileSync(humanPath, "utf8").trim(),
    ].join("\n");
  }

  if (!existsSync(statePath)) {
    throw new Error(`Missing HUMAN.md and .framepack/state.json in ${resolvedProjectDir}`);
  }

  const state = JSON.parse(readFileSync(statePath, "utf8")) as { humanDigest?: HumanDigest };

  if (!state.humanDigest) {
    throw new Error(`Missing humanDigest in ${statePath}`);
  }

  return [
    "Framepack human brief",
    `projectDir: ${resolvedProjectDir}`,
    "",
    formatHumanDigest(state.humanDigest).trim(),
  ].join("\n");
}

export function createWorkbenchProject(input: {
  projectName: string;
  idea: string;
  outputDir: string;
  assetDir?: string;
  style?: string;
  format?: "16:9" | "9:16";
  durationSec?: number;
}): WorkbenchProject {
  const projectDir = resolve(input.outputDir, input.projectName);
  const assets = scanAssets(input.assetDir);
  const files = buildFiles({
    projectName: input.projectName,
    idea: input.idea,
    style: input.style ?? "high-quality commercial programmed motion",
    format: input.format ?? "16:9",
    durationSec: input.durationSec ?? 45,
    assets,
  });

  for (const [filePath, content] of Object.entries(files)) {
    mkdirSync(dirname(join(projectDir, filePath)), { recursive: true });
    writeFileSync(join(projectDir, filePath), content, "utf8");
  }

  return { projectDir, assets, files };
}

export function defaultWorkbenchProjectName(idea: string) {
  return (
    basename(idea)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "framepack-workbench"
  );
}
