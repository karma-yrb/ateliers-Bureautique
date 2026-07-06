import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

import {
  DATA_FILES,
  repairMojibakeString,
  validateDataFiles,
  validateTextFiles,
} from "../scripts/encoding-guard.mjs";

test("repairMojibakeString repairs common UTF-8 mojibake", () => {
  assert.equal(repairMojibakeString("T\u00c3\u0192\u00c2\u00a9l\u00c3\u0192\u00c2\u00a9charger"), "Télécharger");
  assert.equal(repairMojibakeString("S\u00c3\u0192\u00c2\u00a9lectionner"), "Sélectionner");
  assert.equal(
    repairMojibakeString("\u00c3\u00b0\u00c5\u00b8\u00e2\u20ac\u201c\u00c2\u00a5\u00c3\u00af\u00c2\u00b8\u00c2\u008f Prise en main"),
    "\u{1f5a5}\ufe0f Prise en main",
  );
});

test("data files are parseable and encoding-safe", async () => {
  const result = await validateDataFiles(DATA_FILES);
  assert.equal(result.ok, true, JSON.stringify(result.report, null, 2));
  assert.equal(result.totalSuspicious, 0, "Mojibake résiduel détecté dans les données.");
});

test("text file validation catches mojibake outside data files", async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "powerpoint-encoding-"));

  try {
    await fs.writeFile(
      path.join(tempDir, "view.js"),
      `const brokenCaption = "\u00c3\u2030nonc\u00c3\u00a9";\nconst validTitle = "Pyramides des âges";\n`,
      "utf8",
    );

    const result = await validateTextFiles({ roots: [tempDir], rootForReport: tempDir });

    assert.equal(result.ok, false);
    assert.equal(result.totalSuspicious, 1);
    assert.equal(result.report[0].suspiciousSamples[0].line, 1);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
