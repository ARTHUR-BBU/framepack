import type { TemplateRouteId } from "./template-market.js";

export type GsapMotionSkillCategory =
  | "hero"
  | "text"
  | "product"
  | "data"
  | "layout"
  | "scroll-story"
  | "flip"
  | "scrubbed-sequence";

export interface GsapMotionSkill {
  id: string;
  category: GsapMotionSkillCategory;
  displayName: string;
  intentTags: string[];
  bestFor: string[];
  avoidWhen: string[];
  requiredLibraries: string[];
  hyperframesNotes: string[];
  codegenPreset: string;
  acceptanceCriteria: string[];
  plainLanguageSummary: string;
}

export interface GsapMotionRecommendation {
  skills: GsapMotionSkill[];
  agentInstructions: string[];
  acceptanceCriteria: string[];
  plainLanguageSummary: string;
}

const GSAP_MOTION_SKILLS: GsapMotionSkill[] = [
  {
    id: "apple-keynote-hero",
    category: "hero",
    displayName: "Apple Keynote Hero",
    intentTags: ["apple", "keynote", "premium", "launch", "hero", "cinematic"],
    bestFor: ["premium product openings", "launch hooks", "hero name reveals"],
    avoidWhen: ["the user wants chaotic arcade energy"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Use a deterministic GSAP timeline and keep the first HyperFrames frame visible."],
    codegenPreset: "hero-keynote",
    acceptanceCriteria: ["Hero message is readable immediately and gains polish within the first second."],
    plainLanguageSummary: "A calm premium opening where the product or headline arrives like a keynote reveal.",
  },
  {
    id: "kinetic-headline-reveal",
    category: "text",
    displayName: "Kinetic Headline Reveal",
    intentTags: ["big text", "kinetic", "headline", "dynamic", "fast", "impact"],
    bestFor: ["large mobile headlines", "fast hooks", "social-first videos"],
    avoidWhen: ["text is already dense or tiny"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Animate line/word groups with fixed durations; do not depend on SplitText plugins."],
    codegenPreset: "text-kinetic",
    acceptanceCriteria: ["The core line is readable within three seconds."],
    plainLanguageSummary: "Big words arrive with rhythm so the user feels the message immediately.",
  },
  {
    id: "word-stagger-reveal",
    category: "text",
    displayName: "Word Stagger Reveal",
    intentTags: ["word", "stagger", "subtitle", "caption", "editorial"],
    bestFor: ["caption emphasis", "founder/story copy", "course promise lines"],
    avoidWhen: ["every sentence is long and unedited"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Use regular DOM spans or scene containers; keep render timing deterministic."],
    codegenPreset: "text-stagger",
    acceptanceCriteria: ["Stagger supports comprehension, not just motion density."],
    plainLanguageSummary: "Words step into view one by one, useful for premium captions and promise lines.",
  },
  {
    id: "luxury-product-reveal",
    category: "product",
    displayName: "Luxury Product Reveal",
    intentTags: ["luxury", "product", "premium", "reveal", "minimal"],
    bestFor: ["product closeups", "brand polish", "minimal hero scenes"],
    avoidWhen: ["the user wants messy UGC energy"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Use opacity, y, scale, and shadow only; no live pointer interactions."],
    codegenPreset: "product-luxury",
    acceptanceCriteria: ["The product feels intentional, spacious, and commercially credible."],
    plainLanguageSummary: "A product appears with restraint, space, and a premium studio feel.",
  },
  {
    id: "saas-feature-spotlight",
    category: "product",
    displayName: "SaaS Feature Spotlight",
    intentTags: ["saas", "feature", "dashboard", "app", "spotlight"],
    bestFor: ["app screenshots", "feature walkthroughs", "dashboard promos"],
    avoidWhen: ["no product UI or substitute visual exists"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Focus cards and screenshot areas through the timeline, not hover state."],
    codegenPreset: "product-spotlight",
    acceptanceCriteria: ["The viewer knows which feature matters in each scene."],
    plainLanguageSummary: "A controlled spotlight points attention to the important product feature.",
  },
  {
    id: "counter-metric-impact",
    category: "data",
    displayName: "Counter Metric Impact",
    intentTags: ["data", "metric", "counter", "number", "growth", "shock"],
    bestFor: ["KPI reveals", "data shock openings", "business proof"],
    avoidWhen: ["the idea has no credible number"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Use deterministic numeric tweening; avoid runtime randomness."],
    codegenPreset: "data-counter",
    acceptanceCriteria: ["The number is large, legible, and tied to a plain-language implication."],
    plainLanguageSummary: "A big number lands with impact so the business point is obvious.",
  },
  {
    id: "chart-reveal-sequence",
    category: "data",
    displayName: "Chart Reveal Sequence",
    intentTags: ["chart", "data", "bar", "dashboard", "analytics"],
    bestFor: ["chart scenes", "analytics explainers", "dashboard reveals"],
    avoidWhen: ["the project has no chart or metric intent"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Animate bars and labels by timeline; do not require live data fetches."],
    codegenPreset: "data-chart",
    acceptanceCriteria: ["Data motion explains the point rather than hiding it."],
    plainLanguageSummary: "Charts build in stages so the viewer follows the evidence.",
  },
  {
    id: "bento-grid-reveal",
    category: "layout",
    displayName: "Bento Grid Reveal",
    intentTags: ["bento", "grid", "layout", "features", "cards"],
    bestFor: ["feature sets", "template showcases", "multi-benefit sections"],
    avoidWhen: ["only one message exists"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Animate card containers inside scene timing; keep layout dimensions stable."],
    codegenPreset: "layout-bento",
    acceptanceCriteria: ["Each card has a clear role and does not crowd the frame."],
    plainLanguageSummary: "Cards appear in a clean grid, giving many points a professional structure.",
  },
  {
    id: "card-expand-focus",
    category: "layout",
    displayName: "Card Expand Focus",
    intentTags: ["card", "expand", "focus", "layout", "feature"],
    bestFor: ["one-card-at-a-time feature emphasis", "benefit comparison"],
    avoidWhen: ["cards contain too much copy"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Use scale/opacity transforms instead of layout thrash during render."],
    codegenPreset: "layout-card-focus",
    acceptanceCriteria: ["The focused card is unambiguous and readable."],
    plainLanguageSummary: "One card becomes the star while the rest step back.",
  },
  {
    id: "scroll-story-pin-sequence",
    category: "scroll-story",
    displayName: "Render-Safe Scroll Story Pin Sequence",
    intentTags: ["scroll", "scrolltrigger", "pin", "parallax", "storytelling", "web"],
    bestFor: ["scrollytelling references", "website-to-video", "progressive reveals"],
    avoidWhen: ["the output must remain a real interactive web page"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Translate ScrollTrigger intent into a render-safe HyperFrames timeline; do not emit ScrollTrigger.create()."],
    codegenPreset: "heavy-scroll-story",
    acceptanceCriteria: ["The video feels like a scroll story without requiring real scroll input."],
    plainLanguageSummary: "It borrows the feeling of a pinned scroll story, but converts it into video-safe timeline motion.",
  },
  {
    id: "flip-layout-morph",
    category: "flip",
    displayName: "Render-Safe FLIP Layout Morph",
    intentTags: ["flip", "morph", "layout", "cards", "transition"],
    bestFor: ["grid-to-focus transitions", "card morphs", "layout changes"],
    avoidWhen: ["scene layout is unstable or text is overflowing"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Use FLIP-style transform choreography with fixed start/end states; plugin use is optional, not required."],
    codegenPreset: "heavy-flip-morph",
    acceptanceCriteria: ["The layout change feels intentional and does not break readability."],
    plainLanguageSummary: "A layout changes shape smoothly, like cards rearranging into a hero focus.",
  },
  {
    id: "scrubbed-product-walkthrough",
    category: "scrubbed-sequence",
    displayName: "Scrubbed Product Walkthrough",
    intentTags: ["scrub", "walkthrough", "progress", "product", "sequence"],
    bestFor: ["step-by-step product demos", "progress-driven explainers"],
    avoidWhen: ["the product journey has not been decided"],
    requiredLibraries: ["gsap"],
    hyperframesNotes: ["Represent scrub progress as fixed timeline beats for preview/render determinism."],
    codegenPreset: "heavy-scrubbed-walkthrough",
    acceptanceCriteria: ["Every progress beat explains one product or proof moment."],
    plainLanguageSummary: "A product walkthrough moves like the viewer is scrubbing through a polished demo.",
  },
];

export function listGsapMotionSkills(): GsapMotionSkill[] {
  return GSAP_MOTION_SKILLS.map((skill) => ({
    ...skill,
    intentTags: [...skill.intentTags],
    bestFor: [...skill.bestFor],
    avoidWhen: [...skill.avoidWhen],
    requiredLibraries: [...skill.requiredLibraries],
    hyperframesNotes: [
      ...skill.hyperframesNotes,
      "Framepack codegen emits HyperFrames render-safe GSAP timeline code.",
    ],
    acceptanceCriteria: [...skill.acceptanceCriteria],
  }));
}

export function getGsapMotionSkill(id: string): GsapMotionSkill | undefined {
  const skill = GSAP_MOTION_SKILLS.find((item) => item.id === id);
  return skill ? listGsapMotionSkills().find((item) => item.id === id) : undefined;
}

export function recommendGsapMotionSkills(input: {
  idea: string;
  style?: string;
  templateId?: TemplateRouteId | string;
  format?: "16:9" | "9:16";
  durationSec?: number;
}): GsapMotionRecommendation {
  const signal = `${input.idea} ${input.style ?? ""} ${input.templateId ?? ""}`.toLowerCase();
  const scored = GSAP_MOTION_SKILLS.map((skill) => {
    let score = 0;
    for (const tag of skill.intentTags) {
      if (signal.includes(tag)) score += 3;
    }
    for (const phrase of skill.bestFor) {
      if (signal.includes(phrase.toLowerCase().split(" ")[0] ?? "")) score += 1;
    }
    if (skill.category === "text" && /big|large|caption|text|headline|title|subtitle/.test(signal)) score += 5;
    if (skill.category === "hero" && /launch|hero|opening|intro|apple|keynote|premium/.test(signal)) score += 5;
    if (skill.category === "product" && /product|saas|app|feature|dashboard/.test(signal)) score += 5;
    if (skill.category === "data" && /data|metric|number|chart|growth|dashboard/.test(signal)) score += 5;
    if (skill.category === "layout" && /bento|grid|card|layout|feature/.test(signal)) score += 5;
    if (skill.category === "scroll-story" && /scroll|scrolltrigger|pin|parallax|web|story/.test(signal)) score += 8;
    if (skill.category === "flip" && /flip|morph|rearrange|layout change/.test(signal)) score += 8;
    if (skill.category === "scrubbed-sequence" && /scrub|walkthrough|step|progress/.test(signal)) score += 8;
    if (input.format === "9:16" && skill.id === "kinetic-headline-reveal") score += 2;
    if ((input.durationSec ?? 45) <= 35 && ["kinetic-headline-reveal", "counter-metric-impact"].includes(skill.id)) score += 2;
    return { skill, score };
  });

  const selected = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.id.localeCompare(b.skill.id))
    .slice(0, 4)
    .map((item) => item.skill);
  const skills = selected.length > 0 ? selected : [GSAP_MOTION_SKILLS[0], GSAP_MOTION_SKILLS[2], GSAP_MOTION_SKILLS[8]];

  return {
    skills: skills.map((skill) => ({ ...skill, intentTags: [...skill.intentTags], bestFor: [...skill.bestFor], avoidWhen: [...skill.avoidWhen], requiredLibraries: [...skill.requiredLibraries], hyperframesNotes: [...skill.hyperframesNotes], acceptanceCriteria: [...skill.acceptanceCriteria] })),
    plainLanguageSummary: "Motion director recommendation: pick a small set of GSAP motion recipes, attach them to the composition, then generate render-safe HyperFrames timelines.",
    agentInstructions: [
      "Write selected GSAP Motion Skills into COMPOSITION.md before build.",
      "Treat skills as template-attached motion recipes, not standalone agent skills.",
      "When a skill mentions ScrollTrigger or FLIP, convert the intent into deterministic HyperFrames timeline code unless the user explicitly asks for an interactive web page.",
    ],
    acceptanceCriteria: [
      "Selected motion skills are visible in COMPOSITION.md.",
      "Generated HTML registers a GSAP timeline on window.__timelines.",
      "Heavy interaction skills are render-safe and do not require real scroll, hover, drag, or random runtime input.",
    ],
  };
}

export function extractGsapMotionSkillIds(markdown: string): string[] {
  const knownIds = new Set(GSAP_MOTION_SKILLS.map((skill) => skill.id));
  return [...markdown.matchAll(/`([a-z0-9-]+)`/g)]
    .map((match) => match[1])
    .filter((id) => knownIds.has(id));
}
