const VERSION_REGEX = /(<(?:span|a) class="app-version"[^>]*>\s*)v?(\d+\.\d+\.\d+)(\s*<\/(?:span|a)>)/;
const ASSET_VERSION_REGEX = /((?:src|href)=")(?!https?:\/\/|\/\/|#)([^"?#]+?\.(?:css|js))(?:\?v=[^"#]*)?(")/g;

module.exports.readVersion = function readVersion(contents) {
  const match = String(contents || "").match(VERSION_REGEX);
  if (!match) {
    throw new Error("Version introuvable dans le header HTML (.app-version).");
  }
  return match[2];
};

module.exports.writeVersion = function writeVersion(contents, version) {
  if (!version) return contents;
  return String(contents || "")
    .replace(VERSION_REGEX, `$1v${version}$3`)
    .replace(ASSET_VERSION_REGEX, `$1$2?v=${version}$3`);
};
