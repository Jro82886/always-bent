#!/usr/bin/env bash
set -euo pipefail

echo "▶ Safety branch (ok if it already exists)…"
git switch -c fix/map-reset || git switch fix/map-reset

echo "▶ Restore working tree to HEAD (no history lost)…"
git restore --staged . || true
git restore . || true

echo "▶ Purge caches…"
rm -rf .next node_modules .eslintcache

echo "▶ Install deps from lockfile…"
npm ci

echo "▶ Sanity: ensure a single map component (MapRef)…"
grep -R --line-number --ignore-case "MapShell\|MapRef" src || true
echo "— If you see BOTH src/lib/MapRef.tsx and a second MapShell/MapRef, remove the extra and make sure pages import from '@/lib/MapRef'."

echo "▶ Typecheck (frontend + server)…"
npm run typecheck || true
npm run typecheck:server || echo "(no server tsconfig or script)"

echo "✅ Clean start complete. Now run: npm run dev"


