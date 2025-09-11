import { NextRequest, NextResponse } from "next/server";

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

  const base   = envOr("ABFI_SST_TILE_BASE", "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best");
  const layer  = envOr("ABFI_SST_TILE_LAYER", "MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily");
  const matrix = envOr("ABFI_SST_TILE_MATRIX", "GoogleMapsCompatible_Level9");

  const chain = resolveChain(requested);
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
          "X-Debug-GIBS": gibsUrl
        }
      });
    }
    if (r.status !== 404 && r.status !== 204) break;
  }

  return NextResponse.json(
    { error: "upstream-failed", requested, lastStatus, lastUrl },
    { status: lastStatus || 502, headers: { "Cache-Control": "public, s-maxage=60, max-age=0", "X-Debug-Requested": requested, "X-Debug-GIBS": lastUrl } }
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

function resolveChain(reqTime: string) {
  const toISO = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  const today = () => toISO(new Date());
  const minus = (days: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate()-days); return toISO(d); };

  if (reqTime === "today") return [today(), minus(1), minus(2)];
  const m = reqTime.match(/^-(\d+)d$/); if (m) return [minus(parseInt(m[1], 10))];
  return [reqTime]; // YYYY-MM-DD passthrough
}
