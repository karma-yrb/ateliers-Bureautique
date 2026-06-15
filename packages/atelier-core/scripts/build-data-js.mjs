import fs from "node:fs/promises";
import path from "node:path";

function assertBrowserGlobalName(globalName) {
  if (!/^[A-Z][A-Z0-9_]*$/.test(globalName)) {
    throw new Error(`Nom de globale navigateur invalide : ${globalName}`);
  }
}

export async function buildDataJs({
  root,
  globalName,
  source = "data/exercises.enriched.json",
  target = "data/exercises.js",
  logger = console,
}) {
  if (!root) throw new Error("root est requis");
  assertBrowserGlobalName(globalName);

  const sourcePath = path.join(root, source);
  const targetPath = path.join(root, target);
  const raw = (await fs.readFile(sourcePath, "utf8")).replace(/^\uFEFF/, "");

  JSON.parse(raw);

  const js = `window.${globalName} = ${raw};\n`;
  await fs.writeFile(targetPath, js, "utf8");
  logger.log(`Generated: ${targetPath}`);

  return targetPath;
}
