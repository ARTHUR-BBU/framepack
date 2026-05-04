import type { OutputType, VideoBriefDefaults } from "../core/types.js";
import {
  compileGameAdProject,
  compileMarkdownCaseExplainerProject,
  compileThreadCaseExplainerProject,
  compileWebsiteCaseExplainerProject,
} from "./index.js";

export type CompilerSourceInput =
  | {
      sourceType: "markdown";
      markdown: string;
    }
  | {
      sourceType: "thread";
      text: string;
    }
  | {
      sourceType: "website";
      url: string;
      fetchImpl?: typeof fetch;
    }
  | {
      sourceType: "game-ad";
      description: string;
    };

export interface CompilerPipelineSummary {
  sourceType: CompilerSourceInput["sourceType"];
  outputType: OutputType;
}

type CaseExplainerDefaults = VideoBriefDefaults & { outputType: "case-explainer" };
type GameAdDefaults = VideoBriefDefaults & { outputType: "game-ad" };

type CompilerPipeline = CompilerPipelineSummary & {
  compile: (input: {
    source: CompilerSourceInput;
    defaults: VideoBriefDefaults;
    projectName: string;
  }) => Promise<ReturnType<typeof compileMarkdownCaseExplainerProject>>;
};

function assertOutputType<T extends OutputType>(
  actual: OutputType,
  expected: T,
  sourceType: CompilerSourceInput["sourceType"],
): asserts actual is T {
  if (actual !== expected) {
    throw new Error(`Pipeline for ${sourceType} requires outputType ${expected}.`);
  }
}

const PIPELINES: CompilerPipeline[] = [
  {
    sourceType: "markdown",
    outputType: "case-explainer",
    compile: async ({ source, defaults, projectName }) => {
      if (source.sourceType !== "markdown") {
        throw new Error("Markdown pipeline received a non-markdown source.");
      }

      assertOutputType(defaults.outputType, "case-explainer", source.sourceType);

      return compileMarkdownCaseExplainerProject({
        markdown: source.markdown,
        defaults: defaults as CaseExplainerDefaults,
        projectName,
      });
    },
  },
  {
    sourceType: "thread",
    outputType: "case-explainer",
    compile: async ({ source, defaults, projectName }) => {
      if (source.sourceType !== "thread") {
        throw new Error("Thread pipeline received a non-thread source.");
      }

      assertOutputType(defaults.outputType, "case-explainer", source.sourceType);

      return compileThreadCaseExplainerProject({
        text: source.text,
        defaults: defaults as CaseExplainerDefaults,
        projectName,
      });
    },
  },
  {
    sourceType: "website",
    outputType: "case-explainer",
    compile: async ({ source, defaults, projectName }) => {
      if (source.sourceType !== "website") {
        throw new Error("Website pipeline received a non-website source.");
      }

      assertOutputType(defaults.outputType, "case-explainer", source.sourceType);

      return compileWebsiteCaseExplainerProject({
        url: source.url,
        defaults: defaults as CaseExplainerDefaults,
        projectName,
        fetchImpl: source.fetchImpl,
      });
    },
  },
  {
    sourceType: "game-ad",
    outputType: "game-ad",
    compile: async ({ source, defaults, projectName }) => {
      if (source.sourceType !== "game-ad") {
        throw new Error("Game-ad pipeline received a non-game-ad source.");
      }

      assertOutputType(defaults.outputType, "game-ad", source.sourceType);

      return compileGameAdProject({
        description: source.description,
        defaults: defaults as GameAdDefaults,
        projectName,
      });
    },
  },
];

export function listCompilerPipelines(): CompilerPipelineSummary[] {
  return PIPELINES.map((pipeline) => ({
    sourceType: pipeline.sourceType,
    outputType: pipeline.outputType,
  }));
}

export function getCompilerPipeline(
  sourceType: CompilerSourceInput["sourceType"],
): CompilerPipeline {
  const pipeline = PIPELINES.find((candidate) => candidate.sourceType === sourceType);

  if (!pipeline) {
    throw new Error(`Unsupported compiler source type: ${sourceType}`);
  }

  return pipeline;
}

export async function compileVideoProjectFromSource(input: {
  source: CompilerSourceInput;
  defaults: VideoBriefDefaults;
  projectName: string;
}) {
  return getCompilerPipeline(input.source.sourceType).compile(input);
}
