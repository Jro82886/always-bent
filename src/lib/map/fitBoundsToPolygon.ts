// src/lib/map/fitBoundsToPolygon.ts
import type { Map as MapboxMap, LngLatBoundsLike } from 'mapbox-gl';

export function fitBoundsToPolygon(
  map: MapboxMap | undefined | null,
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  opts?: {
    padding?: number;           // px
    maxZoom?: number;           // cap zoom-in
    animate?: boolean;          // default true
    durationMs?: number;        // default 900
    minAreaKm2?: number;        // if tiny, use flyTo(center) instead
    onDone?: () => void;
  }
) {
  if (!map || !polygon || !('coordinates' in polygon)) {
    opts?.onDone?.(); return;
  }

  // Flatten all rings into simple [lng,lat] list
  const rings: number[][][] =
    (polygon as GeoJSON.Polygon).coordinates ??
    ((polygon as GeoJSON.MultiPolygon).coordinates?.flat?.() ?? []);

  if (!rings?.length) { opts?.onDone?.(); return; }

  let west =  Infinity, south =  Infinity, east = -Infinity, north = -Infinity;
  for (const ring of rings) {
    for (const [lng, lat] of ring) {
      if (lng < west)  west  = lng;
      if (lng > east)  east  = lng;
      if (lat < south) south = lat;
      if (lat > north) north = lat;
    }
  }

  // min/max sanity
  if (!isFinite(west+east+south+north)) { opts?.onDone?.(); return; }

  const bounds: LngLatBoundsLike = [[west, south], [east, north]];

  // crude area check (deg² → km² at mid lat). good enough for gating tiny snips.
  const midLat = (north + south) / 2;
  const kmpDegLat = 111;
  const kmpDegLng = Math.cos((midLat * Math.PI) / 180) * 111;
  const areaKm2 = Math.max(0, (east - west) * kmpDegLng) * Math.max(0, (north - south) * kmpDegLat);

  const padding = opts?.padding ?? 36;
  const maxZoom  = opts?.maxZoom ?? 12.5;
  const animate  = opts?.animate ?? true;
  const duration = opts?.durationMs ?? 900;

  // If selection is microscopic, a gentle flyTo feels better than a super-zoom jump.
  if (areaKm2 < (opts?.minAreaKm2 ?? 0.3)) {
    const center = [(west + east) / 2, (north + south) / 2] as [number, number];
    map.easeTo({ center, zoom: Math.min(map.getZoom() + 1.4, maxZoom), duration, animate });
    // ensure callback fires after camera settles
    if (opts?.onDone) setTimeout(opts.onDone, duration + 50);
    return;
  }

  // Use 'moveend' once to avoid opening modal early.
  const once = () => {
    map.off('moveend', once);
    opts?.onDone?.();
  };
  map.on('moveend', once);

  map.fitBounds(bounds, {
    padding, maxZoom, duration, animate,
  });
}
