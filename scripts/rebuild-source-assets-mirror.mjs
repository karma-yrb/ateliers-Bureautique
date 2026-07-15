import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INVENTORY_PATH = path.join(ROOT, "docs", "source-assets-inventory.json");
const DOWNLOAD_ROOT = path.join(ROOT, "downloads-assets-source-all");
const BACKUP_ROOT = path.join(ROOT, "backups");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function normalizeRelativeTarget(assetRelativePath) {
  return String(assetRelativePath || "")
    .replace(/\\/g, "/")
    .replace(/^assets\//, "")
    .replace(/^\/+/, "");
}

function replaceFileNameInAssetPath(assetRelativePath, nextFileName) {
  const normalized = String(assetRelativePath || "").replace(/\\/g, "/");
  const segments = normalized.split("/");
  segments[segments.length - 1] = nextFileName;
  return segments.join("/");
}

function timestampLabel() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function resolveLocalSourcePath(item) {
  const raw = String(item.sourceUrl || "").trim().replace(/^\.\/+/, "");
  return path.resolve(ROOT, "apps", item.app, raw);
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function inferExtensionFromBuffer(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return ".png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }

  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString("ascii");
    if (header === "GIF87a" || header === "GIF89a") return ".gif";
  }

  if (
    buffer.length >= 12
    && buffer.subarray(0, 4).toString("ascii") === "RIFF"
    && buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return ".webp";
  }

  if (buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return ".pdf";
  }

  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
    const sample = buffer.subarray(0, Math.min(buffer.length, 262144)).toString("latin1");
    if (sample.includes("word/")) return ".docx";
    if (sample.includes("xl/")) return ".xlsx";
    if (sample.includes("ppt/")) return ".pptx";
    return ".zip";
  }

  return ".bin";
}

function inferExtensionFromFile(filePath) {
  return inferExtensionFromBuffer(fs.readFileSync(filePath));
}

function inferExtensionFromContentType(contentType, fallbackPath) {
  const type = String(contentType || "").toLowerCase();
  if (type.includes("wordprocessingml.document")) return ".docx";
  if (type.includes("spreadsheetml.sheet")) return ".xlsx";
  if (type.includes("presentationml.presentation")) return ".pptx";
  if (type.includes("application/zip")) return ".zip";
  if (type.includes("image/jpeg")) return ".jpg";
  if (type.includes("image/png")) return ".png";
  if (type.includes("image/webp")) return ".webp";
  if (type.includes("image/gif")) return ".gif";
  if (type.includes("application/pdf")) return ".pdf";
  return path.extname(fallbackPath || "") || ".bin";
}

function findSiblingWithSameStem(filePath) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) return "";

  const expectedStem = path.parse(filePath).name;
  const matches = fs.readdirSync(dirPath)
    .filter((entryName) => path.parse(entryName).name === expectedStem);

  if (matches.length !== 1) return "";
  return path.join(dirPath, matches[0]);
}

function findBackupCandidate(item, backupRoot) {
  const candidates = [];
  const relativeCanonicalPath = normalizeRelativeTarget(item.assetRelativePath);
  const relativeLegacyPath = normalizeRelativeTarget(item.legacyAssetRelativePath);

  if (relativeCanonicalPath) {
    candidates.push(path.join(backupRoot, relativeCanonicalPath));
  }
  if (relativeLegacyPath) {
    candidates.push(path.join(backupRoot, relativeLegacyPath));
  }

  for (const candidatePath of candidates) {
    if (fs.existsSync(candidatePath)) return candidatePath;
    const sibling = findSiblingWithSameStem(candidatePath);
    if (sibling && fs.existsSync(sibling)) return sibling;
  }

  return "";
}

function buildUpdatedTarget(item, extension) {
  const nextExtension = extension && extension !== ".bin"
    ? extension
    : path.extname(String(item.assetRelativePath || "")) || ".bin";

  const nextSuggestedFileName = `${path.parse(String(item.suggestedFileName || "")).name}${nextExtension}`;
  return {
    suggestedFileName: nextSuggestedFileName,
    assetRelativePath: replaceFileNameInAssetPath(String(item.assetRelativePath || ""), nextSuggestedFileName),
    legacyAssetRelativePath: item.legacyAssetRelativePath
      ? replaceFileNameInAssetPath(String(item.legacyAssetRelativePath), nextSuggestedFileName)
      : "",
  };
}

async function downloadRemoteFile(sourceUrl, rawTargetPath) {
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 Codex source-assets rebuild",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const extension = inferExtensionFromContentType(response.headers.get("content-type"), rawTargetPath);
  const finalPath = path.extname(rawTargetPath)
    ? rawTargetPath.replace(/\.[^.]+$/, extension || path.extname(rawTargetPath))
    : `${rawTargetPath}${extension}`;
  ensureDir(finalPath);
  fs.writeFileSync(finalPath, Buffer.from(arrayBuffer));
  return finalPath;
}

function copyLocalFile(sourcePath, rawTargetPath) {
  const detectedExtension = inferExtensionFromFile(sourcePath);
  const extension = detectedExtension !== ".bin"
    ? detectedExtension
    : path.extname(sourcePath) || path.extname(rawTargetPath) || ".bin";
  const finalPath = path.extname(rawTargetPath)
    ? rawTargetPath.replace(/\.[^.]+$/, extension)
    : `${rawTargetPath}${extension}`;
  ensureDir(finalPath);
  fs.copyFileSync(sourcePath, finalPath);
  return finalPath;
}

function assertNoDuplicateTargets(items) {
  const seen = new Map();
  const duplicates = [];
  for (const item of items) {
    const relativeTarget = normalizeRelativeTarget(item.assetRelativePath);
    if (!relativeTarget) continue;
    const previous = seen.get(relativeTarget);
    if (previous) {
      duplicates.push([relativeTarget, previous.exerciseId, item.exerciseId]);
      continue;
    }
    seen.set(relativeTarget, item);
  }

  if (!duplicates.length) return;

  const lines = duplicates
    .slice(0, 20)
    .map(([target, leftId, rightId]) => `${target} <- ${leftId}, ${rightId}`);
  throw new Error(`Cibles dupliquees dans l'inventaire (${duplicates.length}). Exemples:\n${lines.join("\n")}`);
}

if (!fs.existsSync(INVENTORY_PATH)) {
  throw new Error(`Inventaire introuvable : ${INVENTORY_PATH}`);
}

const inventory = readJson(INVENTORY_PATH);
const items = Array.isArray(inventory.items) ? inventory.items : [];
assertNoDuplicateTargets(items);

const backupPath = path.join(BACKUP_ROOT, `downloads-assets-source-all-${timestampLabel()}`);
fs.mkdirSync(BACKUP_ROOT, { recursive: true });

if (fs.existsSync(DOWNLOAD_ROOT)) {
  fs.renameSync(DOWNLOAD_ROOT, backupPath);
}
fs.mkdirSync(DOWNLOAD_ROOT, { recursive: true });

let restoredFromBackup = 0;
let copiedFromLocalSource = 0;
let fetchedRemotely = 0;
let unresolved = 0;
let updatedEntries = 0;
const failures = [];

for (const item of items) {
  const relativeTarget = normalizeRelativeTarget(item.assetRelativePath);
  if (!relativeTarget || !String(item.sourceUrl || "").trim()) {
    unresolved += 1;
    failures.push(`${item.app}/${item.exerciseId}/${item.slot}: source absente`);
    continue;
  }

  try {
    const backupCandidate = fs.existsSync(backupPath)
      ? findBackupCandidate(item, backupPath)
      : "";
    let finalPath = "";

    if (backupCandidate) {
      finalPath = copyLocalFile(backupCandidate, path.join(DOWNLOAD_ROOT, relativeTarget));
      restoredFromBackup += 1;
    } else if (isRemoteUrl(item.sourceUrl)) {
      finalPath = await downloadRemoteFile(item.sourceUrl, path.join(DOWNLOAD_ROOT, relativeTarget));
      fetchedRemotely += 1;
    } else {
      const localSourcePath = resolveLocalSourcePath(item);
      if (!fs.existsSync(localSourcePath)) {
        throw new Error(`source locale introuvable: ${path.relative(ROOT, localSourcePath)}`);
      }
      finalPath = copyLocalFile(localSourcePath, path.join(DOWNLOAD_ROOT, relativeTarget));
      copiedFromLocalSource += 1;
    }

    const actualExtension = path.extname(finalPath).toLowerCase() || ".bin";
    const nextTarget = buildUpdatedTarget(item, actualExtension);
    if (
      nextTarget.suggestedFileName !== item.suggestedFileName
      || nextTarget.assetRelativePath !== item.assetRelativePath
      || nextTarget.legacyAssetRelativePath !== (item.legacyAssetRelativePath || "")
    ) {
      item.suggestedFileName = nextTarget.suggestedFileName;
      item.assetRelativePath = nextTarget.assetRelativePath;
      item.legacyAssetRelativePath = nextTarget.legacyAssetRelativePath;
      updatedEntries += 1;
    }
  } catch (error) {
    unresolved += 1;
    failures.push(`${item.app}/${item.exerciseId}/${item.slot}: ${error.message}`);
  }
}

inventory.generatedAt = new Date().toISOString();
writeJson(INVENTORY_PATH, inventory);

console.log(`Backup source-assets : ${backupPath}`);
console.log(`Miroir reconstruit : ${DOWNLOAD_ROOT}`);
console.log(`Repris depuis backup : ${restoredFromBackup}`);
console.log(`Copies depuis source locale : ${copiedFromLocalSource}`);
console.log(`Telecharges : ${fetchedRemotely}`);
console.log(`Entrees mises a jour : ${updatedEntries}`);
console.log(`Entrees non resolues : ${unresolved}`);

if (failures.length) {
  console.log("");
  console.log("Echecs:");
  for (const line of failures.slice(0, 100)) {
    console.log(`- ${line}`);
  }
  if (failures.length > 100) {
    console.log(`- ... ${failures.length - 100} autre(s)`);
  }
}
