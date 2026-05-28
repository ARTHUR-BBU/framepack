import type { TemplateRouteId } from "./template-market.js";

export type HyperframesPromptTemplateId =
  | "hyperframes-saas-product-promo-30s"
  | "hyperframes-app-showcase-three-phones"
  | "hyperframes-product-reveal-minimal"
  | "hyperframes-website-to-video-promo"
  | "hyperframes-tiktok-karaoke-talking-head"
  | "hyperframes-data-bar-chart-race"
  | "hyperframes-brand-sizzle-reel"
  | "hyperframes-logo-outro-cinematic"
  | "hyperframes-social-overlay-stack"
  | "hyperframes-money-counter-hype"
  | "hyperframes-flight-map-route";

export interface HyperframesPromptTemplate {
  id: HyperframesPromptTemplateId;
  title: string;
  kind: "prompt-template";
  source: "open-design-hyperframes";
  category: string;
  aspect: "16:9" | "9:16";
  fitForTemplateIds: TemplateRouteId[];
  match: string[];
  summary: string;
  sceneShape: string[];
  directorNotes: string[];
  catalogCommands: string[];
  hyperframesRules: string[];
  acceptanceCriteria: string[];
}

export interface HyperframesPromptTemplateRecommendation {
  template: HyperframesPromptTemplate;
  score: number;
  reason: string;
}

const HYPERFRAMES_RULES = [
  "Keep the first frame visible without waiting for JavaScript animation.",
  "Register timelines on window.__timelines.",
  "Use tl.set() for scene switches.",
  "Run npx hyperframes lint and npx hyperframes inspect before final render.",
];

const HYPERFRAMES_PROMPT_TEMPLATES: HyperframesPromptTemplate[] = [
  {
    id: "hyperframes-saas-product-promo-30s",
    title: "30-Second SaaS Product Promo",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Marketing",
    aspect: "16:9",
    fitForTemplateIds: ["saas-launch"],
    match: ["saas", "software", "launch", "product", "linear", "workflow", "startup"],
    summary: "A polished product launch reel with product proof, benefit rhythm, and brand outro.",
    sceneShape: ["promise hook", "product surface", "workflow proof", "benefit escalation", "logo outro"],
    directorNotes: ["Use product UI early.", "Keep text benefit-led.", "Make the CTA feel earned."],
    catalogCommands: [
      "npx hyperframes add app-showcase",
      "npx hyperframes add chromatic-radial-split",
      "npx hyperframes add flash-through-white",
      "npx hyperframes add logo-outro",
      "npx hyperframes add ui-3d-reveal",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["product value is clear in the opening beat", "UI proof appears before abstract claims"],
  },
  {
    id: "hyperframes-app-showcase-three-phones",
    title: "App Showcase Three Floating Phones",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Product",
    aspect: "16:9",
    fitForTemplateIds: ["saas-launch"],
    match: ["app", "phone", "mobile", "showcase", "ui", "screens"],
    summary: "A short product surface showcase built around three mobile mockups and controlled reveal motion.",
    sceneShape: ["brand hook", "three-screen reveal", "feature sweep", "logo close"],
    directorNotes: ["Prioritize screenshot readability.", "Keep phone movement smooth.", "Avoid tiny UI callouts."],
    catalogCommands: [
      "npx hyperframes add app-showcase",
      "npx hyperframes add logo-outro",
      "npx hyperframes add shimmer-sweep",
      "npx hyperframes add ui-3d-reveal",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["screens are legible at video scale", "camera motion supports the product hierarchy"],
  },
  {
    id: "hyperframes-product-reveal-minimal",
    title: "Minimal Product Reveal",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Cinematic",
    aspect: "16:9",
    fitForTemplateIds: ["saas-launch", "founder-story"],
    match: ["minimal", "product", "reveal", "cinematic", "premium", "elegant"],
    summary: "A restrained reveal for one product, object, logo, or hero claim.",
    sceneShape: ["quiet setup", "controlled reveal", "single benefit", "clean hold"],
    directorNotes: ["Use less motion, not no motion.", "Protect whitespace.", "Let one object or claim dominate."],
    catalogCommands: [
      "npx hyperframes add cinematic-zoom",
      "npx hyperframes add light-leak",
      "npx hyperframes add shimmer-sweep",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["the hero object is unmistakable", "minimalism does not become empty or vague"],
  },
  {
    id: "hyperframes-website-to-video-promo",
    title: "Website-to-Video Marketing Cut",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Marketing",
    aspect: "16:9",
    fitForTemplateIds: ["saas-launch", "course-promo"],
    match: ["website", "site", "landing", "homepage", "web", "marketing"],
    summary: "A website-derived promo that turns sections, proof, and CTA into a paced commercial cut.",
    sceneShape: ["site hook", "section scan", "proof beat", "offer beat", "CTA close"],
    directorNotes: ["Do not over-scroll.", "Turn webpage structure into scenes.", "Make screenshots feel intentional."],
    catalogCommands: [
      "npx hyperframes add chromatic-radial-split",
      "npx hyperframes add flash-through-white",
      "npx hyperframes add logo-outro",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["website content becomes a story, not a screen recording", "CTA is readable at the end"],
  },
  {
    id: "hyperframes-tiktok-karaoke-talking-head",
    title: "TikTok Talking Head With Karaoke Captions",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Short Form",
    aspect: "9:16",
    fitForTemplateIds: ["course-promo", "founder-story"],
    match: ["tiktok", "talking", "head", "karaoke", "caption", "subtitles", "short"],
    summary: "A vertical talking-head structure with high-readability karaoke captions and social overlays.",
    sceneShape: ["spoken hook", "caption punch", "proof insert", "CTA caption"],
    directorNotes: ["Caption rhythm is the edit.", "Keep faces and captions from competing.", "Use big mobile-safe text."],
    catalogCommands: [
      "npx hyperframes add tiktok-follow",
      "npx hyperframes add yt-lower-third",
    ],
    hyperframesRules: [...HYPERFRAMES_RULES, "Use TTS or transcript timing only after the user approves the script."],
    acceptanceCriteria: ["captions are readable on mobile", "spoken hook lands within three seconds"],
  },
  {
    id: "hyperframes-data-bar-chart-race",
    title: "Animated Bar-Chart Race",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Data",
    aspect: "16:9",
    fitForTemplateIds: ["data-shock", "news-explainer"],
    match: ["data", "chart", "bar", "race", "growth", "ranking", "metric"],
    summary: "A data proof template that turns ranking movement or metric growth into the main spectacle.",
    sceneShape: ["number hook", "chart race", "turning point", "interpretation"],
    directorNotes: ["Lead with the surprising number.", "Do not clutter the chart.", "Explain what changed and why it matters."],
    catalogCommands: ["npx hyperframes add data-chart"],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["main metric is legible instantly", "chart motion clarifies the argument"],
  },
  {
    id: "hyperframes-brand-sizzle-reel",
    title: "Brand Sizzle Reel",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Marketing",
    aspect: "16:9",
    fitForTemplateIds: ["saas-launch", "founder-story", "course-promo"],
    match: ["brand", "sizzle", "reel", "cinematic", "launch", "hype"],
    summary: "A high-energy brand montage for launches, announcements, and big positioning moments.",
    sceneShape: ["brand thesis", "fast montage", "proof flashes", "signature close"],
    directorNotes: ["Use rhythm and contrast, not random flash.", "Make every shot reinforce the brand promise."],
    catalogCommands: [
      "npx hyperframes add chromatic-radial-split",
      "npx hyperframes add cinematic-zoom",
      "npx hyperframes add flash-through-white",
      "npx hyperframes add logo-outro",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["energy feels intentional", "brand name or promise is not visually lost"],
  },
  {
    id: "hyperframes-logo-outro-cinematic",
    title: "Cinematic Logo Outro",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Branding",
    aspect: "16:9",
    fitForTemplateIds: ["saas-launch", "course-promo", "game-ad", "founder-story", "data-shock"],
    match: ["logo", "outro", "brand", "ending", "cta", "cinematic"],
    summary: "A compact ending template for brand recall, CTA, or final signature.",
    sceneShape: ["final payoff", "logo resolve", "CTA hold"],
    directorNotes: ["Keep the ending readable.", "Give the logo enough hold time.", "Do not add new ideas in the outro."],
    catalogCommands: [
      "npx hyperframes add grain-overlay",
      "npx hyperframes add logo-outro",
      "npx hyperframes add shimmer-sweep",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["logo is visible", "CTA remains readable before the video ends"],
  },
  {
    id: "hyperframes-social-overlay-stack",
    title: "Social Overlay Stack",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Short Form",
    aspect: "9:16",
    fitForTemplateIds: ["news-explainer", "founder-story", "course-promo"],
    match: ["social", "overlay", "reddit", "spotify", "instagram", "x", "proof"],
    summary: "A vertical proof stack using social posts, comments, music cards, and follow overlays.",
    sceneShape: ["social hook", "overlay stack", "proof escalation", "CTA"],
    directorNotes: ["Use overlays as evidence, not decoration.", "Avoid dense unreadable post text."],
    catalogCommands: [
      "npx hyperframes add flash-through-white",
      "npx hyperframes add instagram-follow",
      "npx hyperframes add reddit-post",
      "npx hyperframes add spotify-card",
      "npx hyperframes add x-post",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["each overlay has a clear reason", "source-style visuals stay readable"],
  },
  {
    id: "hyperframes-money-counter-hype",
    title: "$0 to $10K Money Counter Hype",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Short Form",
    aspect: "9:16",
    fitForTemplateIds: ["data-shock", "course-promo"],
    match: ["money", "counter", "revenue", "income", "pricing", "growth", "hype"],
    summary: "A vertical money or metric counter designed for fast, proof-heavy short-form videos.",
    sceneShape: ["money hook", "counter climb", "proof beat", "action close"],
    directorNotes: ["Make the number honest and sourced.", "Avoid casino-style gimmick if the brand is serious."],
    catalogCommands: [
      "npx hyperframes add apple-money-count",
      "npx hyperframes add flash-through-white",
      "npx hyperframes add grain-overlay",
    ],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["number format matches the claim", "count-up serves proof rather than noise"],
  },
  {
    id: "hyperframes-flight-map-route",
    title: "Apple-Style Flight Map Route",
    kind: "prompt-template",
    source: "open-design-hyperframes",
    category: "Travel",
    aspect: "16:9",
    fitForTemplateIds: ["news-explainer", "founder-story"],
    match: ["flight", "map", "route", "travel", "location", "journey", "origin", "destination"],
    summary: "A route-map template for travel, logistics, journey, or before-after movement stories.",
    sceneShape: ["origin", "route reveal", "destination", "meaning"],
    directorNotes: ["Use the route as story structure.", "Keep labels readable.", "Do not let map texture bury the message."],
    catalogCommands: ["npx hyperframes add nyc-paris-flight"],
    hyperframesRules: HYPERFRAMES_RULES,
    acceptanceCriteria: ["origin and destination are clear", "route motion supports the story"],
  },
];

function clonePromptTemplate(template: HyperframesPromptTemplate): HyperframesPromptTemplate {
  return {
    ...template,
    fitForTemplateIds: [...template.fitForTemplateIds],
    match: [...template.match],
    sceneShape: [...template.sceneShape],
    directorNotes: [...template.directorNotes],
    catalogCommands: [...template.catalogCommands],
    hyperframesRules: [...template.hyperframesRules],
    acceptanceCriteria: [...template.acceptanceCriteria],
  };
}

export function listHyperframesPromptTemplates(): HyperframesPromptTemplate[] {
  return HYPERFRAMES_PROMPT_TEMPLATES.map(clonePromptTemplate);
}

function scorePromptTemplate(template: HyperframesPromptTemplate, input: {
  templateId?: TemplateRouteId;
  signal: string;
  format?: "16:9" | "9:16";
}): number {
  const routeScore = input.templateId && template.fitForTemplateIds.includes(input.templateId) ? 5 : 0;
  const formatScore = input.format && template.aspect === input.format ? 2 : 0;
  const keywordScore = template.match.reduce(
    (score, keyword) => score + (input.signal.includes(keyword) ? 1 : 0),
    0,
  );
  return routeScore + formatScore + keywordScore;
}

export function recommendHyperframesPromptTemplate(input: {
  idea: string;
  style?: string;
  format?: "16:9" | "9:16";
  durationSec?: number;
  templateId?: TemplateRouteId;
}): HyperframesPromptTemplateRecommendation {
  const signal = `${input.idea} ${input.style ?? ""} ${input.format ?? ""} ${input.durationSec ?? ""}`.toLowerCase();
  const scored = HYPERFRAMES_PROMPT_TEMPLATES
    .map((template) => ({
      template,
      score: scorePromptTemplate(template, {
        templateId: input.templateId,
        signal,
        format: input.format,
      }),
    }))
    .sort((left, right) => right.score - left.score)[0];

  const matched = scored.template.match.filter((keyword) => signal.includes(keyword));

  return {
    template: clonePromptTemplate(scored.template),
    score: scored.score,
    reason: matched.length > 0
      ? `Matched ${scored.template.id} from prompt-template signal: ${matched.join(", ")}.`
      : `Defaulted to ${scored.template.id} because it best fits the selected Framepack route.`,
  };
}
