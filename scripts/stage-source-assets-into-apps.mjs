import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "downloads-assets-source-all");

const APPS = [
  { app: "word", sourceDir: path.join(SOURCE_ROOT, "word"), targetDir: path.join(ROOT, "apps", "word", "data", "assets", "word") },
  { app: "excel", sourceDir: path.join(SOURCE_ROOT, "excel"), targetDir: path.join(ROOT, "apps", "excel", "data", "assets", "excel") },
  { app: "powerpoint", sourceDir: path.join(SOURCE_ROOT, "powerpoint"), targetDir: path.join(ROOT, "apps", "powerpoint", "data", "assets", "powerpoint") },
];

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (fs.existsSync(dst) && !fs.statSync(dst).isDirectory()) {
      fs.rmSync(dst, { force: true, recursive: true });
    }
    fs.mkdirSync(dst, { recursive: true });

    const sourceEntries = fs.readdirSync(src);
    const sourceNames = new Set(sourceEntries);

    for (const entry of sourceEntries) {
      copyRecursive(path.join(src, entry), path.join(dst, entry));
    }

    for (const entry of fs.readdirSync(dst)) {
      if (!sourceNames.has(entry)) {
        fs.rmSync(path.join(dst, entry), { force: true, recursive: true });
      }
    }
    return;
  }

  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.existsSync(dst) && fs.statSync(dst).isDirectory()) {
    fs.rmSync(dst, { force: true, recursive: true });
  }
  fs.copyFileSync(src, dst);
}

function countFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) return 1;

  let total = 0;
  for (const entry of fs.readdirSync(dirPath)) {
    total += countFiles(path.join(dirPath, entry));
  }
  return total;
}

if (!fs.existsSync(SOURCE_ROOT)) {
  throw new Error(`Miroir source introuvable : ${SOURCE_ROOT}`);
}

for (const config of APPS) {
  if (!fs.existsSync(config.sourceDir)) {
    console.log(`${config.app}: source absente, rien a copier.`);
    continue;
  }

  copyRecursive(config.sourceDir, config.targetDir);
  console.log(`${config.app}: ${countFiles(config.targetDir)} fichier(s) synchronise(s) vers ${path.relative(ROOT, config.targetDir)}`);
}

console.log("Synchronisation locale des source-assets terminee.");
