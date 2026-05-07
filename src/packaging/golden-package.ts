import type {
  AssetExecutionPlan,
  PackageManifest,
  SceneAssetMap,
} from "../core/types.js";
import type { VideoProjectPackage } from "../video/package/project-package.js";
import { getRequiredPackageProtocolFiles } from "./package-protocol.js";

export interface GoldenPackageProtocolSummary {
  projectName: string;
  sourceType: PackageManifest["sourceType"];
  outputType: PackageManifest["outputType"];
  requiredFilesPresent: boolean;
  missingRequiredFiles: string[];
  executionKinds: AssetExecutionPlan["items"][number]["executionKind"][];
  packageCommands: PackageManifest["capabilities"]["packageCommands"];
  executionItemCount: number;
  sceneAssetMap: {
    sceneCount: number;
    topLevelAssetCount: number;
    captureCompatibilityCount: number;
    hasRecommendedAssets: boolean;
  };
  forgeTaskCount: number;
  forgeBackends: string[];
  handoffMentionsRuntimeDoctor: boolean;
  handoffMentionsForgeTasks: boolean;
}

function parsePackageFile<T>(projectPackage: VideoProjectPackage, path: string): T {
  const rawFile = projectPackage.files[path];

  if (!rawFile) {
    throw new Error(`Missing package file: ${path}`);
  }

  return JSON.parse(rawFile) as T;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort();
}

export function createGoldenPackageProtocolSummary(
  projectPackage: VideoProjectPackage,
): GoldenPackageProtocolSummary {
  const missingRequiredFiles = getRequiredPackageProtocolFiles().filter((path) => !(path in projectPackage.files));
  const packageManifest = parsePackageFile<PackageManifest>(projectPackage, "PACKAGE_MANIFEST.json");
  const assetExecutionPlan = parsePackageFile<AssetExecutionPlan>(
    projectPackage,
    "ASSET_EXECUTION_PLAN.json",
  );
  const sceneAssetMap = parsePackageFile<SceneAssetMap>(projectPackage, "SCENE_ASSET_MAP.json");
  const handoff = projectPackage.files["HANDOFF.md"] ?? "";

  return {
    projectName: packageManifest.projectName,
    sourceType: packageManifest.sourceType,
    outputType: packageManifest.outputType,
    requiredFilesPresent: missingRequiredFiles.length === 0,
    missingRequiredFiles,
    executionKinds: [...new Set(assetExecutionPlan.items.map((item) => item.executionKind))],
    packageCommands: [...packageManifest.capabilities.packageCommands],
    executionItemCount: assetExecutionPlan.items.length,
    sceneAssetMap: {
      sceneCount: sceneAssetMap.scenes.length,
      topLevelAssetCount: sceneAssetMap.assets.length,
      captureCompatibilityCount: sceneAssetMap.captures.length,
      hasRecommendedAssets: sceneAssetMap.scenes.every((scene) =>
        Array.isArray(scene.recommendedAssets),
      ),
    },
    forgeTaskCount: assetExecutionPlan.items.filter((item) => item.executionKind.startsWith("forge-")).length,
    forgeBackends: uniqueSorted(
      assetExecutionPlan.items
        .map((item) => item.forgeBackend)
        .filter((backend): backend is string => Boolean(backend)),
    ),
    handoffMentionsRuntimeDoctor: /runtime doctor --project-dir/.test(handoff),
    handoffMentionsForgeTasks: /Asset forge tasks/.test(handoff),
  };
}
