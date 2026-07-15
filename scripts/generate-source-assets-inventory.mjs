import fs from "node:fs";
import path from "node:path";
import { buildCanonicalModuleFolder, buildLegacyModuleFolder, slugify } from "./lib/module-folder.mjs";

const ROOT = process.cwd();
const JSON_OUTPUT = path.join(ROOT, "reports", "source-assets-inventory.json");
const DOWNLOAD_INVENTORY_PATH = path.join(ROOT, "reports", "download-assets-inventory.json");

const APPS = [
  { app: "word", prefix: "word", sourcePath: path.join(ROOT, "apps", "word", "data", "exercises.structured.json") },
  { app: "excel", prefix: "excel", sourcePath: path.join(ROOT, "apps", "excel", "data", "exercises.structured.json") },
  { app: "powerpoint", prefix: "powerpoint", sourcePath: path.join(ROOT, "apps", "powerpoint", "data", "exercises.structured.json") },
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readExistingInventory(filePath) {
  if (!fs.existsSync(filePath)) {
    return { generatedAt: "", baseAssetUrl: "", driveRootUrl: "", lastDriveSyncAt: "", items: [] };
  }
  return readJson(filePath);
}

function buildStableKeyFromParts(app, exerciseId, slot, itemIndex) {
  return `${app}::${exerciseId}::${slot}::${Number(itemIndex || 0)}`;
}

function buildDownloadInventoryMap() {
  if (!fs.existsSync(DOWNLOAD_INVENTORY_PATH)) return new Map();
  const payload = readJson(DOWNLOAD_INVENTORY_PATH);
  const map = new Map();
  for (const item of payload.items || []) {
    map.set(buildStableKeyFromParts(item.app, item.exerciseId, item.slot, item.itemIndex || 0), item);
  }
  return map;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function getExerciseNumber(exercise) {
  const num = Number(exercise && exercise.num);
  if (Number.isFinite(num) && num > 0) return String(num).padStart(3, "0");
  const id = String((exercise && exercise.id) || "");
  const match = id.match(/(\d{1,3})$/);
  return match ? String(match[1]).padStart(3, "0") : "000";
}

function buildDuplicateExerciseMap(exercises) {
  const counts = new Map();
  for (const exercise of exercises) {
    const key = `${exercise.moduleId || ""}::${getExerciseNumber(exercise)}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function buildExerciseBaseName(appConfig, exercise, duplicateExerciseMap) {
  const exerciseNo = getExerciseNumber(exercise);
  const duplicateKey = `${exercise.moduleId || ""}::${exerciseNo}`;
  const duplicateCount = duplicateExerciseMap.get(duplicateKey) || 0;

  if (duplicateCount <= 1) {
    return `${appConfig.prefix}-ex-${exerciseNo}`;
  }

  const globalIndex = Number(exercise && exercise.globalIndex);
  if (Number.isFinite(globalIndex) && globalIndex > 0) {
    return `${appConfig.prefix}-ex-${exerciseNo}-g${String(globalIndex).padStart(3, "0")}`;
  }

  return `${appConfig.prefix}-ex-${exerciseNo}-${slugify(exercise.id || exercise.title, "dup")}`;
}

function getExtension(url, fallback = ".bin") {
  try {
    const parsed = new URL(String(url || ""));
    const lastSegment = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
    const match = lastSegment.match(/\.[a-z0-9]{2,8}$/i);
    if (match && match[0].toLowerCase() !== ".html") return match[0].toLowerCase();
    const downloadParam = parsed.searchParams.get("download") || "";
    const lowerDownload = downloadParam.toLowerCase();
    if (lowerDownload.endsWith(".docx")) return ".docx";
    if (lowerDownload.endsWith(".xlsx")) return ".xlsx";
    if (lowerDownload.endsWith(".pptx")) return ".pptx";
    return fallback;
  } catch {
    return fallback;
  }
}

function normalizeUrlItem(item) {
  if (typeof item === "string") return { url: item.trim(), label: "", caption: "" };
  if (!item || typeof item !== "object") return { url: "", label: "", caption: "" };
  return {
    url: String(item.url || item.src || "").trim(),
    label: String(item.label || "").trim(),
    caption: String(item.caption || "").trim(),
  };
}

function getFileRole(slot) {
  if (slot === "docxUrl") return "workfile-primary";
  if (slot === "downloadUrl" || slot === "extraDownloadUrls") return "workfile-secondary";
  return "image";
}

function buildSuggestedFileName(appConfig, exercise, slot, index, url, duplicateExerciseMap) {
  const extension = getExtension(url, ".bin");
  const base = buildExerciseBaseName(appConfig, exercise, duplicateExerciseMap);
  const tabSlotMatch = String(slot).match(/^exerciseTabs\[(\d+)\]\.(enonceImages|resultImages)$/);

  if (tabSlotMatch) {
    const tabIndex = Number(tabSlotMatch[1]);
    const imageKind = tabSlotMatch[2] === "enonceImages" ? "onglet-enonce" : "onglet-resultat";
    return `${base}-${imageKind}-${tabIndex + 1}-${index + 1}${extension}`;
  }

  switch (slot) {
    case "docxUrl":
      return `${base}${extension}`;
    case "downloadUrl":
      return `${base}-annexe-1${extension}`;
    case "extraDownloadUrls":
      return `${base}-annexe-${index + 2}${extension}`;
    case "imageEnonce":
      return `${base}-image-enonce${Array.isArray(exercise.imageEnonce) ? `-${index + 1}` : ""}${extension}`;
    case "imageResultat":
      return `${base}-image-resultat${Array.isArray(exercise.imageResultat) ? `-${index + 1}` : ""}${extension}`;
    case "scrape.enonceImages":
      return `${base}-scrape-enonce-${index + 1}${extension}`;
    case "scrape.resultImages":
      return `${base}-scrape-resultat-${index + 1}${extension}`;
    case "scrape.extraImages":
      return `${base}-scrape-extra-${index + 1}${extension}`;
    default:
      return `${base}-${slugify(slot, "asset")}-${index + 1}${extension}`;
  }
}

function pushItem(items, appConfig, exercise, slot, source, index = 0, label = "", downloadInventoryMap = new Map(), duplicateExerciseMap = new Map()) {
  const normalized = normalizeUrlItem(source);
  if (!normalized.url) return;

  const moduleStem = buildCanonicalModuleFolder(exercise);
  const legacyModuleFolder = String(exercise.moduleLegacyFolder || "").trim();
  const suggestedFileName = buildSuggestedFileName(appConfig, exercise, slot, index, normalized.url, duplicateExerciseMap);
  const assetRelativePath = path.posix.join("assets", appConfig.app, moduleStem, suggestedFileName);
  const legacyAssetRelativePath = legacyModuleFolder
    ? path.posix.join("assets", appConfig.app, legacyModuleFolder, suggestedFileName)
    : "";

  items.push({
    app: appConfig.app,
    exerciseId: exercise.id,
    exerciseNum: Number(exercise.num || 0),
    moduleId: exercise.moduleId || "",
    moduleFolder: moduleStem,
    moduleLegacyFolder: legacyModuleFolder,
    title: exercise.title || "",
    slot,
    itemIndex: index,
    fileRole: getFileRole(slot),
    label: label || normalized.label || normalized.caption || "",
    sourceUrl: normalized.url,
    suggestedFileName,
    assetRelativePath,
    legacyAssetRelativePath,
    driveModuleFolderId: "",
    driveFileId: "",
    driveViewUrl: "",
    driveDownloadUrl: "",
    assetUrl: "",
    status: "",
    notes: "",
  });
}

function buildItems() {
  const items = [];
  const downloadInventoryMap = buildDownloadInventoryMap();

  for (const appConfig of APPS) {
    const data = readJson(appConfig.sourcePath);
    const exercises = Array.isArray(data.exercises) ? data.exercises : [];
    const moduleMap = new Map((data.modules || []).map((module) => [module.id, module]));
    const duplicateExerciseMap = buildDuplicateExerciseMap(exercises);

    for (const exercise of exercises) {
      const moduleMeta = moduleMap.get(exercise.moduleId) || {};
      const normalizedExercise = {
        ...moduleMeta,
        ...exercise,
        section: exercise.section || moduleMeta.section,
        orderInSection: exercise.orderInSection || moduleMeta.orderInSection,
        moduleName: exercise.moduleName || moduleMeta.name,
        moduleNameClean: exercise.moduleNameClean || moduleMeta.cleanName || exercise.moduleName,
        moduleSlug: slugify(moduleMeta.cleanName || exercise.moduleNameClean || exercise.moduleName, "module"),
        moduleLegacyFolder: buildLegacyModuleFolder({
          moduleId: exercise.moduleId || moduleMeta.id,
          moduleName: exercise.moduleName || moduleMeta.name,
          moduleNameClean: exercise.moduleNameClean || moduleMeta.cleanName || exercise.moduleName,
        }),
      };

      pushItem(items, appConfig, normalizedExercise, "docxUrl", normalizedExercise.docxUrl, 0, "Fichier principal", downloadInventoryMap, duplicateExerciseMap);
      pushItem(items, appConfig, normalizedExercise, "downloadUrl", normalizedExercise.downloadUrl, 0, normalizedExercise.downloadLabel || "Annexe 1", downloadInventoryMap, duplicateExerciseMap);

      if (Array.isArray(normalizedExercise.extraDownloadUrls)) {
        normalizedExercise.extraDownloadUrls.forEach((entry, index) => {
          pushItem(items, appConfig, normalizedExercise, "extraDownloadUrls", entry, index, `Annexe ${index + 2}`, downloadInventoryMap, duplicateExerciseMap);
        });
      }

      if (Array.isArray(normalizedExercise.imageEnonce)) {
        normalizedExercise.imageEnonce.forEach((entry, index) => pushItem(items, appConfig, normalizedExercise, "imageEnonce", entry, index, "Image enonce", downloadInventoryMap, duplicateExerciseMap));
      } else {
        pushItem(items, appConfig, normalizedExercise, "imageEnonce", normalizedExercise.imageEnonce, 0, "Image enonce", downloadInventoryMap, duplicateExerciseMap);
      }

      if (Array.isArray(normalizedExercise.imageResultat)) {
        normalizedExercise.imageResultat.forEach((entry, index) => pushItem(items, appConfig, normalizedExercise, "imageResultat", entry, index, "Image resultat", downloadInventoryMap, duplicateExerciseMap));
      } else {
        pushItem(items, appConfig, normalizedExercise, "imageResultat", normalizedExercise.imageResultat, 0, "Image resultat", downloadInventoryMap, duplicateExerciseMap);
      }

      const scrape = normalizedExercise.scrape || {};
      for (const [slot, values] of [
        ["scrape.enonceImages", scrape.enonceImages],
        ["scrape.resultImages", scrape.resultImages],
        ["scrape.extraImages", scrape.extraImages],
      ]) {
        if (!Array.isArray(values)) continue;
        values.forEach((entry, index) => pushItem(items, appConfig, normalizedExercise, slot, entry, index, slot, downloadInventoryMap, duplicateExerciseMap));
      }

      if (Array.isArray(normalizedExercise.exerciseTabs)) {
        normalizedExercise.exerciseTabs.forEach((tab, tabIndex) => {
          if (Array.isArray(tab.enonceImages)) {
            tab.enonceImages.forEach((entry, imageIndex) => {
              pushItem(items, appConfig, normalizedExercise, `exerciseTabs[${tabIndex}].enonceImages`, entry, imageIndex, `exerciseTabs[${tabIndex}].enonceImages`, downloadInventoryMap, duplicateExerciseMap);
            });
          }
          if (Array.isArray(tab.resultImages)) {
            tab.resultImages.forEach((entry, imageIndex) => {
              pushItem(items, appConfig, normalizedExercise, `exerciseTabs[${tabIndex}].resultImages`, entry, imageIndex, `exerciseTabs[${tabIndex}].resultImages`, downloadInventoryMap, duplicateExerciseMap);
            });
          }
        });
      }
    }
  }

  return items.sort((a, b) => (
    a.app.localeCompare(b.app, "fr")
    || a.moduleFolder.localeCompare(b.moduleFolder, "fr")
    || a.exerciseNum - b.exerciseNum
    || a.slot.localeCompare(b.slot, "fr")
    || a.itemIndex - b.itemIndex
  ));
}

function buildStableKey(item) {
  return `${item.app}::${item.exerciseId}::${item.slot}::${Number(item.itemIndex || 0)}`;
}

function mergeWithExisting(items, existingInventory) {
  const existingItems = Array.isArray(existingInventory.items) ? existingInventory.items : [];
  const existingMap = new Map(existingItems.map((item) => [buildStableKey(item), item]));

  return items.map((item) => {
    const existing = existingMap.get(buildStableKey(item));
    if (!existing) return item;
    return {
      ...item,
      driveModuleFolderId: typeof existing.driveModuleFolderId === "string" ? existing.driveModuleFolderId : "",
      driveFileId: typeof existing.driveFileId === "string" ? existing.driveFileId : "",
      driveViewUrl: typeof existing.driveViewUrl === "string" ? existing.driveViewUrl : "",
      driveDownloadUrl: typeof existing.driveDownloadUrl === "string" ? existing.driveDownloadUrl : "",
      assetUrl: typeof existing.assetUrl === "string" ? existing.assetUrl : "",
      status: typeof existing.status === "string" ? existing.status : "",
      notes: typeof existing.notes === "string" ? existing.notes : "",
    };
  });
}

const existing = readExistingInventory(JSON_OUTPUT);
const existingDownload = readExistingInventory(DOWNLOAD_INVENTORY_PATH);
const items = buildItems();
const merged = mergeWithExisting(items, existing);

const payload = {
  generatedAt: new Date().toISOString(),
  baseAssetUrl: existing.baseAssetUrl || "",
  driveRootUrl: existing.driveRootUrl || existingDownload.driveRootUrl || "",
  lastDriveSyncAt: existing.lastDriveSyncAt || "",
  items: merged,
};

ensureDir(JSON_OUTPUT);
fs.writeFileSync(JSON_OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Inventaire genere : ${JSON_OUTPUT}`);
console.log(JSON.stringify({
  items: merged.length,
  byRole: merged.reduce((acc, item) => {
    acc[item.fileRole] = (acc[item.fileRole] || 0) + 1;
    return acc;
  }, {}),
}, null, 2));
