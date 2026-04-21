import { parseMarkdownSourceMaterials } from "../../video/brief/markdown.js";
import type { SourceBundle } from "../../core/types.js";

export function compileMarkdownSourceBundle(input: { markdown: string }): SourceBundle {
  const collectedAt = new Date().toISOString();
  const sections = parseMarkdownSourceMaterials(input.markdown);

  return {
    sourceType: "markdown",
    rawInputs: {
      markdown: input.markdown,
    },
    collectedArtifacts: sections.map((section) => ({
      kind: section.kind,
      title: section.title,
      body: section.body,
    })),
    ingestMetadata: {
      collectedAt,
    },
  };
}
