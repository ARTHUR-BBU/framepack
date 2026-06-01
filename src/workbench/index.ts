import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
import {
  listHyperframesPromptTemplates,
  recommendHyperframesPromptTemplate,
  type HyperframesPromptTemplateRecommendation,
} from "./hyperframes-prompt-templates.js";
import {
  findTemplateForSceneRole,
  type SceneTemplate,
} from "./scene-templates.js";

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
  promptTemplateRecommendation: HyperframesPromptTemplateRecommendation;
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

export type WorkbenchAuditPhase = "all" | "preflight" | "design" | "composition" | "preview" | "render";

export interface WorkbenchAuditCheck extends WorkbenchQaCheck {
  priority: "P0" | "P1" | "P2";
  phases: Exclude<WorkbenchAuditPhase, "all">[];
  correction: string;
}

export interface WorkbenchAuditReport {
  version: "framepack.workbench-audit.v1";
  phase: WorkbenchAuditPhase;
  status: "passed" | "failed";
  checks: WorkbenchAuditCheck[];
  priorityBlockers: WorkbenchAuditCheck[];
  findings: string[];
  corrections: string[];
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
  const promptTemplate = input.recommendation.promptTemplateRecommendation.template;
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
      `Recommended HyperFrames prompt template: ${promptTemplate.title}. This gives the agent a production-tested scene rhythm and HyperFrames rules to adapt.`,
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
  const promptTemplateRecommendation = recommendHyperframesPromptTemplate({
    templateId: template.id,
    idea: input.idea,
    style,
    format: input.format,
    durationSec: input.durationSec,
  });

  return {
    template,
    directorTranslation,
    catalogRecommendation,
    promptTemplateRecommendation,
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
  listHyperframesPromptTemplates,
  listTemplateMarket,
  recommendHyperframesCatalogPrefabs,
  recommendHyperframesPromptTemplate,
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

function buildAssetGaps(input: {
  assets: WorkbenchAsset[];
  idea: string;
  templateId: TemplateRouteId;
  catalogPrefabs: HyperframesCatalogRecommendation["prefabs"];
}): string {
  const assetKinds = new Set(input.assets.map((a) => a.kind));
  const signal = `${input.idea}`.toLowerCase();
  const gaps: { asset: string; blocking: boolean; recommend: string }[] = [];

  if (!assetKinds.has("image")) {
    gaps.push({ asset: "Brand/product images or screenshots", blocking: true, recommend: "Ask the user to provide logos, product photos, or screenshots. AI image generators can create backgrounds." });
  }

  if (!assetKinds.has("video")) {
    const needsVideo = signal.includes("game") || signal.includes("demo") || signal.includes("trailer") || signal.includes("gameplay");
    if (needsVideo) {
      gaps.push({ asset: "Video clips (gameplay, demo, trailer footage)", blocking: true, recommend: "Ask the user to provide video files. Pre-transcode with ffmpeg: `ffmpeg -i input.mp4 -c:v libx264 -r 30 -g 30 -keyint_min 30 output.mp4`" });
    }
  }

  if (!assetKinds.has("audio")) {
    gaps.push({ asset: "Background music or voiceover audio", blocking: false, recommend: "Optional. If needed: ask user for audio file, or use TTS tools like `npx hyperframes tts` for narration." });
  }

  if (signal.includes("game") || signal.includes("pixel") || signal.includes("sprite")) {
    gaps.push({ asset: "Sprite/pixel art animations", blocking: false, recommend: "Consider `agent-sprite-forge` for generating pixel art sprite sheets." });
  }

  if (signal.includes("brand") || signal.includes("logo")) {
    if (!input.assets.some((a) => a.name.toLowerCase().includes("logo"))) {
      gaps.push({ asset: "Brand logo file (PNG/SVG with transparency)", blocking: true, recommend: "Ask the user to provide their logo file. PNG with transparent background preferred." });
    }
  }

  if (input.catalogPrefabs.length > 0) {
    gaps.push({ asset: "HyperFrames Catalog components", blocking: false, recommend: `Install recommended prefabs: ${input.catalogPrefabs.map((p) => `\`${p.installCommand}\``).join(", ")}` });
  }

  if (gaps.length === 0) {
    return [
      "# Asset Gap Analysis",
      "",
      "No critical gaps detected. User-provided assets cover the basic needs for this composition.",
      "",
      "- Proceed with Catalog Pre-Flight in COMPOSITION.md before writing code.",
      "- Ask the user to confirm the assets are correct and up to date.",
      "",
    ].join("\n");
  }

  const blocking = gaps.filter((g) => g.blocking);
  const optional = gaps.filter((g) => !g.blocking);

  const lines = [
    "# Asset Gap Analysis",
    "",
    `Template route: ${input.templateId}`,
    `User assets scanned: ${input.assets.length}`,
    `Gaps found: ${gaps.length} (${blocking.length} blocking, ${optional.length} optional)`,
    "",
  ];

  if (blocking.length > 0) {
    lines.push("## Blocking (must resolve before composition)", "");
    for (const gap of blocking) {
      lines.push(`- **${gap.asset}**`);
      lines.push(`  Recommend: ${gap.recommend}`);
      lines.push("");
    }
  }

  if (optional.length > 0) {
    lines.push("## Optional (can proceed without)", "");
    for (const gap of optional) {
      lines.push(`- **${gap.asset}**`);
      lines.push(`  Recommend: ${gap.recommend}`);
      lines.push("");
    }
  }

  lines.push("## Next Step", "");
  lines.push("Resolve blocking gaps with the user, then proceed to COMPOSITION.md Catalog Pre-Flight and composition building.", "");

  return lines.join("\n");
}

function catalogPlan(recommendation: HyperframesCatalogRecommendation) {
  const prefabLines = recommendation.prefabs.length > 0
    ? recommendation.prefabs.map((prefab) => `- ${prefab.id} (${prefab.kind}): ${prefab.bestUse} Install: \`${prefab.installCommand}\`.`).join("\n")
    : "- No strong Catalog prefab match. Keep the route custom and inspect the live Catalog before writing from scratch.";

  return [
    "## Catalog Pre-Flight",
    "",
    "**Before writing any custom composition code, complete these steps:**",
    "",
    "1. `npx hyperframes catalog --json` — list all available components",
    "2. For each recommended prefab: `npx hyperframes add <component-id>`",
    "3. Use installed components as building blocks first",
    "4. Only write custom code for what catalog does not cover",
    "",
    "Block type (sub-composition):",
    "```html",
    "<div data-composition-id=\"caption-clip-wipe\"",
    "     data-composition-src=\"compositions/caption-clip-wipe.html\"",
    "     data-start=\"3\" data-duration=\"4\" data-track-index=\"2\">",
    "</div>",
    "```",
    "",
    "Component type: copy the CSS class and GSAP tween from the installed component source.",
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

function promptTemplatePlan(recommendation: HyperframesPromptTemplateRecommendation) {
  const template = recommendation.template;

  return [
    "## HyperFrames Prompt Template",
    "",
    `Selected blueprint: ${template.id} (${template.title})`,
    "",
    `Source: ${template.source}`,
    `Aspect: ${template.aspect}`,
    `Reason: ${recommendation.reason}`,
    "",
    "Scene shape:",
    "",
    numberedList(template.sceneShape),
    "",
    "Director notes:",
    "",
    bulletList(template.directorNotes),
    "",
    "Catalog commands to consider:",
    "",
    bulletList(template.catalogCommands.map((command) => `\`${command}\``)),
    "",
    "HyperFrames rules:",
    "",
    bulletList(template.hyperframesRules),
    "",
    "Template acceptance criteria:",
    "",
    bulletList(template.acceptanceCriteria),
  ].join("\n");
}

function templateFusionPlan(recommendation: PolishArsenalRecommendation) {
  return [
    "## Template Fusion Plan",
    "",
    "- Treat the prompt template as a director blueprint, not a finished video.",
    "- Keep user assets and user intent as the source of truth.",
    "- Borrow scene rhythm, Catalog candidates, motion rules, and QA checks from the selected template.",
    "- Replace generic template copy with the user's offer, proof, audience, and CTA.",
    "- If the user gives a reference video, mine it into `VIDEO_DNA.md` and then update `TEMPLATE_BLUEPRINT.md` before changing the composition.",
    `- Current workflow route: ${recommendation.template.id} (${recommendation.template.label}).`,
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
      pattern: /Catalog Pre-Flight/,
      id: "catalog-plan",
      summary: "COMPOSITION.md includes a Catalog Pre-Flight section.",
      finding: "COMPOSITION.md is missing Catalog Pre-Flight.",
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
    validateContains({
      files,
      file: "COMPOSITION.md",
      pattern: /HyperFrames Prompt Template/,
      id: "prompt-template-plan",
      summary: "COMPOSITION.md includes a HyperFrames Prompt Template plan.",
      finding: "COMPOSITION.md is missing a HyperFrames Prompt Template plan.",
    }),
    validateContains({
      files,
      file: "DESIGN_TOKENS.md",
      pattern: /Design Tokens/,
      id: "design-tokens",
      summary: "DESIGN_TOKENS.md exists as the stable visual token source.",
      finding: "DESIGN_TOKENS.md is missing.",
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
    ["FRAMEPACK.md", "ASSETS.md", "ASSET_GAPS.md", "HUMAN.md", "STYLE.md", "DIRECTION.md", "COMPOSITION.md", "ITERATIONS.md", "DESIGN.md", "DESIGN_TOKENS.md", ".framepack/state.json"]
      .map((filePath) => [
        filePath,
        existsSync(join(projectDir, filePath)) ? readFileSync(join(projectDir, filePath), "utf8") : "",
      ]),
  );

  return validateWorkbenchFiles(files);
}

function auditContains(input: {
  files: Record<string, string>;
  file: string;
  pattern: RegExp;
  id: string;
  phases: Exclude<WorkbenchAuditPhase, "all">[];
  priority: WorkbenchAuditCheck["priority"];
  summary: string;
  finding: string;
  correction: string;
}): WorkbenchAuditCheck {
  const content = input.files[input.file] ?? "";
  const passed = input.pattern.test(content);
  return {
    id: input.id,
    phases: input.phases,
    priority: input.priority,
    status: passed ? "passed" : "failed",
    summary: passed ? input.summary : input.finding,
    correction: input.correction,
  };
}

export function auditWorkbenchFiles(files: Record<string, string>, phase: WorkbenchAuditPhase = "all"): WorkbenchAuditReport {
  const allChecks: WorkbenchAuditCheck[] = [
    auditContains({
      files,
      file: "DESIGN_TOKENS.md",
      pattern: /Design Tokens[\s\S]*(Colors|Palette|#(?:[0-9a-fA-F]{6}))/,
      id: "design-token-contract",
      phases: ["preflight", "design", "composition", "preview", "render"],
      priority: "P0",
      summary: "DESIGN_TOKENS.md provides executable visual tokens.",
      finding: "DESIGN_TOKENS.md is missing executable colors or token guidance.",
      correction: "Regenerate or repair DESIGN.md and DESIGN_TOKENS.md before writing or rebuilding composition code.",
    }),
    auditContains({
      files,
      file: "ASSET_GAPS.md",
      pattern: /Gaps found|No critical gaps detected|Blocking \(must resolve before composition\)|Optional \(can proceed without\)/,
      id: "asset-gap-intelligence",
      phases: ["preflight", "composition"],
      priority: "P1",
      summary: "ASSET_GAPS.md explains blocking or optional asset needs.",
      finding: "ASSET_GAPS.md does not expose actionable asset gap status.",
      correction: "Re-run Framepack create or update ASSET_GAPS.md with blocking, optional, recommendation, and next-step sections.",
    }),
    auditContains({
      files,
      file: "FRAMEPACK.md",
      pattern: /Skill\/instructions|Project skills|Trigger Framepack|agentic loop/i,
      id: "skill-install-surface",
      phases: ["preflight"],
      priority: "P1",
      summary: "FRAMEPACK.md exposes when agents must trigger Framepack skills or instructions.",
      finding: "FRAMEPACK.md does not expose a clear skill/instruction trigger surface.",
      correction: "Run framepack init-agent for the project and keep FRAMEPACK.md trigger rules visible to Codex or Claude Code.",
    }),
    auditContains({
      files,
      file: "ITERATIONS.md",
      pattern: /HITL Loop[\s\S]*(Decision Log|Feedback Prompts|Next action)/,
      id: "harness-compliance-audit",
      phases: ["preflight", "composition", "preview", "render"],
      priority: "P0",
      summary: "ITERATIONS.md records the HITL loop needed to supervise and correct agent work.",
      finding: "ITERATIONS.md does not record the HITL loop and correction checkpoints.",
      correction: "Restore the HITL loop, decision log, feedback prompts, and review notes before asking testers to continue.",
    }),
    auditContains({
      files,
      file: "COMPOSITION.md",
      pattern: /Catalog Pre-Flight[\s\S]*(npx hyperframes add|Recommended prefabs|Fallback)/,
      id: "technology-install-plan",
      phases: ["composition", "preview", "render"],
      priority: "P1",
      summary: "COMPOSITION.md contains a concrete technology or Catalog install plan.",
      finding: "COMPOSITION.md does not contain an actionable technology/Catalog install plan.",
      correction: "Add install commands, fallback strategy, and user-confirmation notes for recommended technologies.",
    }),
    auditContains({
      files,
      file: "HUMAN.md",
      pattern: /Current Summary[\s\S]*(Next user decision|What I need from you)/,
      id: "plain-language-disclosure",
      phases: ["preflight", "preview", "render"],
      priority: "P1",
      summary: "HUMAN.md gives the user a plain-language summary and decision point.",
      finding: "HUMAN.md does not disclose progress and next decisions in plain language.",
      correction: "Update HUMAN.md before continuing so the user understands the plan and can redirect it.",
    }),
    auditContains({
      files,
      file: "index.html",
      pattern: /data-composition-id[\s\S]*data-start="0"[\s\S]*data-width="(?:1080|1920)"[\s\S]*data-height="(?:1080|1920)"[\s\S]*window\.__timelines/,
      id: "build-output-contract",
      phases: ["preview", "render"],
      priority: "P0",
      summary: "index.html exposes the HyperFrames root contract and timeline registration.",
      finding: "index.html is missing the HyperFrames root contract or timeline registration.",
      correction: "Run framepack build and fix the composition before preview or render.",
    }),
    auditContains({
      files,
      file: "COMPOSITION.md",
      pattern: /Preview Before Render[\s\S]*(User confirms|Record feedback|render)/,
      id: "preview-before-render-loop",
      phases: ["preview", "render"],
      priority: "P1",
      summary: "COMPOSITION.md requires preview and user feedback before render.",
      finding: "COMPOSITION.md does not require preview and user feedback before render.",
      correction: "Restore the Preview Before Render loop before handing the project to testers.",
    }),
  ];
  const checks = phase === "all" ? allChecks : allChecks.filter((check) => check.phases.includes(phase));
  const priorityBlockers = checks.filter(
    (check) => check.status === "failed" && (check.priority === "P0" || check.priority === "P1"),
  );

  return {
    version: "framepack.workbench-audit.v1",
    phase,
    status: priorityBlockers.length === 0 ? "passed" : "failed",
    checks,
    priorityBlockers,
    findings: checks.filter((check) => check.status === "failed").map((check) => check.summary),
    corrections: priorityBlockers.map((check) => check.correction),
  };
}

export function auditWorkbenchProject(projectDir: string, phase: WorkbenchAuditPhase = "all"): WorkbenchAuditReport {
  const files = Object.fromEntries(
    ["FRAMEPACK.md", "ASSETS.md", "ASSET_GAPS.md", "HUMAN.md", "STYLE.md", "DIRECTION.md", "COMPOSITION.md", "ITERATIONS.md", "DESIGN.md", "DESIGN_TOKENS.md", "index.html", "meta.json", ".framepack/state.json"]
      .map((filePath) => [
        filePath,
        existsSync(join(projectDir, filePath)) ? readFileSync(join(projectDir, filePath), "utf8") : "",
      ]),
  );

  return auditWorkbenchFiles(files, phase);
}

const DESIGN_SYSTEM_SIGNALS: { id: string; keywords: string[] }[] = [
  { id: "spacex", keywords: ["space", "dark", "cinematic", "futuristic", "rocket", "tech", "black", "white"] },
  { id: "tesla", keywords: ["automotive", "electric", "clean", "car", "vehicle", "photography", "minimal"] },
  { id: "nvidia", keywords: ["ai", "gpu", "green", "dark", "data", "computing", "chip"] },
  { id: "apple", keywords: ["premium", "elegant", "minimal", "apple", "refined", "polished", "ios"] },
  { id: "stripe", keywords: ["fintech", "professional", "purple", "corporate", "payment", "finance"] },
  { id: "nike", keywords: ["sport", "athletic", "energy", "bold", "monochrome", "fitness", "running", "football", "soccer", "basketball", "jersey", "team", "stadium", "transfer"] },
  { id: "ferrari", keywords: ["luxury", "automotive", "red", "cinematic", "editorial", "racing", "italian"] },
  { id: "lamborghini", keywords: ["aggressive", "luxury", "dark", "performance", "supercar"] },
  { id: "bugatti", keywords: ["ultra-luxury", "exclusive", "dark", "refined", "hypercar"] },
  { id: "bmw-m", keywords: ["performance", "dynamic", "automotive", "motorsport", "bold"] },
  { id: "vercel", keywords: ["developer", "dark", "minimal", "modern", "deployment", "nextjs"] },
  { id: "linear-app", keywords: ["saas", "clean", "purple", "productivity", "project"] },
  { id: "spotify", keywords: ["entertainment", "dark", "green", "music", "audio", "podcast"] },
  { id: "discord", keywords: ["social", "gaming", "community", "purple", "chat"] },
  { id: "figma", keywords: ["creative", "design", "collaboration", "colorful", "tool"] },
  { id: "playstation", keywords: ["gaming", "dark", "blue", "console", "ps5", "game"] },
  { id: "shopify", keywords: ["e-commerce", "green", "retail", "modern", "store", "shop"] },
  { id: "meta", keywords: ["social", "blue", "platform", "meta", "facebook"] },
  { id: "uber", keywords: ["transport", "modern", "clean", "global", "ride", "mobility"] },
  { id: "raycast", keywords: ["productivity", "dark", "developer", "fast", "launcher"] },
  { id: "openai", keywords: ["ai", "minimal", "clean", "research", "gpt", "chatgpt"] },
  { id: "notion", keywords: ["productivity", "clean", "workspace", "notes", "wiki"] },
];

function buildCapabilityRecommendations(idea: string, style: string, templateId: string): string[] {
  const signal = `${idea} ${style}`.toLowerCase();
  const recs: string[] = [];

  if (signal.includes("game") || signal.includes("pixel") || signal.includes("sprite")) {
    recs.push("- Capability: `agent-sprite-forge` — 2D sprite asset generation for game-style animation.");
  }

  if (signal.includes("3d") || signal.includes("three.js") || signal.includes("webgl")) {
    recs.push("- Capability: Three.js / WebGL — 3D rendering for immersive scenes. Use `npx hyperframes add` to check catalog support.");
  }

  if (templateId === "data-shock" || signal.includes("chart") || signal.includes("graph") || signal.includes("data")) {
    recs.push("- Capability: D3.js or Chart.js — data visualization for stats and metrics. Embed as Canvas or SVG.");
  }

  if (signal.includes("audio") || signal.includes("music") || signal.includes("beat")) {
    recs.push("- Capability: Web Audio API — audio-reactive animation. See HyperFrames `references/audio-reactive.md` for patterns.");
  }

  return recs;
}

function matchDesignSystem(signal: string): string | null {
  const lower = signal.toLowerCase();
  let bestId: string | null = null;
  let bestScore = 0;

  for (const ds of DESIGN_SYSTEM_SIGNALS) {
    const score = ds.keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestId = ds.id;
    }
  }

  // Require at least 2 keyword matches to avoid false positives.
  return bestScore >= 2 ? bestId : null;
}

function buildDesignFiles(idea: string, style: string, brandColors?: string): Record<string, string> {
  // When user provides explicit brand colors, skip design system matching.
  if (brandColors) {
    const colors = brandColors.split(",").map((c) => c.trim()).filter(Boolean);
    return {
      "DESIGN.md": [
        "# Design System",
        "",
        "User-specified brand colors are the source of truth for this project.",
        "",
        "## Palette",
        "",
        ...colors.map((color, index) => `- Color ${index + 1}: ${color}`),
        "",
        "## Rule",
        "",
        "Use these colors exactly unless the user changes the brand direction.",
        "",
      ].join("\n"),
      "DESIGN_TOKENS.md": [
        "# Design Tokens",
        "",
        "User-specified brand colors. Use these exact values in composition code.",
        "",
        "## Colors",
        "",
        ...colors.map((c, i) => `- ${i === 0 ? "Primary" : i === 1 ? "Secondary" : i === 2 ? "Accent" : `Color ${i + 1}`}: ${c}`),
        "",
        "## Typography",
        "",
        "- Select typography that matches the brand's industry and tone.",
        "",
      ].join("\n"),
    };
  }

  const designId = matchDesignSystem(`${idea} ${style}`);

  // No match found — let the agent decide colors.
  if (!designId) {
    return {
      "DESIGN.md": [
        "# Design System",
        "",
        "No named design system matched with enough confidence. Use this neutral production fallback until the user or agent selects a stronger reference.",
        "",
        "## Palette",
        "",
        "- Background primary: #050505",
        "- Background secondary: #151515",
        "- Accent primary: #ffffff",
        "- Accent secondary: #8a8f98",
        "- Text primary: #ffffff",
        "- Text secondary: #b8bcc5",
        "",
        "## Typography",
        "",
        "- Heading font: Inter, Arial, sans-serif",
        "- Body font: Inter, Arial, sans-serif",
        "- Heading weight: 800",
        "- Body weight: 500",
        "",
        "## Rule",
        "",
        "This fallback is deliberately restrained. Replace it with a named design system when the user gives a clear reference or brand direction.",
        "",
      ].join("\n"),
      "DESIGN_TOKENS.md": [
        "# Design Tokens",
        "",
        "No design system matched. These executable fallback tokens keep the project buildable and auditable until a stronger design reference is selected.",
        "",
        "## Colors",
        "",
        "- Background primary: #050505",
        "- Background secondary: #151515",
        "- Accent primary: #ffffff",
        "- Accent secondary: #8a8f98",
        "- Text primary: #ffffff",
        "- Text secondary: #b8bcc5",
        "",
        "## Typography",
        "",
        "- Heading font: Inter, Arial, sans-serif",
        "- Body font: Inter, Arial, sans-serif",
        "- Heading weight: 800",
        "- Body weight: 500",
        "",
        "Use `--brand-colors \"#RRGGBB,#RRGGBB,...\"` or a clear reference style to specify exact brand colors.",
        "",
      ].join("\n"),
    };
  }

  const designSourcePath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "designs", `${designId}.md`);

  if (!existsSync(designSourcePath)) {
    return {
      "DESIGN.md": [
        "# Design System",
        "",
        `Matched design system '${designId}', but the source file was not bundled. Use the fallback production tokens below.`,
        "",
      ].join("\n"),
      "DESIGN_TOKENS.md": [
        "# Design Tokens",
        "",
        "Matched design system source was missing. These fallback tokens keep the project buildable and auditable.",
        "",
        "## Colors",
        "",
        "- Background primary: #050505",
        "- Background secondary: #151515",
        "- Accent primary: #ffffff",
        "- Accent secondary: #8a8f98",
        "- Text primary: #ffffff",
        "- Text secondary: #b8bcc5",
        "",
        "## Typography",
        "",
        "- Heading font: Inter, Arial, sans-serif",
        "- Body font: Inter, Arial, sans-serif",
        "- Heading weight: 800",
        "- Body weight: 500",
        "",
      ].join("\n"),
    };
  }

  const designContent = readFileSync(designSourcePath, "utf8");

  return {
    "DESIGN.md": designContent,
    "DESIGN_TOKENS.md": buildDesignTokens(designContent),
  };
}

function buildDesignTokens(designContent: string): string {
  const colorLines: string[] = [];
  const fontLines: string[] = [];

  for (const line of designContent.split("\n")) {
    const hexMatch = line.match(/`#([0-9a-fA-F]{3,8})`/);
    if (hexMatch) {
      const label = line.replace(/[`*#\[\]]/g, "").split(":")[0].split("(")[0].trim();
      colorLines.push(`- ${label}: #${hexMatch[1]}`);
    }
    if (line.match(/font-family|font.*:/i) && line.includes("px")) {
      fontLines.push(line.trim());
    }
  }

  return [
    "# Design Tokens",
    "",
    "Extracted from the matched design system. Use these exact values in composition code.",
    "",
    "## Colors",
    "",
    colorLines.length > 0 ? colorLines.slice(0, 20).join("\n") : "- See DESIGN.md for full palette.",
    "",
    "## Typography",
    "",
    fontLines.length > 0 ? fontLines.slice(0, 10).join("\n") : "- See DESIGN.md for typography hierarchy.",
    "",
    "## Source",
    "",
    "These tokens were auto-extracted from DESIGN.md. For complete design rules, read DESIGN.md.",
    "",
  ].join("\n");
}

// --- Design token parsing for skeleton HTML ---

interface DesignTokensResolved {
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    accentPrimary: string;
    accentSecondary: string;
    textPrimary: string;
    textSecondary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingWeight: string;
    bodyWeight: string;
  };
}

const DEFAULT_TOKENS: DesignTokensResolved = {
  colors: {
    bgPrimary: "#0a0a0a",
    bgSecondary: "#111111",
    accentPrimary: "#ffffff",
    accentSecondary: "#888888",
    textPrimary: "#ffffff",
    textSecondary: "rgba(255,255,255,0.7)",
  },
  typography: {
    headingFont: "system-ui, sans-serif",
    bodyFont: "system-ui, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
  },
};

// --- Idea entity extraction ---

export interface IdeaEntities {
  names: string[];
  numbers: string[];
  actions: string[];
  styleKeywords: string[];
  duration: number | null;
}

export function extractIdeaEntities(idea: string): IdeaEntities {
  const names: string[] = [];
  const numbers: string[] = [];
  const actions: string[] = [];
  const styleKeywords: string[] = [];

  // Extract quoted names/brands
  const quoted = idea.match(/["""]([^""]+)["""]|«([^»]+)»/g);
  if (quoted) {
    for (const q of quoted) {
      const inner = q.replace(/^["""]|["""]$|^«|»$/g, "").trim();
      if (inner) names.push(inner);
    }
  }

  // Extract proper nouns (capitalized words not at sentence start)
  const properNouns = idea.match(/(?<=[a-zà-ÿ\s,.\-→>]\s)[A-Z][a-zA-Z]{2,}|[A-Z]{2,}/g);
  if (properNouns) {
    const stopWords = new Set(["The", "This", "That", "And", "But", "For", "With", "Make", "Create", "Build", "Using", "About", "From", "Into", "With"]);
    for (const pn of properNouns) {
      if (!stopWords.has(pn) && !names.includes(pn)) names.push(pn);
    }
  }

  // Extract "X → Y" or "X to Y" transfer patterns
  const transferMatch = idea.match(/([A-Z][a-zA-Z\s]{1,30})\s*(?:→|->|to)\s*([A-Z][a-zA-Z\s]{1,30})/);
  if (transferMatch) {
    const from = transferMatch[1].trim();
    const to = transferMatch[2].trim();
    if (from && !names.includes(from)) names.push(from);
    if (to && !names.includes(to)) names.push(to);
    actions.push("transfer");
  }

  // Extract numbers with units
  const numMatches = idea.matchAll(/(£|€|\$|¥)?(\d+(?:\.\d+)?)(%|\s*million|\s*billion|\s*k|\s* saves|\s* goals|\s* caps)?/gi);
  for (const m of numMatches) {
    const full = m[0].trim();
    if (full.length > 0 && !numbers.includes(full)) numbers.push(full);
  }

  // Extract action keywords
  const actionWords = ["transfer", "announcement", "launch", "reveal", "release", "debut", "arrival", "signing", "promo", "trailer", "teaser", "commercial", "ad"];
  const lowerIdea = idea.toLowerCase();
  for (const aw of actionWords) {
    if (lowerIdea.includes(aw)) actions.push(aw);
  }

  // Extract style keywords
  const styleWords = ["震撼", "premium", "energetic", "dramatic", "elegant", "minimal", "bold", "intense", "cinematic", "dark", "bright", "retro", "modern", "impactful", "sleek", "explosive"];
  for (const sw of styleWords) {
    if (lowerIdea.includes(sw.toLowerCase())) styleKeywords.push(sw);
  }

  // Extract duration
  let duration: number | null = null;
  const durMatch = idea.match(/(\d+)\s*[-]?\s*(?:秒|seconds?|sec|s\b)/i);
  if (durMatch) duration = parseInt(durMatch[1], 10);

  return { names, numbers, actions, styleKeywords, duration };
}

function parseDesignTokens(tokenMd: string): DesignTokensResolved {
  if (!tokenMd) return DEFAULT_TOKENS;
  const result = { ...DEFAULT_TOKENS, colors: { ...DEFAULT_TOKENS.colors }, typography: { ...DEFAULT_TOKENS.typography } };

  for (const line of tokenMd.split("\n")) {
    const hexMatch = line.match(/(-+\s+)?(\w[\w\s]*?):\s*(#[0-9a-fA-F]{3,8})/);
    if (!hexMatch) continue;
    const label = hexMatch[2].trim().toLowerCase();
    const hex = hexMatch[3];
    if (label.includes("primary")) result.colors.accentPrimary = hex;
    else if (label.includes("accent")) result.colors.accentSecondary = hex;
    else if (label.includes("secondary")) result.colors.bgSecondary = hex;
    else if (label.includes("background") || label.includes("bg")) result.colors.bgPrimary = hex;
    else if (label.includes("surface") || label.includes("card")) result.colors.bgSecondary = hex;
    else if (label.includes("text") && label.includes("secondary")) result.colors.textSecondary = hex;
    else if (label.includes("text") || label.includes("foreground")) result.colors.textPrimary = hex;
  }

  return result;
}

// --- Scene role → animation + content mapping ---

type AnimationTemplate = "impact-pop" | "scale-reveal" | "number-counter" | "slide-up" | "kinetic-type";
type HtmlTemplate = "headline" | "product" | "stats" | "proof" | "cta" | "generic";

const SCENE_ROLE_CONFIG: Record<string, { animation: AnimationTemplate; html: HtmlTemplate }> = {
  hook: { animation: "impact-pop", html: "headline" },
  headline: { animation: "impact-pop", html: "headline" },
  promise: { animation: "impact-pop", html: "headline" },
  number: { animation: "number-counter", html: "stats" },
  reward: { animation: "impact-pop", html: "headline" },
  product: { animation: "scale-reveal", html: "product" },
  action: { animation: "impact-pop", html: "product" },
  path: { animation: "scale-reveal", html: "product" },
  progression: { animation: "scale-reveal", html: "product" },
  stats: { animation: "number-counter", html: "stats" },
  proof: { animation: "number-counter", html: "proof" },
  context: { animation: "slide-up", html: "generic" },
  origin: { animation: "slide-up", html: "generic" },
  implication: { animation: "slide-up", html: "generic" },
  tension: { animation: "kinetic-type", html: "headline" },
  cta: { animation: "slide-up", html: "cta" },
  conviction: { animation: "slide-up", html: "cta" },
};

const FAST_TEMPLATES = new Set(["game-ad", "data-shock"]);

function isSafeInlineSceneTemplate(template: SceneTemplate | null | undefined): template is SceneTemplate {
  return Boolean(
    template &&
    template.source !== "block" &&
    template.html.length > 100 &&
    !/<video\b[\s\S]*\bdata-start=/.test(template.html),
  );
}

const SKELETON_SCENES: Record<string, { id: string; label: string; duration: number }[]> = {
  "saas-launch": [
    { id: "hook", label: "Hook — grab attention with the problem", duration: 4 },
    { id: "product", label: "Product — show the solution", duration: 6 },
    { id: "proof", label: "Proof — social proof and results", duration: 5 },
    { id: "cta", label: "CTA — clear call to action", duration: 3 },
  ],
  "news-explainer": [
    { id: "headline", label: "Headline — the key takeaway", duration: 4 },
    { id: "context", label: "Context — why it matters", duration: 6 },
    { id: "implication", label: "Implication — what happens next", duration: 5 },
  ],
  "course-promo": [
    { id: "promise", label: "Promise — what you'll learn", duration: 4 },
    { id: "path", label: "Path — the journey", duration: 6 },
    { id: "proof", label: "Proof — student results", duration: 5 },
    { id: "cta", label: "CTA — enroll now", duration: 3 },
  ],
  "game-ad": [
    { id: "hook", label: "Hook — explosive opening moment", duration: 3 },
    { id: "action", label: "Action — show the highlight", duration: 5 },
    { id: "stats", label: "Stats — numbers and metrics", duration: 4 },
    { id: "progression", label: "Progression — the journey", duration: 5 },
    { id: "reward", label: "Reward — the payoff", duration: 4 },
    { id: "cta", label: "CTA — what to do next", duration: 3 },
  ],
  "founder-story": [
    { id: "tension", label: "Tension — the struggle", duration: 5 },
    { id: "origin", label: "Origin — how it started", duration: 6 },
    { id: "conviction", label: "Conviction — the belief", duration: 5 },
  ],
  "data-shock": [
    { id: "number", label: "Number — the shocking stat", duration: 4 },
    { id: "context", label: "Context — what it means", duration: 6 },
    { id: "action", label: "Action — what to do", duration: 4 },
  ],
};

function buildSkeletonHtml(input: {
  projectName: string;
  format: "16:9" | "9:16";
  durationSec: number;
  idea: string;
  templateId: string;
  designTokens?: DesignTokensResolved | null;
  assets?: WorkbenchAsset[];
  pacing?: "slow" | "medium" | "fast";
}): string {
  const tokens = input.designTokens ?? DEFAULT_TOKENS;
  const [width, height] = input.format === "9:16" ? [1080, 1920] : [1920, 1080];
  const scenes = SKELETON_SCENES[input.templateId] ?? SKELETON_SCENES["saas-launch"];
  const totalSceneDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const scaleFactor = totalSceneDuration > 0 ? input.durationSec / totalSceneDuration : 1;
  const isFastPaced = FAST_TEMPLATES.has(input.templateId) || input.pacing === "fast";
  const isPortrait = input.format === "9:16";
  const shortIdea = input.idea.length > 60 ? input.idea.slice(0, 57) + "..." : input.idea;

  const f = {
    gap: isPortrait ? "20px" : "28px",
    pad: isPortrait ? "100px 40px" : "100px 140px",
    title: isPortrait ? "56px" : "88px",
    body: isPortrait ? "26px" : "34px",
    bodyMax: isPortrait ? "900px" : "1400px",
    stat: isPortrait ? "80px" : "120px",
    statLabel: isPortrait ? "24px" : "32px",
    ctaPad: isPortrait ? "20px 48px" : "24px 64px",
    ctaFont: isPortrait ? "28px" : "36px",
    quoteFont: isPortrait ? "36px" : "52px",
    quoteMax: isPortrait ? "850px" : "1200px",
    attrFont: isPortrait ? "22px" : "28px",
    imgMax: isPortrait ? "280px" : "400px",
  };

  // Extract entities from idea for template filling
  const entities = extractIdeaEntities(input.idea);
  const entityName = entities.names[0] || "Your Brand";
  const entityTagline = entities.names.length > 1 ? entities.names[1] : entities.actions[0] || "Coming Soon";
  const entitySubtitle = entities.actions[0] || entities.styleKeywords[0] || "";
  const statValue = entities.numbers[0]?.replace(/[£€$¥]/, "") || "100";
  const statPrefix = entities.numbers[0]?.match(/[£€$¥]/)?.[0] || "";
  const statLabel = entities.numbers[0] || "Key Metric";

  // Calculate scene timing
  let currentTime = 0;
  const timed = scenes.map((scene) => {
    const dur = Math.round(scene.duration * scaleFactor * 10) / 10;
    const start = Math.round(currentTime * 10) / 10;
    currentTime += dur;
    return { ...scene, dur, start };
  });

  // Build scene HTML with role-specific content
  const videoAssets = (input.assets ?? []).filter(a => a.kind === "video");
  const imageAssets = (input.assets ?? []).filter(a => a.kind === "image");

  // Collect video elements separately — they must be direct children of composition root
  const rootVideos: string[] = [];

  const sceneDivs = timed.map((scene, idx) => {
    const role = SCENE_ROLE_CONFIG[scene.id] ?? { animation: "slide-up", html: "generic" };

    // Try to find a matching scene template
    const template = findTemplateForSceneRole(scene.id, input.format, scene.dur);
    const usableTemplate = isSafeInlineSceneTemplate(template) ? template : null;
    let content: string;

    if (usableTemplate) {
      // Use scene template — fill in entity placeholders
      content = usableTemplate.html
        .replace(/\{\{entityName\}\}/g, entityName)
        .replace(/\{\{entityTagline\}\}/g, entityTagline)
        .replace(/\{\{entitySubtitle\}\}/g, entitySubtitle)
        .replace(/\{\{sceneIndex\}\}/g, String(idx))
        .replace(/\{\{sceneStart\}\}/g, String(scene.start))
        .replace(/\{\{sceneDuration\}\}/g, String(scene.dur))
        .replace(/\{\{statValue\}\}/g, statValue)
        .replace(/\{\{statPrefix\}\}/g, statPrefix)
        .replace(/\{\{statSuffix\}\}/g, "")
        .replace(/\{\{statLabel\}\}/g, statLabel)
        .replace(/\{\{videoSrc\}\}/g, videoAssets.length > 0 ? `assets/${videoAssets[0].name}` : "")
        .replace(/\{\{labelText\}\}/g, entityName)
        .replace(/\{\{subLabelText\}\}/g, entityTagline)
        .replace(/\{\{ctaHeadline\}\}/g, entityTagline)
        .replace(/\{\{ctaSubtext\}\}/g, entitySubtitle || entityName)
        .replace(/\{\{ctaButtonText\}\}/g, entityName)
        .replace(/\{\{countdownFrom\}\}/g, "5")
        .replace(/\{\{mainTitle\}\}/g, entityName)
        .replace(/\{\{mainSubtext\}\}/g, entityTagline)
        .replace(/\{\{pipLabel\}\}/g, entitySubtitle || "LIVE")
        .replace(/\{\{bar1Label\}\}/g, "Speed").replace(/\{\{bar1Value\}\}/g, "85%")
        .replace(/\{\{bar2Label\}\}/g, "Power").replace(/\{\{bar2Value\}\}/g, "70%")
        .replace(/\{\{bar3Label\}\}/g, "Impact").replace(/\{\{bar3Value\}\}/g, "92%")
        .replace(/\{\{leftTitle\}\}/g, entityName).replace(/\{\{leftSubtext\}\}/g, entityTagline)
        .replace(/\{\{rightTitle\}\}/g, entityTagline).replace(/\{\{rightSubtext\}\}/g, entitySubtitle)
        .replace(/\{\{chartValue\}\}/g, statValue).replace(/\{\{chartLabel\}\}/g, statLabel)
        .replace(/\{\{chartSubtext\}\}/g, entityTagline)
        .replace(/\{\{cutTime\}\}/g, String(scene.start))
        .replace(/\{\{dissolveDuration\}\}/g, "0.5")
        .replace(/\{\{flashTime\}\}/g, String(scene.start))
        .replace(/\{\{prevSceneId\}\}/g, `scene-${Math.max(0, idx - 1)}`)
        .replace(/\{\{nextSceneId\}\}/g, `scene-${idx}`);

      // Strip comment blocks for cleaner output
      content = content.replace(/<!--[\s\S]*?-->/g, "").trim();
    } else {
      // Fallback to hardcoded content
      content = buildSceneContent(scene.id, role.html, input.idea, entityName, entityTagline, entitySubtitle, statValue, statPrefix, statLabel);
    }

    // Collect video elements for composition root (not inside scene div)
    const needsVideo = (role.html === "product" || scene.id === "action" || scene.id === "hook") && idx < videoAssets.length;
    const hasVideoInContent = content.includes("<video");
    if (needsVideo && !hasVideoInContent) {
      rootVideos.push(`  <video id="bg-video-${idx}" data-start="${scene.start}" data-duration="${scene.dur}" data-media-start="0" muted playsinline src="assets/${videoAssets[idx].name}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;"></video>`);
    }

    // Add image for product scenes (when not using template)
    const imgIdx = role.html === "product" && idx < imageAssets.length && !usableTemplate ? idx : -1;
    const imgEl = imgIdx >= 0
      ? `\n      <img src="assets/${imageAssets[idx].name}" style="max-width:${f.imgMax};max-height:50%;object-fit:contain;border-radius:12px;opacity:0.9;" />`
      : "";

    // If template already has a scene wrapper div, extract inner content
    // (templates are full scene HTML; we wrap them in our standard structure)
    if (usableTemplate && content.includes("class=\"scene clip\"")) {
      // Extract content between scene wrapper tags — strip the outer div
      const innerMatch = content.match(/class="scene clip"[^>]*>([\s\S]*)<\/div>\s*$/);
      const innerContent = innerMatch ? innerMatch[1].trim() : content;

      return `    <div id="scene-${idx}" data-scene-id="${scene.id}" class="scene clip" data-start="${scene.start}" data-duration="${scene.dur}">
${innerContent}
    </div>`;
    }

    return `    <div id="scene-${idx}" data-scene-id="${scene.id}" class="scene clip" data-start="${scene.start}" data-duration="${scene.dur}">
      <div class="scene-content">${imgEl}
${content}
      </div>
    </div>`;
  });

  // Build entrance + transition tweens
  const tweens: string[] = [];

  for (let i = 0; i < timed.length; i++) {
    const scene = timed[i];
    const sceneEl = `scene-${i}`;
    const role = SCENE_ROLE_CONFIG[scene.id] ?? { animation: "slide-up" as AnimationTemplate };
    const enterTime = i === 0 ? 0.2 : scene.start + 0.3;

    // First scene entrance (no prior transition handles it)
    if (i === 0) {
      tweens.push(buildEntranceTween(sceneEl, role.animation, enterTime));
    } else {
      tweens.push(buildInnerEntranceTween(sceneEl, role.animation, enterTime));
    }

    // Video opacity control
    if (videoAssets.length > 0) {
      const vIdx = (role.html === "product" || scene.id === "action" || scene.id === "hook") && i < videoAssets.length ? i : -1;
      if (vIdx >= 0) {
        tweens.push(`  gsap.set("#bg-video-${vIdx}", { opacity: 0 });`);
        tweens.push(`  tl.to("#bg-video-${vIdx}", { opacity: 0.3, duration: 0.5 }, ${scene.start + 0.2});`);
      }
    }

    // Transition to next scene (except last)
    if (i < timed.length - 1) {
      const next = timed[i + 1];
      const nextEl = `scene-${i + 1}`;
      if (isFastPaced) {
        tweens.push(`  tl.set("#${sceneEl} .scene-content", { opacity: 0 }, ${next.start});`);
        tweens.push(`  tl.from("#${nextEl} .scene-content", { opacity: 0, duration: 0.15 }, ${next.start});`);
      } else {
        tweens.push(`  tl.to("#${sceneEl} .scene-content", { opacity: 0, duration: 0.5, overwrite: "auto" }, ${next.start - 0.5});`);
        tweens.push(`  tl.from("#${nextEl} .scene-content", { opacity: 0, duration: 0.5 }, ${next.start});`);
      }
    }
  }

  // Final scene fade out
  const lastIdx = timed.length - 1;
  const fadeOutTime = Math.round((input.durationSec - 0.8) * 10) / 10;
  if (lastIdx >= 0) {
    tweens.push(`  tl.to("#scene-${lastIdx} .scene-content", { opacity: 0, duration: 0.8, overwrite: "auto" }, ${fadeOutTime});`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${input.projectName}</title>
  <style>
    :root {
      --bg-primary: ${tokens.colors.bgPrimary};
      --bg-secondary: ${tokens.colors.bgSecondary};
      --accent-primary: ${tokens.colors.accentPrimary};
      --accent-secondary: ${tokens.colors.accentSecondary};
      --text-primary: ${tokens.colors.textPrimary};
      --text-secondary: ${tokens.colors.textSecondary};
      --heading-font: ${tokens.typography.headingFont};
      --body-font: ${tokens.typography.bodyFont};
      --heading-weight: ${tokens.typography.headingWeight};
      --body-weight: ${tokens.typography.bodyWeight};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg-primary); color: var(--text-primary); font-family: var(--body-font); overflow: hidden; }

    [data-composition-id="${input.projectName}"] {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      background: var(--bg-primary);
      overflow: hidden;
    }

    .scene {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    .scene:first-child { opacity: 1; }
    #scene-0 { opacity: 1; }

    .scene-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: ${f.gap};
      width: 100%;
      height: 100%;
      padding: ${f.pad};
      text-align: center;
    }

    .scene-title {
      font-family: var(--heading-font);
      font-weight: var(--heading-weight);
      font-size: ${f.title};
      line-height: 1.1;
      letter-spacing: -1px;
      color: var(--text-primary);
    }

    .scene-body {
      font-family: var(--body-font);
      font-weight: var(--body-weight);
      font-size: ${f.body};
      line-height: 1.5;
      color: var(--text-secondary);
      max-width: ${f.bodyMax};
    }

    .stat-value {
      font-family: var(--heading-font);
      font-weight: var(--heading-weight);
      font-size: ${f.stat};
      color: var(--accent-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: ${f.statLabel};
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .cta-button {
      display: inline-block;
      padding: ${f.ctaPad};
      background: var(--accent-primary);
      color: var(--bg-primary);
      font-family: var(--heading-font);
      font-weight: var(--heading-weight);
      font-size: ${f.ctaFont};
      border-radius: 8px;
    }

    .proof-quote {
      font-family: var(--heading-font);
      font-size: ${f.quoteFont};
      font-style: italic;
      color: var(--text-primary);
      max-width: ${f.quoteMax};
      line-height: 1.3;
    }

    .proof-attr {
      font-size: ${f.attrFont};
      color: var(--accent-secondary);
    }

    .sweep-line {
      width: 120px;
      height: 4px;
      background: var(--accent-primary);
      transform: scaleX(0);
      transform-origin: left center;
    }
  </style>
</head>
<body>
  <div data-composition-id="${input.projectName}" data-start="0" data-duration="${input.durationSec}" data-width="${width}" data-height="${height}">
${rootVideos.join("\n")}
${sceneDivs.join("\n")}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });

${tweens.join("\n")}

    window.__timelines["${input.projectName}"] = tl;
  </script>
</body>
</html>`;
}

function buildSceneContent(
  sceneId: string,
  htmlTemplate: HtmlTemplate,
  idea: string,
  name: string,
  tagline: string,
  subtitle: string,
  statVal: string,
  statPre: string,
  statLbl: string,
): string {
  switch (htmlTemplate) {
    case "headline":
      return [
        `        <h1 class="scene-title">${name}</h1>`,
        `        <div class="sweep-line"></div>`,
        `        <p class="scene-body">${tagline || idea}</p>`,
      ].join("\n");
    case "product":
      return [
        `        <h2 class="scene-title">${name}</h2>`,
        `        <p class="scene-body">${subtitle || "Showcase the key feature or moment"}</p>`,
      ].join("\n");
    case "stats":
      return [
        `        <div class="stat-value" id="stat-${sceneId}">${statPre}0</div>`,
        `        <p class="stat-label">${statLbl || sceneLabel(sceneId)}</p>`,
      ].join("\n");
    case "proof":
      return [
        `        <p class="proof-quote">"${subtitle || "Real results speak louder than promises"}"</p>`,
        `        <p class="proof-attr">— ${name}</p>`,
      ].join("\n");
    case "cta":
      return [
        `        <h2 class="scene-title">${tagline || sceneLabel(sceneId)}</h2>`,
        `        <div class="cta-button">${name}</div>`,
      ].join("\n");
    default:
      return [
        `        <h2 class="scene-title">${name || sceneLabel(sceneId)}</h2>`,
        `        <p class="scene-body">${subtitle || idea}</p>`,
      ].join("\n");
  }
}

function sceneLabel(sceneId: string): string {
  const labels: Record<string, string> = {
    hook: "The Moment", headline: "Breaking", promise: "What You Will Learn",
    number: "The Number", tension: "The Challenge", product: "The Solution",
    action: "In Action", path: "The Journey", origin: "Where It Began",
    context: "The Big Picture", implication: "What It Means", stats: "By The Numbers",
    proof: "Real Results", progression: "The Climb", reward: "The Prize",
    cta: "Your Move", conviction: "The Mission",
  };
  return labels[sceneId] ?? sceneId;
}

function buildEntranceTween(sceneId: string, animation: AnimationTemplate, enterTime: number): string {
  const t = Math.round(enterTime * 10) / 10;
  switch (animation) {
    case "impact-pop":
      return `  tl.from("#${sceneId} .scene-title", { scale: 5, ease: "back.out(1.7)", duration: 0.3 }, ${t});`;
    case "scale-reveal":
      return `  tl.from("#${sceneId} .scene-content > *", { scale: 0, ease: "back.out(1.4)", duration: 0.5, stagger: 0.1, overwrite: "auto" }, ${t});`;
    case "number-counter":
      return `  tl.from("#${sceneId} .stat-value", { scale: 0.5, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t});`;
    case "kinetic-type":
      return `  tl.from("#${sceneId} .scene-title", { y: 80, opacity: 0, duration: 0.4, ease: "power3.out" }, ${t});`;
    default:
      return `  tl.from("#${sceneId} .scene-content", { y: 60, opacity: 0, duration: 0.5, ease: "power3.out" }, ${t});`;
  }
}

function buildInnerEntranceTween(sceneId: string, animation: AnimationTemplate, enterTime: number): string {
  const t = Math.round(enterTime * 10) / 10;
  switch (animation) {
    case "impact-pop":
      return `  tl.from("#${sceneId} .scene-title", { scale: 5, ease: "back.out(1.7)", duration: 0.3 }, ${t});`;
    case "scale-reveal":
      return `  tl.from("#${sceneId} .scene-content > *", { scale: 0, ease: "back.out(1.4)", duration: 0.5, stagger: 0.1 }, ${t});`;
    case "number-counter":
      return `  tl.from("#${sceneId} .stat-value", { scale: 0.5, duration: 0.6, ease: "power3.out" }, ${t});`;
    case "kinetic-type":
      return `  tl.from("#${sceneId} .scene-title", { y: 80, duration: 0.4, ease: "power3.out" }, ${t});`;
    default:
      return `  tl.from("#${sceneId} .scene-content > *", { y: 30, duration: 0.5, ease: "power3.out", stagger: 0.08 }, ${t});`;
  }
}

function buildFiles(input: {
  projectName: string;
  idea: string;
  style: string;
  format: "16:9" | "9:16";
  durationSec: number;
  assets: WorkbenchAsset[];
  brandColors?: string;
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
  const capabilityRecs = buildCapabilityRecommendations(input.idea, input.style, recommendation.template.id);
  const recommendedStack = [
    "- Runtime: HyperFrames first; Remotion is a good route for reusable social/template video.",
    "- Motion: GSAP timeline for HyperFrames-safe scene control.",
    `- Template: ${recommendation.template.id} (${recommendation.template.label}).`,
    `- HyperFrames prompt template: ${recommendation.promptTemplateRecommendation.template.id} (${recommendation.promptTemplateRecommendation.template.title}).`,
    `- Professional translation: ${recommendation.professionalCreativeLanguage}`,
    `- Animation techniques: ${recommendation.animationTechniques.join(", ")}.`,
    `- Aesthetic direction: ${recommendation.aestheticDirection.join(", ")}.`,
    `- Catalog prefabs: ${recommendation.catalogRecommendation.prefabs.map((prefab) => prefab.id).join(", ") || "inspect live Catalog before custom work"}.`,
    `- Avoid: ${recommendation.avoid.join(", ")}.`,
    "- Verification: CSS first scene visible, scene switches with tl.set(), timeline registered on window.__timelines.",
    ...capabilityRecs,
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
      "1. Read `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `DESIGN.md`, `DESIGN_TOKENS.md`, `STYLE.md`, `DIRECTION.md`, and `COMPOSITION.md` before writing code.",
      "2. Discuss unclear creative choices with the user in natural language.",
      "3. Use Framepack recommendations as a production brief, not as rigid rails.",
      "4. Build or refine the HyperFrames composition.",
      "5. Preview before render: `npx hyperframes preview --port 3002`, let the user confirm, then `npx hyperframes render`.",
      "6. Record each render/review loop in `ITERATIONS.md`.",
      "7. Use the HITL loop before committing to a composition direction when the user's taste is fuzzy.",
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
      "- Project skills: run `framepack init-agent --target auto --scope project` in the consumer project so Codex and Claude Code can load the Framepack director, template fuser, HyperFrames builder, and reference miner instructions.",
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
      promptTemplatePlan(recommendation.promptTemplateRecommendation),
      "",
      templateFusionPlan(recommendation),
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
      "## Code Templates",
      "",
      "Impact Pop (text shock): `tl.from(\".headline\", { scale: 5, ease: \"back.out(1.7)\", duration: 0.3 }, sceneStart + 0.2)`",
      "",
      "Kinetic Typography (word-by-word): `tl.from(\".word\", { y: 80, opacity: 0, stagger: 0.05, duration: 0.4, ease: \"power3.out\" }, sceneStart)`",
      "",
      "Hard Scene Snap: `tl.set(\"#prev .content\", { opacity: 0 }, cutTime); tl.from(\"#next .content\", { opacity: 0, duration: 0.15 }, cutTime)`",
      "",
      "Smooth Dissolve: `tl.to(\"#prev .content\", { opacity: 0, duration: 0.5 }, cutTime - 0.5); tl.from(\"#next .content\", { opacity: 0, duration: 0.5 }, cutTime)`",
      "",
      "Scale Reveal: `tl.from(\".panel\", { scale: 0, ease: \"back.out(1.4)\", duration: 0.5, stagger: 0.1 }, sceneStart + 0.3)`",
      "",
      "Number Counter: animate a proxy object `{ val: 0 }` to target with `onUpdate` setting `textContent`.",
      "",
      "## HyperFrames Safety Checklist",
      "",
      "Before render, verify every rule:",
      "- `<video>` has `data-start` + `data-media-start`",
      "- No `Math.random()` (use mulberry32 seeded PRNG)",
      "- No `repeat: -1` (calculate finite: `Math.floor(total / cycle) - 1`)",
      "- First scene visible via CSS (`[data-scene-id=\"scene-1\"]{opacity:1}`)",
      "- Scene switches use `tl.set()`, not `tl.to({duration:0.01})`",
      "- Timeline registered: `window.__timelines[\"id\"] = tl`",
      "- No async timeline construction",
      "- Transitions between every scene (no jump cuts)",
      "- No exit animations except on final scene",
      "",
      "## Preview Before Render",
      "",
      "1. `npx hyperframes preview --port 3002`",
      "2. Open `http://localhost:3002/#project/<project-name>`",
      "3. User confirms visual quality",
      "4. Record feedback in ITERATIONS.md",
      "5. `npx hyperframes render` only after user approval",
      "",
    ].join("\n"),
    "ASSET_GAPS.md": buildAssetGaps({
      assets: input.assets,
      idea: input.idea,
      templateId: recommendation.template.id,
      catalogPrefabs: recommendation.catalogRecommendation.prefabs,
    }),
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
          assetGaps: "ASSET_GAPS.md",
          design: "DESIGN.md",
          designTokens: "DESIGN_TOKENS.md",
          style: "STYLE.md",
          direction: "DIRECTION.md",
          composition: "COMPOSITION.md",
          iterations: "ITERATIONS.md",
        },
        directorTranslation: recommendation.directorTranslation,
        catalogRecommendation: recommendation.catalogRecommendation,
        promptTemplateRecommendation: recommendation.promptTemplateRecommendation,
        hitlLoop,
        tuningParameters,
        humanDigest,
      },
      null,
      2,
    ),
    "meta.json": JSON.stringify({
      rootEntry: "index.html",
      compositionDirectory: ".",
      assetDirectory: "assets",
      runtime: "hyperframes",
    }, null, 2),
    ...buildHtmlWithDesign(input, recommendation),
  };
}

function buildHtmlWithDesign(input: { projectName: string; idea: string; style: string; format: "16:9" | "9:16"; durationSec: number; assets: WorkbenchAsset[]; brandColors?: string }, recommendation: PolishArsenalRecommendation): Record<string, string> {
  const designFiles = buildDesignFiles(input.idea, input.style, input.brandColors);
  return {
    "index.html": buildSkeletonHtml({
      projectName: input.projectName,
      format: input.format,
      durationSec: input.durationSec,
      idea: input.idea,
      templateId: recommendation.template.id,
      designTokens: parseDesignTokens(designFiles["DESIGN_TOKENS.md"] ?? ""),
      assets: input.assets,
      pacing: input.style.toLowerCase().includes("fast") ? "fast" : undefined,
    }),
    ...designFiles,
  };
}

export function scaffoldWorkbenchProject(projectDir: string): { projectDir: string; htmlPath: string; sceneCount: number; tokensApplied: boolean; assetsReferenced: number } {
  const dir = resolve(projectDir);

  let state: Record<string, unknown>;
  try {
    state = JSON.parse(readFileSync(join(dir, ".framepack", "state.json"), "utf8"));
  } catch {
    throw new Error("Not a Framepack project: missing .framepack/state.json");
  }
  const meta = (state.projectMetadata ?? state) as Record<string, unknown>;
  const projectName = (meta.projectName as string) ?? basename(dir);
  const format: "16:9" | "9:16" = (meta.format as "16:9" | "9:16") ?? "16:9";
  const durationSec = (meta.durationSec as number) ?? 30;
  const idea = (meta.idea as string) ?? basename(dir);
  const director = meta.directorTranslation as Record<string, unknown> | undefined;
  const templateId = (director?.narrativePattern as string)
    ?? recommendTemplateRoute({ idea: "", style: "", format, durationSec }).template.id;

  const tokensPath = join(dir, "DESIGN_TOKENS.md");
  const tokenMd = existsSync(tokensPath) ? readFileSync(tokensPath, "utf8") : "";
  const tokens = parseDesignTokens(tokenMd);

  const assetsPath = join(dir, "ASSETS.md");
  const assetMd = existsSync(assetsPath) ? readFileSync(assetsPath, "utf8") : "";
  const assets = parseAssetsFromMd(assetMd);

  const scenes = SKELETON_SCENES[templateId] ?? SKELETON_SCENES["saas-launch"];
  const html = buildSkeletonHtml({
    projectName,
    format,
    durationSec,
    idea,
    templateId,
    designTokens: tokens,
    assets,
  });

  const htmlPath = join(dir, "index.html");
  writeFileSync(htmlPath, html, "utf8");

  return {
    projectDir: dir,
    htmlPath,
    sceneCount: scenes.length,
    tokensApplied: tokenMd.length > 0,
    assetsReferenced: assets.length,
  };
}

function parseAssetsFromMd(md: string): WorkbenchAsset[] {
  const assets: WorkbenchAsset[] = [];
  const validKinds = new Set(["image", "video", "audio", "text", "other"]);
  for (const line of md.split("\n")) {
    const m = line.match(/[-*]\s+`?([^`*\s]+\.\w+)`?\s*\((\w+)\)/);
    if (m) assets.push({ name: m[1], kind: (validKinds.has(m[2]) ? m[2] : "other") as WorkbenchAssetKind, path: "" });
  }
  return assets;
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
  brandColors?: string;
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
    brandColors: input.brandColors,
  });

  for (const [filePath, content] of Object.entries(files)) {
    mkdirSync(dirname(join(projectDir, filePath)), { recursive: true });
    writeFileSync(join(projectDir, filePath), content, "utf8");
  }

  // Auto-copy asset files to project's assets/ directory
  if (input.assetDir) {
    const sourceDir = resolve(input.assetDir);
    const targetDir = join(projectDir, "assets");
    if (existsSync(sourceDir) && sourceDir !== targetDir) {
      mkdirSync(targetDir, { recursive: true });
      for (const asset of assets) {
        const src = join(sourceDir, asset.name);
        const dst = join(targetDir, asset.name);
        if (existsSync(src) && !existsSync(dst)) {
          try { copyFileSync(src, dst); } catch { /* skip unreadable files */ }
        }
      }
    }
  }

  return { projectDir, assets, files };
}

export function buildWorkbenchProject(projectDir: string): {
  projectDir: string;
  htmlPath: string;
  sceneCount: number;
  tokensApplied: boolean;
  assetsReferenced: number;
  templatesUsed: string[];
} {
  const dir = resolve(projectDir);

  // Read project state
  let state: Record<string, unknown>;
  try {
    state = JSON.parse(readFileSync(join(dir, ".framepack", "state.json"), "utf8"));
  } catch {
    throw new Error("Not a Framepack project: missing .framepack/state.json. Run `framepack create` first.");
  }
  const meta = (state.projectMetadata ?? state) as Record<string, unknown>;
  const projectName = (meta.projectName as string) ?? basename(dir);
  const format: "16:9" | "9:16" = (meta.format as "16:9" | "9:16") ?? "16:9";
  const durationSec = (meta.durationSec as number) ?? 30;
  const idea = readIfExists(join(dir, "FRAMEPACK.md"))?.split("\n").find(l => l.startsWith("Idea:"))?.replace("Idea:", "").trim()
    ?? (meta.idea as string) ?? basename(dir);
  const director = meta.directorTranslation as Record<string, unknown> | undefined;
  const templateId = (director?.narrativePattern as string)
    ?? recommendTemplateRoute({ idea: "", style: "", format, durationSec }).template.id;

  // Read design tokens
  const tokenMd = readIfExists(join(dir, "DESIGN_TOKENS.md")) ?? "";
  const tokens = parseDesignTokens(tokenMd);

  // Read assets
  const assetMd = readIfExists(join(dir, "ASSETS.md")) ?? "";
  const assets = parseAssetsFromMd(assetMd);

  // Read COMPOSITION.md for richer scene context
  const compositionMd = readIfExists(join(dir, "COMPOSITION.md")) ?? "";
  const sceneDescriptions = parseSceneDescriptions(compositionMd);

  // Get scenes from template
  const scenes = SKELETON_SCENES[templateId] ?? SKELETON_SCENES["saas-launch"];

  // Build enhanced HTML
  const html = buildEnhancedHtml({
    projectName,
    format,
    durationSec,
    idea,
    templateId,
    designTokens: tokens,
    assets,
    scenes,
    sceneDescriptions,
    compositionMd,
  });

  const htmlPath = join(dir, "index.html");
  writeFileSync(htmlPath, html, "utf8");

  // Ensure meta.json exists (needed by preview/render)
  const metaPath = join(dir, "meta.json");
  if (!existsSync(metaPath)) {
    const [w, h] = format === "9:16" ? [1080, 1920] : [1920, 1080];
    writeFileSync(metaPath, JSON.stringify({
      rootEntry: "index.html",
      compositionDirectory: ".",
      assetDirectory: "assets",
      runtime: "hyperframes",
      width: w,
      height: h,
      duration: durationSec,
    }, null, 2));
  }
  const templatesUsed: string[] = [];
  const entities = extractIdeaEntities(idea);
  for (const scene of scenes) {
    const tpl = findTemplateForSceneRole(scene.id, format, scene.duration);
    if (isSafeInlineSceneTemplate(tpl)) templatesUsed.push(tpl.id);
  }

  return {
    projectDir: dir,
    htmlPath,
    sceneCount: scenes.length,
    tokensApplied: tokenMd.length > 0,
    assetsReferenced: assets.length,
    templatesUsed,
  };
}

function readIfExists(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

interface SceneDescription {
  role: string;
  label: string;
  guidance: string;
}

function parseSceneDescriptions(compositionMd: string): Map<string, SceneDescription> {
  const descriptions = new Map<string, SceneDescription>();
  const lines = compositionMd.split("\n");

  let inSceneShape = false;
  let currentScene: SceneDescription | null = null;

  for (const line of lines) {
    if (line.includes("## Scene Shape")) {
      inSceneShape = true;
      continue;
    }
    if (inSceneShape && line.startsWith("## ")) {
      inSceneShape = false;
      continue;
    }
    if (!inSceneShape) continue;

    // Match numbered scene entries like "1. Open with a strong visual promise."
    const numberedMatch = line.match(/^\d+\.\s+(.+)/);
    if (numberedMatch) {
      if (currentScene) {
        descriptions.set(currentScene.role, currentScene);
      }
      currentScene = {
        role: "",
        label: numberedMatch[1].trim(),
        guidance: numberedMatch[1].trim(),
      };
      // Guess the role from the label
      const lower = numberedMatch[1].toLowerCase();
      if (lower.includes("open") || lower.includes("hook") || lower.includes("strong")) {
        currentScene.role = "hook";
      } else if (lower.includes("product") || lower.includes("solution") || lower.includes("show")) {
        currentScene.role = "product";
      } else if (lower.includes("proof") || lower.includes("social") || lower.includes("result")) {
        currentScene.role = "proof";
      } else if (lower.includes("cta") || lower.includes("call") || lower.includes("action") || lower.includes("next")) {
        currentScene.role = "cta";
      } else if (lower.includes("stat") || lower.includes("number") || lower.includes("metric")) {
        currentScene.role = "stats";
      } else if (lower.includes("tension") || lower.includes("struggle")) {
        currentScene.role = "tension";
      } else if (lower.includes("build") || lower.includes("problem")) {
        currentScene.role = "context";
      } else if (lower.includes("end") || lower.includes("payoff") || lower.includes("reward")) {
        currentScene.role = "reward";
      }
      continue;
    }
  }
  if (currentScene) descriptions.set(currentScene.role, currentScene);

  return descriptions;
}

function buildEnhancedHtml(input: {
  projectName: string;
  format: "16:9" | "9:16";
  durationSec: number;
  idea: string;
  templateId: string;
  designTokens?: DesignTokensResolved | null;
  assets?: WorkbenchAsset[];
  scenes: { id: string; label: string; duration: number }[];
  sceneDescriptions: Map<string, SceneDescription>;
  compositionMd: string;
}): string {
  const tokens = input.designTokens ?? DEFAULT_TOKENS;
  const [width, height] = input.format === "9:16" ? [1080, 1920] : [1920, 1080];
  const scenes = input.scenes;
  const totalSceneDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const scaleFactor = totalSceneDuration > 0 ? input.durationSec / totalSceneDuration : 1;
  const isFastPaced = FAST_TEMPLATES.has(input.templateId) || input.compositionMd.toLowerCase().includes("fast");
  const isPortrait = input.format === "9:16";
  const shortIdea = input.idea.length > 60 ? input.idea.slice(0, 57) + "..." : input.idea;

  const f = {
    gap: isPortrait ? "20px" : "28px",
    pad: isPortrait ? "100px 40px" : "100px 140px",
    title: isPortrait ? "56px" : "88px",
    body: isPortrait ? "26px" : "34px",
    bodyMax: isPortrait ? "900px" : "1400px",
    stat: isPortrait ? "80px" : "120px",
    statLabel: isPortrait ? "24px" : "32px",
    ctaPad: isPortrait ? "20px 48px" : "24px 64px",
    ctaFont: isPortrait ? "28px" : "36px",
    quoteFont: isPortrait ? "36px" : "52px",
    quoteMax: isPortrait ? "850px" : "1200px",
    attrFont: isPortrait ? "22px" : "28px",
    imgMax: isPortrait ? "280px" : "400px",
  };

  const entities = extractIdeaEntities(input.idea);
  const entityName = entities.names[0] || "Your Brand";
  const entityTagline = entities.names.length > 1 ? entities.names[1] : entities.actions[0] || "Coming Soon";
  const entitySubtitle = entities.actions[0] || entities.styleKeywords[0] || "";
  const statValue = entities.numbers[0]?.replace(/[£€$¥]/, "") || "100";
  const statPrefix = entities.numbers[0]?.match(/[£€$¥]/)?.[0] || "";
  const statLabel = entities.numbers[0] || "Key Metric";

  let currentTime = 0;
  const timed = scenes.map((scene) => {
    const dur = Math.round(scene.duration * scaleFactor * 10) / 10;
    const start = Math.round(currentTime * 10) / 10;
    currentTime += dur;
    return { ...scene, dur, start };
  });

  const videoAssets = (input.assets ?? []).filter(a => a.kind === "video");
  const imageAssets = (input.assets ?? []).filter(a => a.kind === "image");

  // Extract GSAP code templates from COMPOSITION.md
  const codeTemplates = extractCodeTemplates(input.compositionMd);

  // Collect video elements separately — they must be direct children of composition root
  const enhancedRootVideos: string[] = [];

  const sceneDivs = timed.map((scene, idx) => {
    const role = SCENE_ROLE_CONFIG[scene.id] ?? { animation: "slide-up" as AnimationTemplate, html: "generic" as HtmlTemplate };
    const template = findTemplateForSceneRole(scene.id, input.format, scene.dur);
    // Skip block templates — they only work when blocks are actually installed
    const usableTemplate = isSafeInlineSceneTemplate(template) ? template : null;

    let content: string;
    if (usableTemplate) {
      content = fillTemplatePlaceholders(usableTemplate.html, {
        entityName, entityTagline, entitySubtitle, statValue, statPrefix, statLabel,
        sceneIndex: idx, sceneStart: scene.start, sceneDuration: scene.dur,
        videoSrc: videoAssets.length > 0 ? `assets/${videoAssets[idx % videoAssets.length].name}` : "",
        prevSceneId: `scene-${Math.max(0, idx - 1)}`,
        nextSceneId: `scene-${idx}`,
      });
      content = content.replace(/<!--[\s\S]*?-->/g, "").trim();
    } else {
      content = buildSceneContent(scene.id, role.html, input.idea, entityName, entityTagline, entitySubtitle, statValue, statPrefix, statLabel);
    }

    // Scene description guidance as HTML comment (for agent reference)
    const desc = input.sceneDescriptions.get(scene.id);
    const guidanceComment = desc ? `\n        <!-- Scene guidance: ${desc.label} -->` : "";

    // Collect video elements for composition root (not inside scene div)
    const needsVideo = (role.html === "product" || scene.id === "action" || scene.id === "hook") && idx < videoAssets.length;
    const hasVideoInContent = content.includes("<video");
    if (needsVideo && !hasVideoInContent) {
      enhancedRootVideos.push(`  <video id="bg-video-${idx}" data-start="${scene.start}" data-duration="${scene.dur}" data-media-start="0" muted playsinline src="assets/${videoAssets[idx % videoAssets.length].name}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0;"></video>`);
    }

    // Add image for product scenes
    const imgIdx = role.html === "product" && idx < imageAssets.length && !usableTemplate ? idx : -1;
    const imgEl = imgIdx >= 0
      ? `\n      <img src="assets/${imageAssets[idx].name}" style="max-width:${f.imgMax};max-height:50%;object-fit:contain;border-radius:12px;opacity:0.9;" />`
      : "";

    if (usableTemplate && content.includes('class="scene clip"')) {
      const innerMatch = content.match(/class="scene clip"[^>]*>([\s\S]*)<\/div>\s*$/);
      const innerContent = innerMatch ? innerMatch[1].trim() : content;
      return `    <div id="scene-${idx}" data-scene-id="${scene.id}" class="scene clip" data-start="${scene.start}" data-duration="${scene.dur}">${guidanceComment}
${innerContent}
    </div>`;
    }

    return `    <div id="scene-${idx}" data-scene-id="${scene.id}" class="scene clip" data-start="${scene.start}" data-duration="${scene.dur}">${guidanceComment}
      <div class="scene-content">${imgEl}
${content}
      </div>
    </div>`;
  });

  // Build enhanced GSAP timeline
  const tweens: string[] = [];

  for (let i = 0; i < timed.length; i++) {
    const scene = timed[i];
    const sceneEl = `scene-${i}`;
    const role = SCENE_ROLE_CONFIG[scene.id] ?? { animation: "slide-up" as AnimationTemplate };
    const enterTime = i === 0 ? 0.2 : scene.start + 0.3;

    if (i === 0) {
      tweens.push(buildEntranceTween(sceneEl, role.animation, enterTime));
    } else {
      tweens.push(buildInnerEntranceTween(sceneEl, role.animation, enterTime));
    }

    // Video opacity control
    if (videoAssets.length > 0) {
      const vIdx = (role.html === "product" || scene.id === "action" || scene.id === "hook") && i < videoAssets.length ? i : -1;
      if (vIdx >= 0) {
        tweens.push(`  gsap.set("#bg-video-${vIdx}", { opacity: 0 });`);
        tweens.push(`  tl.to("#bg-video-${vIdx}", { opacity: 0.3, duration: 0.5 }, ${scene.start + 0.2});`);
      }
    }

    // Transition to next scene
    if (i < timed.length - 1) {
      const next = timed[i + 1];
      const nextEl = `scene-${i + 1}`;

      // Use code templates from COMPOSITION.md when available
      const transitionTemplate = findBestTransition(codeTemplates, scene.id);
      if (transitionTemplate) {
        const tweenCode = transitionTemplate
          .replace(/sceneStart/g, String(scene.start))
          .replace(/cutTime/g, String(next.start))
          .replace(/#prev/g, `#${sceneEl}`)
          .replace(/#next/g, `#${nextEl}`)
          .replace(/\.headline/g, `#${sceneEl} .scene-title`)
          .replace(/\.word/g, `#${sceneEl} .scene-word`);
        tweens.push(`  // ${scene.id} → ${timed[i + 1].id} transition`);
        tweens.push(`  ${tweenCode}`);
      } else if (isFastPaced) {
        tweens.push(`  tl.set("#${sceneEl} .scene-content", { opacity: 0 }, ${next.start});`);
        tweens.push(`  tl.from("#${nextEl} .scene-content", { opacity: 0, duration: 0.15 }, ${next.start});`);
      } else {
        tweens.push(`  tl.to("#${sceneEl} .scene-content", { opacity: 0, duration: 0.5, overwrite: "auto" }, ${next.start - 0.5});`);
        tweens.push(`  tl.from("#${nextEl} .scene-content", { opacity: 0, duration: 0.5 }, ${next.start});`);
      }
    }
  }

  // Final fade out
  const lastIdx = timed.length - 1;
  const fadeOutTime = Math.round((input.durationSec - 0.8) * 10) / 10;
  if (lastIdx >= 0) {
    tweens.push(`  tl.to("#scene-${lastIdx} .scene-content", { opacity: 0, duration: 0.8, overwrite: "auto" }, ${fadeOutTime});`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${input.projectName}</title>
  <style>
    :root {
      --bg-primary: ${tokens.colors.bgPrimary};
      --bg-secondary: ${tokens.colors.bgSecondary};
      --accent-primary: ${tokens.colors.accentPrimary};
      --accent-secondary: ${tokens.colors.accentSecondary};
      --text-primary: ${tokens.colors.textPrimary};
      --text-secondary: ${tokens.colors.textSecondary};
      --heading-font: ${tokens.typography.headingFont};
      --body-font: ${tokens.typography.bodyFont};
      --heading-weight: ${tokens.typography.headingWeight};
      --body-weight: ${tokens.typography.bodyWeight};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg-primary); color: var(--text-primary); font-family: var(--body-font); overflow: hidden; }

    [data-composition-id="${input.projectName}"] {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      background: var(--bg-primary);
      overflow: hidden;
    }

    .scene {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
    }

    #scene-0 { opacity: 1; }

    .scene-content {
      padding: ${f.pad};
      max-width: ${width}px;
      text-align: center;
      width: 100%;
    }

    .scene-title {
      font-size: ${f.title};
      font-weight: var(--heading-weight);
      color: var(--text-primary);
      font-family: var(--heading-font);
      line-height: 1.1;
      margin-bottom: ${f.gap};
    }

    .scene-subtitle {
      font-size: ${f.body};
      font-weight: var(--body-weight);
      color: var(--text-secondary);
      font-family: var(--body-font);
      max-width: ${f.bodyMax};
      margin: 0 auto;
      line-height: 1.5;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: ${f.gap};
      max-width: ${f.bodyMax};
      margin: 0 auto;
    }

    .stat-card {
      text-align: center;
      padding: 32px 20px;
      border-radius: 16px;
      background: var(--bg-secondary);
    }

    .stat-number {
      font-size: ${f.stat};
      font-weight: 900;
      color: var(--accent-primary);
      font-family: var(--heading-font);
    }

    .stat-label {
      font-size: ${f.statLabel};
      color: var(--text-secondary);
      margin-top: 8px;
    }

    .cta-button {
      display: inline-block;
      padding: ${f.ctaPad};
      background: var(--accent-primary);
      color: var(--bg-primary);
      font-size: ${f.ctaFont};
      font-weight: 700;
      border-radius: 12px;
      text-decoration: none;
      margin-top: ${f.gap};
    }

    .quote-block {
      max-width: ${f.quoteMax};
      margin: 0 auto;
    }

    .quote-text {
      font-size: ${f.quoteFont};
      font-weight: 700;
      font-style: italic;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .quote-attr {
      font-size: ${f.attrFont};
      color: var(--text-secondary);
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div data-composition-id="${input.projectName}" data-start="0" data-duration="${input.durationSec}" data-width="${width}" data-height="${height}">
${enhancedRootVideos.join("\n")}
${sceneDivs.join("\n")}
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });

${tweens.join("\n")}

    window.__timelines = window.__timelines || {};
    window.__timelines["${input.projectName}"] = tl;
    tl.play();
  </script>
</body>
</html>`;
}

function fillTemplatePlaceholders(html: string, vars: {
  entityName: string;
  entityTagline: string;
  entitySubtitle: string;
  statValue: string;
  statPrefix: string;
  statLabel: string;
  sceneIndex: number;
  sceneStart: number;
  sceneDuration: number;
  videoSrc: string;
  prevSceneId: string;
  nextSceneId: string;
}): string {
  return html
    .replace(/\{\{entityName\}\}/g, vars.entityName)
    .replace(/\{\{entityTagline\}\}/g, vars.entityTagline)
    .replace(/\{\{entitySubtitle\}\}/g, vars.entitySubtitle)
    .replace(/\{\{sceneIndex\}\}/g, String(vars.sceneIndex))
    .replace(/\{\{sceneStart\}\}/g, String(vars.sceneStart))
    .replace(/\{\{sceneDuration\}\}/g, String(vars.sceneDuration))
    .replace(/\{\{statValue\}\}/g, vars.statValue)
    .replace(/\{\{statPrefix\}\}/g, vars.statPrefix)
    .replace(/\{\{statSuffix\}\}/g, "")
    .replace(/\{\{statLabel\}\}/g, vars.statLabel)
    .replace(/\{\{videoSrc\}\}/g, vars.videoSrc)
    .replace(/\{\{labelText\}\}/g, vars.entityName)
    .replace(/\{\{subLabelText\}\}/g, vars.entityTagline)
    .replace(/\{\{ctaHeadline\}\}/g, vars.entityTagline)
    .replace(/\{\{ctaSubtext\}\}/g, vars.entitySubtitle || vars.entityName)
    .replace(/\{\{ctaButtonText\}\}/g, vars.entityName)
    .replace(/\{\{countdownFrom\}\}/g, "5")
    .replace(/\{\{mainTitle\}\}/g, vars.entityName)
    .replace(/\{\{mainSubtext\}\}/g, vars.entityTagline)
    .replace(/\{\{pipLabel\}\}/g, vars.entitySubtitle || "LIVE")
    .replace(/\{\{bar1Label\}\}/g, "Speed").replace(/\{\{bar1Value\}\}/g, "85%")
    .replace(/\{\{bar2Label\}\}/g, "Power").replace(/\{\{bar2Value\}\}/g, "70%")
    .replace(/\{\{bar3Label\}\}/g, "Impact").replace(/\{\{bar3Value\}\}/g, "92%")
    .replace(/\{\{leftTitle\}\}/g, vars.entityName).replace(/\{\{leftSubtext\}\}/g, vars.entityTagline)
    .replace(/\{\{rightTitle\}\}/g, vars.entityTagline).replace(/\{\{rightSubtext\}\}/g, vars.entitySubtitle)
    .replace(/\{\{chartValue\}\}/g, vars.statValue).replace(/\{\{chartLabel\}\}/g, vars.statLabel)
    .replace(/\{\{chartSubtext\}\}/g, vars.entityTagline)
    .replace(/\{\{cutTime\}\}/g, String(vars.sceneStart))
    .replace(/\{\{dissolveDuration\}\}/g, "0.5")
    .replace(/\{\{flashTime\}\}/g, String(vars.sceneStart))
    .replace(/\{\{prevSceneId\}\}/g, vars.prevSceneId)
    .replace(/\{\{nextSceneId\}\}/g, vars.nextSceneId);
}

interface CodeTemplate {
  name: string;
  pattern: string;
  code: string;
}

function extractCodeTemplates(compositionMd: string): CodeTemplate[] {
  const templates: CodeTemplate[] = [];
  const inCodeTemplates = compositionMd.includes("## Code Templates");
  if (!inCodeTemplates) return templates;

  const section = compositionMd.split("## Code Templates")[1]?.split("##")[0] ?? "";
  const lines = section.split("\n");
  let current: CodeTemplate | null = null;

  for (const line of lines) {
    const namedMatch = line.match(/^([A-Z][^(]+)\s*\(([^)]+)\):\s*`(.+)`/);
    if (namedMatch) {
      if (current) templates.push(current);
      current = { name: namedMatch[1].trim(), pattern: namedMatch[2].trim(), code: namedMatch[3] };
    }
  }
  if (current) templates.push(current);
  return templates;
}

function findBestTransition(templates: CodeTemplate[], sceneId: string): string | null {
  for (const t of templates) {
    const lower = t.name.toLowerCase() + " " + t.pattern.toLowerCase();
    if (lower.includes("hard") && (sceneId === "action" || sceneId === "hook")) return t.code;
    if (lower.includes("dissolve") && (sceneId === "context" || sceneId === "origin")) return t.code;
    if (lower.includes("snap") && sceneId !== "cta") return t.code;
  }
  return null;
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
