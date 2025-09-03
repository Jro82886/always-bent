#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env.local ]]; then
  echo "No .env.local found" >&2
  exit 1
fi
TS="$(date +%s)"
cp .env.local ".env.local.bak.$TS"
echo ".env.local backed up to .env.local.bak.$TS"

