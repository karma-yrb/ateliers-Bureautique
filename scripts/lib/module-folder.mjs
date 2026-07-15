export function slugify(value, fallback = "module") {
  const slug = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function padOrder(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "00";
  return String(Math.trunc(numeric)).padStart(2, "0");
}

function normalizeSection(section) {
  return slugify(section || "modules", "modules");
}

function buildModuleSlug(exercise) {
  const explicitSlug = String(exercise.moduleSlug || "").trim();
  if (explicitSlug) return slugify(explicitSlug, "module");

  const cleanName = String(exercise.moduleNameClean || exercise.moduleName || "").trim();
  if (cleanName) return slugify(cleanName, "module");

  const moduleId = String(exercise.moduleId || "").trim();
  return slugify(moduleId, "module");
}

export function buildCanonicalModuleFolder(exercise) {
  const section = normalizeSection(exercise.section);
  const order = padOrder(exercise.orderInSection);
  const slug = buildModuleSlug(exercise);
  return `${section}-${order}-${slug}`;
}

export function buildLegacyModuleFolder(exercise) {
  const moduleId = String(exercise.moduleId || "").trim();
  const moduleName = String(exercise.moduleNameClean || exercise.moduleName || "").trim();

  if (moduleId.startsWith("m")) {
    return `${moduleId}-${slugify(moduleName, "module")}`;
  }

  return slugify(moduleId || moduleName, "module");
}
