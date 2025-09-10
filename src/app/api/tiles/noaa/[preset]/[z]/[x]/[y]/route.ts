import { NextRequest, NextResponse } from 'next/server';
import { tileBBoxCRS84 } from '@/lib/tile';
import { WMS_PRESETS } from '@/lib/wmsPresets';

const UA = 'ABFI/1.0 (contact: amanda@alwaysbent.com)';

// Simple per-process queue to avoid bursty hits to NOAA
let inflight = 0;
const MAX_CONCURRENCY = 4;
async function gate<T>(fn: () => Promise<T>) {
  while (inflight >= MAX_CONCURRENCY) await new Promise(r => setTimeout(r, 25));
  inflight++;
  try { return await fn(); } finally { inflight--; }
}

function safePreset(preset: string) {
  const p = WMS_PRESETS[preset];
  if (!p) throw new Error('Unknown preset');
  const host = new URL(p.base).hostname;
  if (!p.hostAllow.includes(host)) throw new Error('Host not allowed');
  return p;
}

function buildWmsUrl(p: ReturnType<typeof safePreset>, bbox: string, time?: string) {
  // ERDDAP expects ".../wms/<dataset>/request"
  const base = p.base.endsWith('/request') ? p.base : p.base.replace(/\/?$/, '/request');
  const qs = new URLSearchParams({
    service: 'WMS',
    request: 'GetMap',
    version: p.version,
    layers: p.layer,
    styles: p.styles || '',
    format: p.format || 'image/png',
    transparent: p.transparent || 'TRUE',
    crs: p.crs || 'CRS:84',
    bbox,
    width: String(p.width ?? 256),
    height: String(p.height ?? 256)
  });
  if (time && time !== 'LATEST') qs.set('time', time);
  return `${base}?${qs.toString()}`;
}

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ preset: string; z: string; x: string; y: string }> }
) {
  try {
    const { preset, z, x, y } = await params;
    const p = safePreset(preset);
    const url = new URL(req.url);
    const time = url.searchParams.get('time') || ''; // pass ISO (YYYY-MM-DD) or omit for "latest"

    const Z = Math.max(0, Math.min(22, Number(z)));
    const X = Math.max(0, Number(x));
    const Y = Math.max(0, Number(y));
    const { minLon, minLat, maxLon, maxLat } = tileBBoxCRS84(Z, X, Y);
    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;

    const wmsUrl = buildWmsUrl(p, bbox, time);

    const fetchOnce = () => fetch(wmsUrl, {
      headers: { 'User-Agent': UA, 'Accept': 'image/png' },
      redirect: 'follow',
      // Let Vercel CDN cache it
      next: { revalidate: 60 * 60 } as any // 1 hour
    });

    // retry logic: try with time, then without time (some WMS default to latest)
    const res = await gate(async () => {
      let r = await fetchOnce();
      if (!r.ok && time) {
        await new Promise(r2 => setTimeout(r2, 120)); // tiny backoff
        r = await fetch(buildWmsUrl(p, bbox, ''), {
          headers: { 'User-Agent': UA, 'Accept': 'image/png' },
          next: { revalidate: 60 * 60 } as any
        });
      }
      return r;
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream WMS ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }

    // pass-through image with strong CDN caching (stale OK)
    const buf = Buffer.from(await res.arrayBuffer());
    const resp = new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
    return resp;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Proxy error' }, { status: 500 });
  }
}
