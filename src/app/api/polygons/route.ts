import { NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-dynamic';

type BBox = { minLon: number; minLat: number; maxLon: number; maxLat: number };

function parseBbox(s: string | null): BBox | null {
  if (!s) return null;
  const parts = s.split(',').map((p) => parseFloat(p));
  if (parts.length !== 4 || parts.some((v) => Number.isNaN(v))) return null;
  const [minLatMaybe, minLonMaybe, maxLatMaybe, maxLonMaybe] = parts; // callers may send lat,lon order by mistake
  // Heuristic: if first value looks like latitude (|v| <= 90) and second looks like longitude (|v| <= 180), swap to lon,lat
  const looksLatLon = Math.abs(minLatMaybe) <= 90 && Math.abs(minLonMaybe) <= 180;
  const a = looksLatLon ? [minLonMaybe, minLatMaybe, maxLonMaybe, maxLatMaybe] : parts;
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

    // If a backend service is configured, try to proxy through to it
    const backend = (process.env.POLYGONS_BACKEND_URL || '').trim();
    if (backend) {
      const upstream = `${backend}?${url.searchParams.toString()}`;
      const r = await fetch(upstream, { headers: { Accept: 'application/json' }, cache: 'no-store' }).catch(() => null);
      if (r && r.ok) {
        const text = await r.text();
        return new Response(text, { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
      }
      // If backend fails, fall through to use local GeoJSON files
      console.warn('Polygon backend unavailable, falling back to local files');
    }

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


