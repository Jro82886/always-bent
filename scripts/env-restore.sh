#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

LATEST="$(ls -1 .env.local.bak.* 2>/dev/null | sort -r | head -n1 || true)"
if [[ -z "${LATEST}" ]]; then
  echo "No .env.local.bak.* backups found" >&2
  exit 1
fi

cp "$LATEST" .env.local
echo "Restored .env.local from $LATEST"

