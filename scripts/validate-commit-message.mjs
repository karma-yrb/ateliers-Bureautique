import { readFileSync } from "node:fs";
import { validateCommitSubject } from "../packages/atelier-core/scripts/validate-release-commits.mjs";

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error("[commit-msg] Usage: node scripts/validate-commit-message.mjs <message-file|message>");
    process.exitCode = 1;
    return;
  }

  let subject = input;

  try {
    subject = readFileSync(input, "utf8").split(/\r?\n/, 1)[0]?.trim() || "";
  } catch {
    subject = input.trim();
  }

  const result = validateCommitSubject(subject);
  if (result.ok) {
    return;
  }

  console.error(`[commit-msg] Message invalide: "${subject}"`);
  console.error(`[commit-msg] Raison: ${result.reason}`);
  console.error("[commit-msg] Format attendu: type(scope): description");
  console.error("[commit-msg] Exemples: fix(homepage): display version badge, chore(release): 1.0.1");
  process.exitCode = 1;
}

main();
