import type {
  SourceManifest,
  ThreadPost,
  ValidationReport,
  VideoBriefDefaults,
  WebsiteSection,
} from "../core/types.js";
import { compileMarkdownSourceBundle } from "../ingest/markdown/index.js";
import { compileThreadSourceBundle } from "../ingest/thread/index.js";
import {
  compileWebsiteSourceBundle,
  fetchWebsiteSourceBundle,
} from "../ingest/website/index.js";
import { compileVideoBrief } from "../planning/brief/index.js";
import {
  buildCaseExplainerVideoProject,
  buildCaseExplainerVideoProjectFromCompiledBrief,
} from "../video/index.js";
export { compileGameAdProject } from "./game-ad.js";

function createWebsiteSourceManifest(input: {
  url: string;
  title?: string;
  summary?: string;
  sections?: WebsiteSection[];
  collectedAt: string;
}): SourceManifest {
  return {
    sourceType: "website",
    url: input.url,
    title: input.title ?? input.url,
    summary: input.summary ?? "",
    sections: input.sections ?? [],
    collectedAt: input.collectedAt,
  };
}

function createThreadSourceManifest(input: {
  title: string;
  summary: string;
  posts: ThreadPost[];
  collectedAt: string;
}): SourceManifest {
  return {
    sourceType: "thread",
    title: input.title,
    summary: input.summary,
    posts: input.posts,
    collectedAt: input.collectedAt,
  };
}

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

export function compileWebsiteVideoBrief(input: {
  url: string;
  title?: string;
  summary?: string;
  sections?: Array<{
    title: string;
    body: string;
  }>;
  defaults: VideoBriefDefaults;
}) {
  const sourceBundle = compileWebsiteSourceBundle({
    url: input.url,
    title: input.title,
    summary: input.summary,
    sections: input.sections,
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

export function compileThreadVideoBrief(input: {
  text: string;
  defaults: VideoBriefDefaults;
}) {
  const sourceBundle = compileThreadSourceBundle({
    text: input.text,
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

export async function compileWebsiteCaseExplainerProject(input: {
  url: string;
  defaults: {
    goal: string;
    audience: string;
    format: "16:9" | "9:16";
    outputType: "case-explainer";
    style?: {
      tone?: string;
      pacing?: "slow" | "medium" | "fast";
      brandName?: string;
    };
    constraints?: {
      maxDurationSec?: number;
      requiredPoints?: string[];
      bannedTerms?: string[];
    };
    theme?: {
      palette: string;
    };
  };
  projectName: string;
  fetchImpl?: typeof fetch;
}) {
  const sourceBundle = await fetchWebsiteSourceBundle({
    url: input.url,
    fetchImpl: input.fetchImpl,
  });
  const sections = sourceBundle.collectedArtifacts.map((artifact) => ({
    title: artifact.title ?? "",
    body: artifact.body ?? "",
  }));
  const brief = compileVideoBrief({
    sourceBundle,
    defaults: input.defaults,
  });
  const sourceManifest = createWebsiteSourceManifest({
    url: sourceBundle.rawInputs.url,
    title: sourceBundle.rawInputs.title,
    summary: sourceBundle.rawInputs.summary,
    sections,
    collectedAt: sourceBundle.ingestMetadata.collectedAt,
  });

  return buildCaseExplainerVideoProjectFromCompiledBrief({
    brief,
    defaults: input.defaults,
    projectName: input.projectName,
    sourceManifest,
  });
}

export function compileMarkdownCaseExplainerProject(input: {
  markdown: string;
  defaults: {
    goal: string;
    audience: string;
    format: "16:9" | "9:16";
    outputType: "case-explainer";
    style?: {
      tone?: string;
      pacing?: "slow" | "medium" | "fast";
      brandName?: string;
    };
    constraints?: {
      maxDurationSec?: number;
      requiredPoints?: string[];
      bannedTerms?: string[];
    };
    theme?: {
      palette: string;
    };
  };
  projectName: string;
}) {
  return buildCaseExplainerVideoProject({
    inputType: "markdown",
    markdown: input.markdown,
    defaults: input.defaults,
    projectName: input.projectName,
  });
}

export function compileThreadCaseExplainerProject(input: {
  text: string;
  defaults: {
    goal: string;
    audience: string;
    format: "16:9" | "9:16";
    outputType: "case-explainer";
    style?: {
      tone?: string;
      pacing?: "slow" | "medium" | "fast";
      brandName?: string;
    };
    constraints?: {
      maxDurationSec?: number;
      requiredPoints?: string[];
      bannedTerms?: string[];
    };
    theme?: {
      palette: string;
    };
  };
  projectName: string;
}) {
  const sourceBundle = compileThreadSourceBundle({
    text: input.text,
  });
  const brief = compileVideoBrief({
    sourceBundle,
    defaults: input.defaults,
  });
  const posts = sourceBundle.collectedArtifacts.map((artifact) => ({
    index: Number(artifact.index ?? "0"),
    text: artifact.body ?? "",
  }));
  const sourceManifest = createThreadSourceManifest({
    title: sourceBundle.rawInputs.title || "Imported Thread",
    summary: posts[0]?.text.slice(0, 140) ?? "",
    posts,
    collectedAt: sourceBundle.ingestMetadata.collectedAt,
  });

  return buildCaseExplainerVideoProjectFromCompiledBrief({
    brief,
    defaults: input.defaults,
    projectName: input.projectName,
    sourceManifest,
  });
}

export function ensureProjectValidationPassed(validationReport: ValidationReport) {
  if (validationReport.issues.length > 0) {
    throw new Error(`Validation failed: ${validationReport.issues.join(", ")}`);
  }
}
