import type { VideoBriefDefaults } from "../core/types.js";
import { compileMarkdownSourceBundle } from "../ingest/markdown/index.js";
import { compileVideoBrief } from "../planning/brief/index.js";

export function compileMarkdownVideoBrief(input: {
  markdown: string;
  defaults: VideoBriefDefaults;
}) {
  const sourceBundle = compileMarkdownSourceBundle({
    markdown: input.markdown,
  });
  const brief = compileVideoBrief({
    sourceBundle,
    defaults: input.defaults,
  });

  return {
    sourceBundle,
    brief,
  };
}
