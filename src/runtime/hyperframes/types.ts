export type HyperframesRuntimeAction = "doctor" | "preview" | "lint" | "validate" | "render";

export interface RuntimeCapabilities {
  available: boolean;
  binary: string;
  detectedAt: string;
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
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface HyperframesPackageRuntimeInfo {
  rootEntry: string;
  compositionDirectory: string;
  assetDirectory: string;
}

export interface HyperframesCommandSpec {
  action: HyperframesRuntimeAction;
  executable: string;
  args: string[];
  cwd: string;
  summary: string;
}
