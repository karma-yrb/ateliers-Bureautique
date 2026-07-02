import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BROWSER_RUNTIME_FILES } from "../runtime-contract.mjs";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function syncBrowserRuntime({
  appRoot,
  files = BROWSER_RUNTIME_FILES,
  logger = console,
}) {
  if (!appRoot) throw new Error("appRoot est requis");

  let changed = 0;

  for (const { src, dst } of files) {
    const srcPath = path.join(PACKAGE_ROOT, src);
    const dstPath = path.join(appRoot, dst);
    mkdirSync(path.dirname(dstPath), { recursive: true });
    copyFileSync(srcPath, dstPath);
    logger.log(`[sync-runtime] Synchronisé : ${src} → ${dst}`);
    changed += 1;
  }

  logger.log(`[sync-runtime] Terminé. ${changed} fichier(s) synchronisé(s).`);
  return changed;
}
