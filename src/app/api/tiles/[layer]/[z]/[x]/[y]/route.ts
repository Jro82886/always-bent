import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type Params = { layer: string; z: string; x: string; y: string };

// Support either Copernicus-* or legacy Amentum-* envs
const BASE =
  process.env.COPERNICUS_WMTS_BASE ||
  process.env.AMENTUM_WMTS_BASE ||
  "";
const MATRIX_SET =
  process.env.COPERNICUS_WMTS_MATRIXSET ||
  process.env.AMENTUM_WMTS_MATRIXSET ||
  "EPSG:3857";
const DEFAULT_STYLE =
  process.env.COPERNICUS_WMTS_STYLE ||
  process.env.AMENTUM_WMTS_STYLE ||
  "default";
const DEFAULT_TIME =
  process.env.COPERNICUS_WMTS_TIME ||
  process.env.AMENTUM_WMTS_TIME;

const AUTH_TYPE = (
  process.env.COPERNICUS_AUTH_TYPE ||
  process.env.AMENTUM_AUTH_TYPE ||
  ""
).toLowerCase();
const TOKEN = process.env.COPERNICUS_TOKEN || process.env.AMENTUM_TOKEN;
const BASIC_USER = process.env.COPERNICUS_BASIC_USER || process.env.AMENTUM_BASIC_USER;
const BASIC_PASS = process.env.COPERNICUS_BASIC_PASS || process.env.AMENTUM_BASIC_PASS;

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

function normalizeTimeParam(raw?: string | null): string {
  if (!raw) return isoMidnightUTC();
  // If user passed YYYY-MM-DD, convert to UTC midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00Z`;
  // If a date-like string, try to round-trip to ISO
  const t = Date.parse(raw);
  if (!Number.isNaN(t)) return new Date(t).toISOString();
  // Fallback to today UTC midnight
  return isoMidnightUTC();
}

// Map short names to full layer ids; extend as you add layers
const LAYER_MAP: Record<string, string> = {
  // Copernicus SST (OSTIA L4 NRT) default if env not set
  // You can override by setting LAYER_SST_DAILY in .env.local
  // sst_daily removed in favor of MUR SST via /api/tiles/sst route
  // keep alias if needed
  sst:
    process.env.LAYER_SST_DAILY ||
    process.env.LAYER_THETAO_DAILY ||
    process.env.AMENTUM_WMTS_LAYER ||
    "SST_GLO_SST_L4_NRT_OBSERVATIONS_010_001/METOFFICE-GLO-SST-L4-NRT-OBS-SST-V2/analysed_sst",
  // Chlorophyll aliases (choose env-based product later)
  chl_daily:
    process.env.LAYER_CHL_DAILY ||
    process.env.LAYER_CHL_MONTHLY ||
    "", // left blank until configured
  chl:
    process.env.LAYER_CHL_DAILY ||
    process.env.LAYER_CHL_MONTHLY ||
    "",
  // Raw SST (optional separate product)
  sst_raw:
    process.env.LAYER_SST_RAW ||
    "",
};

export async function GET(req: NextRequest, ctx: { params: Promise<Params> }) {
  const { layer, z, x, y } = await ctx.params;
  // y may include the ".png" suffix from the route; strip it for WMTS
  const yRow = y.replace(/\.png$/i, "");

  const targetLayer = LAYER_MAP[layer];
  if (!BASE || !targetLayer) {
    return Response.json({ error: "Not configured", missing: { BASE: !!BASE, LAYER: !!targetLayer, key: layer } }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const time = normalizeTimeParam(searchParams.get("time") || DEFAULT_TIME);
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
    TILEROW: yRow,
    TILECOL: x,
    TIME: time,
  });

  const upstream = `${BASE}?${qs.toString()}`;

  const headers: Record<string, string> = {};
  if (AUTH_TYPE === "bearer" && TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  if (AUTH_TYPE === "basic" && BASIC_USER && BASIC_PASS) {
    const b64 = Buffer.from(`${BASIC_USER}:${BASIC_PASS}`).toString("base64");
    headers["Authorization"] = `Basic ${b64}`;
  }

  // Fetch with multi-day fallback (up to 5 days back), then try DEFAULT_TIME if set
  const tryFetch = async (url: string) => fetch(url, { headers }).catch(() => undefined);
  let res = await tryFetch(upstream);
  if (!res || !res.ok) {
    let okRes: Response | undefined;
    let lastUrl = upstream;
    let t = time;
    for (let i = 0; i < 5 && !okRes; i++) {
      t = prevDayIsoMidnightUTC(t);
      const qsFallback = new URLSearchParams(qs);
      qsFallback.set("TIME", t);
      lastUrl = `${BASE}?${qsFallback.toString()}`;
      const r = await tryFetch(lastUrl);
      if (r && r.ok) okRes = r;
    }
    if (!okRes && DEFAULT_TIME) {
      const qsDefault = new URLSearchParams(qs);
      qsDefault.set("TIME", DEFAULT_TIME);
      lastUrl = `${BASE}?${qsDefault.toString()}`;
      const r = await tryFetch(lastUrl);
      if (r && r.ok) okRes = r;
    }
    if (!okRes) {
      const text = res ? await res.text().catch(() => "") : "";
      return Response.json(
        {
          error: "Upstream error",
          status: res?.status ?? 502,
          upstream,
          triedUntil: t,
          lastTried: lastUrl,
          detail: text.slice(0, 500),
        },
        { status: 502 }
      );
    }
    res = okRes;
  }

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") || "image/png",
      "cache-control": "public, max-age=600",
      "access-control-allow-origin": "*",
      // expose the TIME used after any fallback for debugging
      "x-tile-time-used": new URL(res.url).searchParams.get("TIME") || "",
    },
  });
}


