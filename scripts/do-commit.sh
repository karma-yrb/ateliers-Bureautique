#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/do-commit.sh [--dry-run] "type(scope): description" [file...]

Examples:
  scripts/do-commit.sh "fix(word): corrige le score final" apps/word/js/app.js
  scripts/do-commit.sh --dry-run "fix(word): corrige le score final" apps/word/js/app.js
  scripts/do-commit.sh "docs(repo): ajoute la politique bash"

Behavior:
  - If file paths are provided, only those files are staged and committed.
  - If no file path is provided, only already staged changes are committed.
  - Refuses to commit if unrelated files are already staged.
  - --dry-run previews the commit scope without creating the commit.
EOF
}

die() {
  echo "[do-commit] $1" >&2
  exit 1
}

print_list() {
  local prefix="$1"
  shift
  local item
  for item in "$@"; do
    echo "${prefix}${item}"
  done
}

readarray_lines() {
  local output
  if ! output="$("$@" 2>/dev/null)"; then
    return 1
  fi

  if [[ -z "$output" ]]; then
    return 0
  fi

  mapfile -t REPLY <<<"$output"
}

dry_run=0

if [[ $# -gt 0 && "$1" == "--dry-run" ]]; then
  dry_run=1
  shift
fi

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

message="$1"
shift

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  die "Ce dossier n'est pas un depot git."
fi

declare -a targets=("$@")
declare -a staged_before=()
declare -a staged_after=()
declare -a outside_scope=()

readarray_lines git diff --cached --name-only || true
staged_before=("${REPLY[@]:-}")

if [[ $# -gt 0 ]]; then
  git add -- "$@"
fi

if git diff --cached --quiet; then
  die "Aucun changement stage a committer. Stage d'abord les bons fichiers, ou passe-les en arguments."
fi

readarray_lines git diff --cached --name-only || true
staged_after=("${REPLY[@]:-}")

if [[ ${#targets[@]} -gt 0 ]]; then
  for staged_file in "${staged_after[@]}"; do
    if [[ ! " ${targets[*]} " =~ (^|[[:space:]])${staged_file//./\\.}($|[[:space:]]) ]]; then
      outside_scope+=("$staged_file")
    fi
  done
fi

if [[ ${#outside_scope[@]} -gt 0 ]]; then
  echo "[do-commit] Des fichiers deja stages sortent du perimetre demande :"
  print_list "  - " "${outside_scope[@]}"
  die "Nettoie le staging ou relance sans liste de fichiers si tu veux committer tout le staging."
fi

node scripts/validate-commit-message.mjs "$message"

echo "[do-commit] Message valide : $message"
echo "[do-commit] Fichiers qui seront commités :"
print_list "  - " "${staged_after[@]}"

if [[ $dry_run -eq 1 ]]; then
  echo "[do-commit] Dry run termine. Aucun commit cree."
  exit 0
fi

git commit -m "$message"
