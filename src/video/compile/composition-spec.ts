import type { CompositionScene, CompositionSpec, ScenePlan, VideoFormat } from "../types.js";
import type { CompositionProposal, CompositionProposalScene } from "../../creative/composition-proposal.js";

function getCompositionDimensions(format: VideoFormat) {
  if (format === "16:9") {
    return { width: 1920, height: 1080 };
  }

  return { width: 1080, height: 1920 };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getSceneTitle(scene: ScenePlan["scenes"][number], proposalScene?: CompositionProposalScene) {
  if (proposalScene?.title) {
    return proposalScene.title;
  }

  return scene.onScreenText[0] ?? scene.narration;
}

function getSceneBody(scene: ScenePlan["scenes"][number], proposalScene?: CompositionProposalScene) {
  if (proposalScene?.body) {
    return proposalScene.body;
  }

  return scene.onScreenText.slice(1).join(" ");
}

function getMotionIntent(visualType: ScenePlan["scenes"][number]["visualType"]) {
  if (visualType === "cover") {
    return "title reveal";
  }

  if (visualType === "problem") {
    return "contrast emphasis";
  }

  if (visualType === "solution") {
    return "solution build";
  }

  if (visualType === "workflow") {
    return "step stack";
  }

  if (visualType === "ending") {
    return "cta punch";
  }

  return "proof highlight";
}

function buildAssetSlot(scene: ScenePlan["scenes"][number], proposalScene?: CompositionProposalScene) {
  if (proposalScene?.assetSlot.kind === "fallback-card") {
    return `<div class="scene-asset-placeholder">${escapeHtml(proposalScene.assetSlot.label)}</div>`;
  }

  const assetRef = proposalScene?.assetSlot.assetRef ?? scene.assets[0];

  if (!assetRef) {
    return '<div class="scene-asset-placeholder">Directed visual asset pending</div>';
  }

  const escapedRef = escapeHtml(assetRef);
  return [
    '<figure class="scene-asset-slot">',
    `  <img src="assets/generated/${escapedRef}.png" alt="${escapedRef}" />`,
    `  <figcaption>${escapedRef}</figcaption>`,
    "</figure>",
  ].join("");
}

function buildSceneHtml(scene: ScenePlan["scenes"][number], proposalScene?: CompositionProposalScene) {
  const title = escapeHtml(getSceneTitle(scene, proposalScene));
  const body = escapeHtml(getSceneBody(scene, proposalScene));
  const narration = escapeHtml(proposalScene?.caption ?? scene.narration);
  const motionIntent = escapeHtml(proposalScene?.motion.entry ?? getMotionIntent(scene.visualType));
  const treatment = escapeHtml(proposalScene?.treatment ?? scene.visualType);
  const layout = escapeHtml(proposalScene?.layout ?? "scene-plan fallback layout");
  const proposalId = escapeHtml(proposalScene?.proposalId ?? `fallback-${scene.sceneId}`);
  const role = escapeHtml(proposalScene?.role ?? scene.visualType);
  const visualHierarchy = escapeHtml(proposalScene?.visualHierarchy.join(" > ") ?? "title > body > asset");
  const assetSlot = buildAssetSlot(scene, proposalScene);

  return [
    `<section class="scene scene-${scene.visualType}" data-scene-id="${scene.sceneId}" data-proposal-id="${proposalId}" data-role="${role}" data-treatment="${treatment}" data-motion-intent="${motionIntent}">`,
    '  <div class="scene-backdrop"></div>',
    '  <div class="scene-content">',
    `    <p class="scene-kicker">${escapeHtml(scene.purpose)}</p>`,
    `    <h1>${title}</h1>`,
    body ? `    <p class="scene-body">${body}</p>` : "",
    `    <p class="scene-caption">${narration}</p>`,
    `    <p class="scene-treatment">${layout}</p>`,
    `    <p class="scene-hierarchy">${visualHierarchy}</p>`,
    "  </div>",
    `  ${assetSlot}`,
    "</section>",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

export function compileCompositionSpec(
  input: ScenePlan & {
    format: VideoFormat;
    themePalette?: string;
    compositionProposal?: CompositionProposal;
  },
): CompositionSpec {
  const dimensions = getCompositionDimensions(input.format);
  const proposalBySceneId = new Map(
    input.compositionProposal?.scenes.map((scene) => [scene.sceneId, scene]) ?? [],
  );

  return {
    ...dimensions,
    fps: 30,
    durationSec: input.totalDurationSec,
    scenes: input.scenes.map((scene): CompositionScene => ({
      sceneId: scene.sceneId,
      htmlTemplate: buildSceneHtml(scene, proposalBySceneId.get(scene.sceneId)),
      cssClassNames: [
        scene.visualType,
        proposalBySceneId.get(scene.sceneId)?.treatment ?? scene.visualType,
      ],
      assetRefs: scene.assets,
    })),
    theme: {
      palette: input.themePalette ?? "default",
    },
  };
}
