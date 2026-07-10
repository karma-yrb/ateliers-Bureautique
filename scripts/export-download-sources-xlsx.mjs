import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.resolve(
  ROOT,
  process.argv[2] || path.join(ROOT, "docs", "sources-a-telecharger-par-exercice.xlsx")
);

const MODULES = [
  {
    sheetName: "Word",
    sourcePath: path.join(ROOT, "apps", "word", "data", "exercises.structured.json")
  },
  {
    sheetName: "Excel",
    sourcePath: path.join(ROOT, "apps", "excel", "data", "exercises.structured.json")
  },
  {
    sheetName: "PowerPoint",
    sourcePath: path.join(ROOT, "apps", "powerpoint", "data", "exercises.structured.json")
  }
];

const THEME_LABELS = {
  bases: "Bases",
  avance: "Avance",
  asca: "ASCA",
  complets: "Complets"
};

function readExercises(sourcePath) {
  const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  return raw.exercises || raw;
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

function normalizeUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pushLinks(bucket, exercise, type, values) {
  for (const rawValue of toArray(values)) {
    const url =
      typeof rawValue === "string"
        ? normalizeUrl(rawValue)
        : normalizeUrl(rawValue?.src || rawValue?.url || "");
    if (!url) continue;
    bucket.push({
      theme: THEME_LABELS[exercise.section] || exercise.section || "",
      subcategory: exercise.moduleNameClean || exercise.moduleName || exercise.moduleId || "",
      exerciseNumber: exercise.id || exercise.num || "",
      exerciseName: exercise.title || exercise.id,
      cfLink: exercise.pageUrl || exercise.scrape?.url || "",
      type,
      url,
      sortKey: `${exercise.section || ""}::${exercise.moduleNameClean || exercise.moduleName || ""}::${String(exercise.globalIndex || 0).padStart(4, "0")}::${type}::${url}`
    });
  }
}

function extractRows(exercises) {
  const rows = [];
  for (const exercise of exercises) {
    pushLinks(rows, exercise, "fichier de travail", exercise.docxUrl);
    pushLinks(rows, exercise, "ressource a telecharger", exercise.downloadUrl);
    pushLinks(rows, exercise, "ressource additionnelle", exercise.extraDownloadUrls);
    pushLinks(rows, exercise, "image enonce", exercise.imageEnonce);
    pushLinks(rows, exercise, "image resultat", exercise.imageResultat);
    pushLinks(rows, exercise, "image annexe", exercise.extraImages);
    pushLinks(rows, exercise, "image enonce scrapee", exercise.scrape?.enonceImages);
    pushLinks(rows, exercise, "image resultat scrapee", exercise.scrape?.resultImages);
    pushLinks(rows, exercise, "image annexe scrapee", exercise.scrape?.extraImages);
  }

  const deduped = new Map();
  for (const row of rows) {
    deduped.set(`${row.theme}||${row.exerciseName}||${row.type}||${row.url}`, row);
  }

  return [...deduped.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey, "fr"))
    .map(({ theme, subcategory, exerciseNumber, exerciseName, cfLink, type, url }) => [
      theme,
      subcategory,
      exerciseNumber,
      exerciseName,
      cfLink,
      type,
      url
    ]);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index) {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function makeSheetXml(rows) {
  const header = [["theme", "sous-categorie", "numero exercice", "nom exercice", "lien CF", "type lien", "url"], ...rows];
  const rowXml = header
    .map((cells, rowIndex) => {
      const cellsXml = cells
        .map((cell, cellIndex) => {
          const ref = `${columnName(cellIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cellsXml}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView workbookViewId="0"/>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="18" customWidth="1"/>
    <col min="2" max="2" width="28" customWidth="1"/>
    <col min="3" max="3" width="18" customWidth="1"/>
    <col min="4" max="4" width="42" customWidth="1"/>
    <col min="5" max="5" width="60" customWidth="1"/>
    <col min="6" max="6" width="28" customWidth="1"/>
    <col min="7" max="7" width="120" customWidth="1"/>
  </cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function makeWorkbookXml(sheets) {
  const sheetsXml = sheets
    .map(
      (sheet, index) =>
        `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetsXml}</sheets>
</workbook>`;
}

function makeWorkbookRelsXml(sheetCount) {
  const rels = [];
  for (let i = 0; i < sheetCount; i += 1) {
    rels.push(
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`
    );
  }
  rels.push(
    `<Relationship Id="rId${sheetCount + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`
  );

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${rels.join("")}
</Relationships>`;
}

function makeRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function makeContentTypesXml(sheetCount) {
  const overrides = [];
  for (let i = 0; i < sheetCount; i += 1) {
    overrides.push(
      `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${overrides.join("")}
</Types>`;
}

function makeStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="1">
    <fill><patternFill patternType="none"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>`;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStore(entries) {
  const fileParts = [];
  const directoryParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const dataBuffer = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, "utf8");
    const crc = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    fileParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    directoryParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectory = Buffer.concat(directoryParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...fileParts, centralDirectory, endRecord]);
}

const sheets = MODULES.map(({ sheetName, sourcePath }) => ({
  name: sheetName,
  rows: extractRows(readExercises(sourcePath))
}));

const entries = [
  { name: "[Content_Types].xml", data: makeContentTypesXml(sheets.length) },
  { name: "_rels/.rels", data: makeRootRelsXml() },
  { name: "xl/workbook.xml", data: makeWorkbookXml(sheets) },
  { name: "xl/_rels/workbook.xml.rels", data: makeWorkbookRelsXml(sheets.length) },
  { name: "xl/styles.xml", data: makeStylesXml() },
  ...sheets.map((sheet, index) => ({
    name: `xl/worksheets/sheet${index + 1}.xml`,
    data: makeSheetXml(sheet.rows)
  }))
];

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, zipStore(entries));

for (const sheet of sheets) {
  console.log(`${sheet.name}: ${sheet.rows.length} ligne(s)`);
}
console.log(`Fichier genere: ${OUTPUT}`);
