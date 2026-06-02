import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type PreferenceStrength = "high" | "medium" | "low";
export type PreferenceSource = "explicit-user-style" | "project-document" | "inferred";

export interface WorkbenchFieldForce {
  id: string;
  label: string;
  strength: PreferenceStrength;
  source: PreferenceSource;
  appliesTo: string[];
}

export interface WorkbenchPreferences {
  version: "framepack.preferences.v1";
  updatedAt: string;
  projectDir: string;
  fieldForces: WorkbenchFieldForce[];
  plainLanguageSummary: string;
}

export function writeWorkbenchPreferences(input: {
  projectDir: string;
  idea?: string;
  style?: string;
  extraText?: string;
}): WorkbenchPreferences {
  const projectDir = resolve(input.projectDir);
  const text = [
    input.idea ?? "",
    input.style ?? "",
    input.extraText ?? "",
    readIfExists(join(projectDir, "STYLE.md")),
    readIfExists(join(projectDir, "DIRECTION.md")),
    readIfExists(join(projectDir, "HUMAN.md")),
    readIfExists(join(projectDir, "ITERATIONS.md")),
  ].join("\n").toLowerCase();

  const preferences: WorkbenchPreferences = {
    version: "framepack.preferences.v1",
    updatedAt: new Date().toISOString(),
    projectDir,
    fieldForces: inferFieldForces(text, Boolean(input.style)),
    plainLanguageSummary: "Framepack records the user's style signals here so later template, Catalog, and composition choices stay consistent.",
  };

  mkdirSync(join(projectDir, ".framepack"), { recursive: true });
  writeFileSync(join(projectDir, ".framepack", "preferences.json"), JSON.stringify(preferences, null, 2), "utf8");
  return preferences;
}

export function readWorkbenchPreferences(projectDir: string): WorkbenchPreferences | undefined {
  const path = join(resolve(projectDir), ".framepack", "preferences.json");
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as WorkbenchPreferences;
}

export function formatWorkbenchPreferences(projectDir: string): string {
  const preferences = readWorkbenchPreferences(projectDir);
  if (!preferences) {
    return [
      "Framepack preferences",
      `projectDir: ${resolve(projectDir)}`,
      "",
      "No preferences recorded yet. Run create with --idea/--style or update STYLE.md, then rerun a recommendation command.",
    ].join("\n");
  }

  return [
    "Framepack preferences",
    `projectDir: ${resolve(projectDir)}`,
    "",
    preferences.plainLanguageSummary,
    "",
    ...preferences.fieldForces.map((force) => `- ${force.id} (${force.strength}): ${force.label}`),
  ].join("\n");
}

export function preferenceStyleSuffix(projectDir?: string): string | undefined {
  if (!projectDir) return undefined;
  const preferences = readWorkbenchPreferences(projectDir);
  if (!preferences || preferences.fieldForces.length === 0) return undefined;
  return preferences.fieldForces.map((force) => force.label).join("; ");
}

function inferFieldForces(text: string, explicitStyle: boolean): WorkbenchFieldForce[] {
  const forces: WorkbenchFieldForce[] = [];
  addIf(forces, text, ["premium", "高级", "质感", "polished"], {
    id: "premium-polish",
    label: "premium and polished visual tone",
    appliesTo: ["template-selection", "design-tokens", "composition"],
    source: explicitStyle ? "explicit-user-style" : "inferred",
  });
  addIf(forces, text, ["business", "商务", "professional"], {
    id: "business-clarity",
    label: "business clarity with confident structure",
    appliesTo: ["direction", "copy", "composition"],
    source: explicitStyle ? "explicit-user-style" : "inferred",
  });
  addIf(forces, text, ["dynamic", "动感", "kinetic", "fast", "节奏快"], {
    id: "fast-kinetic-pacing",
    label: "fast kinetic pacing and visible motion",
    appliesTo: ["pacing", "animation", "scene-transitions"],
    source: explicitStyle ? "explicit-user-style" : "inferred",
  });
  addIf(forces, text, ["big text", "大字", "大标题", "headline"], {
    id: "large-focal-text",
    label: "large focal text and clear hierarchy",
    appliesTo: ["caption-design", "composition", "template-selection"],
    source: explicitStyle ? "explicit-user-style" : "inferred",
  });
  addIf(forces, text, ["cinematic", "电影感"], {
    id: "cinematic-depth",
    label: "cinematic depth and dramatic reveals",
    appliesTo: ["visual-style", "transitions", "composition"],
    source: explicitStyle ? "explicit-user-style" : "inferred",
  });
  addIf(forces, text, ["tech", "科技", "ai", "agent"], {
    id: "technical-system-energy",
    label: "technical system energy and product proof",
    appliesTo: ["catalog-prefabs", "data-motion", "composition"],
    source: explicitStyle ? "explicit-user-style" : "inferred",
  });

  return forces.length > 0
    ? forces
    : [{
      id: "balanced-polish",
      label: "balanced polish with clear video structure",
      strength: "medium",
      source: "inferred",
      appliesTo: ["direction", "composition", "template-selection"],
    }];
}

function addIf(
  forces: WorkbenchFieldForce[],
  text: string,
  needles: string[],
  force: Omit<WorkbenchFieldForce, "strength">,
): void {
  if (!needles.some((needle) => text.includes(needle.toLowerCase()))) return;
  forces.push({
    ...force,
    strength: force.source === "explicit-user-style" ? "high" : "medium",
  });
}

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}
