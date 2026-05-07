import type {
  AssetExecutionPlan,
  PackageManifest,
  SourceManifest,
  ValidationReport,
  VideoBrief,
} from "../core/types.js";
import {
  FRAMEPACK_PACKAGE_PROTOCOL,
  FRAMEPACK_PACKAGE_COMMANDS,
  FRAMEPACK_PACKAGE_PROTOCOL_VERSION,
  FRAMEPACK_PACKAGE_PROTOCOL_V1,
  getPackageProtocolArtifacts,
} from "./package-protocol.js";

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function buildPackageManifest(input: {
  projectName: string;
  brief: VideoBrief;
  sourceManifest?: SourceManifest;
  assetExecutionPlan: AssetExecutionPlan;
  validationReport: ValidationReport;
}): PackageManifest {
  const sourceFiles = input.sourceManifest ? ["SOURCE_MANIFEST.json"] : [];

  return {
    protocol: FRAMEPACK_PACKAGE_PROTOCOL,
    protocolVersion: FRAMEPACK_PACKAGE_PROTOCOL_VERSION,
    projectName: input.projectName,
    generatedAt: input.validationReport.generatedAt,
    sourceType: input.sourceManifest?.sourceType ?? "none",
    outputType: input.brief.outputType,
    format: input.brief.format,
    entrypoints: { ...FRAMEPACK_PACKAGE_PROTOCOL_V1.entrypoints },
    artifacts: getPackageProtocolArtifacts({ sourceFiles }),
    capabilities: {
      sourceTypes: input.sourceManifest ? [input.sourceManifest.sourceType] : [],
      executionKinds: unique(input.assetExecutionPlan.items.map((item) => item.executionKind)),
      packageCommands: [...FRAMEPACK_PACKAGE_COMMANDS],
      runtimeBackend: "hyperframes",
    },
    compatibility: {
      legacyFiles: [...FRAMEPACK_PACKAGE_PROTOCOL_V1.compatibility.legacyFiles],
    },
  };
}
