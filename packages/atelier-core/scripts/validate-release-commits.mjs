import { execFileSync } from "node:child_process";

export const ALLOWED_TYPES = new Set([
  "feat",
  "fix",
  "perf",
  "refactor",
  "docs",
  "test",
  "chore",
  "build",
  "ci",
  "style",
  "revert",
  "core",
  "word",
  "excel",
]);

export const CONVENTIONAL_RE = /^(?<type>[a-z]+)(\([^)]+\))?(?<breaking>!)?: (?<description>.+)$/;

function git(cwd, args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getLastTag(cwd, tagPrefix) {
  try {
    return git(cwd, ["describe", "--tags", "--abbrev=0", "--match", `${tagPrefix}*`]);
  } catch {
    return "";
  }
}

function getCommits(cwd, range) {
  const args = ["log"];
  if (range) args.push(range);
  args.push("--pretty=format:%h%x1f%s%x1e");

  const raw = git(cwd, args);
  if (!raw) return [];

  return raw
    .split("\x1e")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash = "", subject = ""] = line.split("\x1f");
      return { hash: hash.trim(), subject: subject.trim() };
    });
}

function isSkippableCommit(subject) {
  return subject.startsWith("Merge ") || subject.startsWith('Revert "');
}

export function validateCommitSubject(subject) {
  if (isSkippableCommit(subject)) {
    return { ok: true, skipped: true };
  }

  const match = subject.match(CONVENTIONAL_RE);
  if (!match) {
    return { ok: false, reason: "format invalide" };
  }

  const type = match.groups?.type || "";
  if (!ALLOWED_TYPES.has(type)) {
    return { ok: false, reason: `type '${type}' non autorise` };
  }

  return { ok: true, skipped: false };
}

export function runValidateReleaseCommits({
  cwd = process.cwd(),
  tagPrefix,
  allowedLegacyCommits = [],
  logger = console,
}) {
  if (!tagPrefix) throw new Error("tagPrefix est requis");

  const allowedLegacySet = new Set(allowedLegacyCommits);
  const lastTag = getLastTag(cwd, tagPrefix);
  if (!lastTag) {
    logger.error("[release-check] Aucun tag trouve, validation des commits ignoree pour cette release.");
    return { ok: true, skipped: true };
  }

  const commits = getCommits(cwd, `${lastTag}..HEAD`);
  if (!commits.length) {
    logger.error(`[release-check] Aucun commit depuis ${lastTag}.`);
    return { ok: true, skipped: true };
  }

  const invalid = [];

  for (const commit of commits) {
    if (allowedLegacySet.has(commit.hash)) continue;
    if (isSkippableCommit(commit.subject)) continue;

    const validation = validateCommitSubject(commit.subject);
    if (!validation.ok) {
      invalid.push({
        ...commit,
        reason: validation.reason,
      });
    }
  }

  if (!invalid.length) {
    logger.error(`[release-check] ${commits.length} commit(s) valides depuis ${lastTag}.`);
    return { ok: true, skipped: false, commits: commits.length };
  }

  logger.error("[release-check] Commit(s) non conformes detectes :");
  for (const item of invalid) {
    logger.error(` - ${item.hash} ${item.subject} (${item.reason})`);
  }
  logger.error("[release-check] Utiliser le format Conventional Commits: type(scope): description");

  return { ok: false, skipped: false, invalid };
}
