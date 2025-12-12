import { NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

type BBox = { minLon: number; minLat: number; maxLon: number; maxLat: number };

function parseBbox(s: string | null): BBox | null {
  if (!s) return null;
  const parts = s.split(',').map((p) => parseFloat(p));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return null;

  // Standard bbox format: minLon, minLat, maxLon, maxLat
  // For East Coast US: lon is negative (-80 to -65), lat is positive (24 to 45)
  // Only swap if it CLEARLY looks like lat,lon order (positive first, negative second)
  const [v0, v1, v2, v3] = parts;
  const looksLikeLatLonOrder = v0 > 0 && v1 < 0 && v2 > 0 && v3 < 0;
  const a = looksLikeLatLonOrder ? [v1, v0, v3, v2] : parts;
  let [minLon, minLat, maxLon, maxLat] = a as [number, number, number, number];
  // Apply small buffer to avoid edge misses
  const buf = parseFloat(process.env.POLYGONS_BBOX_BUFFER_DEG || '0.25');
  if (Number.isFinite(buf) && buf > 0) {
    minLon -= buf; minLat -= buf; maxLon += buf; maxLat += buf;
  }
  if (minLon > maxLon || minLat > maxLat) return null;
  return { minLon, minLat, maxLon, maxLat };
}

function bboxIntersects(a: BBox, b: BBox): boolean {
  return !(a.minLon > b.maxLon || a.maxLon < b.minLon || a.minLat > b.maxLat || a.maxLat < b.minLat);
}

function coordsBBox(coords: any): BBox {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  const walk = (c: any) => {
    if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
      const lon = c[0];
      const lat = c[1];
      if (lon < minLon) minLon = lon;
      if (lat < minLat) minLat = lat;
      if (lon > maxLon) maxLon = lon;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(c)) {
      for (const cc of c) walk(cc);
    }
  };
  walk(coords);
  return { minLon, minLat, maxLon, maxLat };
}

function featureBBox(f: any): BBox | null {
  if (!f || !f.geometry) return null;
  const g = f.geometry;
  if (g.type === 'GeometryCollection') {
    let agg: BBox | null = null;
    for (const sub of g.geometries || []) {
      const bb = coordsBBox(sub.coordinates);
      if (!agg) agg = { ...bb };
      else {
        agg.minLon = Math.min(agg.minLon, bb.minLon);
        agg.minLat = Math.min(agg.minLat, bb.minLat);
        agg.maxLon = Math.max(agg.maxLon, bb.maxLon);
        agg.maxLat = Math.max(agg.maxLat, bb.maxLat);
      }
    }
    return agg;
  }
  if (!g.coordinates) return null;
  return coordsBBox(g.coordinates);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bboxParam = url.searchParams.get('bbox');
    const _time = url.searchParams.get('time');
    const _daysBack = url.searchParams.get('days_back');
    const _gsUrl = url.searchParams.get('gs_url');

    // Try Railway backend first (server-side to avoid CORS issues)
    const railwayUrl = process.env.NEXT_PUBLIC_POLYGONS_URL || process.env.POLYGONS_BACKEND_URL;
    if (railwayUrl && bboxParam) {
      try {
        // Convert bbox from Mapbox format (minLon,minLat,maxLon,maxLat)
        // to Railway format (minLat,minLon,maxLat,maxLon)
        const parts = bboxParam.split(',');
        if (parts.length !== 4) throw new Error('Invalid bbox');
        const [minLon, minLat, maxLon, maxLat] = parts;
        const railwayBbox = `${minLat},${minLon},${maxLat},${maxLon}`;

        // Use AbortController for timeout (5 seconds max)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${railwayUrl}/ocean-features/real?bbox=${railwayBbox}`, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
          next: { revalidate: 300 } // Cache for 5 minutes
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const railwayData = await res.json();
          if (railwayData?.features?.length > 0) {
            // Normalize feature_type to class for frontend compatibility
            railwayData.features = railwayData.features.map((f: any) => {
              if (f.properties?.feature_type && !f.properties?.class) {
                let mappedClass = f.properties.feature_type;
                if (mappedClass === 'thermal_front') mappedClass = 'edge';
                return { ...f, properties: { ...f.properties, class: mappedClass } };
              }
              return f;
            });
            return new Response(JSON.stringify(railwayData), {
              status: 200,
              headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300' },
            });
          }
        }
      } catch (e) {
        console.log('[/api/polygons] Railway fetch failed, using static fallback');
      }
    }

    // Fall back to static GeoJSON
    const bbox = parseBbox(bboxParam);

    const dataPathCandidates = [
      path.join(process.cwd(), 'public', 'abfi_sst_edges_latest.geojson'),
      path.join(process.cwd(), 'public', 'abfi_sst_edges_sample.geojson'),
    ];

    let raw: string | null = null;
    for (const p of dataPathCandidates) {
      try {
        raw = await fs.readFile(p, 'utf8');
        if (raw) break;
      } catch {}
    }
    if (!raw) {
      return new Response(JSON.stringify({ error: 'No polygons dataset found' }), {
        status: 404,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
      });
    }

    const gj = JSON.parse(raw);
    if (!bbox || !Array.isArray(gj?.features)) {
      return new Response(JSON.stringify(gj), {
        status: 200,
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
      });
    }

    const out = { type: 'FeatureCollection', features: [] as any[] };
    for (const f of gj.features) {
      const fb = featureBBox(f);
      if (!fb) continue;
      if (bboxIntersects(bbox, fb)) out.features.push(f);
    }

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=30' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'polygons_failed', message: String(err?.message || err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}


