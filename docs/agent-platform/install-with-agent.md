# Install Framepack With An Agent

Framepack is designed to be installed by a coding agent.

Recommended prompt:

```text
Read https://github.com/ARTHUR-BBU/framepack and install Framepack into this project. Configure its MCP server and make yourself able to generate, validate, inspect, and continue Framepack video project packages.
```

The agent should:

1. Install Framepack from npm.
2. Run `framepack init-agent --target codex --scope project`.
3. Verify `framepack mcp --describe`.
4. Inspect `framepack packs recommend --json` or the MCP `recommendPacks` tool.
5. Generate a small package.
6. Run status and validation.

## What The Agent Is Installing

Framepack is not only a CLI. The install should make the agent able to use:

- MCP tools for generation, status, validation, asset work, and runtime checks
- project resources such as manifest, handoff, asset execution plan, forge tasks, and status
- workflow prompts for common video tasks
- workflow packs and creative direction packs for route and taste selection
- Codex skill instructions or Claude Code preview instructions

The intended user experience is natural language first. The user describes the video job; the agent chooses the Framepack workflow, generates a package, checks readiness, follows `nextActionItems`, and reports what remains.

For broad requests, the agent can pass `--auto-pack` or MCP `autoRecommendPacks: true` during generation. When the agent chooses a workflow and creative direction explicitly, CLI uses `--workflow-pack` and `--creative-direction-pack`; MCP uses `workflowPackId` and `creativeDirectionPackId`.

## Creative And Template Direction

Agents should treat design and motion quality as part of the workflow, not as an afterthought.

When a task needs creative output, the agent should identify:

- the intended video type
- the audience and tone
- the visual style
- the animation rhythm
- the best available template or workflow pack
- any missing assets or forge tasks

If no template exists, the agent should preserve clear creative notes in the package handoff so a human, designer, or future template pack can improve the result.
