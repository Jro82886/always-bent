import { NextRequest, NextResponse } from "next/server";
import { xyzToBboxCRS84 } from "@/lib/tiles/webmercator";
import { buildErddapGetMapURL } from "@/lib/tiles/erddap";

// East Coast clamp (optional safety to reduce useless requests)
const EAST_MIN_LON = -85, EAST_MAX_LON = -60;
const EAST_MIN_LAT =  24, EAST_MAX_LAT =  46;

export const dynamic = "force-dynamic"; // serverless; let Vercel cache via headers

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  try {
    const { z: zStr, x: xStr, y: yStr } = await params;
    const z = clampInt(zStr, 0, 22);
    const x = clampInt(xStr, 0, Math.pow(2, z) - 1);
    const y = clampInt(yStr, 0, Math.pow(2, z) - 1);

    // time param: default to today, allow ?time=YYYY-MM-DD and allow -1d/-2d/-3d (your UI can pass the resolved ISO)
    const url = new URL(req.url);
    const timeParam = url.searchParams.get("time") || isoTodayUTC();
    const timeISO = normalizeTimeParam(timeParam); // returns ISO date (YYYY-MM-DD)

    const bbox = xyzToBboxCRS84(z, x, y);
    const clamped = clampBboxToEastCoast(bbox);

    const base = mustEnv("ABFI_SST_WMS_BASE");
    const layer = mustEnv("ABFI_SST_WMS_LAYER");
    const version = mustEnv("ABFI_SST_WMS_VERSION");
    const styles = mustEnv("ABFI_SST_WMS_STYLES");

    const wmsUrl = buildErddapGetMapURL({
      base, layer, version, styles,
      bbox: clamped,
      width: 256,
      height: 256,
      timeISO
    });

    // Fetch from NOAA; forward as PNG
    const upstream = await fetch(wmsUrl, {
      headers: { "User-Agent": "ABFI/1.0 (tiles-proxy)" },
      // Let Vercel cache it at the edge; ERDDAP images are immutable per-date
      next: { revalidate: 60 * 60 } as any // 1 hour
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        {
          status: 502,
          headers: cacheHeaders(60) // cache brief errors to avoid storms
        }
      );
    }

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        ...cacheHeaders(60 * 60 * 6) // 6h CDN cache per tile
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

function clampBboxToEastCoast([minLon, minLat, maxLon, maxLat]: readonly number[]) {
  // Optionally clamp; if outside, just return original
  if (
    maxLon < EAST_MIN_LON || minLon > EAST_MAX_LON ||
    maxLat < EAST_MIN_LAT || minLat > EAST_MAX_LAT
  ) return [minLon, minLat, maxLon, maxLat] as const;

  return [
    Math.max(minLon, EAST_MIN_LON),
    Math.max(minLat, EAST_MIN_LAT),
    Math.min(maxLon, EAST_MAX_LON),
    Math.min(maxLat, EAST_MAX_LAT)
  ] as const;
}

function isoTodayUTC() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// allows inputs like "today", "-1d", "2025-09-03"
function normalizeTimeParam(t: string) {
  if (t === "today") return isoTodayUTC();
  if (t === "-1d" || t === "-2d" || t === "-3d") {
    const days = Number(t.replace("d", "").replace("-", ""));
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  // basic YYYY-MM-DD passthrough
  return t;
}

function mustEnv(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v;
}

function cacheHeaders(seconds: number) {
  return {
    "Cache-Control": `public, s-maxage=${seconds}, max-age=0, stale-while-revalidate=${seconds}`
  };
}
