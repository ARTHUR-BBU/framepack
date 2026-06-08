import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

export type ArsenalKind = "template" | "motion" | "library" | "reference" | "design" | "hyperframes-rule";

export interface ArsenalSource {
  type: "built-in" | "trusted-registry" | "project" | "candidate";
  uri: string;
  trusted: boolean;
  licenseNote: string;
}

export interface ArsenalItem {
  id: string;
  kind: ArsenalKind;
  name: string;
  description: string;
  tags: string[];
  appliesTo: string[];
  source: ArsenalSource;
  version: string;
  reuseCount: number;
}

export interface DownloadedResource {
  id: string;
  itemId: string;
  cachedPath: string;
  source: ArsenalSource;
  firstUsedProject?: string;
  reuseCount: number;
}

export interface WeaponRemix {
  id: string;
  name: string;
  projectDir: string;
  createdAt: string;
  sourceItemIds: string[];
  savedAsItemId: string;
}

export interface ProjectArsenalManifest {
  version: "framepack.arsenal-project.v1";
  projectName: string;
  projectDir?: string;
  items: ArsenalItem[];
  downloads: DownloadedResource[];
  remixes: WeaponRemix[];
  candidateSources: ArsenalSource[];
}

export interface GlobalArsenalManifest {
  version: "framepack.arsenal-global.v1";
  items: ArsenalItem[];
  downloads: DownloadedResource[];
  candidateSources: ArsenalSource[];
}

export interface StoryboardSegment {
  id: string;
  role: string;
  beat: string;
  visual: string;
  motion: string;
  assetIntent: string;
}

export interface TemplateBlueprint {
  version: "framepack.template-blueprint.v1";
  name: string;
  reusableSlots: string[];
  rhythm: string[];
  hyperframesRules: string[];
}

export interface ReferenceDNA {
  version: "framepack.reference-dna.v1";
  sourceVideo: string;
  rhythm: string[];
  segments: StoryboardSegment[];
  designTokens: string[];
  reusableBlueprint: TemplateBlueprint;
}

const BUILT_IN_ARSENAL: ArsenalItem[] = [
  {
    id: "workflow.event-promo",
    kind: "template",
    name: "Event Promo Rhythm Blueprint",
    description: "活动宣传片节奏蓝图：钩子、活动价值、嘉宾/议程、现场感、倒计时、CTA。",
    tags: ["event", "promo", "summit", "conference", "webinar", "launch-event", "活动", "宣传片"],
    appliesTo: ["event-promo"],
    source: { type: "built-in", uri: "framepack://workflow/event-promo", trusted: true, licenseNote: "included" },
    version: "1.0.0",
    reuseCount: 0,
  },
  {
    id: "motion.event-countdown-pulse",
    kind: "motion",
    name: "Countdown Pulse",
    description: "倒计时和报名 CTA 的卡点脉冲动效，适合活动预热、直播开始前和票务截止。",
    tags: ["countdown", "pulse", "cta", "event", "fast"],
    appliesTo: ["event-promo", "course-promo", "launch"],
    source: { type: "built-in", uri: "framepack://motion/event-countdown-pulse", trusted: true, licenseNote: "included" },
    version: "1.0.0",
    reuseCount: 0,
  },
  {
    id: "motion.speaker-lineup-reveal",
    kind: "motion",
    name: "Speaker Lineup Reveal",
    description: "嘉宾阵容逐个揭示，适合峰会、发布会、沙龙和线上直播预告。",
    tags: ["speaker", "lineup", "event", "reveal", "cards"],
    appliesTo: ["event-promo"],
    source: { type: "built-in", uri: "framepack://motion/speaker-lineup-reveal", trusted: true, licenseNote: "included" },
    version: "1.0.0",
    reuseCount: 0,
  },
  {
    id: "library.gsap",
    kind: "library",
    name: "GSAP",
    description: "Framepack 首选时间轴动效库，用于 HyperFrames 可渲染的确定性编排。",
    tags: ["gsap", "timeline", "animation", "hyperframes-safe"],
    appliesTo: ["event-promo", "saas-launch", "course-promo", "sports-highlight", "transfer-announcement"],
    source: { type: "trusted-registry", uri: "https://registry.npmjs.org/gsap", trusted: true, licenseNote: "external package; verify license before redistribution" },
    version: "3.x",
    reuseCount: 0,
  },
  {
    id: "rules.hyperframes-render-safe",
    kind: "hyperframes-rule",
    name: "HyperFrames Render-Safe Checklist",
    description: "最终审片严格规则：首屏可见、tl.set 场景切换、window.__timelines 注册、无随机和无限循环。",
    tags: ["hyperframes", "lint", "render-safe", "qa"],
    appliesTo: ["all"],
    source: { type: "built-in", uri: "framepack://rules/hyperframes-render-safe", trusted: true, licenseNote: "included" },
    version: "1.0.0",
    reuseCount: 0,
  },
  {
    id: "reference.video-dna",
    kind: "reference",
    name: "Reference Video DNA",
    description: "把参考视频反推成 VIDEO_DNA、STORYBOARD 和 TEMPLATE_BLUEPRINT 的结构化方法。",
    tags: ["reference", "storyboard", "video-dna", "template-blueprint"],
    appliesTo: ["all"],
    source: { type: "built-in", uri: "framepack://reference/video-dna", trusted: true, licenseNote: "included" },
    version: "1.0.0",
    reuseCount: 0,
  },
];

function cloneItem(item: ArsenalItem): ArsenalItem {
  return {
    ...item,
    tags: [...item.tags],
    appliesTo: [...item.appliesTo],
    source: { ...item.source },
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "arsenal-item";
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listArsenalItems(): ArsenalItem[] {
  return BUILT_IN_ARSENAL.map(cloneItem);
}

export function recommendArsenal(input: {
  idea: string;
  format?: "16:9" | "9:16";
  type?: string;
}): { type: string; items: ArsenalItem[]; agentBoundary: string; candidateSources: ArsenalSource[] } {
  const type = input.type ?? "general-video";
  const signal = `${input.idea} ${input.format ?? ""} ${type}`.toLowerCase();
  const scored = listArsenalItems()
    .map((item) => {
      const haystack = [...item.tags, ...item.appliesTo, item.name, item.description].join(" ").toLowerCase();
      let score = item.appliesTo.includes(type) ? 8 : 0;
      for (const tag of item.tags) {
        if (signal.includes(tag.toLowerCase())) score += 3;
      }
      if (haystack.includes("event") && /event|summit|conference|webinar|活动|发布会|峰会|直播/.test(signal)) {
        score += 6;
      }
      if (item.kind === "hyperframes-rule") score += 2;
      if (item.kind === "library") score += 1;
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.item.id.localeCompare(right.item.id));
  const items = (scored.length > 0 ? scored.map((entry) => entry.item) : listArsenalItems()).slice(0, 8);

  return {
    type,
    items,
    agentBoundary: "Agent is the director. Framepack recommends weapons, references, and render rules without making final creative decisions.",
    candidateSources: [
      {
        type: "candidate",
        uri: "https://github.com/greensock/GSAP",
        trusted: false,
        licenseNote: "Search candidate only. Do not auto-download until registered as trusted.",
      },
    ],
  };
}

export function createProjectArsenalManifest(input: {
  projectName: string;
  projectDir?: string;
  idea: string;
  format: "16:9" | "9:16";
  type?: string;
}): ProjectArsenalManifest {
  const recommendation = recommendArsenal({
    idea: input.idea,
    format: input.format,
    type: input.type ?? (/(event|summit|conference|webinar|活动|发布会|峰会|直播)/i.test(input.idea) ? "event-promo" : "general-video"),
  });

  return {
    version: "framepack.arsenal-project.v1",
    projectName: input.projectName,
    projectDir: input.projectDir,
    items: recommendation.items,
    downloads: [],
    remixes: [],
    candidateSources: recommendation.candidateSources,
  };
}

export function projectArsenalPath(projectDir: string): string {
  return join(projectDir, ".framepack", "arsenal.json");
}

export function readProjectArsenal(projectDir: string): ProjectArsenalManifest {
  const path = projectArsenalPath(projectDir);
  if (!existsSync(path)) {
    return createProjectArsenalManifest({
      projectName: basename(projectDir),
      projectDir,
      idea: basename(projectDir),
      format: "16:9",
    });
  }
  return JSON.parse(readFileSync(path, "utf8")) as ProjectArsenalManifest;
}

export function writeProjectArsenal(projectDir: string, manifest: ProjectArsenalManifest): void {
  mkdirSync(join(projectDir, ".framepack"), { recursive: true });
  writeFileSync(projectArsenalPath(projectDir), JSON.stringify(manifest, null, 2), "utf8");
}

export function cacheManifestPath(projectDir: string): string {
  return join(projectDir, ".framepack", "arsenal-cache", "manifest.json");
}

export function readGlobalArsenal(projectDir: string): GlobalArsenalManifest {
  const path = cacheManifestPath(projectDir);
  if (!existsSync(path)) {
    return {
      version: "framepack.arsenal-global.v1",
      items: [],
      downloads: [],
      candidateSources: [],
    };
  }
  return JSON.parse(readFileSync(path, "utf8")) as GlobalArsenalManifest;
}

export function writeGlobalArsenal(projectDir: string, manifest: GlobalArsenalManifest): void {
  const path = cacheManifestPath(projectDir);
  mkdirSync(join(projectDir, ".framepack", "arsenal-cache"), { recursive: true });
  writeFileSync(path, JSON.stringify(manifest, null, 2), "utf8");
}

export function addArsenalItem(input: {
  projectDir: string;
  from: string;
  kind: ArsenalKind;
  name?: string;
}): ArsenalItem {
  const projectDir = resolve(input.projectDir);
  const source = resolve(input.from);
  if (!existsSync(source)) {
    throw new Error(`Arsenal source not found or not trusted: ${input.from}`);
  }

  const cacheDir = join(projectDir, ".framepack", "arsenal-cache", input.kind);
  mkdirSync(cacheDir, { recursive: true });
  const itemName = input.name ?? basename(source, extname(source));
  const cachedPath = join(cacheDir, `${slugify(itemName)}${extname(source) || ".txt"}`);
  copyFileSync(source, cachedPath);

  const item: ArsenalItem = {
    id: `${input.kind}.${slugify(itemName)}`,
    kind: input.kind,
    name: itemName,
    description: `Project-added ${input.kind} weapon from ${basename(source)}.`,
    tags: [input.kind, "project-added"],
    appliesTo: ["project"],
    source: {
      type: "project",
      uri: cachedPath,
      trusted: true,
      licenseNote: "project local source; user/agent supplied",
    },
    version: "1.0.0",
    reuseCount: 1,
  };
  const download: DownloadedResource = {
    id: `download.${slugify(itemName)}`,
    itemId: item.id,
    cachedPath,
    source: item.source,
    firstUsedProject: projectDir,
    reuseCount: 1,
  };
  const projectManifest = readProjectArsenal(projectDir);
  projectManifest.items = [...projectManifest.items.filter((existing) => existing.id !== item.id), item];
  projectManifest.downloads = [...projectManifest.downloads.filter((existing) => existing.id !== download.id), download];
  writeProjectArsenal(projectDir, projectManifest);

  const globalManifest = readGlobalArsenal(projectDir);
  globalManifest.items = [...globalManifest.items.filter((existing) => existing.id !== item.id), item];
  globalManifest.downloads = [...globalManifest.downloads.filter((existing) => existing.id !== download.id), download];
  writeGlobalArsenal(projectDir, globalManifest);

  return item;
}

export function saveProjectRemix(input: { projectDir: string; name: string }): WeaponRemix {
  const projectDir = resolve(input.projectDir);
  const projectManifest = readProjectArsenal(projectDir);
  const savedAsItemId = `template.${slugify(input.name)}`;
  const remix: WeaponRemix = {
    id: `remix.${slugify(input.name)}.${Date.now()}`,
    name: input.name,
    projectDir,
    createdAt: nowIso(),
    sourceItemIds: projectManifest.items.map((item) => item.id),
    savedAsItemId,
  };
  const item: ArsenalItem = {
    id: savedAsItemId,
    kind: "template",
    name: input.name,
    description: `Reusable template saved from ${basename(projectDir)}.`,
    tags: ["saved-remix", "template", "project-derived"],
    appliesTo: ["project", "event-promo"],
    source: {
      type: "project",
      uri: projectDir,
      trusted: true,
      licenseNote: "derived from local project; review rights before publishing",
    },
    version: "1.0.0",
    reuseCount: 1,
  };

  projectManifest.remixes.push(remix);
  projectManifest.items = [...projectManifest.items.filter((existing) => existing.id !== item.id), item];
  writeProjectArsenal(projectDir, projectManifest);

  const globalManifest = readGlobalArsenal(projectDir);
  globalManifest.items = [...globalManifest.items.filter((existing) => existing.id !== item.id), item];
  writeGlobalArsenal(projectDir, globalManifest);

  return remix;
}

export function createReferenceDna(input: {
  projectDir: string;
  videoPath: string;
}): ReferenceDNA {
  const sourceVideo = resolve(input.videoPath);
  if (!existsSync(sourceVideo)) {
    throw new Error(`Reference video not found: ${input.videoPath}`);
  }

  const segments: StoryboardSegment[] = [
    {
      id: "segment-01",
      role: "hook",
      beat: "Open on the strongest promise or event moment.",
      visual: "Large title over high-contrast footage or hero still.",
      motion: "Cinematic reveal followed by a short impact pop.",
      assetIntent: "Use the most recognizable event/brand/subject visual.",
    },
    {
      id: "segment-02",
      role: "proof",
      beat: "Show why the viewer should care now.",
      visual: "Speaker, agenda, product, or crowd proof cards.",
      motion: "Staggered card reveal with controlled camera push.",
      assetIntent: "Map available footage and stills to proof moments.",
    },
    {
      id: "segment-03",
      role: "cta",
      beat: "Close with time/place/action.",
      visual: "Countdown, date, venue, registration CTA.",
      motion: "Countdown pulse and final hold for readability.",
      assetIntent: "Use logo, date, URL, and audio hit if available.",
    },
  ];
  return {
    version: "framepack.reference-dna.v1",
    sourceVideo,
    rhythm: ["hook", "proof", "lineup/agenda", "countdown", "CTA"],
    segments,
    designTokens: ["extract dominant background", "extract headline scale", "extract accent color", "extract safe text zones"],
    reusableBlueprint: {
      version: "framepack.template-blueprint.v1",
      name: `${basename(sourceVideo, extname(sourceVideo))} blueprint`,
      reusableSlots: ["eventName", "heroVisual", "speakerLineup", "agendaBeats", "dateVenue", "cta"],
      rhythm: ["dark/open hook", "proof build", "event energy", "countdown", "final CTA hold"],
      hyperframesRules: ["scene visibility controlled with tl.set()", "register window.__timelines", "no Math.random()", "no repeat: -1"],
    },
  };
}

export function formatVideoDna(dna: ReferenceDNA): string {
  return [
    "# VIDEO_DNA.md",
    "",
    `ReferenceDNA: ${dna.version}`,
    `Source video: ${dna.sourceVideo}`,
    `rhythm: ${dna.rhythm.join(" -> ")}`,
    "",
    "## Rhythm",
    "",
    ...dna.rhythm.map((beat) => `- ${beat}`),
    "",
    "## Segments",
    "",
    ...dna.segments.flatMap((segment) => [
      `### ${segment.id}: ${segment.role}`,
      "",
      `- Beat: ${segment.beat}`,
      `- Visual: ${segment.visual}`,
      `- Motion: ${segment.motion}`,
      `- Asset intent: ${segment.assetIntent}`,
      "",
    ]),
    "## Design Tokens To Extract",
    "",
    ...dna.designTokens.map((token) => `- ${token}`),
    "",
  ].join("\n");
}

export function formatTemplateBlueprint(blueprint: TemplateBlueprint): string {
  return [
    "# Template Blueprint",
    "",
    `Version: ${blueprint.version}`,
    `Name: ${blueprint.name}`,
    "",
    "## Reusable Slots",
    "",
    ...blueprint.reusableSlots.map((slot) => `- ${slot}`),
    "",
    "## Rhythm",
    "",
    ...blueprint.rhythm.map((beat) => `- ${beat}`),
    "",
    "## HyperFrames Rules",
    "",
    ...blueprint.hyperframesRules.map((rule) => `- ${rule}`),
    "",
  ].join("\n");
}

export function mineReferenceVideo(input: { projectDir: string; videoPath: string }): ReferenceDNA {
  const projectDir = resolve(input.projectDir);
  const dna = createReferenceDna({ projectDir, videoPath: input.videoPath });
  writeFileSync(join(projectDir, "VIDEO_DNA.md"), formatVideoDna(dna), "utf8");
  writeFileSync(join(projectDir, "TEMPLATE_BLUEPRINT.md"), formatTemplateBlueprint(dna.reusableBlueprint), "utf8");
  const storyboardPath = join(projectDir, "STORYBOARD.md");
  const storyboard = [
    "# Storyboard",
    "",
    "Reference-derived storyboard. Agent is the director; Framepack extracts reusable structure and production constraints.",
    "",
    ...dna.segments.flatMap((segment, index) => [
      `## ${index + 1}. ${segment.role}`,
      "",
      `- Beat: ${segment.beat}`,
      `- Visual: ${segment.visual}`,
      `- Motion: ${segment.motion}`,
      "",
    ]),
  ].join("\n");
  writeFileSync(storyboardPath, storyboard, "utf8");
  return dna;
}
