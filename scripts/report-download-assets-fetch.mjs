import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INVENTORY_PATH = path.join(ROOT, "reports", "download-assets-inventory.json");
const DOWNLOAD_ROOT = path.join(ROOT, "downloads-assets-source");
const REPORT_PATH = path.join(ROOT, "reports", "download-assets-fetch-report.md");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function toMarkdownTable(rows, headers) {
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
  ];
  for (const row of rows) {
    lines.push(`| ${row.map((cell) => String(cell || "").replace(/\|/g, "\\|")).join(" | ")} |`);
  }
  return lines.join("\n");
}

if (!fs.existsSync(INVENTORY_PATH)) {
  throw new Error(`Inventaire introuvable : ${INVENTORY_PATH}`);
}

const inventory = readJson(INVENTORY_PATH);
const items = Array.isArray(inventory.items) ? inventory.items : [];

const missing = [];
const suspicious = [];

for (const item of items) {
  const relativeTarget = normalizeRelativeTarget(item.assetRelativePath);
  const fullPath = path.join(DOWNLOAD_ROOT, relativeTarget);

  if (!fs.existsSync(fullPath)) {
    missing.push({
      app: item.app,
      exerciseId: item.exerciseId,
      slot: item.slot,
      sourceUrl: item.sourceUrl,
      target: relativeTarget,
    });
    continue;
  }

  const ext = path.extname(fullPath).toLowerCase();
  if (ext === ".html" || ext === ".bin") {
    suspicious.push({
      app: item.app,
      exerciseId: item.exerciseId,
      slot: item.slot,
      sourceUrl: item.sourceUrl,
      target: relativeTarget,
      ext,
    });
  }
}

const lines = [
  "# Rapport de recuperation des assets",
  "",
  `Genere le : ${new Date().toISOString()}`,
  `Dossier analyse : ${DOWNLOAD_ROOT}`,
  "",
  "## Resume",
  "",
  `- Entrees inventaire : ${items.length}`,
  `- Fichiers manquants : ${missing.length}`,
  `- Fichiers suspects (.html / .bin) : ${suspicious.length}`,
  "",
];

if (missing.length) {
  lines.push("## Fichiers manquants", "");
  lines.push(
    toMarkdownTable(
      missing.map((row) => [row.app, row.exerciseId, row.slot, row.target, row.sourceUrl]),
      ["app", "exerciseId", "slot", "target", "sourceUrl"],
    ),
    "",
  );
}

if (suspicious.length) {
  lines.push("## Fichiers suspects", "");
  lines.push(
    toMarkdownTable(
      suspicious.map((row) => [row.app, row.exerciseId, row.slot, row.ext, row.target, row.sourceUrl]),
      ["app", "exerciseId", "slot", "ext", "target", "sourceUrl"],
    ),
    "",
  );
}

if (!missing.length && !suspicious.length) {
  lines.push("Aucune anomalie detectee.", "");
}

ensureDir(REPORT_PATH);
fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`);

console.log(`Rapport genere : ${REPORT_PATH}`);
console.log(`Fichiers manquants : ${missing.length}`);
console.log(`Fichiers suspects : ${suspicious.length}`);
