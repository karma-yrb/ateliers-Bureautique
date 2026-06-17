import path from "node:path";
import { validateTextFiles as defaultValidateTextFiles } from "./encoding-guard.mjs";

export async function runValidateEncoding({
  root,
  dataFiles,
  validateDataFiles,
  textRoots = [root],
  validateTextFiles = defaultValidateTextFiles,
  logger = console,
}) {
  if (!root) throw new Error("root est requis");
  if (!Array.isArray(dataFiles)) throw new Error("dataFiles doit être un tableau");
  if (typeof validateDataFiles !== "function") {
    throw new Error("validateDataFiles doit être une fonction");
  }
  if (typeof validateTextFiles !== "function") {
    throw new Error("validateTextFiles doit être une fonction");
  }

  const dataResult = await validateDataFiles(dataFiles);
  const textResult = await validateTextFiles({
    roots: textRoots,
    rootForReport: path.resolve(root, "../.."),
  });

  logger.log("Données:");
  for (const entry of dataResult.report) {
    const absolute = path.join(root, entry.file);
    logger.log(`- ${entry.file}`);
    logger.log(`  kind: ${entry.kind}`);
    logger.log(`  bom: ${entry.hadBom ? "YES" : "no"}`);
    logger.log(`  suspicious: ${entry.suspiciousCount}`);
    if (entry.suspiciousSamples.length > 0) {
      for (const sample of entry.suspiciousSamples) {
        logger.log(`    ${sample.pointer}: ${sample.value}`);
      }
    }
    if (!absolute.startsWith(root)) {
      throw new Error(`Chemin invalide détecté: ${absolute}`);
    }
  }

  logger.log("\nFichiers texte:");
  for (const entry of textResult.report) {
    if (!entry.hadBom && entry.suspiciousCount === 0) continue;
    logger.log(`- ${entry.file}`);
    logger.log(`  bom: ${entry.hadBom ? "YES" : "no"}`);
    logger.log(`  suspicious: ${entry.suspiciousCount}`);
    for (const sample of entry.suspiciousSamples) {
      logger.log(`    ligne ${sample.line}: ${sample.value}`);
    }
  }

  const ok = dataResult.ok && textResult.ok;
  const totalSuspicious = dataResult.totalSuspicious + textResult.totalSuspicious;

  if (!ok) {
    logger.error(`\nValidation encodage échouée. Occurrences suspectes: ${totalSuspicious}`);
  } else {
    logger.log("\nValidation encodage OK.");
  }

  return {
    ...dataResult,
    ok,
    totalSuspicious,
    dataReport: dataResult.report,
    textReport: textResult.report,
  };
}
