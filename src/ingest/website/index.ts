import type { SourceBundle } from "../../core/types.js";

export function compileWebsiteSourceBundle(input: {
  url: string;
  title?: string;
  summary?: string;
  sections?: Array<{
    title: string;
    body: string;
  }>;
}): SourceBundle {
  const collectedAt = new Date().toISOString();
  const sections = input.sections ?? [];

  return {
    sourceType: "website",
    rawInputs: {
      url: input.url,
      title: input.title ?? "",
      summary: input.summary ?? "",
    },
    collectedArtifacts: sections.map((section) => ({
      kind: "structured",
      title: section.title,
      body: section.body,
      url: input.url,
      pageTitle: input.title ?? "",
      pageSummary: input.summary ?? "",
    })),
    ingestMetadata: {
      collectedAt,
    },
  };
}
