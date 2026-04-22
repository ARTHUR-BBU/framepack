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
}): HyperframesCommandSpec {
  const args =
    input.action === "doctor"
      ? ["--version"]
      : [input.action, input.packageRuntimeInfo.rootEntry];

  return {
    action: input.action,
    executable: input.capabilities.binary,
    args,
    cwd: input.packageDirectory,
    summary: `${input.capabilities.binary} ${args.join(" ")}`,
  };
}
