import path from "node:path";
import { fileURLToPath } from "node:url";
import { runUpdateReleaseArtifacts } from "../packages/atelier-core/scripts/update-release-artifacts.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

runUpdateReleaseArtifacts({
  rootDir: ROOT_DIR,
  tagPrefix: "bureautique-v",
  releaseJsonPaths: [path.join(ROOT_DIR, "pages", "releases", "releases.json")],
  releaseJsPaths: [path.join(ROOT_DIR, "pages", "releases", "releases.js")],
});
