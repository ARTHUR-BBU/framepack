import type {
  HyperframesCommandSpec,
  HyperframesPackageRuntimeInfo,
  HyperframesRuntimeAction,
  RuntimeCapabilities,
} from "./types.js";

export function buildHyperframesCommandSpec(input: {
  action: HyperframesRuntimeAction;
  packageDirectory?: string;
  packageRuntimeInfo: HyperframesPackageRuntimeInfo;
  capabilities: RuntimeCapabilities;
  passthroughArgs?: string[];
}): HyperframesCommandSpec {
  void input.packageRuntimeInfo;
  const passthroughArgs = input.passthroughArgs ?? [];
  const packageDirectory = input.packageDirectory;
  const args = (() => {
    if (input.action === "doctor") {
      return ["doctor", ...passthroughArgs];
    }

    if (input.action === "upgrade-check") {
      return ["upgrade", "--check", "--json"];
    }

    if (!packageDirectory) {
      throw new Error(`Missing package directory for HyperFrames ${input.action}.`);
    }

    return [input.action, ...passthroughArgs, packageDirectory];
  })();

  return {
    action: input.action,
    executable: input.capabilities.binary,
    args,
    cwd: packageDirectory ?? process.cwd(),
    summary: `${input.capabilities.binary} ${args.join(" ")}`,
    passthroughArgs,
  };
}
