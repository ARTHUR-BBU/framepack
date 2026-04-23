import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SourceManifest } from "../core/types.js";
import { captureWebsiteProject } from "./website/executor.js";
import { composeThreadProject } from "./thread/executor.js";

function readJsonFile<T>(projectDir: string, fileName: string): T {
  return JSON.parse(readFileSync(resolve(projectDir, fileName), "utf8")) as T;
}

export async function materializeProjectAssets(input: {
  projectDir: string;
}) {
  const projectDir = resolve(input.projectDir);
  const sourceManifest = readJsonFile<SourceManifest>(projectDir, "SOURCE_MANIFEST.json");

  if (sourceManifest.sourceType === "website") {
    return captureWebsiteProject({
      projectDir,
    });
  }

  if (sourceManifest.sourceType === "thread") {
    return composeThreadProject({
      projectDir,
    });
  }

  throw new Error("Asset materialization is not supported for this source type.");
}
