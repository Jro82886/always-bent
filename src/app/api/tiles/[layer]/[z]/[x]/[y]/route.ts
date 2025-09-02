import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Params = { layer: string; z: string; x: string; y: string };

const BASE = process.env.AMENTUM_WMTS_BASE!;
const MATRIX_SET = process.env.AMENTUM_WMTS_MATRIXSET || "EPSG:3857";
const DEFAULT_STYLE = process.env.AMENTUM_WMTS_STYLE || "default";
const DEFAULT_TIME = process.env.AMENTUM_WMTS_TIME;

const AUTH_TYPE = (process.env.AMENTUM_AUTH_TYPE || "bearer").toLowerCase();
const TOKEN = process.env.AMENTUM_TOKEN;

function isoMidnightUTC(date?: string | null) {
  if (date) return date;
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function prevDayIsoMidnightUTC(dateIso: string): string {
  const d = new Date(dateIso);
  d.setUTCDate(d.getUTCDate() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// Map short names to full layer ids; extend as you add layers
const LAYER_MAP: Record<string, string> = {
  // short-name → full identifier from env
  sst: process.env.AMENTUM_WMTS_LAYER || "",
  sst_daily: process.env.LAYER_THETAO_DAILY || "",
};

export async function GET(req: NextRequest, ctx: { params: Params }) {
  const { layer, z, x, y } = ctx.params;

  const targetLayer = LAYER_MAP[layer];
  if (!BASE || !targetLayer) {
    return Response.json({ error: "Not configured", missing: { BASE: !!BASE, LAYER: !!targetLayer, key: layer } }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const time = isoMidnightUTC(searchParams.get("time") || DEFAULT_TIME);
  const style = searchParams.get("style") || DEFAULT_STYLE;

  const qs = new URLSearchParams({
    SERVICE: "WMTS",
    REQUEST: "GetTile",
    VERSION: "1.0.0",
    LAYER: targetLayer,
    STYLE: style,
    FORMAT: "image/png",
    TILEMATRIXSET: MATRIX_SET,
    TILEMATRIX: z,
    TILEROW: y,
    TILECOL: x,
    TIME: time,
  });

  const upstream = `${BASE}?${qs.toString()}`;

  const headers: Record<string, string> = {};
  if (AUTH_TYPE === "bearer" && TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

  let res = await fetch(upstream, { headers });
  if (!res.ok) {
    // Optional safety: fallback to previous day once
    const fallbackTime = prevDayIsoMidnightUTC(time);
    const qsFallback = new URLSearchParams(qs);
    qsFallback.set("TIME", fallbackTime);
    const upstreamFallback = `${BASE}?${qsFallback.toString()}`;
    const res2 = await fetch(upstreamFallback, { headers }).catch(() => undefined);
    if (!res2 || !res2.ok) {
      const text = await res.text().catch(() => "");
      return Response.json(
        {
          error: "Upstream error",
          status: res.status,
          upstream,
          triedFallbackTime: fallbackTime,
          upstreamFallback,
          detail: text.slice(0, 500),
        },
        { status: 502 }
      );
    }
    res = res2;
  }

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") || "image/png",
      "cache-control": "public, max-age=600",
      "access-control-allow-origin": "*",
    },
  });
}


