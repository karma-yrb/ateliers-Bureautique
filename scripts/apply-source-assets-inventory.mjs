import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INVENTORY_PATH = path.join(ROOT, "docs", "source-assets-inventory.json");

const APPS = [
  { app: "word", sourcePath: path.join(ROOT, "apps", "word", "data", "exercises.structured.json") },
  { app: "excel", sourcePath: path.join(ROOT, "apps", "excel", "data", "exercises.structured.json") },
  { app: "powerpoint", sourcePath: path.join(ROOT, "apps", "powerpoint", "data", "exercises.structured.json") },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeAssetUrl(baseAssetUrl, assetUrl, assetRelativePath) {
  const explicit = String(assetUrl || "").trim();
  if (explicit) return explicit;

  const base = String(baseAssetUrl || "").trim().replace(/\/+$/, "");
  const relative = String(assetRelativePath || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (base && relative) return `${base}/${relative}`;
  return "";
}

function buildInventoryMap(payload) {
  const map = new Map();
  for (const item of payload.items || []) {
    const key = `${item.app}::${item.exerciseId}::${item.slot}::${Number(item.itemIndex || 0)}`;
    const assetUrl = normalizeAssetUrl(payload.baseAssetUrl, item.assetUrl || item.driveDownloadUrl, item.assetRelativePath);
    if (!assetUrl) continue;
    map.set(key, assetUrl);
  }
  return map;
}

function updateArray(entries, callback) {
  return entries.map((entry, index) => callback(entry, index));
}

function updateUrlLikeEntry(entry, nextUrl) {
  if (typeof entry === "string") return nextUrl;
  if (!entry || typeof entry !== "object") return nextUrl;
  if ("url" in entry) return { ...entry, url: nextUrl };
  if ("src" in entry) return { ...entry, src: nextUrl };
  return entry;
}

function updateAppData(appConfig, inventoryMap) {
  const data = readJson(appConfig.sourcePath);
  let changed = 0;

  for (const exercise of data.exercises || []) {
    const simpleSlots = ["docxUrl", "downloadUrl"];
    for (const slot of simpleSlots) {
      const key = `${appConfig.app}::${exercise.id}::${slot}::0`;
      const nextUrl = inventoryMap.get(key);
      if (nextUrl && exercise[slot] !== nextUrl) {
        exercise[slot] = nextUrl;
        changed += 1;
      }
    }

    if (Array.isArray(exercise.extraDownloadUrls)) {
      exercise.extraDownloadUrls = updateArray(exercise.extraDownloadUrls, (entry, index) => {
        const nextUrl = inventoryMap.get(`${appConfig.app}::${exercise.id}::extraDownloadUrls::${index}`);
        if (!nextUrl) return entry;
        changed += 1;
        return updateUrlLikeEntry(entry, nextUrl);
      });
    }

    for (const slot of ["imageEnonce", "imageResultat"]) {
      if (Array.isArray(exercise[slot])) {
        exercise[slot] = updateArray(exercise[slot], (entry, index) => {
          const nextUrl = inventoryMap.get(`${appConfig.app}::${exercise.id}::${slot}::${index}`);
          if (!nextUrl) return entry;
          changed += 1;
          return updateUrlLikeEntry(entry, nextUrl);
        });
      } else {
        const nextUrl = inventoryMap.get(`${appConfig.app}::${exercise.id}::${slot}::0`);
        if (nextUrl && exercise[slot] !== nextUrl) {
          exercise[slot] = nextUrl;
          changed += 1;
        }
      }
    }

    const scrape = exercise.scrape || {};
    for (const slot of ["scrape.enonceImages", "scrape.resultImages", "scrape.extraImages"]) {
      const field = slot.split(".")[1];
      if (!Array.isArray(scrape[field])) continue;
      scrape[field] = updateArray(scrape[field], (entry, index) => {
        const nextUrl = inventoryMap.get(`${appConfig.app}::${exercise.id}::${slot}::${index}`);
        if (!nextUrl) return entry;
        changed += 1;
        return updateUrlLikeEntry(entry, nextUrl);
      });
    }
    exercise.scrape = scrape;

    if (Array.isArray(exercise.exerciseTabs)) {
      exercise.exerciseTabs = updateArray(exercise.exerciseTabs, (tab, tabIndex) => {
        const nextTab = { ...tab };
        for (const field of ["enonceImages", "resultImages"]) {
          if (!Array.isArray(nextTab[field])) continue;
          nextTab[field] = updateArray(nextTab[field], (entry, imageIndex) => {
            const nextUrl = inventoryMap.get(`${appConfig.app}::${exercise.id}::exerciseTabs[${tabIndex}].${field}::${imageIndex}`);
            if (!nextUrl) return entry;
            changed += 1;
            return updateUrlLikeEntry(entry, nextUrl);
          });
        }
        return nextTab;
      });
    }
  }

  writeJson(appConfig.sourcePath, data);
  return changed;
}

if (!fs.existsSync(INVENTORY_PATH)) {
  throw new Error(`Inventaire introuvable : ${INVENTORY_PATH}`);
}

const payload = readJson(INVENTORY_PATH);
const inventoryMap = buildInventoryMap(payload);

if (!inventoryMap.size) {
  console.log("Aucune URL d'asset renseignee dans l'inventaire. Rien a appliquer.");
  process.exit(0);
}

for (const appConfig of APPS) {
  const count = updateAppData(appConfig, inventoryMap);
  console.log(`${appConfig.app}: ${count} lien(s) mis a jour.`);
}

console.log("Mise a jour terminee. Pensez a regenerer les bundles de donnees.");
