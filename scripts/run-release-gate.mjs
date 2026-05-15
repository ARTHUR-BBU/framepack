import { execFileSync } from "node:child_process";

const checks = [
  {
    id: "typecheck",
    command: "npm run typecheck",
    args: ["run", "typecheck"],
  },
  {
    id: "test",
    command: "npm test",
    args: ["test"],
  },
  {
    id: "pack-dry-run",
    command: "npm pack --dry-run --json",
    args: ["pack", "--dry-run", "--json"],
  },
  {
    id: "install-smoke",
    command: "npm run release:smoke:install",
    args: ["run", "release:smoke:install"],
  },
];

function runNpmCheck(check) {
  const startedAt = Date.now();

  try {
    const stdout = execFileSync("npm", check.args, {
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return {
      id: check.id,
      command: check.command,
      status: "passed",
      durationMs: Date.now() - startedAt,
      stdoutTail: stdout.trim().split(/\r?\n/).slice(-20),
    };
  } catch (error) {
    return {
      id: check.id,
      command: check.command,
      status: "failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      stdoutTail: typeof error.stdout === "string" ? error.stdout.trim().split(/\r?\n/).slice(-20) : [],
      stderrTail: typeof error.stderr === "string" ? error.stderr.trim().split(/\r?\n/).slice(-20) : [],
    };
  }
}

const results = [];

for (const check of checks) {
  const result = runNpmCheck(check);
  results.push(result);

  if (result.status === "failed") {
    break;
  }
}

const report = {
  name: "Framepack Release gate",
  status: results.every((result) => result.status === "passed") ? "passed" : "failed",
  checks: results,
};

const output = JSON.stringify(report, null, 2);

if (report.status === "passed") {
  console.log(output);
} else {
  console.error(output);
  process.exitCode = 1;
}
