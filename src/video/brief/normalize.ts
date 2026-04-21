import type { VideoBriefInput } from "../types.js";
import { compileMarkdownVideoBrief } from "../../compiler/index.js";

export function normalizeVideoBriefInput(input: VideoBriefInput) {
  switch (input.inputType) {
    case "markdown":
      return compileMarkdownVideoBrief({
        markdown: input.markdown,
        defaults: input.defaults,
      }).brief;
    default:
      throw new Error(`Unsupported video brief input type: ${(input as { inputType: string }).inputType}`);
  }
}
