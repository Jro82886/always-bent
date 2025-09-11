import { NextRequest, NextResponse } from "next/server";
import { resolveSstDate } from "@/lib/sst/resolveSstDate";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const resolvedParams = await params;
  const z = toInt(resolvedParams.z), x = toInt(resolvedParams.x), y = toInt(resolvedParams.y);
  if (z > 9) {
    return NextResponse.json({ error: "zoom-too-high" }, { status: 404 });
  }
  const url = new URL(req.url);
  const requested = url.searchParams.get("time") || process.env.ABFI_SST_DEFAULT_TIME || "today";
  let baseDateISO: string;
  let timeGuardNote = "ok";
  try {
    baseDateISO = resolveSstDate(requested);
  } catch (e: any) {
    // Coerce invalid inputs to 'today' to avoid client 400 spam
    timeGuardNote = `coerced: ${String(e?.message || e)}`;
    baseDateISO = resolveSstDate("today");
  }

  const base   = envOr("ABFI_SST_TILE_BASE", "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best");
  const layer  = envOr("ABFI_SST_TILE_LAYER", "MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily");
  const matrix = envOr("ABFI_SST_TILE_MATRIX", "GoogleMapsCompatible_Level9");

  const chain = chainFromBase(baseDateISO);
  let lastStatus = 0, lastUrl = "";

  for (const timeISO of chain) {
    const gibsUrl = `${strip(base)}/${layer}/default/${timeISO}/${matrix}/${z}/${y}/${x}.png`;
    lastUrl = gibsUrl;
    const r = await fetch(gibsUrl, { headers: { "User-Agent": "ABFI/1.0" }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    lastStatus = r.status;
    if (r.ok) {
      const buf = await r.arrayBuffer();
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, s-maxage=21600, max-age=0, stale-while-revalidate=21600",
          "X-Debug-Requested": requested,
          "X-Debug-Used": timeISO,
          "X-Debug-GIBS": gibsUrl,
          "X-Debug-Time-Guard": timeGuardNote
        }
      });
    }
    if (r.status !== 404 && r.status !== 204) break;
  }

  return NextResponse.json(
    { error: "upstream-failed", requested, lastStatus, lastUrl },
    { status: lastStatus || 502, headers: { "Cache-Control": "public, s-maxage=60, max-age=0", "X-Debug-Requested": requested, "X-Debug-GIBS": lastUrl, "X-Debug-Time-Guard": timeGuardNote } }
  );
}

export async function HEAD(
  req: NextRequest,
  ctx: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const res = await GET(req, ctx);
  // Return same status/headers but no body for HEAD
  return new NextResponse(null, { status: res.status, headers: res.headers });
}

function toInt(s: string) { const n = parseInt(s, 10); return Number.isFinite(n) ? n : 0; }
function envOr(k: string, d: string) { const v = process.env[k]; return v && v.length > 0 ? v : d; }
function strip(s: string) { return s.endsWith("/") ? s.slice(0, -1) : s; }

function chainFromBase(baseISO: string) {
  // baseISO is already validated; add -1d/-2d/-3d as needed
  const [y, m, d] = baseISO.split('-').map(Number);
  const base = new Date(Date.UTC(y, (m as number) - 1, d));
  const toISO = (dt: Date) => `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`;
  const out = [toISO(base)];
  for (let k = 1; k <= 3; k++) {
    const t = new Date(base);
    t.setUTCDate(base.getUTCDate() - k);
    out.push(toISO(t));
  }
  return out;
}
