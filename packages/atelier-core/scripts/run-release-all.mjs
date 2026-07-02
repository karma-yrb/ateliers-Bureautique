import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

export function runReleaseAll({
  scriptPath = "scripts/release-all.sh",
  processImpl = process,
  spawnSyncImpl = spawnSync,
  existsSyncImpl = existsSync,
  exitOnComplete = true,
} = {}) {
  const gitBash = processImpl.env.LOCALAPPDATA
    ? join(processImpl.env.LOCALAPPDATA, "Programs", "Git", "bin", "bash.exe")
    : "";
  const bashCommand = processImpl.platform === "win32" && existsSyncImpl(gitBash) ? gitBash : "bash";
  const result = spawnSyncImpl(bashCommand, [scriptPath], {
    stdio: "inherit",
  });

  const status = result.status ?? 1;
  if (exitOnComplete) {
    processImpl.exit(status);
  }
  return status;
}
