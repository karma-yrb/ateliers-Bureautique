#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/do-commit.sh "type(scope): description" [file...]

Examples:
  scripts/do-commit.sh "fix(word): corrige le score final" apps/word/js/app.js
  scripts/do-commit.sh "docs(repo): ajoute la politique bash"

Behavior:
  - If file paths are provided, only those files are staged and committed.
  - If no file path is provided, only already staged changes are committed.
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

message="$1"
shift

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[do-commit] Ce dossier n'est pas un depot git."
  exit 1
fi

if [[ $# -gt 0 ]]; then
  git add -- "$@"
fi

if git diff --cached --quiet; then
  echo "[do-commit] Aucun changement stage a committer."
  echo "[do-commit] Stage d'abord les bons fichiers, ou passe-les en arguments."
  exit 1
fi

node scripts/validate-commit-message.mjs "$message"
git commit -m "$message"
