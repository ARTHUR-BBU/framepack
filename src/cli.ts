import { fileURLToPath } from "node:url";
import { runCli } from "./interfaces/cli/index.js";

export { parseCliArgs, runCli } from "./interfaces/cli/index.js";

const isDirectExecution =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  runCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
