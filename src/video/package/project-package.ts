import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScenePlan, VideoBrief } from "../types.js";

export interface VideoProjectPackage {
  projectName: string;
  files: Record<string, string>;
}

export function createVideoProjectPackage(input: {
  projectName: string;
  brief: VideoBrief;
  scenePlan: ScenePlan;
  compositionHtml: string;
}): VideoProjectPackage {
  return {
    projectName: input.projectName,
    files: {
      "FLYWHEEL.md": "# Flywheel\n\nIntake -> Plan -> Review -> Compose -> Render -> Retro\n",
      "VIDEO_BRIEF.json": JSON.stringify(input.brief, null, 2),
      "SCENE_PLAN.json": JSON.stringify(input.scenePlan, null, 2),
      "COMMANDS.md":
        "npx hyperframes preview\nnpx hyperframes lint\nnpx hyperframes validate\nnpx hyperframes render\n",
      "GUARDRAILS.md": "# Guardrails\n\nReview ScenePlan before render.\n",
      "RETRO_LOG.md": "# Retro Log\n\n- Initial generation\n",
      "composition.html": input.compositionHtml,
    },
  };
}

export function writeVideoProjectPackage(
  outputDir: string,
  projectPackage: VideoProjectPackage,
) {
  const targetDir = resolve(outputDir, projectPackage.projectName);

  mkdirSync(targetDir, { recursive: true });

  for (const [fileName, content] of Object.entries(projectPackage.files)) {
    writeFileSync(resolve(targetDir, fileName), content, "utf8");
  }

  return targetDir;
}
