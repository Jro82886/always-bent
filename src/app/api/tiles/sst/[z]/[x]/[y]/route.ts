import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  try {
    const { z: zStr, x: xStr, y: yStr } = await params;
    const z = clampInt(zStr, 0, 22);
    const x = clampInt(xStr, 0, Math.pow(2, z) - 1);
    const y = clampInt(yStr, 0, Math.pow(2, z) - 1);

    const url = new URL(req.url);
    const timeParam = url.searchParams.get("time") || process.env.ABFI_SST_DEFAULT_TIME || "today";
    const timeISO = normalizeTimeParam(timeParam);

    const base   = mustEnv("ABFI_SST_TILE_BASE");   // .../wmts/epsg3857/best
    const layer  = mustEnv("ABFI_SST_TILE_LAYER");  // MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily
    const matrix = mustEnv("ABFI_SST_TILE_MATRIX"); // GoogleMapsCompatible_Level9

    // GIBS path order is {z}/{y}/{x} (note y before x)
    const gibsUrl = `${stripSlash(base)}/${layer}/default/${timeISO}/${matrix}/${z}/${y}/${x}.png`;

    const upstream = await fetch(gibsUrl, {
      headers: { "User-Agent": "ABFI/1.0 (gibs-proxy)" },
      next: { revalidate: 60 * 60 } as any // 1h CDN revalidate
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}`, url: gibsUrl },
        { status: 502, headers: cacheHeaders(60) }
      );
    }

    // Important: GIBS returns PNG already
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        ...cacheHeaders(60 * 60 * 6) // 6h
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "proxy-failure", detail: String(e?.message || e) },
      { status: 500, headers: cacheHeaders(30) }
    );
  }
}

function clampInt(s: string, min: number, max: number) {
  const n = Math.max(min, Math.min(max, parseInt(s, 10)));
  return Number.isFinite(n) ? n : min;
}

function normalizeTimeParam(t: string) {
  if (t === "today") return isoTodayUTC();
  if (/^-\d+d$/.test(t)) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - parseInt(t.slice(1)));
    return toISO(d);
  }
  return t; // assume YYYY-MM-DD
}

function isoTodayUTC() {
  return toISO(new Date());
}

function toISO(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mustEnv(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
}

function stripSlash(s: string) {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function cacheHeaders(seconds: number) {
  return { "Cache-Control": `public, s-maxage=${seconds}, max-age=0, stale-while-revalidate=${seconds}` };
}

