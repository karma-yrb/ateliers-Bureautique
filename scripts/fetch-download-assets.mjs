import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INVENTORY_PATH = path.join(ROOT, "docs", "download-assets-inventory.json");
const DOWNLOAD_ROOT = path.join(ROOT, "downloads-assets-source");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeRelativeTarget(assetRelativePath) {
  const normalized = String(assetRelativePath || "")
    .replace(/\\/g, "/")
    .replace(/^assets\//, "")
    .replace(/^\/+/, "");
  return normalized;
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
  return path.extname(fallbackPath || "");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function downloadFile(sourceUrl, outputPath) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const extension = inferExtensionFromContentType(response.headers.get("content-type"), outputPath);
  const finalPath = path.extname(outputPath)
    ? outputPath.replace(/\.[^.]+$/, extension || path.extname(outputPath))
    : `${outputPath}${extension}`;
  ensureDir(finalPath);
  fs.writeFileSync(finalPath, Buffer.from(arrayBuffer));
  return finalPath;
}

if (!fs.existsSync(INVENTORY_PATH)) {
  throw new Error(`Inventaire introuvable : ${INVENTORY_PATH}`);
}

const inventory = readJson(INVENTORY_PATH);
const items = Array.isArray(inventory.items) ? inventory.items : [];
const targets = items.filter((item) => String(item.sourceUrl || "").trim() && String(item.assetRelativePath || "").trim());

if (!targets.length) {
  console.log("Aucun fichier source a telecharger.");
  process.exit(0);
}

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const item of targets) {
  const relativeTarget = normalizeRelativeTarget(item.assetRelativePath);
  const outputPath = path.join(DOWNLOAD_ROOT, relativeTarget);

  if (fs.existsSync(outputPath)) {
    skipped += 1;
    console.log(`SKIP ${relativeTarget}`);
    continue;
  }

  try {
    const finalPath = await downloadFile(item.sourceUrl, outputPath);
    downloaded += 1;
    console.log(`OK   ${path.relative(DOWNLOAD_ROOT, finalPath).replace(/\\/g, "/")}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${relativeTarget} <- ${item.sourceUrl} (${error.message})`);
  }
}

console.log("");
console.log(`Dossier mere : ${DOWNLOAD_ROOT}`);
console.log(`Telecharges : ${downloaded}`);
console.log(`Deja presents : ${skipped}`);
console.log(`Erreurs : ${failed}`);
