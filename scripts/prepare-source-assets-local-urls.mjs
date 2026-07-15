import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INVENTORY_PATH = path.join(ROOT, "docs", "source-assets-inventory.json");
const DOWNLOAD_ROOT = path.join(ROOT, "downloads-assets-source-all");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function normalizeRelativeTarget(assetRelativePath) {
  return String(assetRelativePath || "")
    .replace(/\\/g, "/")
    .replace(/^assets\//, "")
    .replace(/^\/+/, "");
}

if (!fs.existsSync(INVENTORY_PATH)) {
  throw new Error(`Inventaire introuvable : ${INVENTORY_PATH}`);
}

const inventory = readJson(INVENTORY_PATH);
let localized = 0;
let missing = 0;

for (const item of inventory.items || []) {
  const relativeTarget = normalizeRelativeTarget(item.assetRelativePath);
  const localPath = path.join(DOWNLOAD_ROOT, relativeTarget);
  const nextUrl = fs.existsSync(localPath)
    ? `data/${String(item.assetRelativePath || "").replace(/\\/g, "/").replace(/^\/+/, "")}`
    : "";

  if (nextUrl) {
    localized += 1;
  } else {
    missing += 1;
  }

  item.assetUrl = nextUrl;
}

inventory.generatedAt = new Date().toISOString();
inventory.baseAssetUrl = "";

writeJson(INVENTORY_PATH, inventory);

console.log(`Inventaire mis a jour : ${INVENTORY_PATH}`);
console.log(`Assets localises : ${localized}`);
console.log(`Assets encore absents : ${missing}`);
