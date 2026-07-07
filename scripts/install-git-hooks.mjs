import { execFileSync } from "node:child_process";

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
    stdio: "inherit",
  });
  console.log("[hooks] core.hooksPath configure sur .githooks");
} catch (error) {
  console.error("[hooks] Impossible de configurer core.hooksPath sur .githooks.");
  process.exitCode = 1;
}
