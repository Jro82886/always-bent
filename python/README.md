# ABFI Numeric Polygons Service (FastAPI)

A minimal FastAPI service that fetches MUR SST from ERDDAP griddap (jplMURSST41), computes contour-based polygons (edges), and returns GeoJSON.

## Quickstart

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GRIDDAP_BASE="https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.nc"
uvicorn app.main:app --host 0.0.0.0 --port 8010

## Test

curl "http://localhost:8010/polygons?time=2023-06-01&bbox=-77,32,-71,36" | jq '.features | length'

## Wire Next.js proxy

Set in .env.local:

POLYGONS_BACKEND_URL=http://localhost:8010/polygons
NEXT_PUBLIC_SST_POLYGONS_URL=/api/polygons

Then the frontend will call Next /api/polygons which proxies to the Python service.

## Notes
- Uses xarray + griddap NetCDF; time matches nearest day.
- Contour levels auto-derived from 10–90th percentile, ~8 levels.
- Output is simplified polygons labeled { type: edge, level }.
