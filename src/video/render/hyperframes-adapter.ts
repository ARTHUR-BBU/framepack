import type { CompositionScene, CompositionSpec } from "../types.js";

export function emitHyperframesComposition(spec: CompositionSpec) {
  const html = [
    `<div id="stage" data-composition-id="case-explainer" data-width="${spec.width}" data-height="${spec.height}">`,
    ...spec.scenes.map((scene: CompositionScene) => scene.htmlTemplate),
    "</div>",
  ].join("");

  return {
    html,
    commands: {
      preview: "npx hyperframes preview",
      lint: "npx hyperframes lint",
      validate: "npx hyperframes validate",
      render: "npx hyperframes render",
    },
  };
}
