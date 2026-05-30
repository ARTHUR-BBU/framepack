import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// ── Types ──────────────────────────────────────────────

export type SceneTemplateCategory =
  | "opening"
  | "name-reveal"
  | "stats"
  | "footage"
  | "cta"
  | "transition"
  | "overlay";

export type SceneTemplateSource =
  | "builtin"
  | "block"
  | "component"
  | "external"
  | "agent-created";

export type SceneTemplateFormat = "16:9" | "9:16" | "any";

export interface SceneTemplate {
  id: string;
  category: SceneTemplateCategory;
  tags: string[];
  format: SceneTemplateFormat;
  source: SceneTemplateSource;
  html: string;
  requiredTokens: string[];
  minDuration: number;
  maxDuration: number;
}

export interface SceneTemplateQuery {
  category?: SceneTemplateCategory;
  tags?: string[];
  format?: string;
  duration?: number;
  source?: SceneTemplateSource;
}

export interface TemplateRegistryEntry {
  id: string;
  name: string;
  baseUrl: string;
  format: "hyperframes-html" | "remotion-react" | "gsap-snippet" | "heygen-design";
}

// ── Block → Scene Role Mapping ────────────────────────

export const BLOCK_SCENE_MAP: Record<string, SceneTemplateCategory[]> = {
  "app-showcase": ["footage", "cta"],
  "data-chart": ["stats"],
  "reddit-post-card": ["stats"],
  "ios26-liquid-glass": ["footage"],
  "logo-outro": ["cta"],
  "apple-money-count": ["stats"],
  "flash-through-white": ["transition"],
  "vfx-text-cursor": ["opening", "name-reveal"],
};

// ── Template Loading ──────────────────────────────────

let _builtinCache: SceneTemplate[] | null = null;

/**
 * Load all built-in scene templates from templates/scene-templates/.
 * Results are cached after first load.
 */
export function loadBuiltinTemplates(): SceneTemplate[] {
  if (_builtinCache) return _builtinCache;

  const templatesDir = resolveTemplatesDir();
  if (!existsSync(templatesDir)) {
    _builtinCache = [];
    return _builtinCache;
  }

  const templates: SceneTemplate[] = [];
  const categories = readdirSync(templatesDir, { withFileTypes: true });

  for (const cat of categories) {
    if (!cat.isDirectory()) continue;
    const catDir = join(templatesDir, cat.name);
    const files = readdirSync(catDir);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const jsonPath = join(catDir, file);
      const htmlFile = file.replace(".json", ".html");
      const htmlPath = join(catDir, htmlFile);

      try {
        const meta = JSON.parse(readFileSync(jsonPath, "utf-8"));
        const html = existsSync(htmlPath)
          ? readFileSync(htmlPath, "utf-8")
          : "";

        templates.push({
          id: meta.id || file.replace(".json", ""),
          category: meta.category || cat.name,
          tags: meta.tags || [],
          format: meta.format || "any",
          source: "builtin",
          html,
          requiredTokens: meta.requiredTokens || [],
          minDuration: meta.minDuration || 2,
          maxDuration: meta.maxDuration || 15,
        });
      } catch {
        // skip malformed templates
      }
    }
  }

  _builtinCache = templates;
  return templates;
}

/**
 * Load block-based scene templates from installed HyperFrames blocks.
 * Blocks are discovered from compositions/blocks/ in the project directory.
 */
export function loadBlockTemplates(projectDir?: string): SceneTemplate[] {
  const templates: SceneTemplate[] = [];

  for (const [blockId, categories] of Object.entries(BLOCK_SCENE_MAP)) {
    templates.push({
      id: `block-${blockId}`,
      category: categories[0],
      tags: ["block", blockId],
      format: "any" as SceneTemplateFormat,
      source: "block",
      html: buildBlockMountHtml(blockId),
      requiredTokens: [],
      minDuration: 3,
      maxDuration: 20,
    });
  }

  return templates;
}

/**
 * Load agent-created templates from a project or global directory.
 */
export function loadAgentTemplates(projectDir?: string): SceneTemplate[] {
  const templates: SceneTemplate[] = [];
  const dirs: string[] = [];

  if (projectDir) {
    dirs.push(join(projectDir, ".framepack", "templates"));
  }
  dirs.push(getGlobalTemplateDir());

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    loadTemplatesFromDir(dir, "agent-created", templates);
  }

  return templates;
}

/**
 * Load all scene templates from all sources.
 */
export function loadAllTemplates(projectDir?: string): SceneTemplate[] {
  return [
    ...loadBuiltinTemplates(),
    ...loadBlockTemplates(projectDir),
    ...loadAgentTemplates(projectDir),
  ];
}

// ── Template Matching ─────────────────────────────────

/**
 * Match scene templates against a query.
 * Returns templates sorted by relevance (more tag matches = higher score).
 */
export function matchSceneTemplates(query: SceneTemplateQuery): SceneTemplate[] {
  const all = loadAllTemplates();
  let filtered = all;

  if (query.category) {
    filtered = filtered.filter(t => t.category === query.category);
  }

  if (query.format && query.format !== "any") {
    filtered = filtered.filter(t => t.format === "any" || t.format === query.format);
  }

  if (query.duration) {
    filtered = filtered.filter(t => query.duration! >= t.minDuration && query.duration! <= t.maxDuration);
  }

  if (query.source) {
    filtered = filtered.filter(t => t.source === query.source);
  }

  // Score by tag overlap
  if (query.tags && query.tags.length > 0) {
    const scored = filtered.map(t => {
      const overlap = t.tags.filter(tag =>
        query.tags!.some(qt => qt.toLowerCase() === tag.toLowerCase())
      ).length;
      return { template: t, score: overlap };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.template);
  }

  // Source priority: builtin > block > component > external > agent-created
  const sourceOrder: SceneTemplateSource[] = ["builtin", "block", "component", "external", "agent-created"];
  filtered.sort((a, b) => sourceOrder.indexOf(a.source) - sourceOrder.indexOf(b.source));

  return filtered;
}

/**
 * Find the best matching template for a scene role within a template route.
 */
export function findTemplateForSceneRole(
  sceneRole: string,
  format: string,
  duration: number,
  projectDir?: string,
): SceneTemplate | null {
  const categoryMap: Record<string, SceneTemplateCategory> = {
    hook: "opening",
    headline: "opening",
    promise: "opening",
    tension: "opening",
    number: "stats",
    stats: "stats",
    proof: "stats",
    product: "footage",
    action: "footage",
    path: "footage",
    progression: "footage",
    context: "opening",
    origin: "opening",
    implication: "opening",
    cta: "cta",
    conviction: "cta",
    reward: "cta",
  };

  const category = categoryMap[sceneRole] || "opening";
  const results = matchSceneTemplates({ category, format, duration });

  // Prefer tags matching the scene role
  const tagged = results.find(t =>
    t.tags.some(tag => tag.toLowerCase().includes(sceneRole))
  );

  return tagged || results[0] || null;
}

// ── Template Saving ───────────────────────────────────

/**
 * Save an agent-created template to local directory.
 */
export function saveAgentTemplate(
  template: Omit<SceneTemplate, "source">,
  projectDir?: string,
): string {
  const baseDir = projectDir
    ? join(projectDir, ".framepack", "templates")
    : getGlobalTemplateDir();

  const catDir = join(baseDir, template.category);
  mkdirSync(catDir, { recursive: true });

  const meta = {
    id: template.id,
    category: template.category,
    tags: template.tags,
    format: template.format,
    requiredTokens: template.requiredTokens,
    minDuration: template.minDuration,
    maxDuration: template.maxDuration,
  };

  writeFileSync(join(catDir, `${template.id}.json`), JSON.stringify(meta, null, 2));
  writeFileSync(join(catDir, `${template.id}.html`), template.html);

  // Invalidate cache
  _builtinCache = null;

  return join(catDir, template.id);
}

// ── Template Registry ─────────────────────────────────

export const DEFAULT_REGISTRIES: TemplateRegistryEntry[] = [
  {
    id: "hyperframes-blocks",
    name: "HyperFrames Catalog Blocks",
    baseUrl: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry/blocks",
    format: "hyperframes-html",
  },
  {
    id: "gsap-community",
    name: "GSAP Community Animations",
    baseUrl: "https://github.com/topics/gsap-animation",
    format: "gsap-snippet",
  },
  {
    id: "remotion-community",
    name: "Remotion Community Templates",
    baseUrl: "https://github.com/topics/programmatic-video",
    format: "remotion-react",
  },
];

/**
 * List available template registries.
 */
export function listRegistries(): TemplateRegistryEntry[] {
  return DEFAULT_REGISTRIES;
}

// ── Template Statistics ───────────────────────────────

export interface TemplateStats {
  builtin: number;
  blocks: number;
  agentCreated: number;
  total: number;
  byCategory: Record<string, number>;
}

export function getTemplateStats(projectDir?: string): TemplateStats {
  const builtin = loadBuiltinTemplates();
  const blocks = loadBlockTemplates(projectDir);
  const agent = loadAgentTemplates(projectDir);

  const all = [...builtin, ...blocks, ...agent];
  const byCategory: Record<string, number> = {};
  for (const t of all) {
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  }

  return {
    builtin: builtin.length,
    blocks: blocks.length,
    agentCreated: agent.length,
    total: all.length,
    byCategory,
  };
}

// ── Helpers ───────────────────────────────────────────

function resolveTemplatesDir(): string {
  // From dist/workbench/scene-templates.js → templates/scene-templates/
  // dist/ is at project root, templates/ is also at project root
  const thisDir = new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
  // Try multiple resolution paths
  const candidates = [
    resolve(thisDir, "..", "..", "templates", "scene-templates"),
    resolve(thisDir, "..", "..", "..", "templates", "scene-templates"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0];
}

function getGlobalTemplateDir(): string {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  return join(home, ".framepack", "templates");
}

function buildBlockMountHtml(blockId: string): string {
  return [
    `<div data-composition-id="${blockId}-scene"`,
    `     data-composition-src="compositions/blocks/${blockId}.html"`,
    `     data-start="{{sceneStart}}" data-duration="{{sceneDuration}}">`,
    `</div>`,
  ].join("\n");
}

function loadTemplatesFromDir(
  dir: string,
  source: SceneTemplateSource,
  out: SceneTemplate[],
): void {
  if (!existsSync(dir)) return;
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const catDir = join(dir, entry.name);
    loadTemplatesFromCategoryDir(catDir, entry.name as SceneTemplateCategory, source, out);
  }
}

function loadTemplatesFromCategoryDir(
  catDir: string,
  category: SceneTemplateCategory,
  source: SceneTemplateSource,
  out: SceneTemplate[],
): void {
  const files = readdirSync(catDir);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const jsonPath = join(catDir, file);
    const htmlPath = join(catDir, file.replace(".json", ".html"));

    try {
      const meta = JSON.parse(readFileSync(jsonPath, "utf-8"));
      const html = existsSync(htmlPath) ? readFileSync(htmlPath, "utf-8") : "";
      out.push({
        id: meta.id || file.replace(".json", ""),
        category: meta.category || category,
        tags: meta.tags || [],
        format: meta.format || "any",
        source,
        html,
        requiredTokens: meta.requiredTokens || [],
        minDuration: meta.minDuration || 2,
        maxDuration: meta.maxDuration || 15,
      });
    } catch {
      // skip malformed
    }
  }
}
