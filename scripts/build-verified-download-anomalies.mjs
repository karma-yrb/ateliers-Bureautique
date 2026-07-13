import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const INPUT_PATH = path.join(ROOT, "tmp-link-checks.json");
const OUTPUT_JSON = path.join(ROOT, "docs", "download-assets-anomalies-verified.json");
const OUTPUT_MD = path.join(ROOT, "docs", "download-assets-anomalies-verified.md");

function statusOf(checks, kind, matcher = null) {
  const candidates = checks.filter((item) => item.kind === kind);
  if (!matcher) return candidates;
  return candidates.filter(matcher);
}

function best(checks, kind, matcher = null) {
  return statusOf(checks, kind, matcher)[0] || null;
}

function classifyCase(row) {
  const currentDoc = best(row.checks, "current.docxUrl");
  const currentDown = best(row.checks, "current.downloadUrl");
  const currentExtras = statusOf(row.checks, "current.extra");
  const pageBinaryLinks = statusOf(row.checks, "page.link", (item) => /application\/zip|officedocument/.test(item.contentType || ""));
  const pageDocLike = pageBinaryLinks.filter((item) => /officedocument/.test(item.contentType || ""));
  const pageZipLike = pageBinaryLinks.filter((item) => /application\/zip/.test(item.contentType || ""));

  const result = {
    app: row.app,
    exerciseId: row.id,
    title: row.title,
    pageUrl: row.pageUrl,
    verdict: "",
    recommendedAction: "",
    recommendedDocxUrl: "",
    recommendedDownloadUrl: "",
    notes: "",
  };

  if (row.id === "excel-ex-041") {
    result.verdict = "corriger_attribution";
    result.recommendedAction = "garder un seul fichier de travail";
    result.recommendedDocxUrl = currentDown && currentDown.status === 200 ? currentDown.url : "";
    result.recommendedDownloadUrl = "";
    result.notes = "Le premier lien actuel est casse (404). Le second lien xlsx est valide et correspond au fichier de travail. Le lien Solution ne doit pas devenir un 2e telechargement visible.";
    return result;
  }

  if (row.id === "ex-034") {
    result.verdict = "recuperation_manuelle_images";
    result.recommendedAction = "garder le docx et remplacer les 2 images externes manuellement";
    result.recommendedDocxUrl = currentDoc && currentDoc.status === 200 ? currentDoc.url : "";
    result.recommendedDownloadUrl = "";
    result.notes = "Le docx est valide. Les deux images Rawpixel repondent 403 et doivent etre recuperees/remplacees manuellement.";
    return result;
  }

  if (["powerpoint-ex-001", "powerpoint-ex-002", "powerpoint-ex-003", "powerpoint-ex-005", "powerpoint-ex-006", "powerpoint-ex-007", "ex-182", "ex-186"].includes(row.id)) {
    result.verdict = "donnee_valide_script_a_corriger";
    result.recommendedAction = "ne pas corriger la donnee, corriger la detection d'extension";
    result.recommendedDocxUrl = currentDoc && currentDoc.status === 200 ? currentDoc.url : "";
    result.recommendedDownloadUrl = currentDown && currentDown.status === 200 ? currentDown.url : "";
    result.notes = "L'URL actuelle telecharge bien un fichier Office (ou Solution) avec content-type correct. Le faux .html vient du script de nommage base sur l'URL au lieu du content-type.";
    return result;
  }

  if ((row.id === "ex-046" || row.id === "ex-066") && currentDoc && currentDoc.status === 404 && currentDown && currentDown.status === 200) {
    result.verdict = "supprimer_faux_docx";
    result.recommendedAction = "supprimer docxUrl et garder seulement le zip";
    result.recommendedDocxUrl = "";
    result.recommendedDownloadUrl = currentDown.url;
    result.notes = "La page source n'expose qu'un zip utile a l'exercice. Aucun docx original valide n'est disponible.";
    return result;
  }

  if ((row.id === "ex-120" || row.id === "ex-130") && currentDoc && currentDoc.status === 404 && pageZipLike.length) {
    result.verdict = "remplacer_par_zip";
    result.recommendedAction = "supprimer docxUrl et garder le zip valide";
    result.recommendedDocxUrl = "";
    result.recommendedDownloadUrl = pageZipLike[0].url;
    result.notes = "La page montre un docx casse, mais un zip valide reste disponible et correspond aux ressources de l'exercice.";
    return result;
  }

  if (currentDoc && currentDoc.status === 404 && !pageZipLike.length && !pageDocLike.some((item) => item.status === 200)) {
    result.verdict = "supprimer_lien_invalide";
    result.recommendedAction = "retirer le telechargement depuis l'app";
    result.recommendedDocxUrl = "";
    result.recommendedDownloadUrl = currentDown && currentDown.status === 200 ? currentDown.url : "";
    result.notes = "Aucun fichier de travail valide n'a ete retrouve sur la page source actuelle.";
    return result;
  }

  result.verdict = "a_verifier_manuellement";
  result.recommendedAction = "controle manuel";
  result.recommendedDocxUrl = currentDoc && currentDoc.status === 200 ? currentDoc.url : "";
  result.recommendedDownloadUrl = currentDown && currentDown.status === 200 ? currentDown.url : "";
  result.notes = "Cas non tranche automatiquement.";
  return result;
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
    ["app", "exerciseId", "title", "verdict", "recommendedAction", "recommendedDocxUrl", "recommendedDownloadUrl", "pageUrl", "notes", "decision", "finalDocxUrl", "finalDownloadUrl", "extraNotes"],
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
    <col min="3" max="3" width="34" customWidth="1"/>
    <col min="4" max="4" width="24" customWidth="1"/>
    <col min="5" max="5" width="28" customWidth="1"/>
    <col min="6" max="6" width="60" customWidth="1"/>
    <col min="7" max="7" width="60" customWidth="1"/>
    <col min="8" max="8" width="48" customWidth="1"/>
    <col min="9" max="9" width="70" customWidth="1"/>
    <col min="10" max="10" width="18" customWidth="1"/>
    <col min="11" max="11" width="60" customWidth="1"/>
    <col min="12" max="12" width="60" customWidth="1"/>
    <col min="13" max="13" width="28" customWidth="1"/>
  </cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`;
}

function makeWorkbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Verified" sheetId="1" r:id="rId1"/></sheets>
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

const rows = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
const verified = rows.map(classifyCase);

fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(verified, null, 2)}\n`);

const md = [
  "# Verification des anomalies de telechargement",
  "",
  `Genere le : ${new Date().toISOString()}`,
  "",
  "| app | exerciseId | verdict | recommendedAction | recommendedDocxUrl | recommendedDownloadUrl |",
  "| --- | --- | --- | --- | --- | --- |",
  ...verified.map((row) => `| ${row.app} | ${row.exerciseId} | ${row.verdict} | ${row.recommendedAction} | ${row.recommendedDocxUrl} | ${row.recommendedDownloadUrl} |`),
  "",
].join("\n");
fs.writeFileSync(OUTPUT_MD, `${md}\n`);

const xlsxRows = verified.map((row) => [
  row.app,
  row.exerciseId,
  row.title,
  row.verdict,
  row.recommendedAction,
  row.recommendedDocxUrl,
  row.recommendedDownloadUrl,
  row.pageUrl,
  row.notes,
  "",
  "",
  "",
  "",
]);

const zip = createZip([
  { name: "[Content_Types].xml", data: makeContentTypesXml() },
  { name: "_rels/.rels", data: makeRootRelsXml() },
  { name: "xl/workbook.xml", data: makeWorkbookXml() },
  { name: "xl/_rels/workbook.xml.rels", data: makeWorkbookRelsXml() },
  { name: "xl/styles.xml", data: makeStylesXml() },
  { name: "xl/worksheets/sheet1.xml", data: makeSheetXml(xlsxRows) },
]);
fs.writeFileSync(path.join(ROOT, "docs", "download-assets-anomalies-verified.xlsx"), zip);

console.log(`Verification ecrite : ${OUTPUT_JSON}`);
