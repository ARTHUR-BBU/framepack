import type { CompositionScene, CompositionSpec, ScenePlan, VideoFormat } from "../types.js";

function getCompositionDimensions(format: VideoFormat) {
  if (format === "16:9") {
    return { width: 1920, height: 1080 };
  }

  return { width: 1080, height: 1920 };
}

export function compileCompositionSpec(
  input: ScenePlan & { format: VideoFormat; themePalette?: string },
): CompositionSpec {
  const dimensions = getCompositionDimensions(input.format);

  return {
    ...dimensions,
    fps: 30,
    durationSec: input.totalDurationSec,
    scenes: input.scenes.map((scene): CompositionScene => ({
      sceneId: scene.sceneId,
      htmlTemplate: `<section data-scene-id="${scene.sceneId}"></section>`,
      cssClassNames: [scene.visualType],
      assetRefs: scene.assets,
    })),
    theme: {
      palette: input.themePalette ?? "default",
    },
  };
}
