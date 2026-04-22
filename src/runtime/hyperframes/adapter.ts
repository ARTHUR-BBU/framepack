import type {
  HyperframesPackageRuntimeInfo,
  RuntimeCapabilities,
} from "./types.js";
import { detectLocalHyperframesCapabilities } from "./discovery.js";

export function detectHyperframesCapabilities(): RuntimeCapabilities {
  return detectLocalHyperframesCapabilities();
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
