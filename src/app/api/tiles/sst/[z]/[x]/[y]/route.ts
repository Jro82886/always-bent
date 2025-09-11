import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  try {
    const resolvedParams = await params;
    const z = parseInt(resolvedParams.z, 10);
    const x = parseInt(resolvedParams.x, 10);
    const y = parseInt(resolvedParams.y, 10);

    const url = new URL(req.url);
    const timeParam = url.searchParams.get("time") || process.env.ABFI_SST_DEFAULT_TIME || "today";
    const timeISO = normalizeTimeParam(timeParam);

    const base   = mustEnv("ABFI_SST_TILE_BASE");
    const layer  = mustEnv("ABFI_SST_TILE_LAYER");
    const matrix = mustEnv("ABFI_SST_TILE_MATRIX");

    // GIBS path: {base}/{layer}/default/{date}/{matrix}/{z}/{y}/{x}.png
    const gibsUrl = `${stripSlash(base)}/${layer}/default/${timeISO}/${matrix}/${z}/${y}/${x}.png`;

    console.log('🌐 NASA GIBS Proxy:', gibsUrl);

    const upstream = await fetch(gibsUrl, {
      headers: { "User-Agent": "ABFI/1.0 (gibs-proxy)" },
      next: { revalidate: 60 * 60 } // 1h
    });

    if (!upstream.ok) {
      console.warn(`🚨 NASA GIBS ${upstream.status}:`, gibsUrl);
      return NextResponse.json(
        { error: `Upstream ${upstream.status}`, url: gibsUrl },
        { status: 502, headers: cacheHeaders(60) }
      );
    }

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        ...cacheHeaders(60 * 60 * 6) // 6h CDN cache
      }
    });
  } catch (e: any) {
    console.error('🚨 NASA GIBS Proxy Error:', e?.message || e);
    return NextResponse.json(
      { error: "proxy-failure", detail: String(e?.message || e) },
      { status: 500, headers: cacheHeaders(30) }
    );
  }
}

function normalizeTimeParam(t: string) {
  if (t === "today") return isoTodayUTC();
  if (/^-\d+d$/.test(t)) {
    const days = parseInt(t.slice(1));
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return toISO(d);
  }
  return t; // assume YYYY-MM-DD
}

function isoTodayUTC() { return toISO(new Date()); }

function toISO(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
}

function mustEnv(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
}

function stripSlash(s: string) { return s.endsWith("/") ? s.slice(0, -1) : s; }

function cacheHeaders(seconds: number) {
  return { "Cache-Control": `public, s-maxage=${seconds}, max-age=0, stale-while-revalidate=${seconds}` };
}
