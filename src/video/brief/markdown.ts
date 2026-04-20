import type { SourceMaterial } from "../types.js";

interface MarkdownSection {
  title: string;
  body: string;
}

const FALLBACK_MARKDOWN_TITLE = "Imported Markdown";

function flushSection(sections: MarkdownSection[], title: string | null, bodyLines: string[]) {
  const body = bodyLines.join("\n").trim();

  if (title) {
    if (body) {
      sections.push({
        title,
        body,
      });
    }
    return;
  }

  if (body) {
    sections.push({
      title: FALLBACK_MARKDOWN_TITLE,
      body,
    });
  }
}

export function parseMarkdownSourceMaterials(markdown: string): SourceMaterial[] {
  const sections: MarkdownSection[] = [];
  let currentTitle: string | null = null;
  let currentBodyLines: string[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    const headingMatch = line.match(/^#{1,6}\s+(.*\S)\s*$/);

    if (headingMatch) {
      flushSection(sections, currentTitle, currentBodyLines);
      currentTitle = headingMatch[1].trim();
      currentBodyLines = [];
      continue;
    }

    currentBodyLines.push(line);
  }

  flushSection(sections, currentTitle, currentBodyLines);

  if (sections.length === 0) {
    return [
      {
        kind: "markdown",
        title: FALLBACK_MARKDOWN_TITLE,
        body: markdown.trim(),
      },
    ];
  }

  return sections.map((section) => ({
    kind: "markdown",
    title: section.title,
    body: section.body,
  }));
}
