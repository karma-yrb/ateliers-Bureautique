import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

export const DEFAULT_SYNC_ITEMS = [
  { src: "js", dst: "app/js" },
  { src: "data", dst: "app/data" },
  { src: "styles.css", dst: "app/styles.css" },
  { src: "styles-redesign-v2.css", dst: "app/styles-redesign-v2.css" },
  { src: "index.html", dst: "app/index.html" },
];

function copyRecursive(src, dst) {
  const stat = statSync(src);

  if (stat.isDirectory()) {
    mkdirSync(dst, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }
    return;
  }

  mkdirSync(path.dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}

export function syncApp({ root, items = DEFAULT_SYNC_ITEMS, logger = console }) {
  if (!root) throw new Error("root est requis");

  let changed = 0;

  for (const { src, dst } of items) {
    const srcPath = path.join(root, src);
    const dstPath = path.join(root, dst);

    if (!existsSync(srcPath)) {
      logger.warn(`[sync-app] Source introuvable, ignorée : ${src}`);
      continue;
    }

    copyRecursive(srcPath, dstPath);
    logger.log(`[sync-app] Synchronisé : ${src} → ${dst}`);
    changed += 1;
  }

  logger.log(`[sync-app] Terminé. ${changed} élément(s) synchronisé(s).`);
  return changed;
}
