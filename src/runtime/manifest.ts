import type {
  HyperframesCommandSpec,
  HyperframesPackageRuntimeInfo,
  HyperframesRuntimeAction,
  RuntimeCapabilities,
} from "./hyperframes/types.js";

export const PACKAGE_RUNTIME_ACTIONS: HyperframesRuntimeAction[] = [
  "preview",
  "lint",
  "inspect",
  "snapshot",
  "render",
  "upgrade-check",
];

export function isRuntimeActionSupported(
  action: HyperframesRuntimeAction,
  supportedCommands: string[],
): boolean {
  if (action === "upgrade-check") {
    return supportedCommands.includes("upgrade");
  }

  return supportedCommands.includes(action);
}

export interface RuntimeManifest {
  version: "framepack.runtime-manifest.v1";
  backend: "hyperframes";
  entrypoints: {
    rootEntry: string;
    runtimeConfig: "hyperframes.json";
    runtimeMeta: "meta.json";
    compositionDirectory: string;
    assetDirectory: string;
  };
  capabilities: RuntimeCapabilities;
  commands: HyperframesCommandSpec[];
  evidence: {
    validationReport: "VALIDATION_REPORT.json";
    guardrails: "GUARDRAILS.md";
    runtimeSnapshots: "snapshots/";
    runtimeInspectReports: "reports/runtime-inspect/";
  };
}

export function buildRuntimeManifest(input: {
  backend: "hyperframes";
  runtimeInfo: HyperframesPackageRuntimeInfo;
  capabilities: RuntimeCapabilities;
  commands: HyperframesCommandSpec[];
}): RuntimeManifest {
  return {
    version: "framepack.runtime-manifest.v1",
    backend: input.backend,
    entrypoints: {
      rootEntry: input.runtimeInfo.rootEntry,
      runtimeConfig: "hyperframes.json",
      runtimeMeta: "meta.json",
      compositionDirectory: input.runtimeInfo.compositionDirectory,
      assetDirectory: input.runtimeInfo.assetDirectory,
    },
    capabilities: {
      ...input.capabilities,
      supportedCommands: [...input.capabilities.supportedCommands],
      supportedCatalogFeatures: [...input.capabilities.supportedCatalogFeatures],
      supportedRenderOptions: [...input.capabilities.supportedRenderOptions],
      fallbackNotes: [...input.capabilities.fallbackNotes],
    },
    commands: input.commands.map((command) => ({
      ...command,
      args: [...command.args],
      passthroughArgs: [...(command.passthroughArgs ?? [])],
    })),
    evidence: {
      validationReport: "VALIDATION_REPORT.json",
      guardrails: "GUARDRAILS.md",
      runtimeSnapshots: "snapshots/",
      runtimeInspectReports: "reports/runtime-inspect/",
    },
  };
}
