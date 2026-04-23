export type VideoFormat = "16:9" | "9:16";
export type OutputType = "case-explainer" | "product-demo" | "social-short";

export interface VideoStyle {
  tone: string;
  pacing: "slow" | "medium" | "fast";
  brandName: string;
}

export interface VideoConstraintSet {
  maxDurationSec: number;
  requiredPoints: string[];
  bannedTerms: string[];
}

export interface SourceMaterial {
  kind: "markdown" | "structured";
  title: string;
  body: string;
}

export interface VideoBriefDefaults {
  goal: string;
  audience: string;
  format: VideoFormat;
  outputType: OutputType;
  style?: Partial<VideoStyle>;
  constraints?: Partial<VideoConstraintSet>;
  theme?: {
    palette: string;
  };
}

export interface MarkdownVideoBriefInput {
  inputType: "markdown";
  markdown: string;
  defaults: VideoBriefDefaults;
}

export interface WebsiteVideoBriefInput {
  inputType: "website";
  url: string;
  title?: string;
  summary?: string;
  sections?: Array<{
    title: string;
    body: string;
  }>;
  defaults: VideoBriefDefaults;
}

export type VideoBriefInput = MarkdownVideoBriefInput | WebsiteVideoBriefInput;

export interface WebsiteSection {
  title: string;
  body: string;
}

export interface ThreadPost {
  index: number;
  text: string;
}

export interface WebsiteSourceManifest {
  sourceType: "website";
  url: string;
  title: string;
  summary: string;
  sections: WebsiteSection[];
  collectedAt: string;
}

export interface ThreadSourceManifest {
  sourceType: "thread";
  title: string;
  summary: string;
  posts: ThreadPost[];
  collectedAt: string;
}

export type SourceManifest = WebsiteSourceManifest | ThreadSourceManifest;

export interface SourceBundle {
  sourceType: "markdown" | "website" | "thread" | "prd" | "case";
  rawInputs: Record<string, string>;
  collectedArtifacts: Array<Record<string, string>>;
  ingestMetadata: {
    collectedAt: string;
  };
}

export interface VideoBrief {
  goal: string;
  audience: string;
  format: VideoFormat;
  style: VideoStyle;
  sourceMaterials: SourceMaterial[];
  constraints: VideoConstraintSet;
  outputType: OutputType;
}

export type SceneVisualType =
  | "cover"
  | "problem"
  | "solution"
  | "workflow"
  | "highlights"
  | "ending";

export interface Scene {
  sceneId: string;
  purpose: string;
  startTimeSec: number;
  durationSec: number;
  narration: string;
  onScreenText: string[];
  visualType: SceneVisualType;
  assets: string[];
  transition: string;
  validationNotes: string[];
}

export interface ScenePlan {
  totalDurationSec: number;
  scenes: Scene[];
}

export interface ScriptScene {
  sceneId: string;
  voiceoverLines: string[];
  captionLines: string[];
}

export interface Script {
  scenes: ScriptScene[];
}

export interface StoryboardScene {
  sceneId: string;
  visualIntent: string;
  motionNote: string;
  transitionNote: string;
}

export interface Storyboard {
  scenes: StoryboardScene[];
}

export interface CaptureTarget {
  sourceType: "website";
  sourceUrl: string;
  sectionTitle: string;
  sectionBody: string;
  suggestedAsset: string;
  purposeTag: "hero" | "proof" | "workflow" | "highlight";
  assetForm: "screenshot" | "section-card" | "text-overlay";
  recommendedSceneIds: string[];
  rationale: string;
}

export interface AssetPlan {
  availableAssets: string[];
  placeholderAssets: string[];
  missingAssets: string[];
  captureTargets: CaptureTarget[];
}

export interface SceneAssetMapSceneEntry {
  sceneId: string;
  recommendedCaptures: Array<{
    suggestedAsset: string;
    purposeTag: CaptureTarget["purposeTag"];
    assetForm: CaptureTarget["assetForm"];
    sourceSectionTitle: string;
    rationale: string;
  }>;
}

export interface SceneAssetMapCaptureEntry {
  suggestedAsset: string;
  purposeTag: CaptureTarget["purposeTag"];
  assetForm: CaptureTarget["assetForm"];
  sourceSectionTitle: string;
  recommendedSceneIds: string[];
  rationale: string;
}

export interface SceneAssetMap {
  scenes: SceneAssetMapSceneEntry[];
  captures: SceneAssetMapCaptureEntry[];
}

export interface SourceSceneMapSceneEntry {
  sceneId: string;
  linkedSources: Array<{
    sourceType: "website" | "thread";
    sourceLabel: string;
    suggestedAsset: string;
    assetForm: string;
    rationale: string;
  }>;
}

export interface SourceSceneMapSourceEntry {
  sourceType: "website" | "thread";
  sourceLabel: string;
  sourceText: string;
  suggestedAsset: string;
  assetForm: string;
  recommendedSceneIds: string[];
  rationale: string;
}

export interface SourceSceneMap {
  scenes: SourceSceneMapSceneEntry[];
  sources: SourceSceneMapSourceEntry[];
}

export interface AssetExecutionPlanItem {
  suggestedAsset: string;
  sourceType: "website" | "thread";
  sourceLabel: string;
  sourceText: string;
  sourceUrl?: string;
  purposeTag?: CaptureTarget["purposeTag"];
  executionKind: "capture-screenshot" | "compose-text-card";
  assetForm: CaptureTarget["assetForm"] | "text-card";
  recommendedSceneIds: string[];
  rationale?: string;
  outputPath: string;
  metadataPath: string;
  status: "pending" | "available";
}

export interface AssetExecutionPlan {
  generatedAt: string;
  items: AssetExecutionPlanItem[];
}

export interface PackageManifest {
  protocol: "framepack.project-package";
  protocolVersion: 1;
  projectName: string;
  generatedAt: string;
  sourceType: SourceManifest["sourceType"] | "none";
  outputType: OutputType;
  format: VideoFormat;
  entrypoints: {
    rootComposition: string;
    runtimeMeta: string;
    runtimeConfig: string;
    handoff: string;
    commands: string;
  };
  artifacts: {
    source: string[];
    planning: string[];
    assets: string[];
    execution: string[];
    validation: string[];
    runtime: string[];
    docs: string[];
  };
  capabilities: {
    sourceTypes: Array<SourceManifest["sourceType"]>;
    executionKinds: AssetExecutionPlanItem["executionKind"][];
    runtimeBackend: "hyperframes";
  };
  compatibility: {
    legacyFiles: string[];
  };
}

export interface ValidationReport {
  projectName: string;
  status: "passed" | "failed";
  sceneCount: number;
  totalDurationSec: number;
  issues: string[];
  generatedAt: string;
}

export interface CompositionScene {
  sceneId: string;
  htmlTemplate: string;
  cssClassNames: string[];
  assetRefs: string[];
}

export interface CompositionSpec {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  scenes: CompositionScene[];
  theme: {
    palette: string;
  };
}

export interface RuntimeCapabilities {
  version: string;
  supportedCommands: string[];
  supportedCatalogFeatures: string[];
  supportedRenderOptions: string[];
  fallbackNotes: string[];
}

export interface RuntimeExecutionResult {
  action: string;
  success: boolean;
  outputPaths: string[];
  warnings: string[];
  summary: string;
}
