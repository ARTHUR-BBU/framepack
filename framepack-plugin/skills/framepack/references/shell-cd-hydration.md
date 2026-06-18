# Shell `cd` prefixes before HyperFrames commands

## Durable lesson

Framepack pre-tool hooks run before the user's shell command executes. If an agent runs:

```bash
cd F:/Framepack-01-test && npx hyperframes lint
```

the hook cannot rely only on the terminal tool's `workdir`; at hook time the shell has not executed `cd` yet. Hydration/audit steps that use only `args["workdir"]` can write `AGENTS.md`, `.framepack/arsenal.json`, or timeline ledgers into the caller cwd instead of the intended project.

## Required pattern

Before Guardrail Hydrator, Arsenal sync, Timeline sync, or Quality Audit:

1. Strip heredoc bodies for command detection.
2. Detect real HyperFrames commands, not path substrings.
3. Resolve the effective project directory:
   - if a `cd <project> &&` or `cd <project>;` prefix appears before `hyperframes`, resolve that path against the base workdir;
   - otherwise use the terminal tool workdir / cwd.
4. Run all project-scoped side effects against that effective project directory.

## Regression test shape

Create a temporary base dir and nested `case-project`, invoke the pre-tool hook with:

```python
args={"command": "cd case-project && npx hyperframes lint", "workdir": str(base)}
```

Assert:

```python
assert (project / "AGENTS.md").exists()
assert not (base / "AGENTS.md").exists()
```

This catches the exact failure mode where test-team projects appear to be missing `AGENTS.md` even though the hook ran.

## User-facing wording

If the user says `agent.md` is missing, clarify that the project-level file is `AGENTS.md`. It is the Guardrail Hydrator's managed project rule file, not a creative deliverable like `frame.md` or `.hyperframes/expanded-prompt.md`.
