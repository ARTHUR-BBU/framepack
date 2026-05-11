import type {
  HyperframesCommandSpec,
  HyperframesPackageRuntimeInfo,
  HyperframesRuntimeAction,
  RuntimeCapabilities,
} from "./types.js";
import { detectLocalHyperframesCapabilities } from "./discovery.js";
import { buildHyperframesCommandSpec } from "./commands.js";

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
    buildCommand(input: {
      action: HyperframesRuntimeAction;
      packageDirectory?: string;
      packageRuntimeInfo: HyperframesPackageRuntimeInfo;
      capabilities: RuntimeCapabilities;
      passthroughArgs?: string[];
    }): HyperframesCommandSpec {
      return buildHyperframesCommandSpec(input);
    },
  };
}
