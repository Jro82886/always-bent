#!/usr/bin/env bash
set -euo pipefail
FAIL=0

echo "🔍 Checking for Inlet Contract vFinal violations..."
echo ""

# Disallow camera moves tied to inlet selection/state
echo "1️⃣ Checking for inlet-triggered camera moves..."
if rg -n "(fitBounds|flyTo|easeTo).*(inlet|selectedInlet)|(inlet|selectedInlet).*(fitBounds|flyTo|easeTo)" src; then
  echo "❌ Inlet-triggered camera move detected."
  FAIL=1
else
  echo "✅ No inlet-triggered camera moves found."
fi
echo ""

# Disallow inlet-triggered layer flips
echo "2️⃣ Checking for inlet-triggered layer toggles..."
if rg -n "selectedInlet(Id)?.*(toggle|set.*Visibility|set.*Opacity)" src; then
  echo "❌ Inlet-triggered layer toggle detected."
  FAIL=1
else
  echo "✅ No inlet-triggered layer toggles found."
fi
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✅ All inlet contract checks passed!"
else
  echo "❌ Inlet contract violations found. Please fix before committing."
fi

exit $FAIL
