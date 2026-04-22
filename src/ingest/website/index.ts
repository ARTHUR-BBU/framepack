import type { SourceBundle, WebsiteSection } from "../../core/types.js";

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeWhitespace(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function extractTagContent(html: string, tagName: string): string {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return normalizeWhitespace(match?.[1] ?? "");
}

function extractMetaDescription(html: string): string {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  return normalizeWhitespace(match?.[1] ?? "");
}

export function extractWebsiteContent(input: { url: string; html: string }): {
  url: string;
  title: string;
  summary: string;
  sections: WebsiteSection[];
} {
  const title = extractTagContent(input.html, "title");
  const summary = extractMetaDescription(input.html);
  const sectionMatches = [
    ...input.html.matchAll(/<(h1|h2)[^>]*>([\s\S]*?)<\/\1>/gi),
  ];

  const sections = sectionMatches.map((match, index, allMatches) => {
    const currentIndex = match.index ?? 0;
    const nextIndex = allMatches[index + 1]?.index ?? input.html.length;
    const slice = input.html.slice(currentIndex, nextIndex);
    const heading = normalizeWhitespace(match[2] ?? "");
    const paragraphMatches = [...slice.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const body = paragraphMatches.map((paragraph) => normalizeWhitespace(paragraph[1] ?? "")).join(" ");

    return {
      title: heading || `Section ${index + 1}`,
      body: body || summary || title || input.url,
    };
  });

  return {
    url: input.url,
    title: title || input.url,
    summary,
    sections,
  };
}

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

export async function fetchWebsiteSourceBundle(input: {
  url: string;
  fetchImpl?: typeof fetch;
}): Promise<SourceBundle> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const response = await fetchImpl(input.url);

  if (!response.ok) {
    throw new Error(`Failed to fetch website: ${input.url} (${response.status})`);
  }

  const html = await response.text();
  const extracted = extractWebsiteContent({
    url: input.url,
    html,
  });

  if (
    (extracted.title.trim().length === 0 || extracted.title === input.url) &&
    extracted.summary.trim().length === 0 &&
    extracted.sections.length === 0
  ) {
    throw new Error(`Extracted website content is empty: ${input.url}`);
  }

  return compileWebsiteSourceBundle(extracted);
}
