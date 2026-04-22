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
}

export interface HyperframesPackageRuntimeInfo {
  rootEntry: string;
  compositionDirectory: string;
  assetDirectory: string;
}
