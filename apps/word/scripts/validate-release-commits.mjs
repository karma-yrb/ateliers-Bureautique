import { runValidateReleaseCommits } from "../../../packages/atelier-core/scripts/validate-release-commits.mjs";

const result = runValidateReleaseCommits({
  tagPrefix: "word-v",
  allowedLegacyCommits: ["f55a031"],
});

if (!result.ok) {
  process.exitCode = 1;
}
