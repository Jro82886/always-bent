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

  const base   = envOr("ABFI_SST_TILE_BASE", "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best").trim();
  const layer  = envOr("ABFI_SST_TILE_LAYER", "MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily").trim();
  const envMatrix = envOr("ABFI_SST_TILE_MATRIX", "GoogleMapsCompatible_Level9").trim();
  const detectedMatrix = await detectMatrixSet(base, layer);
  const matrixPreferred = (detectedMatrix || envMatrix).trim();
  const matrixCandidates = [matrixPreferred];

  const chain = chainFromBase(baseDateISO);
  let lastStatus = 0, lastUrl = "";

  for (const timeISO of chain) {
    for (const matrix of matrixCandidates) {
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
            "X-Debug-Time-Guard": timeGuardNote,
            "X-Debug-Matrix-Used": matrix,
            "X-Debug-Matrix-Candidates": matrixCandidates.join(",")
          }
        });
      }
      // On 400 invalid WMTS request, try WMS fallback in EPSG:3857 for this tile/date
      if (r.status === 400) {
        const wmsUrl = buildWmsUrlFromBase(base, layer, xyzToBbox3857(z, x, y), timeISO);
        try {
          const w = await fetch(wmsUrl, { headers: { "User-Agent": "ABFI/1.0" }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
          if (w.ok) {
            const buf = await w.arrayBuffer();
            return new NextResponse(buf, {
              status: 200,
              headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, s-maxage=21600, max-age=0, stale-while-revalidate=21600",
                "X-Debug-Requested": requested,
                "X-Debug-Used": timeISO,
                "X-Debug-GIBS": wmsUrl,
                "X-Debug-Time-Guard": timeGuardNote,
                "X-Debug-WMS-Fallback": "1"
              }
            });
          }
        } catch {}
      }
      // continue fallback chain only for not-available statuses
      if (r.status !== 404 && r.status !== 204 && r.status !== 400) break;
    }
  }

  return NextResponse.json(
    { error: "upstream-failed", requested, lastStatus, lastUrl },
    { status: lastStatus || 502, headers: { "Cache-Control": "public, s-maxage=60, max-age=0", "X-Debug-Requested": requested, "X-Debug-GIBS": lastUrl, "X-Debug-Time-Guard": timeGuardNote, "X-Debug-Matrix-Candidates": matrixCandidates.join(",") } }
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
// Detect the correct TileMatrixSet for the layer by parsing WMTS capabilities
async function detectMatrixSet(base: string, layer: string): Promise<string | null> {
  try {
    // normalize base to capabilities endpoint for the same projection path
    const capsUrl = `${strip(base)}/WMTSCapabilities.xml`;
    const r = await fetch(capsUrl, { headers: { "User-Agent": "ABFI/1.0" }, cache: 'no-store' as any, next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const xmlText = await r.text();
    // lightweight parse: find the Layer entry and a GoogleMapsCompatible* matrix set link
    const layerIdx = xmlText.indexOf(`<Layer><ows:Title>${layer}</ows:Title>`);
    if (layerIdx === -1) return null;
    const slice = xmlText.slice(layerIdx, layerIdx + 4000);
    const m = slice.match(/<TileMatrixSetLink>\s*<TileMatrixSet>([^<]+)<\/TileMatrixSet>/);
    if (m && /GoogleMapsCompatible/.test(m[1])) {
      return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

// Build WMS URL in EPSG:3857 using the same base host
function buildWmsUrlFromBase(base: string, layer: string, bbox3857: number[], timeISO: string) {
  const origin = new URL(base).origin;
  const wms = `${origin}/wms/epsg3857/best/wms.cgi`;
  const p = new URLSearchParams({
    SERVICE: 'WMS', REQUEST: 'GetMap', VERSION: '1.3.0',
    LAYERS: layer, STYLES: 'default', FORMAT: 'image/png', TRANSPARENT: 'true',
    CRS: 'EPSG:3857', BBOX: bbox3857.join(','), WIDTH: '256', HEIGHT: '256', TIME: timeISO
  });
  return `${wms}?${p.toString()}`;
}

// xyz → EPSG:3857 bbox
function xyzToBbox3857(z: number, x: number, y: number) {
  const n = Math.pow(2, z);
  const lonLeft = (x / n) * 360 - 180;
  const lonRight = ((x + 1) / n) * 360 - 180;
  const latTopRad = Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / n));
  const latBottomRad = Math.atan(Math.sinh(Math.PI - (2 * Math.PI * (y + 1)) / n));
  const latTop = (latTopRad * 180) / Math.PI;
  const latBottom = (latBottomRad * 180) / Math.PI;
  const xLeft = (lonLeft * 20037508.34) / 180;
  const xRight = (lonRight * 20037508.34) / 180;
  const yTop = (Math.log(Math.tan(((90 + latTop) * Math.PI) / 360)) * 20037508.34) / Math.PI;
  const yBottom = (Math.log(Math.tan(((90 + latBottom) * Math.PI) / 360)) * 20037508.34) / Math.PI;
  return [xLeft, yBottom, xRight, yTop];
}

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
