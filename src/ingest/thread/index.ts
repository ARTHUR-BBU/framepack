import type { SourceBundle, ThreadPost } from "../../core/types.js";

function normalizeThreadText(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

function stripLeadingMarker(value: string) {
  return value.replace(/^\s*(?:[-*]\s+|\d+[.)]\s+)/, "").trim();
}

function parseThreadPosts(text: string): ThreadPost[] {
  const normalized = normalizeThreadText(text);

  if (normalized.length === 0) {
    throw new Error("Thread input is empty.");
  }

  const posts = normalized
    .split(/\n\s*\n+/)
    .map((block) => stripLeadingMarker(block).trim())
    .filter((block) => block.length > 0)
    .map((text, index) => ({
      index: index + 1,
      text,
    }));

  if (posts.length === 0) {
    throw new Error("Thread input did not produce any posts.");
  }

  return posts;
}

function summarizeThread(posts: ThreadPost[]) {
  return posts[0]?.text.slice(0, 140) ?? "Imported Thread";
}

export function compileThreadSourceBundle(input: { text: string }): SourceBundle {
  const collectedAt = new Date().toISOString();
  const posts = parseThreadPosts(input.text);

  return {
    sourceType: "thread",
    rawInputs: {
      text: input.text,
      title: summarizeThread(posts),
    },
    collectedArtifacts: posts.map((post) => ({
      kind: "structured",
      title: `Post ${post.index}`,
      body: post.text,
      index: String(post.index),
    })),
    ingestMetadata: {
      collectedAt,
    },
  };
}
