import type { TemplateRouteId } from "./template-market.js";

export type HyperframesCatalogPrefabKind = "block" | "component";

export interface HyperframesCatalogPrefab {
  id: string;
  label: string;
  kind: HyperframesCatalogPrefabKind;
  source: "hyperframes-catalog";
  installCommand: string;
  integrationMode: "composition-mount" | "copy-snippet";
  tags: string[];
  fitForTemplateIds: TemplateRouteId[];
  bestUse: string;
  acceptanceCriteria: string[];
}

export interface HyperframesCatalogRecommendation {
  templateId: TemplateRouteId;
  prefabs: HyperframesCatalogPrefab[];
  agentInstructions: string[];
  fallbackStrategy: string;
}

const CATALOG_PREFABS: HyperframesCatalogPrefab[] = [
  {
    id: "caption-editorial-emphasis",
    label: "Caption Editorial Emphasis",
    kind: "component",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add caption-editorial-emphasis",
    integrationMode: "copy-snippet",
    tags: ["caption", "editorial", "emphasis", "text"],
    fitForTemplateIds: ["course-promo", "news-explainer", "data-shock", "founder-story"],
    bestUse: "Emphasize key phrases, numbers, claims, and CTA lines without drowning the frame.",
    acceptanceCriteria: ["important words are readable on first pause", "caption motion supports meaning"],
  },
  {
    id: "caption-clip-wipe",
    label: "Caption Clip Wipe",
    kind: "component",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add caption-clip-wipe",
    integrationMode: "copy-snippet",
    tags: ["caption", "wipe", "kinetic", "short-form"],
    fitForTemplateIds: ["course-promo", "game-ad", "saas-launch"],
    bestUse: "Create quick mobile-safe caption reveals for fast social pacing.",
    acceptanceCriteria: ["wipe timing does not hide first-frame message", "text stays large enough for mobile"],
  },
  {
    id: "app-showcase",
    label: "App Showcase",
    kind: "block",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add app-showcase",
    integrationMode: "composition-mount",
    tags: ["app", "product", "ui", "saas"],
    fitForTemplateIds: ["saas-launch"],
    bestUse: "Show the product surface early in a launch or product explainer.",
    acceptanceCriteria: ["product UI is visible before the proof section", "block does not obscure CTA copy"],
  },
  {
    id: "data-chart",
    label: "Data Chart",
    kind: "block",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add data-chart",
    integrationMode: "composition-mount",
    tags: ["data", "chart", "proof", "growth"],
    fitForTemplateIds: ["data-shock", "news-explainer", "saas-launch"],
    bestUse: "Convert a claim into visual proof with a clear chart moment.",
    acceptanceCriteria: ["the key number is legible", "chart motion clarifies the comparison"],
  },
  {
    id: "reddit-post-card",
    label: "Reddit Post Card",
    kind: "block",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add reddit-post-card",
    integrationMode: "composition-mount",
    tags: ["social", "reddit", "post", "proof"],
    fitForTemplateIds: ["news-explainer", "founder-story"],
    bestUse: "Represent social proof, public conversation, or community evidence.",
    acceptanceCriteria: ["post text is not too dense", "source framing remains clear"],
  },
  {
    id: "ios26-liquid-glass",
    label: "iOS 26 Liquid Glass",
    kind: "block",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add ios26-liquid-glass",
    integrationMode: "composition-mount",
    tags: ["liquid-glass", "premium", "apple", "ui"],
    fitForTemplateIds: ["saas-launch", "founder-story"],
    bestUse: "Add premium interface texture when it supports the product signal.",
    acceptanceCriteria: ["glass treatment does not reduce text contrast", "visual polish supports brand fit"],
  },
  {
    id: "logo-outro",
    label: "Logo Outro",
    kind: "block",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add logo-outro",
    integrationMode: "composition-mount",
    tags: ["logo", "outro", "cta", "brand"],
    fitForTemplateIds: ["saas-launch", "course-promo", "game-ad", "founder-story", "data-shock"],
    bestUse: "Close with a clean brand and CTA beat.",
    acceptanceCriteria: ["logo is visible", "CTA is readable before the video ends"],
  },
  {
    id: "light-leak",
    label: "Light Leak Transition",
    kind: "component",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add light-leak",
    integrationMode: "copy-snippet",
    tags: ["transition", "light", "cinematic", "polish"],
    fitForTemplateIds: ["course-promo", "founder-story", "saas-launch"],
    bestUse: "Add cinematic polish between major beats without overloading the motion system.",
    acceptanceCriteria: ["transition is brief", "the next scene lands readable"],
  },
  {
    id: "apple-money-count",
    label: "Apple Money Count",
    kind: "block",
    source: "hyperframes-catalog",
    installCommand: "npx hyperframes add apple-money-count",
    integrationMode: "composition-mount",
    tags: ["money", "count", "data", "revenue"],
    fitForTemplateIds: ["data-shock", "course-promo"],
    bestUse: "Make revenue, savings, or pricing proof feel tangible.",
    acceptanceCriteria: ["number format matches the claim", "count-up does not feel gimmicky"],
  },
];

function clonePrefab(prefab: HyperframesCatalogPrefab): HyperframesCatalogPrefab {
  return {
    ...prefab,
    tags: [...prefab.tags],
    fitForTemplateIds: [...prefab.fitForTemplateIds],
    acceptanceCriteria: [...prefab.acceptanceCriteria],
  };
}

export function listHyperframesCatalogPrefabs(): HyperframesCatalogPrefab[] {
  return CATALOG_PREFABS.map(clonePrefab);
}

function scorePrefab(prefab: HyperframesCatalogPrefab, input: {
  templateId: TemplateRouteId;
  signal: string;
}): number {
  const routeScore = prefab.fitForTemplateIds.includes(input.templateId) ? 4 : 0;
  const keywordScore = prefab.tags.reduce(
    (score, tag) => score + (input.signal.includes(tag) ? 1 : 0),
    0,
  );
  return routeScore + keywordScore;
}

export function recommendHyperframesCatalogPrefabs(input: {
  templateId: TemplateRouteId;
  idea: string;
  style?: string;
  format?: "16:9" | "9:16";
}): HyperframesCatalogRecommendation {
  const signal = `${input.idea} ${input.style ?? ""} ${input.format ?? ""}`.toLowerCase();
  const prefabs = CATALOG_PREFABS
    .map((prefab) => ({ prefab, score: scorePrefab(prefab, { templateId: input.templateId, signal }) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map(({ prefab }) => clonePrefab(prefab));

  return {
    templateId: input.templateId,
    prefabs,
    agentInstructions: [
      "Inspect the live official Catalog first: npx hyperframes catalog --json",
      "Use these Catalog candidates as prefab suggestions; do not auto-install them without an agent/user execution decision.",
      "For block prefabs, mount the generated composition segment. For component prefabs, copy the CSS/GSAP snippet into the custom composition.",
    ],
    fallbackStrategy: "If a Catalog candidate is unavailable or off-brand, keep the scene custom and preserve the same role, timing, and acceptance criteria.",
  };
}
