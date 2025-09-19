#!/bin/bash

echo "=== Testing Copernicus CHL with viridis style ==="

# Your Copernicus credentials
USER="arosenkilde@gmail.com"
PASS="Siesta4109Key!"

# Test GetCapabilities first
echo -e "\n1. Testing GetCapabilities..."
curl -s -u "$USER:$PASS" \
  "https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetCapabilities&VERSION=1.0.0" \
  > capabilities.xml

if [ $? -eq 0 ]; then
  echo "✅ GetCapabilities successful"
  # Check if viridis style exists
  grep -i "viridis" capabilities.xml && echo "✅ Found viridis style" || echo "⚠️ No viridis style found"
  # Check available styles for CHL layer
  echo -e "\nAvailable CHL styles:"
  grep -A5 -B5 "OCEANCOLOUR_GLO_BGC_L4_MY_009_104" capabilities.xml | grep -E "<Style>|<Identifier>" | head -20
else
  echo "❌ GetCapabilities failed"
fi

# Test actual tile with viridis
echo -e "\n2. Testing CHL tile with cmap:viridis..."
TEST_URL="https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:viridis&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX=5&TILEROW=12&TILECOL=9&TIME=2025-01-17T00:00:00.000Z"

curl -s -u "$USER:$PASS" \
  -H "Accept: image/png" \
  -o test-chl-viridis.png \
  -w "\nHTTP Status: %{http_code}\nContent-Type: %{content_type}\nSize: %{size_download} bytes\n" \
  "$TEST_URL"

if [ -f "test-chl-viridis.png" ] && [ -s "test-chl-viridis.png" ]; then
  echo "✅ Viridis tile downloaded successfully"
  file test-chl-viridis.png
else
  echo "❌ Viridis tile download failed"
fi

# Test with turbo for comparison
echo -e "\n3. Testing CHL tile with cmap:turbo (for comparison)..."
TEST_URL_TURBO="https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_MY_009_104/cmems_obs-oc_glo_bgc-plankton_my_l4-gapfree-multi-4km_P1D/CHL&STYLE=cmap:turbo&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX=5&TILEROW=12&TILECOL=9&TIME=2025-01-17T00:00:00.000Z"

curl -s -u "$USER:$PASS" \
  -H "Accept: image/png" \
  -o test-chl-turbo.png \
  -w "\nHTTP Status: %{http_code}\nContent-Type: %{content_type}\nSize: %{size_download} bytes\n" \
  "$TEST_URL_TURBO"

if [ -f "test-chl-turbo.png" ] && [ -s "test-chl-turbo.png" ]; then
  echo "✅ Turbo tile downloaded successfully"
  file test-chl-turbo.png
else
  echo "❌ Turbo tile download failed"
fi

echo -e "\n✅ Test complete. Check test-chl-viridis.png and test-chl-turbo.png"
