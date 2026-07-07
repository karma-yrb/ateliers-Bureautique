import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runValidateReleaseCommits } from "../packages/atelier-core/scripts/validate-release-commits.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const TAG_PREFIX = "bureautique-v";
const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  return execFileSync(command, args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function hasTag(prefix) {
  try {
    return Boolean(run("git", ["describe", "--tags", "--abbrev=0", "--match", `${prefix}*`]));
  } catch {
    return false;
  }
}

function readVersion() {
  const pkg = JSON.parse(readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"));
  return String(pkg.version);
}

function main() {
  const validation = runValidateReleaseCommits({
    cwd: ROOT_DIR,
    tagPrefix: TAG_PREFIX,
    logger: console,
  });
  if (!validation.ok) {
    process.exitCode = 1;
    return;
  }

  const releaseArgs = hasTag(TAG_PREFIX)
    ? ["run", "release", "--", "--skip.tag", "--skip.commit"]
    : ["run", "release:first", "--", "--skip.tag", "--skip.commit"];

  execFileSync(NPM_COMMAND, releaseArgs, {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  execFileSync("node", ["scripts/update-global-release-artifacts.mjs"], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  execFileSync("git", ["add", "package.json", "package-lock.json", "CHANGELOG.md", "pages/releases"], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });

  const version = readVersion();
  execFileSync("git", ["commit", "-m", `chore(release): ${version}`], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });
  execFileSync("git", ["tag", `${TAG_PREFIX}${version}`], {
    cwd: ROOT_DIR,
    stdio: "inherit",
  });
}

main();
