#!/usr/bin/env bash

ensure_git_on_main() {
  local current_branch

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[release:all] ERREUR: ce dossier n'est pas un depot Git."
    echo "[release:all] Ouvre le dossier clone du depot, ou initialise Git avant de publier."
    return 1
  fi

  current_branch=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$current_branch" != "main" ]]; then
    echo "[release:all] ERREUR: pas sur main (branche actuelle: $current_branch)"
    return 1
  fi
}

latest_release_tag() {
  local tag_prefix="$1"
  git tag --list "${tag_prefix}*" --sort=-v:refname | head -n 1
}

release_needed() {
  local tag_prefix="$1"
  shift

  local last_tag
  last_tag=$(latest_release_tag "$tag_prefix")

  if [[ -z "$last_tag" ]]; then
    return 0
  fi

  if git diff --quiet "$last_tag"..HEAD -- "$@"; then
    return 1
  fi

  return 0
}
