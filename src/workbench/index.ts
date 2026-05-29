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
    ["FRAMEPACK.md", "ASSETS.md", "ASSET_GAPS.md", "HUMAN.md", "STYLE.md", "DIRECTION.md", "COMPOSITION.md", "ITERATIONS.md", ".framepack/state.json"]
      .map((filePath) => [
        filePath,
        existsSync(join(projectDir, filePath)) ? readFileSync(join(projectDir, filePath), "utf8") : "",
      ]),
  );

  return validateWorkbenchFiles(files);
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
      "DESIGN_TOKENS.md": [
        "# Design Tokens",
        "",
        "No design system matched. Agent should establish colors and typography based on user style words.",
        "",
        "Use `--brand-colors \"#RRGGBB,#RRGGBB,...\"` to specify exact brand colors.",
        "",
      ].join("\n"),
    };
  }

  const designSourcePath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "designs", `${designId}.md`);

  if (!existsSync(designSourcePath)) {
    return {
      "DESIGN_TOKENS.md": [
        "# Design Tokens",
        "",
        "No design system matched. Agent should establish colors and typography based on user style words.",
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
}): string {
  const [width, height] = input.format === "9:16" ? [1080, 1920] : [1920, 1080];
  const scenes = SKELETON_SCENES[input.templateId] ?? SKELETON_SCENES["saas-launch"];
  const totalSceneDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
  const scaleFactor = totalSceneDuration > 0 ? input.durationSec / totalSceneDuration : 1;

  let currentTime = 0;
  const sceneDivs = scenes.map((scene) => {
    const dur = Math.round(scene.duration * scaleFactor * 10) / 10;
    const start = Math.round(currentTime * 10) / 10;
    currentTime += dur;
    return `    <div id="${scene.id}" class="scene" data-start="${start}" data-duration="${dur}">
      <div class="scene-content">
        <h2 class="scene-title">${scene.label}</h2>
        <p class="scene-body">Replace with your content for: ${input.idea}</p>
      </div>
    </div>`;
  });

  const sceneCss = scenes.map((scene, i) => {
    const opacity = i === 0 ? "1" : "0";
    return `    [data-start="${scene.id === scenes[0].id ? "0" : ""}"] { opacity: ${opacity}; }`;
  });

  const entranceTweens = scenes.map((scene, i) => {
    const startTime = i === 0 ? 0.2 : scenes.slice(0, i).reduce((sum, s) => sum + Math.round(s.duration * scaleFactor * 10) / 10, 0) + 0.3;
    return `  tl.from("#${scene.id} .scene-content", { y: 60, opacity: 0, duration: 0.5, ease: "power3.out" }, ${Math.round(startTime * 10) / 10});`;
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${input.projectName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #ffffff; font-family: system-ui, sans-serif; overflow: hidden; }

    [data-composition-id="${input.projectName}"] {
      position: relative;
      width: ${width}px;
      height: ${height}px;
      background: #0a0a0a;
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

    .scene-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      width: 100%;
      height: 100%;
      padding: ${input.format === "9:16" ? "120px 48px" : "120px 160px"};
      text-align: center;
    }

    .scene-title {
      font-size: ${input.format === "9:16" ? "64px" : "96px"};
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -1px;
    }

    .scene-body {
      font-size: ${input.format === "9:16" ? "28px" : "36px"};
      font-weight: 400;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.7);
      max-width: ${input.format === "9:16" ? "900px" : "1400px"};
    }
  </style>
</head>
<body>
  <div data-composition-id="${input.projectName}" data-start="0" data-duration="${input.durationSec}" data-width="${width}" data-height="${height}">
${sceneDivs.join("\n")}
  </div>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });

    // Entrance animations — agent should enhance these
${entranceTweens.join("\n")}

    window.__timelines["${input.projectName}"] = tl;
  </script>
</body>
</html>`;
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
      "1. Read `HUMAN.md`, `ASSETS.md`, `ASSET_GAPS.md`, `STYLE.md`, `DIRECTION.md`, and `COMPOSITION.md` before writing code.",
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
    "index.html": buildSkeletonHtml({
      projectName: input.projectName,
      format: input.format,
      durationSec: input.durationSec,
      idea: input.idea,
      templateId: recommendation.template.id,
    }),
    ...buildDesignFiles(input.idea, input.style, input.brandColors),
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
