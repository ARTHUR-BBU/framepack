import type {
  SourceManifest,
  ValidationReport,
  VideoBriefDefaults,
  WebsiteSection,
} from "../core/types.js";
import { compileMarkdownSourceBundle } from "../ingest/markdown/index.js";
import {
  compileWebsiteSourceBundle,
  fetchWebsiteSourceBundle,
} from "../ingest/website/index.js";
import { compileVideoBrief } from "../planning/brief/index.js";
import {
  buildCaseExplainerVideoProject,
  buildCaseExplainerVideoProjectFromCompiledBrief,
} from "../video/index.js";

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

export function ensureProjectValidationPassed(validationReport: ValidationReport) {
  if (validationReport.issues.length > 0) {
    throw new Error(`Validation failed: ${validationReport.issues.join(", ")}`);
  }
}
