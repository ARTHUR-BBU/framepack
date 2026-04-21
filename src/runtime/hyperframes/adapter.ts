import type {
  HyperframesPackageRuntimeInfo,
  RuntimeCapabilities,
} from "./types.js";

export function detectHyperframesCapabilities(): RuntimeCapabilities {
  return {
    version: "unknown",
    supportedCommands: ["preview", "lint", "validate", "render"],
    supportedCatalogFeatures: [],
    supportedRenderOptions: [],
    fallbackNotes: ["Runtime execution is not enabled in Phase 1."],
  };
}

export function createHyperframesRuntimeAdapter() {
  return {
    describePackage(input: { projectName: string }): HyperframesPackageRuntimeInfo {
      void input.projectName;

      return {
        rootEntry: "index.html",
        compositionDirectory: "compositions",
        assetDirectory: "assets",
      };
    },
  };
}
