#!/usr/bin/env bash
set -euo pipefail

# Placeholder staging deploy script. Requires STAGING_HOST, STAGING_SSH_KEY, STAGING_PATH secrets.

if [[ -z "${STAGING_HOST:-}" || -z "${STAGING_SSH_KEY:-}" || -z "${STAGING_PATH:-}" ]]; then
  echo "Staging deploy skipped: STAGING_HOST/STAGING_SSH_KEY/STAGING_PATH not provided." >&2
  exit 0
fi

echo "Would deploy to ${STAGING_HOST}:${STAGING_PATH} using provided key."
echo "Add rsync/scp/ssh commands here once secrets are configured."
