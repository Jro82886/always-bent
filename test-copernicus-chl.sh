#!/bin/bash

# Test Copernicus Chlorophyll WMTS endpoint
# This tests if your credentials and layer path are correct

echo "Testing Copernicus Chlorophyll layer..."
echo "Using credentials for: jrosenkilde"

# Test with a known tile (zoom 3, Eastern US coast)
# Date: yesterday (adjust if needed)
YESTERDAY=$(date -u -d "yesterday" '+%Y-%m-%d')
TIME="${YESTERDAY}T00:00:00.000Z"

echo "Testing with date: $TIME"

curl -u "jrosenkilde:Alwaysbent82886!" \
  "https://wmts.marine.copernicus.eu/teroWmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=OCEANCOLOUR_GLO_BGC_L4_NRT_009_102/cmems_obs-oc_glo_bgc-plankton_nrt_l4-gapfree-multi-4km_P1D/chl&STYLE=default&FORMAT=image/png&TILEMATRIXSET=EPSG:3857&TILEMATRIX=3&TILEROW=2&TILECOL=2&TIME=${TIME}" \
  -o test-chl-copernicus.png \
  -w "\nHTTP Status: %{http_code}\n"

if [ -f "test-chl-copernicus.png" ]; then
  echo "Success! Check test-chl-copernicus.png"
  echo "File size: $(ls -lh test-chl-copernicus.png | awk '{print $5}')"
else
  echo "Failed to download chlorophyll tile"
fi
