import path from "node:path";
import { fileURLToPath } from "node:url";
import { runValidateEncoding } from "../../../packages/atelier-core/scripts/validate-encoding.mjs";
import { DATA_FILES, validateDataFiles, getProjectRoot } from "./encoding-guard.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

const result = await runValidateEncoding({
  root: getProjectRoot(),
  dataFiles: DATA_FILES,
  validateDataFiles,
  textRoots: [
    getProjectRoot(),
    path.resolve(SCRIPT_DIR, "../../../packages/atelier-core"),
  ],
});

if (!result.ok) {
  process.exitCode = 1;
}
