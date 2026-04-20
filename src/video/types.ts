export type VideoFormat = "16:9" | "9:16";
export type OutputType = "case-explainer" | "product-demo" | "social-short";

export interface VideoBriefDefaults {
  goal: string;
  audience: string;
  format: VideoFormat;
  outputType: OutputType;
  style?: Partial<VideoStyle>;
  theme?: {
    palette: string;
  };
}

export interface MarkdownVideoBriefInput {
  inputType: "markdown";
  markdown: string;
  defaults: VideoBriefDefaults;
}

export type VideoBriefInput = MarkdownVideoBriefInput;

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
