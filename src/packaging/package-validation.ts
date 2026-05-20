import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CapabilityGraph } from "../capabilities/capability-graph.js";
import type { RuntimeManifest } from "../runtime/manifest.js";
import type {
  AssetExecutionPlan,
  PackageManifest,
  SceneAssetMap,
  ScenePlan,
  SourceSceneMap,
  ValidationReport,
} from "../core/types.js";
import { formatValidationReportMarkdown } from "../video/validation/validation-report.js";
import {
  FRAMEPACK_PACKAGE_COMMANDS,
  FRAMEPACK_PACKAGE_PROTOCOL,
  FRAMEPACK_PACKAGE_PROTOCOL_VERSION,
  getRequiredPackageProtocolFiles,
} from "./package-protocol.js";

const CAPABILITY_GRAPH_VERSION = "framepack.capability-graph.v1";
const CAPABILITY_NODE_KINDS = new Set(["runtime", "library", "cli", "mcp-tool", "skill", "remote-api", "manual"]);
const CAPABILITY_DELIVERIES = new Set([
  "npm-local",
  "cdn-runtime",
  "cli-local",
  "mcp-tool",
  "remote-api",
  "codex-skill",
  "manual-external",
]);
const CAPABILITY_STATUSES = new Set(["available", "planned", "not-detected", "external", "blocked"]);
const RUNTIME_MANIFEST_VERSION = "framepack.runtime-manifest.v1";

function readJsonFile<T>(projectDir: string, relativePath: string, issues: string[]): T | undefined {
  const targetPath = resolve(projectDir, relativePath);

  if (!existsSync(targetPath)) {
    issues.push(`Missing required package file: ${relativePath}`);
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(targetPath, "utf8")) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues.push(`Invalid JSON in ${relativePath}: ${message}`);
    return undefined;
  }
}

function validateManifest(input: {
  manifest?: PackageManifest;
  assetExecutionPlan?: AssetExecutionPlan;
  projectDir: string;
  issues: string[];
}) {
  if (!input.manifest) {
    return;
  }

  if (input.manifest.protocol !== FRAMEPACK_PACKAGE_PROTOCOL) {
    input.issues.push(`PACKAGE_MANIFEST.json protocol must be ${FRAMEPACK_PACKAGE_PROTOCOL}.`);
  }

  if (input.manifest.protocolVersion !== FRAMEPACK_PACKAGE_PROTOCOL_VERSION) {
    input.issues.push(
      `PACKAGE_MANIFEST.json protocolVersion must be ${FRAMEPACK_PACKAGE_PROTOCOL_VERSION}.`,
    );
  }

  if (!input.assetExecutionPlan) {
    return;
  }

  const manifestExecutionKinds = new Set(input.manifest.capabilities.executionKinds);
  for (const item of input.assetExecutionPlan.items) {
    if (!manifestExecutionKinds.has(item.executionKind)) {
      input.issues.push(
        `PACKAGE_MANIFEST.json capabilities.executionKinds is missing ${item.executionKind} for ${item.suggestedAsset}.`,
      );
    }
  }

  const packageCommands = new Set(input.manifest.capabilities.packageCommands ?? []);
  for (const command of FRAMEPACK_PACKAGE_COMMANDS) {
    if (!packageCommands.has(command)) {
      input.issues.push(
        `PACKAGE_MANIFEST.json capabilities.packageCommands is missing ${command}.`,
      );
    }
  }

  for (const artifactPath of Object.values(input.manifest.artifacts).flat()) {
    if (artifactPath.endsWith("/")) {
      continue;
    }

    const targetPath = resolve(input.projectDir, artifactPath);
    if (!existsSync(targetPath)) {
      input.issues.push(`PACKAGE_MANIFEST.json artifacts references missing file: ${artifactPath}.`);
    }
  }
}

function validateSceneAssetMap(input: {
  scenePlan?: ScenePlan;
  sceneAssetMap?: SceneAssetMap;
  assetExecutionPlan?: AssetExecutionPlan;
  issues: string[];
}) {
  if (!input.sceneAssetMap) {
    return;
  }

  if (!Array.isArray(input.sceneAssetMap.assets)) {
    input.issues.push("SCENE_ASSET_MAP.json assets must be an array.");
    return;
  }

  if (!Array.isArray(input.sceneAssetMap.scenes)) {
    input.issues.push("SCENE_ASSET_MAP.json scenes must be an array.");
    return;
  }

  const topLevelAssets = new Map(input.sceneAssetMap.assets.map((asset) => [asset.suggestedAsset, asset]));

  if (input.assetExecutionPlan) {
    for (const item of input.assetExecutionPlan.items) {
      if (!topLevelAssets.has(item.suggestedAsset)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json assets is missing execution asset ${item.suggestedAsset}.`,
        );
      }
    }
  }

  const sceneIds = new Set(input.scenePlan?.scenes.map((scene) => scene.sceneId) ?? []);
  const mappedSceneAssets = new Map<string, Set<string>>();

  for (const scene of input.sceneAssetMap.scenes) {
    if (!Array.isArray(scene.recommendedAssets)) {
      input.issues.push(
        `SCENE_ASSET_MAP.json scene ${scene.sceneId} recommendedAssets must be an array.`,
      );
      continue;
    }

    if (sceneIds.size > 0 && !sceneIds.has(scene.sceneId)) {
      input.issues.push(`SCENE_ASSET_MAP.json references unknown scene ${scene.sceneId}.`);
    }

    const sceneAssetNames = new Set<string>();
    for (const asset of scene.recommendedAssets) {
      sceneAssetNames.add(asset.suggestedAsset);
      if (!topLevelAssets.has(asset.suggestedAsset)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json scene ${scene.sceneId} references missing top-level asset ${asset.suggestedAsset}.`,
        );
      }
    }
    mappedSceneAssets.set(scene.sceneId, sceneAssetNames);
  }

  for (const asset of input.sceneAssetMap.assets) {
    for (const sceneId of asset.recommendedSceneIds) {
      if (sceneIds.size > 0 && !sceneIds.has(sceneId)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json asset ${asset.suggestedAsset} recommends unknown scene ${sceneId}.`,
        );
        continue;
      }

      if (!mappedSceneAssets.get(sceneId)?.has(asset.suggestedAsset)) {
        input.issues.push(
          `SCENE_ASSET_MAP.json scene ${sceneId} is missing recommended asset ${asset.suggestedAsset}.`,
        );
      }
    }
  }
}

function validateSourceSceneMap(input: {
  scenePlan?: ScenePlan;
  sourceSceneMap?: SourceSceneMap;
  sceneAssetMap?: SceneAssetMap;
  issues: string[];
}) {
  if (!input.sourceSceneMap) {
    return;
  }

  const sceneIds = new Set(input.scenePlan?.scenes.map((scene) => scene.sceneId) ?? []);
  const sceneAssetMapAssets = Array.isArray(input.sceneAssetMap?.assets)
    ? input.sceneAssetMap.assets
    : [];
  const assetNames = new Set(sceneAssetMapAssets.map((asset) => asset.suggestedAsset));

  for (const source of input.sourceSceneMap.sources) {
    if (assetNames.size > 0 && !assetNames.has(source.suggestedAsset)) {
      input.issues.push(
        `SOURCE_SCENE_MAP.json source ${source.sourceLabel} references asset ${source.suggestedAsset} missing from SCENE_ASSET_MAP.json.`,
      );
    }

    for (const sceneId of source.recommendedSceneIds) {
      if (sceneIds.size > 0 && !sceneIds.has(sceneId)) {
        input.issues.push(
          `SOURCE_SCENE_MAP.json source ${source.sourceLabel} recommends unknown scene ${sceneId}.`,
        );
      }
    }
  }
}

function validateAvailableOutputs(input: {
  projectDir: string;
  assetExecutionPlan?: AssetExecutionPlan;
  issues: string[];
}) {
  if (!input.assetExecutionPlan) {
    return;
  }

  for (const item of input.assetExecutionPlan.items) {
    if (item.status !== "available" && item.status !== "external") {
      continue;
    }

    const outputPath = resolve(input.projectDir, item.outputPath);
    if (!existsSync(outputPath)) {
      input.issues.push(
        `ASSET_EXECUTION_PLAN.json marks ${item.suggestedAsset} as ${item.status}, but ${item.outputPath} does not exist.`,
      );
    }
  }
}

function validateCapabilityGraph(input: {
  capabilityGraph?: CapabilityGraph;
  assetExecutionPlan?: AssetExecutionPlan;
  issues: string[];
}) {
  if (!input.capabilityGraph) {
    return;
  }

  if (input.capabilityGraph.version !== CAPABILITY_GRAPH_VERSION) {
    input.issues.push(`CAPABILITY_GRAPH.json version must be ${CAPABILITY_GRAPH_VERSION}.`);
  }

  if (!Array.isArray(input.capabilityGraph.nodes)) {
    input.issues.push("CAPABILITY_GRAPH.json nodes must be an array.");
    return;
  }

  if (!Array.isArray(input.capabilityGraph.edges)) {
    input.issues.push("CAPABILITY_GRAPH.json edges must be an array.");
    return;
  }

  const nodeIds = new Set<string>();
  for (const node of input.capabilityGraph.nodes) {
    if (!node || typeof node.id !== "string" || node.id.length === 0) {
      input.issues.push("CAPABILITY_GRAPH.json contains a node without a non-empty id.");
      continue;
    }

    if (nodeIds.has(node.id)) {
      input.issues.push(`CAPABILITY_GRAPH.json contains duplicate node id ${node.id}.`);
    }
    nodeIds.add(node.id);

    if (!CAPABILITY_NODE_KINDS.has(node.kind)) {
      input.issues.push(`CAPABILITY_GRAPH.json node ${node.id} has invalid kind ${String(node.kind)}.`);
    }

    if (typeof node.provider !== "string" || node.provider.length === 0) {
      input.issues.push(`CAPABILITY_GRAPH.json node ${node.id} provider must be a non-empty string.`);
    }

    if (!CAPABILITY_DELIVERIES.has(node.delivery)) {
      input.issues.push(`CAPABILITY_GRAPH.json node ${node.id} has invalid delivery ${String(node.delivery)}.`);
    }

    if (typeof node.required !== "boolean") {
      input.issues.push(`CAPABILITY_GRAPH.json node ${node.id} required must be a boolean.`);
    }

    if (!CAPABILITY_STATUSES.has(node.status)) {
      input.issues.push(`CAPABILITY_GRAPH.json node ${node.id} has invalid status ${String(node.status)}.`);
    }

    if (!Array.isArray(node.usedBy)) {
      input.issues.push(`CAPABILITY_GRAPH.json node ${node.id} usedBy must be an array.`);
    }
  }

  if (!nodeIds.has("video-runtime.hyperframes")) {
    input.issues.push("CAPABILITY_GRAPH.json must include video-runtime.hyperframes.");
  }

  if (!nodeIds.has("mcp.framepack")) {
    input.issues.push("CAPABILITY_GRAPH.json must include mcp.framepack.");
  }

  for (const edge of input.capabilityGraph.edges) {
    if (!edge || typeof edge.from !== "string" || typeof edge.to !== "string") {
      input.issues.push("CAPABILITY_GRAPH.json contains an edge without string from/to values.");
      continue;
    }

    if (!nodeIds.has(edge.from)) {
      input.issues.push(`CAPABILITY_GRAPH.json edge references missing from node ${edge.from}.`);
    }

    if (!nodeIds.has(edge.to)) {
      input.issues.push(`CAPABILITY_GRAPH.json edge references missing to node ${edge.to}.`);
    }

    if (typeof edge.reason !== "string" || edge.reason.length === 0) {
      input.issues.push(`CAPABILITY_GRAPH.json edge ${edge.from}->${edge.to} reason must be a non-empty string.`);
    }
  }

  const forgeBackends = new Set(
    input.assetExecutionPlan?.items
      .map((item) => item.forgeBackend)
      .filter((backend): backend is string => Boolean(backend)) ?? [],
  );
  for (const backend of forgeBackends) {
    const nodeId = `asset-forge.${backend}`;
    if (!nodeIds.has(nodeId)) {
      input.issues.push(`CAPABILITY_GRAPH.json is missing ${nodeId}.`);
    }
  }

  const requiredSkills = new Set(
    input.assetExecutionPlan?.items
      .map((item) => item.requiredSkill)
      .filter((skill): skill is string => Boolean(skill)) ?? [],
  );
  for (const skill of requiredSkills) {
    const nodeId = `skill.${skill}`;
    if (!nodeIds.has(nodeId)) {
      input.issues.push(`CAPABILITY_GRAPH.json is missing ${nodeId}.`);
    }
  }
}

function validateRuntimeManifest(input: {
  runtimeManifest?: RuntimeManifest;
  manifest?: PackageManifest;
  issues: string[];
}) {
  if (!input.runtimeManifest) {
    return;
  }

  if (input.runtimeManifest.version !== RUNTIME_MANIFEST_VERSION) {
    input.issues.push(`RUNTIME_MANIFEST.json version must be ${RUNTIME_MANIFEST_VERSION}.`);
  }

  if (input.runtimeManifest.backend !== "hyperframes") {
    input.issues.push("RUNTIME_MANIFEST.json backend must be hyperframes.");
  }

  const entrypoints = input.runtimeManifest.entrypoints;
  if (!entrypoints || typeof entrypoints !== "object") {
    input.issues.push("RUNTIME_MANIFEST.json entrypoints must be an object.");
  } else {
    if (entrypoints.rootEntry !== "index.html") {
      input.issues.push("RUNTIME_MANIFEST.json entrypoints.rootEntry must be index.html.");
    }

    if (entrypoints.runtimeConfig !== "hyperframes.json") {
      input.issues.push("RUNTIME_MANIFEST.json entrypoints.runtimeConfig must be hyperframes.json.");
    }

    if (entrypoints.runtimeMeta !== "meta.json") {
      input.issues.push("RUNTIME_MANIFEST.json entrypoints.runtimeMeta must be meta.json.");
    }

    if (typeof entrypoints.compositionDirectory !== "string" || entrypoints.compositionDirectory.length === 0) {
      input.issues.push("RUNTIME_MANIFEST.json entrypoints.compositionDirectory must be a non-empty string.");
    }

    if (typeof entrypoints.assetDirectory !== "string" || entrypoints.assetDirectory.length === 0) {
      input.issues.push("RUNTIME_MANIFEST.json entrypoints.assetDirectory must be a non-empty string.");
    }
  }

  if (!input.runtimeManifest.capabilities || typeof input.runtimeManifest.capabilities.available !== "boolean") {
    input.issues.push("RUNTIME_MANIFEST.json capabilities.available must be a boolean.");
  }

  if (!Array.isArray(input.runtimeManifest.commands)) {
    input.issues.push("RUNTIME_MANIFEST.json commands must be an array.");
  } else {
    const packageCommands = new Set(input.manifest?.capabilities.packageCommands ?? []);
    for (const command of input.runtimeManifest.commands) {
      if (!command || typeof command.action !== "string") {
        input.issues.push("RUNTIME_MANIFEST.json contains a command without a string action.");
        continue;
      }

      const packageCommand =
        command.action === "upgrade-check"
          ? "runtime-upgrade-check"
          : command.action === "preview" || command.action === "render"
            ? command.action
            : `runtime-${command.action}`;
      if (!packageCommands.has(packageCommand as PackageManifest["capabilities"]["packageCommands"][number])) {
        input.issues.push(`RUNTIME_MANIFEST.json command ${command.action} is not exposed by PACKAGE_MANIFEST.json.`);
      }

      if (typeof command.executable !== "string" || command.executable.length === 0) {
        input.issues.push(`RUNTIME_MANIFEST.json command ${command.action} executable must be a non-empty string.`);
      }

      if (!Array.isArray(command.args)) {
        input.issues.push(`RUNTIME_MANIFEST.json command ${command.action} args must be an array.`);
      }

      if (typeof command.cwd !== "string" || command.cwd.length === 0) {
        input.issues.push(`RUNTIME_MANIFEST.json command ${command.action} cwd must be a non-empty string.`);
      }

      if (typeof command.summary !== "string" || command.summary.length === 0) {
        input.issues.push(`RUNTIME_MANIFEST.json command ${command.action} summary must be a non-empty string.`);
      }
    }
  }

  if (input.runtimeManifest.evidence?.validationReport !== "VALIDATION_REPORT.json") {
    input.issues.push("RUNTIME_MANIFEST.json evidence.validationReport must be VALIDATION_REPORT.json.");
  }

  if (input.runtimeManifest.evidence?.guardrails !== "GUARDRAILS.md") {
    input.issues.push("RUNTIME_MANIFEST.json evidence.guardrails must be GUARDRAILS.md.");
  }
}

export function validateProjectPackage(input: {
  projectDir: string;
  now?: Date;
}): ValidationReport {
  const issues: string[] = [];
  for (const path of getRequiredPackageProtocolFiles()) {
    const targetPath = resolve(input.projectDir, path);
    if (!existsSync(targetPath)) {
      issues.push(`Missing required package file: ${path}`);
    }
  }

  const manifest = existsSync(resolve(input.projectDir, "PACKAGE_MANIFEST.json"))
    ? readJsonFile<PackageManifest>(input.projectDir, "PACKAGE_MANIFEST.json", issues)
    : undefined;
  const scenePlan = existsSync(resolve(input.projectDir, "SCENE_PLAN.json"))
    ? readJsonFile<ScenePlan>(input.projectDir, "SCENE_PLAN.json", issues)
    : undefined;
  const assetExecutionPlan = existsSync(resolve(input.projectDir, "ASSET_EXECUTION_PLAN.json"))
    ? readJsonFile<AssetExecutionPlan>(
        input.projectDir,
        "ASSET_EXECUTION_PLAN.json",
        issues,
      )
    : undefined;
  const sceneAssetMap = existsSync(resolve(input.projectDir, "SCENE_ASSET_MAP.json"))
    ? readJsonFile<SceneAssetMap>(input.projectDir, "SCENE_ASSET_MAP.json", issues)
    : undefined;
  const sourceSceneMap = existsSync(resolve(input.projectDir, "SOURCE_SCENE_MAP.json"))
    ? readJsonFile<SourceSceneMap>(input.projectDir, "SOURCE_SCENE_MAP.json", issues)
    : undefined;
  const capabilityGraph = existsSync(resolve(input.projectDir, "CAPABILITY_GRAPH.json"))
    ? readJsonFile<CapabilityGraph>(input.projectDir, "CAPABILITY_GRAPH.json", issues)
    : undefined;
  const runtimeManifest = existsSync(resolve(input.projectDir, "RUNTIME_MANIFEST.json"))
    ? readJsonFile<RuntimeManifest>(input.projectDir, "RUNTIME_MANIFEST.json", issues)
    : undefined;

  validateManifest({ manifest, assetExecutionPlan, projectDir: input.projectDir, issues });
  validateSceneAssetMap({ scenePlan, sceneAssetMap, assetExecutionPlan, issues });
  validateSourceSceneMap({ scenePlan, sourceSceneMap, sceneAssetMap, issues });
  validateAvailableOutputs({ projectDir: input.projectDir, assetExecutionPlan, issues });
  validateCapabilityGraph({ capabilityGraph, assetExecutionPlan, issues });
  validateRuntimeManifest({ runtimeManifest, manifest, issues });

  return {
    projectName: manifest?.projectName ?? "unknown-project",
    status: issues.length === 0 ? "passed" : "failed",
    sceneCount: scenePlan?.scenes.length ?? 0,
    totalDurationSec: scenePlan?.totalDurationSec ?? 0,
    issues,
    generatedAt: (input.now ?? new Date()).toISOString(),
  };
}

export function writeProjectPackageValidationReport(input: {
  projectDir: string;
  report: ValidationReport;
}) {
  writeFileSync(
    resolve(input.projectDir, "VALIDATION_REPORT.json"),
    JSON.stringify(input.report, null, 2),
    "utf8",
  );
  writeFileSync(
    resolve(input.projectDir, "VALIDATION_REPORT.md"),
    formatValidationReportMarkdown(input.report),
    "utf8",
  );
}
