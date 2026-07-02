import { runValidateReleaseCommits } from "../../../packages/atelier-core/scripts/validate-release-commits.mjs";

const result = runValidateReleaseCommits({
  tagPrefix: "excel-v",
  allowedLegacyCommits: ["f55a031", "b9a0585"],
});

if (!result.ok) {
  process.exitCode = 1;
}
