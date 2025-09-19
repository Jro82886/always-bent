#!/usr/bin/env bash
set -euo pipefail
FAIL=0

echo "🔍 Checking for contract violations..."
echo ""

# Inlet: block camera moves & layer flips
echo "1️⃣ Checking for inlet-triggered camera moves..."
rg -n "(fitBounds|flyTo|easeTo).*(inlet|selectedInlet)|(inlet|selectedInlet).*(fitBounds|flyTo|easeTo)" src && { echo "❌ Inlet camera move"; FAIL=1; } || echo "✅ No inlet camera moves found."
echo ""

echo "2️⃣ Checking for inlet-triggered layer toggles..."
rg -n "selectedInlet(Id)?.*(toggle|set.*Visibility|set.*Opacity)" src && { echo "❌ Inlet layer flip"; FAIL=1; } || echo "✅ No inlet layer flips found."
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✅ All contract checks passed!"
else
  echo "❌ Contract violations found. Please fix before committing."
fi

exit $FAIL
