export type TemplateRouteId =
  | "saas-launch"
  | "news-explainer"
  | "course-promo"
  | "game-ad"
  | "founder-story"
  | "data-shock";

export interface TemplateMarketItem {
  id: TemplateRouteId;
  label: string;
  kind: "workflow-template";
  access: "built-in";
  license: "included";
  priceCents: null;
  contributionModel: "github-pr-reviewed";
  tags: string[];
  match: string[];
  visualLanguage: string[];
  motionLanguage: string[];
  templateGuidance: string[];
  acceptanceCriteria: string[];
  implementationRoutes: ("hyperframes" | "remotion")[];
  assetNeeds: string[];
}

export interface TemplateRouteRecommendation {
  template: TemplateMarketItem;
  score: number;
  reason: string;
}

const TEMPLATE_MARKET: TemplateMarketItem[] = [
  {
    id: "saas-launch",
    label: "SaaS Launch",
    kind: "workflow-template",
    access: "built-in",
    license: "included",
    priceCents: null,
    contributionModel: "github-pr-reviewed",
    tags: ["saas", "launch", "product", "startup"],
    match: ["saas", "software", "product", "launch", "startup", "tool", "platform"],
    visualLanguage: ["clean product UI focus", "confident whitespace", "large benefit-led headlines"],
    motionLanguage: ["interface reveals", "proof-card stack", "smooth camera push"],
    templateGuidance: ["open on the product promise", "show workflow proof", "close with outcome"],
    acceptanceCriteria: ["first frame states the value clearly", "UI or product asset is visible early"],
    implementationRoutes: ["hyperframes", "remotion"],
    assetNeeds: ["product screenshot", "logo", "primary benefit"],
  },
  {
    id: "news-explainer",
    label: "News Explainer",
    kind: "workflow-template",
    access: "built-in",
    license: "included",
    priceCents: null,
    contributionModel: "github-pr-reviewed",
    tags: ["news", "explainer", "timeline", "analysis"],
    match: ["news", "policy", "case", "explain", "timeline", "analysis", "report"],
    visualLanguage: ["editorial contrast", "source-first hierarchy", "caption-led clarity"],
    motionLanguage: ["timeline build", "headline wipes", "evidence zoom"],
    templateGuidance: ["start with the headline", "sequence context before opinion", "end with implication"],
    acceptanceCriteria: ["viewer understands the event in five seconds", "claims stay source-shaped"],
    implementationRoutes: ["hyperframes", "remotion"],
    assetNeeds: ["headline", "source points", "timeline facts"],
  },
  {
    id: "course-promo",
    label: "Course Promo",
    kind: "workflow-template",
    access: "built-in",
    license: "included",
    priceCents: null,
    contributionModel: "github-pr-reviewed",
    tags: ["course", "education", "promo", "founders"],
    match: ["course", "training", "lesson", "learn", "coach", "bootcamp", "education"],
    visualLanguage: ["premium education funnel", "expert signal", "bold promise plus proof"],
    motionLanguage: ["kinetic typography", "module ladder", "before-after transformation"],
    templateGuidance: ["promise the transformation", "show learning path", "make the outcome concrete"],
    acceptanceCriteria: ["offer is readable on mobile", "benefit and audience are unmistakable"],
    implementationRoutes: ["hyperframes", "remotion"],
    assetNeeds: ["course name", "audience", "modules or outcomes"],
  },
  {
    id: "game-ad",
    label: "Game Ad",
    kind: "workflow-template",
    access: "built-in",
    license: "included",
    priceCents: null,
    contributionModel: "github-pr-reviewed",
    tags: ["game", "ad", "sprite", "arcade"],
    match: ["game", "sprite", "arcade", "battle", "quest", "character", "play"],
    visualLanguage: ["arcade energy", "character-first framing", "reward-heavy contrast"],
    motionLanguage: ["impact pops", "parallax map move", "FX bursts"],
    templateGuidance: ["open with action", "show progression", "end with reward or challenge"],
    acceptanceCriteria: ["motion feels playable", "main character or reward is never visually lost"],
    implementationRoutes: ["hyperframes"],
    assetNeeds: ["character or product hero", "reward", "background or map"],
  },
  {
    id: "founder-story",
    label: "Founder Story",
    kind: "workflow-template",
    access: "built-in",
    license: "included",
    priceCents: null,
    contributionModel: "github-pr-reviewed",
    tags: ["founder", "story", "mission", "brand"],
    match: ["founder", "journey", "story", "mission", "why", "build", "startup"],
    visualLanguage: ["human stakes", "documentary polish", "intimate but commercial framing"],
    motionLanguage: ["photo parallax", "quote emphasis", "chapter transitions"],
    templateGuidance: ["start with tension", "connect struggle to product", "close on conviction"],
    acceptanceCriteria: ["emotional arc is clear", "business takeaway lands before the ending"],
    implementationRoutes: ["hyperframes", "remotion"],
    assetNeeds: ["founder quote", "origin point", "product or mission proof"],
  },
  {
    id: "data-shock",
    label: "Data Shock",
    kind: "workflow-template",
    access: "built-in",
    license: "included",
    priceCents: null,
    contributionModel: "github-pr-reviewed",
    tags: ["data", "numbers", "growth", "chart"],
    match: ["data", "metric", "growth", "shock", "numbers", "chart", "report", "revenue"],
    visualLanguage: ["oversized numbers", "high-contrast proof", "minimal chart clutter"],
    motionLanguage: ["count-up numbers", "chart snap", "comparison reveal"],
    templateGuidance: ["lead with the surprising number", "explain why it matters", "turn data into action"],
    acceptanceCriteria: ["key number is legible instantly", "chart motion supports the argument"],
    implementationRoutes: ["hyperframes", "remotion"],
    assetNeeds: ["headline metric", "comparison point", "source or proof"],
  },
];

function cloneTemplate(template: TemplateMarketItem): TemplateMarketItem {
  return {
    ...template,
    tags: [...template.tags],
    match: [...template.match],
    visualLanguage: [...template.visualLanguage],
    motionLanguage: [...template.motionLanguage],
    templateGuidance: [...template.templateGuidance],
    acceptanceCriteria: [...template.acceptanceCriteria],
    implementationRoutes: [...template.implementationRoutes],
    assetNeeds: [...template.assetNeeds],
  };
}

export function listTemplateMarket(): TemplateMarketItem[] {
  return TEMPLATE_MARKET.map(cloneTemplate);
}

function scoreTemplate(template: TemplateMarketItem, signal: string): number {
  return [...template.match, ...template.tags].reduce(
    (score, keyword) => score + (signal.includes(keyword) ? 1 : 0),
    0,
  );
}

export function recommendTemplateRoute(input: {
  idea: string;
  style?: string;
  format?: "16:9" | "9:16";
  durationSec?: number;
}): TemplateRouteRecommendation {
  const signal = `${input.idea} ${input.style ?? ""} ${input.format ?? ""}`.toLowerCase();
  const scored = TEMPLATE_MARKET
    .map((template) => ({ template, score: scoreTemplate(template, signal) }))
    .sort((left, right) => right.score - left.score)[0];

  return {
    template: cloneTemplate(scored.template),
    score: scored.score,
    reason: scored.score > 0
      ? `Matched ${scored.template.id} from idea/style signal: ${scored.template.match.filter((keyword) => signal.includes(keyword)).join(", ")}.`
      : `Defaulted to ${scored.template.id} because no stronger template signal was found.`,
  };
}
