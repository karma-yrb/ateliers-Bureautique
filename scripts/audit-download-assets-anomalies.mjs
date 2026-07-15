import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, "reports", "download-assets-fetch-report.md");
const DOWNLOAD_ROOT = path.join(ROOT, "downloads-assets-source");

const APP_SOURCES = {
  word: path.join(ROOT, "apps", "word", "data", "exercises.structured.json"),
  excel: path.join(ROOT, "apps", "excel", "data", "exercises.structured.json"),
  powerpoint: path.join(ROOT, "apps", "powerpoint", "data", "exercises.structured.json"),
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseMarkdownTable(sectionTitle, markdown) {
  const marker = `## ${sectionTitle}`;
  const start = markdown.indexOf(marker);
  if (start === -1) return [];
  const nextSection = markdown.indexOf("\n## ", start + marker.length);
  const block = markdown.slice(start, nextSection === -1 ? undefined : nextSection);
  const lines = block.split(/\r?\n/).filter((line) => line.trim().startsWith("|"));
  if (lines.length < 3) return [];
  const headers = lines[0].split("|").map((cell) => cell.trim()).filter(Boolean);
  return lines.slice(2).map((line) => {
    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] || "";
    });
    return row;
  });
}

function collectFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectFiles(full));
      continue;
    }
    out.push(full);
  }
  return out;
}

function findExercise(data, exerciseId) {
  return (data.exercises || []).find((exercise) => exercise.id === exerciseId) || null;
}

function getDownloadFieldValue(exercise, slot) {
  if (!exercise) return null;
  if (slot === "docxUrl") return exercise.docxUrl || null;
  if (slot === "downloadUrl") return exercise.downloadUrl || null;
  if (slot === "extraDownloadUrls") return exercise.extraDownloadUrls || [];
  return null;
}

function classify(row, datasets, localFiles) {
  const app = row.app;
  const data = datasets[app];
  const exercise = findExercise(data, row.exerciseId);
  const currentValue = getDownloadFieldValue(exercise, row.slot);
  const targetSuffix = String(row.target || "").replace(/\//g, path.sep);
  const localMatches = localFiles.filter((filePath) => filePath.endsWith(targetSuffix));

  if (!exercise) {
    return {
      verdict: "a_verifier_dans_les_donnees",
      note: "Exercice introuvable dans le dataset actuel.",
      currentValue: "",
      localMatches: [],
    };
  }

  if (row.slot === "extraDownloadUrls" && Array.isArray(currentValue)) {
    const exactMatch = currentValue.find((item) => {
      if (typeof item === "string") return item === row.sourceUrl;
      return item && item.url === row.sourceUrl;
    });
    if (exactMatch && /rawpixel/i.test(String(row.sourceUrl || ""))) {
      return {
        verdict: "a_recuperer_manuellement",
        note: "Source externe protegee (Rawpixel) toujours referencee dans les donnees actuelles.",
        currentValue: JSON.stringify(exactMatch),
        localMatches: localMatches.map((filePath) => path.relative(ROOT, filePath)),
      };
    }
  }

  if (localMatches.length) {
    return {
      verdict: "deja_recupere_localement",
      note: "Un fichier local correspondant existe deja dans le dossier de telechargement.",
      currentValue: typeof currentValue === "string" ? currentValue : JSON.stringify(currentValue),
      localMatches: localMatches.map((filePath) => path.relative(ROOT, filePath)),
    };
  }

  if (/categories-telechargement/.test(String(row.sourceUrl || "")) || /\.html$/i.test(String(row.target || ""))) {
    return {
      verdict: "a_recuperer_manuellement",
      note: "Lien de page intermediaire plutot qu'un binaire direct.",
      currentValue: typeof currentValue === "string" ? currentValue : JSON.stringify(currentValue),
      localMatches: [],
    };
  }

  if (String(row.sourceUrl || "") !== String(currentValue || "") && typeof currentValue === "string" && currentValue) {
    return {
      verdict: "deja_traite_autrement",
      note: "La donnee actuelle ne pointe plus exactement vers l'URL du rapport.",
      currentValue,
      localMatches: [],
    };
  }

  return {
    verdict: "a_corriger_dans_les_donnees",
    note: "La donnee actuelle pointe encore vers une source qui ne se telecharge pas correctement.",
    currentValue: typeof currentValue === "string" ? currentValue : JSON.stringify(currentValue),
    localMatches: [],
  };
}

const markdown = fs.readFileSync(REPORT_PATH, "utf8");
const missingRows = parseMarkdownTable("Fichiers manquants", markdown);
const suspiciousRows = parseMarkdownTable("Fichiers suspects", markdown);
const rows = [...missingRows.map((row) => ({ ...row, issueType: "missing" })), ...suspiciousRows.map((row) => ({ ...row, issueType: "suspicious" }))];

const datasets = Object.fromEntries(
  Object.entries(APP_SOURCES).map(([app, sourcePath]) => [app, readJson(sourcePath)]),
);
const localFiles = collectFiles(DOWNLOAD_ROOT);

const audited = rows.map((row) => ({
  ...row,
  ...classify(row, datasets, localFiles),
}));

const byVerdict = audited.reduce((acc, row) => {
  acc[row.verdict] = acc[row.verdict] || [];
  acc[row.verdict].push(row);
  return acc;
}, {});

const reportLines = [
  "# Audit croise des anomalies d'assets",
  "",
  `Genere le : ${new Date().toISOString()}`,
  "",
  "## Resume",
  "",
  `- Cas analyses : ${audited.length}`,
  ...Object.entries(byVerdict).map(([verdict, rowsForVerdict]) => `- ${verdict} : ${rowsForVerdict.length}`),
  "",
];

for (const verdict of Object.keys(byVerdict).sort()) {
  reportLines.push(`## ${verdict}`, "");
  reportLines.push("| app | exerciseId | issueType | slot | note | currentValue | target |");
  reportLines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const row of byVerdict[verdict]) {
    reportLines.push(`| ${row.app} | ${row.exerciseId} | ${row.issueType} | ${row.slot} | ${String(row.note || "").replace(/\|/g, "\\|")} | ${String(row.currentValue || "").replace(/\|/g, "\\|")} | ${String(row.target || "").replace(/\|/g, "\\|")} |`);
    if (row.localMatches && row.localMatches.length) {
      reportLines.push(`|  |  |  |  | localMatches | ${row.localMatches.join("<br>")} |  |`);
    }
  }
  reportLines.push("");
}

const OUTPUT_PATH = path.join(ROOT, "docs", "download-assets-anomalies-audit.md");
fs.writeFileSync(OUTPUT_PATH, `${reportLines.join("\n")}\n`);

console.log(`Audit genere : ${OUTPUT_PATH}`);
console.log(JSON.stringify(Object.fromEntries(Object.entries(byVerdict).map(([key, value]) => [key, value.length])), null, 2));
