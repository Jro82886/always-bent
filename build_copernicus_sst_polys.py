#!/usr/bin/env python3
"""
ABFI SST Polygon Builder (stub-friendly)

Usage (local):
  python build_copernicus_sst_polys.py --bbox -77,33,-70,40 --date 2025-09-02 --out public/abfi_sst_edges_latest.geojson

Behavior:
  - If full scientific deps are installed (copernicusmarine/xarray/rioxarray/rasterio/geopandas/shapely/pyproj/numpy/scikit-image),
    you can expand this script with the extraction pipeline.
  - If deps are missing, it will copy an existing demo file from public/abfi_sst_edges_sample.geojson
    to the requested --out path so your UI keeps working while pipelines are wired up.
"""

from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path


DEMO_SRC = Path("public/abfi_sst_edges_sample.geojson")


def write_demo(out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if DEMO_SRC.exists():
        out_path.write_bytes(DEMO_SRC.read_bytes())
        print(f"[abfi] Wrote demo polygons → {out_path}")
    else:
        # minimal empty collection fallback
        out_path.write_text(json.dumps({"type": "FeatureCollection", "features": []}))
        print(f"[abfi] Demo source missing; wrote empty FeatureCollection → {out_path}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset-id", default="METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2")
    ap.add_argument("--var", default="analysed_sst")
    ap.add_argument("--date", required=True, help="YYYY-MM-DD (UTC)")
    ap.add_argument("--bbox", required=True, help="minLon,minLat,maxLon,maxLat")
    ap.add_argument("--out", required=True, help="output GeoJSON path")
    args = ap.parse_args()

    out_path = Path(args.out)

    # Try to detect if scientific stack is available; if not, write demo file.
    try:
        import numpy as _np  # noqa: F401
        import xarray as _xr  # noqa: F401
        import geopandas as _gpd  # noqa: F401
        import shapely.geometry as _geom  # noqa: F401
        import shapely.ops as _ops  # noqa: F401
        import skimage.measure as _measure  # noqa: F401

        # When ABFI_ENABLE_REAL is set, attempt a real fetch + polygonization
        if os.environ.get("ABFI_ENABLE_REAL", "0") == "1":
            try:
                # Allow CMEMS creds via either COPERNICUSMARINE_* or CMEMS_* envs
                if os.environ.get("CMEMS_USERNAME") and not os.environ.get("COPERNICUSMARINE_USERNAME"):
                    os.environ["COPERNICUSMARINE_USERNAME"] = os.environ["CMEMS_USERNAME"]
                if os.environ.get("CMEMS_PASSWORD") and not os.environ.get("COPERNICUSMARINE_PASSWORD"):
                    os.environ["COPERNICUSMARINE_PASSWORD"] = os.environ["CMEMS_PASSWORD"]

                # Lazy import to avoid forcing dependency during demo use
                from copernicusmarine import subset as cm_subset

                # Parse bbox
                try:
                    min_lon, min_lat, max_lon, max_lat = [float(v) for v in str(args.bbox).split(",")]
                except Exception:
                    raise ValueError("--bbox must be minLon,minLat,maxLon,maxLat")

                date = args.date
                tmp_dir = Path("/tmp/abfi_sst")
                tmp_dir.mkdir(parents=True, exist_ok=True)
                out_nc = tmp_dir / "sst.nc"

                # Request a one-day, one-var spatial subset
                cm_subset(
                    dataset_id=args.dataset_id,
                    variables=[args.var],
                    minimum_longitude=min_lon,
                    maximum_longitude=max_lon,
                    minimum_latitude=min_lat,
                    maximum_latitude=max_lat,
                    start_datetime=f"{date}T00:00:00Z",
                    end_datetime=f"{date}T23:59:59Z",
                    output_directory=str(tmp_dir),
                    output_filename=out_nc.name,
                    force_download=True,
                )

                # Open the subset and locate the SST variable
                ds = _xr.open_dataset(out_nc)
                var_name = None
                for candidate in [args.var, "analysed_sst", "sst", "sea_surface_temperature"]:
                    if candidate in ds.data_vars:
                        var_name = candidate
                        break
                if var_name is None:
                    raise RuntimeError("SST variable not found in subset")

                da = ds[var_name]
                if "time" in da.dims:
                    da = da.isel(time=0)

                # Expect dims like (lat, lon) or (y, x); find coordinate names
                lon_name = None
                lat_name = None
                for name in list(ds.coords) + list(da.dims):
                    lname = name.lower()
                    if lon_name is None and ("lon" in lname or lname == "x"):
                        lon_name = name
                    if lat_name is None and ("lat" in lname or lname == "y"):
                        lat_name = name
                if lon_name is None or lat_name is None:
                    # Try common fallback names
                    lon_name = lon_name or "longitude"
                    lat_name = lat_name or "latitude"
                if lon_name not in ds and lon_name not in da.coords:
                    raise RuntimeError("Longitude coordinate not found")
                if lat_name not in ds and lat_name not in da.coords:
                    raise RuntimeError("Latitude coordinate not found")

                lon_vals = (ds[lon_name] if lon_name in ds else da.coords[lon_name]).values
                lat_vals = (ds[lat_name] if lat_name in ds else da.coords[lat_name]).values

                # Convert Celsius→Fahrenheit for interpretability
                arr_c = _np.asarray(da.values)
                arr_f = (arr_c * 9.0 / 5.0) + 32.0

                # Compute gradient magnitude (very simple front detector)
                gy, gx = _np.gradient(arr_f)
                grad = _np.sqrt(gx * gx + gy * gy)

                # Threshold (degF per grid step). Tune as needed.
                mask = grad > float(os.environ.get("ABFI_GRAD_THRESH_F", "0.8"))

                # Extract contours around high-gradient regions
                contours = _measure.find_contours(mask.astype(float), 0.5)

                features: list[dict] = []
                # Build polygons by mapping pixel indices to lon/lat via coord arrays
                # Note: row index corresponds to latitude index, col index to longitude index
                lat_len = lat_vals.shape[0]
                lon_len = lon_vals.shape[0]

                # Ensure 1D coordinate arrays (some datasets are 2D)
                if lat_vals.ndim > 1:
                    lat_vals_1d = lat_vals[:, 0]
                else:
                    lat_vals_1d = lat_vals
                if lon_vals.ndim > 1:
                    lon_vals_1d = lon_vals[0, :]
                else:
                    lon_vals_1d = lon_vals

                for contour in contours:
                    # contour is array of (row, col) indices in image space
                    if contour.shape[0] < 8:
                        continue
                    # Clamp to valid index range
                    rows = _np.clip(contour[:, 0].astype(int), 0, lat_len - 1)
                    cols = _np.clip(contour[:, 1].astype(int), 0, lon_len - 1)
                    # Map to lon/lat
                    lats = lat_vals_1d[rows]
                    lons = lon_vals_1d[cols]
                    coords = [(float(lon), float(lat)) for lon, lat in zip(lons, lats)]
                    # Close the ring
                    if coords[0] != coords[-1]:
                        coords.append(coords[0])

                    poly = _geom.Polygon(coords)
                    if not poly.is_valid:
                        poly = poly.buffer(0)
                    # Drop tiny slivers
                    if poly.is_empty or poly.area < 1e-5:
                        continue

                    # Very naive classification by perimeter (placeholder)
                    klass = "edge"
                    if poly.area > 0.25:  # degrees^2 – rough size filter
                        klass = "eddy"
                    elif poly.length > 1.0:
                        klass = "filament"

                    feat = {
                        "type": "Feature",
                        "properties": {
                            "class": klass,
                            "source": "cmems",
                            "date": date,
                            "var": var_name,
                        },
                        "geometry": _geom.mapping(poly),
                    }
                    features.append(feat)

                # If extraction produced nothing, fall back to demo for UX
                if not features:
                    write_demo(out_path)
                    return 0

                out_path.parent.mkdir(parents=True, exist_ok=True)
                out_path.write_text(json.dumps({"type": "FeatureCollection", "features": features}))
                print(f"[abfi] Wrote real polygons → {out_path}  (features={len(features)})")
                return 0
            except Exception as real_err:
                print(f"[abfi] Real pipeline failed, using demo fallback: {real_err}")
                write_demo(out_path)
                return 0

        # Default: keep demo behavior for light dev setups
        write_demo(out_path)
        return 0
    except Exception as e:  # missing deps or other issues → demo fallback
        print(f"[abfi] Using demo polygons (deps missing or pipeline not enabled): {e}")
        write_demo(out_path)
        return 0


if __name__ == "__main__":
    sys.exit(main())


