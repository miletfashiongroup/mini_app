#!/usr/bin/env bash
set -euo pipefail

# Blocks direct work on main unless explicitly allowed.

branch="${GITHUB_REF##*/}"
if [[ -z "${branch}" || "${branch}" == "refs"* ]]; then
  branch="$(git symbolic-ref --short HEAD 2>/dev/null || echo unknown)"
fi

if [[ "${branch}" == "main" && "${ALLOW_MAIN_PUSH:-false}" != "true" ]]; then
  echo "Direct commits to main are not allowed. Create a feature branch and open a PR." >&2
  exit 1
fi

echo "Branch protection check passed for branch ${branch}"
