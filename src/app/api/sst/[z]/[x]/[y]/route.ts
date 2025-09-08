import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Compute EPSG:3857 (meters) BBOX for z/x/y
function zxyToBBox3857(z: number, x: number, y: number) {
  const WORLD = 20037508.342789244; // meters
  const tiles = Math.pow(2, z);
  const tileSpan = (WORLD * 2) / tiles;
  const minX = -WORLD + x * tileSpan;
  const maxX = minX + tileSpan;
  const maxY = WORLD - y * tileSpan;
  const minY = maxY - tileSpan;
  return [minX, minY, maxX, maxY].join(',');
}

// Compute EPSG:4326 (lon/lat degrees) BBOX for z/x/y
function zxyToBBox4326(z: number, x: number, y: number) {
  const n = Math.pow(2, z);
  const lon1 = (x / n) * 360 - 180;
  const lon2 = ((x + 1) / n) * 360 - 180;
  const latRad1 = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const latRad2 = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n)));
  const lat1 = (latRad2 * 180) / Math.PI; // south
  const lat2 = (latRad1 * 180) / Math.PI; // north
  return { minLon: lon1, minLat: lat1, maxLon: lon2, maxLat: lat2 };
}

// 1x1 transparent PNG (base64)
const BLANK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9U3Yq5gAAAAASUVORK5CYII=';
function blankPngResponse(reason: string) {
  const buf = Buffer.from(BLANK_PNG_BASE64, 'base64');
  return new Response(buf, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=120',
      'x-tile-fallback': reason,
    },
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await ctx.params;
  const url = new URL(req.url);
  let time = url.searchParams.get('time') || '';

  // Normalize time
  if (time && /^\d{4}-\d{2}-\d{2}$/.test(time)) time = `${time}T00:00:00Z`;
  if (time.toLowerCase() === 'latest') time = '';

  // Use ERDDAP environment variables from .env.local - ensure /request is appended
  let base = (process.env.ERDDAP_WMS_BASE || 'https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request').trim();
  if (!base.endsWith('/request')) base += '/request';
  const layer = (process.env.ERDDAP_WMS_LAYER || 'jplMURSST41:analysed_sst').trim();
  const version = (process.env.ERDDAP_WMS_VERSION || '1.3.0').trim();

  if (!base || !layer) return blankPngResponse('not-configured');

  const bbox3857 = zxyToBBox3857(parseInt(z, 10), parseInt(x, 10), parseInt(y, 10));
  const bbox4326 = zxyToBBox4326(parseInt(z, 10), parseInt(x, 10), parseInt(y, 10));

  // Helper to fetch and validate an image, returns buffer and url
  const fetchImage = async (u: string) => {
    const r = await fetch(u, { headers: { Accept: 'image/png' } }).catch(() => undefined);
    if (!r || !r.ok) return { ok: false as const, reason: 'upstream-bad' as const, url: u };
    const ct = r.headers.get('content-type') || '';
    if (!/image\/(png|jpeg)/i.test(ct)) return { ok: false as const, reason: 'non-image' as const, url: u };
    const buf = await r.arrayBuffer();
    return { ok: true as const, buf, url: u };
  };

  const buildCandidates = () => {
    const out: string[] = [];
    // Reasonable ERDDAP defaults for styling SST
    const styles = process.env.ERDDAP_WMS_STYLES || 'boxfill/rainbow';
    const colorScale = process.env.ERDDAP_WMS_COLORSCALERANGE || '0,35';
    const numBands = process.env.ERDDAP_WMS_NUMCOLORBANDS || '254';
    // WMS 1.3.0, EPSG:3857
    const q1 = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: version, LAYERS: layer, STYLES: styles, FORMAT: 'image/png', TRANSPARENT: 'true', CRS: 'EPSG:3857', BBOX: bbox3857, WIDTH: '256', HEIGHT: '256', COLORSCALERANGE: colorScale, NUMCOLORBANDS: numBands } as any);
    if (time) q1.set('TIME', time);
    out.push(`${base}?${q1.toString()}`);
    // WMS 1.1.1, EPSG:3857 (SRS)
    const q2 = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.1.1', LAYERS: layer, STYLES: styles, FORMAT: 'image/png', TRANSPARENT: 'true', SRS: 'EPSG:3857', BBOX: bbox3857, WIDTH: '256', HEIGHT: '256', COLORSCALERANGE: colorScale, NUMCOLORBANDS: numBands } as any);
    if (time) q2.set('TIME', time);
    out.push(`${base}?${q2.toString()}`);
    // WMS 1.3.0, EPSG:4326 (axis order: lat,lon)
    const b3 = [bbox4326.minLat, bbox4326.minLon, bbox4326.maxLat, bbox4326.maxLon].join(',');
    const q3 = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: version, LAYERS: layer, STYLES: styles, FORMAT: 'image/png', TRANSPARENT: 'true', CRS: 'EPSG:4326', BBOX: b3, WIDTH: '256', HEIGHT: '256', COLORSCALERANGE: colorScale, NUMCOLORBANDS: numBands } as any);
    if (time) q3.set('TIME', time);
    out.push(`${base}?${q3.toString()}`);
    // WMS 1.1.1, EPSG:4326 (axis order: lon,lat)
    const b4 = [bbox4326.minLon, bbox4326.minLat, bbox4326.maxLon, bbox4326.maxLat].join(',');
    const q4 = new URLSearchParams({ SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.1.1', LAYERS: layer, STYLES: styles, FORMAT: 'image/png', TRANSPARENT: 'true', SRS: 'EPSG:4326', BBOX: b4, WIDTH: '256', HEIGHT: '256', COLORSCALERANGE: colorScale, NUMCOLORBANDS: numBands } as any);
    if (time) q4.set('TIME', time);
    out.push(`${base}?${q4.toString()}`);
    return out;
  };

  // Try candidates with TIME, then without TIME if needed
  let lastUrl = '';
  let got: any = null;
  for (const u of buildCandidates()) {
    lastUrl = u;
    const r = await fetchImage(u);
    if (r.ok) { got = r; break; }
  }
  if (!got) {
    const timeStrip = (u: string) => u.replace(/[&?]TIME=[^&]*/i, '');
    for (const u of buildCandidates().map(timeStrip)) {
      lastUrl = u;
      const r = await fetchImage(u);
      if (r.ok) { got = r; break; }
    }
  }

  if (!got) {
    const resp = blankPngResponse('non-image');
    (resp as any).headers?.set?.('x-upstream-last', lastUrl);
    return resp;
  }

  return new Response(got.buf, {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=600',
      'x-upstream-last': got.url,
    },
  });
}
