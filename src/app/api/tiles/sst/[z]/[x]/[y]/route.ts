/* eslint-disable @next/next/no-server-import-in-page */
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { z: string; x: string; y: string };

const BASE   = process.env.AMENTUM_WMTS_BASE!;
const LAYER  = process.env.AMENTUM_WMTS_LAYER!;
const STYLE  = process.env.AMENTUM_WMTS_STYLE || 'default';
const FORMAT = process.env.AMENTUM_WMTS_FORMAT || 'image/png';
const MATRIX = process.env.AMENTUM_WMTS_MATRIXSET || 'EPSG:3857';
const DEFAULT_TIME = process.env.AMENTUM_WMTS_TIME;

const AUTH_TYPE = (process.env.AMENTUM_AUTH_TYPE || '').toLowerCase();

const token = process.env.AMENTUM_TOKEN;
const user  = process.env.AMENTUM_USER;
const pass  = process.env.AMENTUM_PASS;
const tokenParam = process.env.AMENTUM_TOKEN_PARAM || 'token';

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { z, x, y } = params;

    // read ?time= from client, or fall back
    const urlIn = new URL(req.url);
    const time = urlIn.searchParams.get('time') || DEFAULT_TIME || undefined;

    if (!BASE || !LAYER) {
      return NextResponse.json(
        { error: 'Amentum WMTS not configured', missing: { AMENTUM_WMTS_BASE: !!BASE, AMENTUM_WMTS_LAYER: !!LAYER } },
        { status: 500 }
      );
    }

    // Build upstream WMTS URL
    const out = new URL(BASE);
    out.searchParams.set('SERVICE', 'WMTS');
    out.searchParams.set('REQUEST', 'GetTile');
    out.searchParams.set('VERSION', '1.0.0');
    out.searchParams.set('LAYER', LAYER);
    out.searchParams.set('STYLE', STYLE);
    out.searchParams.set('FORMAT', FORMAT);
    out.searchParams.set('TILEMATRIXSET', MATRIX);
    out.searchParams.set('TILEMATRIX', z);
    out.searchParams.set('TILEROW', y);
    out.searchParams.set('TILECOL', x);
    if (time) out.searchParams.set('time', time);

    // Auth
    const headers: Record<string, string> = {};
    if (AUTH_TYPE === 'bearer' && token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (AUTH_TYPE === 'basic' && user && pass) {
      const b64 = Buffer.from(`${user}:${pass}`).toString('base64');
      headers.Authorization = `Basic ${b64}`;
    } else if (AUTH_TYPE === 'query' && token) {
      out.searchParams.set(tokenParam, token);
    }

    const r = await fetch(out.toString(), { headers, cache: 'no-store' });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      return NextResponse.json(
        { error: 'Amentum WMTS upstream error', status: r.status, upstream: out.toString(), body: text.slice(0, 512) },
        { status: 502 }
      );
    }

    // Stream PNG/GeoTIFF/etc back to client
    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': FORMAT,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Proxy failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { z: string; x: string; y: string } }
) {
  const base   = process.env.COPERNICUS_WMTS_BASE!;
  const layer  = process.env.COPERNICUS_WMTS_LAYER!;
  const style  = process.env.COPERNICUS_WMTS_STYLE || "cmap:viridis";
  const format = process.env.COPERNICUS_WMTS_FORMAT || "image/png";
  const set    = process.env.COPERNICUS_WMTS_MATRIXSET || "EPSG:3857";
  const timeQ  = new URL(req.url).searchParams.get("time");
  const time   = (timeQ && timeQ.trim()) || process.env.COPERNICUS_WMTS_TIME || ""; // optional
  const user   = process.env.COPERNICUS_USER!;
  const pass   = process.env.COPERNICUS_PASS!;

  try {
    const url = new URL(base);
    url.searchParams.set("SERVICE", "WMTS");
    url.searchParams.set("REQUEST", "GetTile");
    url.searchParams.set("VERSION", "1.0.0");
    url.searchParams.set("LAYER", layer);
    if (style) url.searchParams.set("STYLE", style);
    url.searchParams.set("TILEMATRIXSET", set);
    url.searchParams.set("FORMAT", format);
    url.searchParams.set("TILEMATRIX", params.z);
    url.searchParams.set("TILEROW", params.y);
    url.searchParams.set("TILECOL", params.x);
    if (time) url.searchParams.set("time", time);

    const auth = Buffer.from(`${user}:${pass}`).toString("base64");
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Basic ${auth}` },
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return new NextResponse(`Copernicus WMTS error ${r.status}: ${text}`, { status: 502 });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    return new NextResponse(buf, {
      headers: {
        "Content-Type": format,
        "Cache-Control": "public, max-age=120",
      },
    });
  } catch (err: any) {
    return new NextResponse(`Proxy error: ${err?.message || String(err)}`, { status: 500 });
  }
}


