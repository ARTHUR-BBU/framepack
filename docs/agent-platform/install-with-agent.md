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
4. Generate a small package.
5. Run status and validation.
