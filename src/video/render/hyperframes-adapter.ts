import type { CompositionScene, CompositionSpec } from "../types.js";

export function emitHyperframesComposition(spec: CompositionSpec) {
  const compositionId = "case-explainer";
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="UTF-8" />',
    `  <meta name="viewport" content="width=${spec.width}, height=${spec.height}" />`,
    '  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>',
    "  <style>",
    "    * { margin: 0; padding: 0; box-sizing: border-box; }",
    `    html, body { width: ${spec.width}px; height: ${spec.height}px; overflow: hidden; background: #000; }`,
    "    .scene { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; }",
    "  </style>",
    "</head>",
    "<body>",
    `  <div id="stage" data-composition-id="${compositionId}" data-start="0" data-duration="${spec.durationSec}" data-width="${spec.width}" data-height="${spec.height}" data-palette="${spec.theme.palette}">`,
    ...spec.scenes.map((scene: CompositionScene) => `    ${scene.htmlTemplate}`),
    "  </div>",
    "  <script>",
    "    window.__timelines = window.__timelines || {};",
    "    const tl = gsap.timeline({ paused: true });",
    `    window.__timelines["${compositionId}"] = tl;`,
    "  </script>",
    "</body>",
    "</html>",
  ].join("\n");

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
