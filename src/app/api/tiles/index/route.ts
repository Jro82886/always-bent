import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CacheEntry = { ts: number; windowHours: number; data: string[] };
const INDEX_CACHE: Record<string, CacheEntry> = {};

function parseISO(s: string): number { const t = Date.parse(s); return Number.isNaN(t) ? 0 : t; }

function expandTimeRange(range: string, windowHours: number): string[] {
  // Formats: "start/end/period" (e.g., PT1H) or comma-separated list
  if (range.includes('/')) {
    const [start, end, period] = range.split('/');
    const startMs = parseISO(start);
    const endMs = Math.min(parseISO(end), Date.now());
    if (!startMs || !endMs || !period) return [];
    // Support PT15M, PT30M, PT1H, PT3H, PT6H, P1D
    const m = period.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/);
    if (!m) return [];
    const days = parseInt(m[1] || '0', 10);
    const hours = parseInt(m[2] || '0', 10);
    const mins = parseInt(m[3] || '0', 10);
    const stepMs = ((days * 24 + hours) * 60 + mins) * 60 * 1000 || 60 * 60 * 1000; // default 1h
    const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
    const out: string[] = [];
    for (let t = endMs; t >= startMs && t >= cutoff; t -= stepMs) out.push(new Date(t).toISOString());
    return out;
  }
  // Comma-separated
  const all = range.split(',').map(s => s.trim()).filter(Boolean);
  const cutoff = Date.now() - windowHours * 60 * 60 * 1000;
  return all.filter(s => parseISO(s) >= cutoff).sort((a,b) => parseISO(b) - parseISO(a));
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const source = (url.searchParams.get('source') || 'goes').toLowerCase();
    const layer = (url.searchParams.get('layer') || 'sst').toLowerCase();
    const windowHours = Math.max(1, Math.min(72, parseInt(url.searchParams.get('windowHours') || '72', 10)));

    if (source !== 'goes' || layer !== 'sst') {
      return NextResponse.json({ timestamps: [] });
    }

    const base = process.env.ABFI_SST_RAW_WMS_BASE;
    const cacheKey = `${base}|${windowHours}`;
    const now = Date.now();
    const cached = INDEX_CACHE[cacheKey];
    if (cached && now - cached.ts < 5 * 60 * 1000) {
      return NextResponse.json({ timestamps: cached.data });
    }

    if (!base) return NextResponse.json({ timestamps: [] });
    const capsUrl = `${base}?service=WMS&request=GetCapabilities`;
    const res = await fetch(capsUrl, { next: { revalidate: 300 } }).catch(() => undefined as any);
    if (!res || !res.ok) {
      return NextResponse.json({ timestamps: [] });
    }
    const xml = await res.text().catch(() => "");
    // Rough parse: search for Dimension or Extent with name="time"
    const match = xml.match(/<(?:Dimension|Extent)[^>]*name=["']time["'][^>]*>([\s\S]*?)<\/(?:Dimension|Extent)>/i);
    const raw = match?.[1]?.trim();
    let timestamps = raw ? expandTimeRange(raw, windowHours) : [];
    if (!timestamps.length) {
      // Synthesize last 3 days (ERDDAP-friendly daily products)
      const out: string[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date();
        d.setUTCHours(0,0,0,0);
        d.setUTCDate(d.getUTCDate() - i);
        out.push(d.toISOString());
      }
      timestamps = out;
    }
    INDEX_CACHE[cacheKey] = { ts: now, windowHours, data: timestamps };
    return NextResponse.json({ timestamps });
  } catch (e: any) {
    return NextResponse.json({ timestamps: [] }, { status: 200 });
  }
}


