import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const AUDIT_PATH = path.join(ROOT, "docs", "download-assets-anomalies-audit.md");
const OUTPUT_PATH = path.join(ROOT, "docs", "download-assets-anomalies.xlsx");

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
  }).filter((row) => row.app);
}

function xmlEscape(value) {
  return String(value ?? "")
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
  const header = [
    ["app", "exerciseId", "issueType", "slot", "verdict", "action", "currentValue", "target", "note", "decision", "replacementUrl", "replacementFile", "notes"],
    ...rows,
  ];
  const rowXml = header.map((cells, rowIndex) => {
    const cellsXml = cells.map((cell, cellIndex) => {
      const ref = `${columnName(cellIndex)}${rowIndex + 1}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(cell)}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cellsXml}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>
    <col min="1" max="1" width="12" customWidth="1"/>
    <col min="2" max="2" width="16" customWidth="1"/>
    <col min="3" max="3" width="12" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="26" customWidth="1"/>
    <col min="6" max="6" width="24" customWidth="1"/>
    <col min="7" max="7" width="62" customWidth="1"/>
    <col min="8" max="8" width="44" customWidth="1"/>
    <col min="9" max="9" width="54" customWidth="1"/>
    <col min="10" max="10" width="22" customWidth="1"/>
    <col min="11" max="11" width="62" customWidth="1"/>
    <col min="12" max="12" width="36" customWidth="1"/>
    <col min="13" max="13" width="36" customWidth="1"/>
  </cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function makeWorkbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Anomalies" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
}

function makeWorkbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function makeRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function makeContentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;
}

function makeStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function createZip(entries) {
  const fileParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name);
    const dataBuf = Buffer.from(entry.data, "utf8");
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(0, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    fileParts.push(localHeader, nameBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(0, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...fileParts, ...centralParts, end]);
}

if (!fs.existsSync(AUDIT_PATH)) {
  throw new Error(`Audit introuvable : ${AUDIT_PATH}`);
}

const markdown = fs.readFileSync(AUDIT_PATH, "utf8");
const sections = [
  "a_corriger_dans_les_donnees",
  "a_recuperer_manuellement",
  "deja_recupere_localement",
];

const rows = [];
for (const section of sections) {
  const parsed = parseMarkdownTable(section, markdown);
  for (const row of parsed) {
    const action = section === "a_corriger_dans_les_donnees"
      ? "corriger url"
      : section === "a_recuperer_manuellement"
        ? "recuperation manuelle"
        : "verifier page intermediaire";
    rows.push([
      row.app,
      row.exerciseId,
      row.issueType,
      row.slot,
      section,
      action,
      row.currentValue,
      row.target,
      row.note,
      "",
      "",
      "",
      "",
    ]);
  }
}

const zip = createZip([
  { name: "[Content_Types].xml", data: makeContentTypesXml() },
  { name: "_rels/.rels", data: makeRootRelsXml() },
  { name: "xl/workbook.xml", data: makeWorkbookXml() },
  { name: "xl/_rels/workbook.xml.rels", data: makeWorkbookRelsXml() },
  { name: "xl/styles.xml", data: makeStylesXml() },
  { name: "xl/worksheets/sheet1.xml", data: makeSheetXml(rows) },
]);

fs.writeFileSync(OUTPUT_PATH, zip);
console.log(`Fichier genere : ${OUTPUT_PATH}`);
console.log(`Lignes exportees : ${rows.length}`);
