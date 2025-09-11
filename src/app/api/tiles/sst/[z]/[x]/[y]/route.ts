import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const resolvedParams = await params;
  const z = toInt(resolvedParams.z), x = toInt(resolvedParams.x), y = toInt(resolvedParams.y);
  const url = new URL(req.url);
  const requested = url.searchParams.get("time") || process.env.ABFI_SST_DEFAULT_TIME || "today";

  const base   = must("ABFI_SST_WMS_BASE");
  const layer  = must("ABFI_SST_WMS_LAYER");
  const version = must("ABFI_SST_WMS_VERSION");
  const styles = must("ABFI_SST_WMS_STYLES");

  // today -> -1d -> -2d (only fallback for 404/204)
  const chain = resolveChain(requested);
  let lastStatus = 0, lastUrl = "";

  for (const timeISO of chain) {
    // Convert XYZ to WMS BBOX for EPSG:3857
    const bbox = xyzToBbox3857(z, x, y);
    const gibsUrl = buildWmsUrl(base, layer, version, styles, bbox, timeISO);
    lastUrl = gibsUrl;

    const r = await fetch(gibsUrl, {
      headers: { "User-Agent": "ABFI/1.0" },
      next: { revalidate: 3600 }
    });
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
    if (r.status !== 404 && r.status !== 204) break; // real error -> stop fallback
  }

  return NextResponse.json(
    { error: "upstream-failed", requested, lastStatus, lastUrl },
    {
      status: lastStatus || 502,
      headers: {
        "Cache-Control": "public, s-maxage=60, max-age=0",
        "X-Debug-Requested": requested,
        "X-Debug-GIBS": lastUrl
      }
    }
  );
}

function toInt(s: string) { const n = parseInt(s, 10); return Number.isFinite(n) ? n : 0; }
function must(k: string) { const v = process.env[k]; if (!v) throw new Error(`Missing env ${k}`); return v!; }
function strip(s: string) { return s.endsWith("/") ? s.slice(0, -1) : s; }

// Convert XYZ tile coordinates to EPSG:3857 bounding box
function xyzToBbox3857(z: number, x: number, y: number) {
  const n = Math.pow(2, z);
  const lonLeft = (x / n) * 360 - 180;
  const lonRight = ((x + 1) / n) * 360 - 180;

  // Convert to Web Mercator meters
  const latTopRad = Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / n));
  const latBottomRad = Math.atan(Math.sinh(Math.PI - (2 * Math.PI * (y + 1)) / n));

  const latTop = latTopRad * 180 / Math.PI;
  const latBottom = latBottomRad * 180 / Math.PI;

  // EPSG:3857 bounds (approximately)
  const xLeft = lonLeft * 20037508.34 / 180;
  const xRight = lonRight * 20037508.34 / 180;
  const yTop = Math.log(Math.tan((90 + latTop) * Math.PI / 360)) * 20037508.34 / Math.PI;
  const yBottom = Math.log(Math.tan((90 + latBottom) * Math.PI / 360)) * 20037508.34 / Math.PI;

  return [xLeft, yBottom, xRight, yTop];
}

// Build WMS GetMap URL
function buildWmsUrl(base: string, layer: string, version: string, styles: string, bbox: number[], timeISO: string) {
  const params = new URLSearchParams({
    SERVICE: "WMS",
    REQUEST: "GetMap",
    VERSION: version,
    LAYERS: layer,
    STYLES: styles,
    FORMAT: "image/png",
    TRANSPARENT: "true",
    CRS: "EPSG:3857",
    BBOX: bbox.join(","),
    WIDTH: "256",
    HEIGHT: "256",
    TIME: timeISO
  });

  return `${strip(base)}?${params.toString()}`;
}

function resolveChain(reqTime: string) {
  const toISO = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;
  const today = () => toISO(new Date());
  const minus = (days: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate()-days); return toISO(d); };

  if (reqTime === "today") return [today(), minus(1), minus(2)];
  const m = reqTime.match(/^-(\d+)d$/); if (m) return [minus(parseInt(m[1], 10))];
  return [reqTime]; // YYYY-MM-DD passthrough
}
