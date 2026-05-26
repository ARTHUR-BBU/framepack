# Framepack 0.5 Rebirth Charter

Framepack 0.5 starts from a clean public product idea:

> Framepack is a lightweight HyperFrames creative workbench for agents.

## First Principles

- The user may start with a mature plan, a rough idea, or only a folder of assets.
- Codex and Claude Code are already good at interactive creative discussion.
- Framepack should not lock that discussion into a rigid wizard.
- Framepack should capture the useful decisions and turn them into assets, prompts, composition plans, and iteration memory.
- HyperFrames is the rendering and composition body. Framepack must help agents use it well.

## Product Boundary

Framepack manages:

- asset inventory
- creative brief
- HyperFrames prompt
- composition plan
- iteration log
- package folders

Framepack does not:

- judge user-provided assets by default
- replace HyperFrames
- pretend to be a video model
- expose internal protocol theory as the primary user experience

## Code Principle

Keep the public path small. If a feature can be expressed as a markdown workbench file, do not create a protocol object first. If a command can create useful files directly, do not add a new lifecycle layer.

One line beats two when one line is enough.

## Legacy

The 0.4 Agent Harness remains an internal learning base. Concepts such as MCP, runtime checks, workflow packs, and quality gates can be reused when they directly improve the lightweight workbench. They should not define the public product surface.
