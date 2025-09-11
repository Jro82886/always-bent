import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const resolvedParams = await params;
  const z = parseInt(resolvedParams.z, 10);
  const x = parseInt(resolvedParams.x, 10);
  const y = parseInt(resolvedParams.y, 10);

  // 🚨 BLOCK HIGH ZOOM REQUESTS (Primary cause of 404 errors)
  if (z > 9) {
    console.warn(`🚨 Blocking high zoom z=${z} (max 9 for MODIS 4km product)`);
    return NextResponse.json(
      { error: "zoom-too-high", maxZoom: 9, requested: z },
      { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  }

  const url = new URL(req.url);
  const requested = url.searchParams.get("time") || "today";

  // HARDCODED NASA GIBS VALUES FOR RELIABILITY
  const base   = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best";
  const layer  = "MODIS_Aqua_L3_SST_Thermal_4km_Night_Daily";
  const matrix = "GoogleMapsCompatible_Level9";

  // Try up to 3 dates (today -> -1d -> -2d) but only on 404/204
  const chain = buildFallbackChain(requested);
  let lastStatus = 0, lastUrl = "", successfulUrl = "";

  for (const timeISO of chain) {
    const gibsUrl = `${stripSlash(base)}/${layer}/default/${timeISO}/${matrix}/${z}/${y}/${x}.png`;
    lastUrl = gibsUrl;

    console.log(`🌐 Testing NASA GIBS: ${gibsUrl}`);

    try {
      const upstream = await fetch(gibsUrl, {
        headers: { "User-Agent": "ABFI/1.0 (gibs-proxy)" },
        // ⏱️ SHORT TIMEOUT TO PREVENT HANGING (5 seconds)
        signal: AbortSignal.timeout(5000)
      });

      lastStatus = upstream.status;
      console.log(`📡 NASA Response: ${upstream.status} for ${timeISO}`);

      if (upstream.ok) {
        successfulUrl = gibsUrl;
        const body = await upstream.arrayBuffer();
        return new NextResponse(body, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, s-maxage=21600, max-age=0, stale-while-revalidate=21600", // 6h
            "X-Debug-Requested": requested,
            "X-Debug-Used": timeISO,
            "X-Debug-GIBS": gibsUrl,
            "X-Debug-Status": "SUCCESS"
          }
        });
      }

      // Continue fallback only on "not found/empty" (404/204)
      if (upstream.status !== 404 && upstream.status !== 204) {
        console.warn(`🚨 NASA GIBS ${upstream.status} - not a missing tile, stopping fallback`);
        break;
      }

    } catch (fetchError: any) {
      console.error(`🚨 Fetch failed for ${timeISO}:`, fetchError.message);
      lastStatus = 502;
      // Continue to next date in chain for timeout/network errors
    }
  }

  // All attempts failed
  console.error(`🚨 All NASA GIBS attempts failed for z=${z}, x=${x}, y=${y}`);
  return NextResponse.json(
    {
      error: "all-attempts-failed",
      requested,
      attempts: chain.length,
      lastStatus,
      lastUrl,
      successfulUrl
    },
    {
      status: lastStatus || 502,
      headers: {
        "Cache-Control": "public, s-maxage=60, max-age=0", // Short cache for errors
        "X-Debug-Requested": requested,
        "X-Debug-GIBS": lastUrl,
        "X-Debug-Status": "FAILED"
      }
    }
  );
}

function stripSlash(s: string) { return s.endsWith("/") ? s.slice(0, -1) : s; }

function buildFallbackChain(reqTime: string) {
  const toISO = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`;

  if (reqTime === "today") {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setUTCDate(today.getUTCDate() - 2);

    return [toISO(today), toISO(yesterday), toISO(twoDaysAgo)];
  }

  if (/^-(\d+)d$/.test(reqTime)) {
    const days = parseInt(reqTime.slice(1));
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return [toISO(d)];
  }

  return [reqTime]; // YYYY-MM-DD passthrough
}
