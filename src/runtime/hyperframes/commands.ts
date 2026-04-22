import type {
  HyperframesCommandSpec,
  HyperframesPackageRuntimeInfo,
  HyperframesRuntimeAction,
  RuntimeCapabilities,
} from "./types.js";

export function buildHyperframesCommandSpec(input: {
  action: HyperframesRuntimeAction;
  packageDirectory: string;
  packageRuntimeInfo: HyperframesPackageRuntimeInfo;
  capabilities: RuntimeCapabilities;
  passthroughArgs?: string[];
}): HyperframesCommandSpec {
  void input.packageRuntimeInfo;
  const passthroughArgs = input.passthroughArgs ?? [];
  const args =
    input.action === "doctor"
      ? ["doctor", ...passthroughArgs]
      : [input.action, ...passthroughArgs, input.packageDirectory];

  return {
    action: input.action,
    executable: input.capabilities.binary,
    args,
    cwd: input.packageDirectory,
    summary: `${input.capabilities.binary} ${args.join(" ")}`,
    passthroughArgs,
  };
}
