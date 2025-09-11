import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const z = url.searchParams.get('z') ?? '3';
    const x = url.searchParams.get('x') ?? '2';
    const y = url.searchParams.get('y') ?? '3';
    const time = url.searchParams.get('time') ?? (new Date(Date.now() - 24*3600*1000).toISOString().slice(0,10) + 'T00:00:00.000Z');

    const tpl = process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE || '';
    if (!tpl) {
      return new Response('NEXT_PUBLIC_SST_WMTS_TEMPLATE not set', { status: 500 });
    }
    // Ensure lowercase 'time=' in template is respected; if not, enforce here
    let wmts = tpl
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y)
      .replace('{time}', encodeURIComponent(time));
    // If template accidentally uses TIME=, normalize to time=
    wmts = wmts.replace('TIME=', 'time=');

    const upstream = await fetch(wmts, { redirect: 'follow' });
    const buf = await upstream.arrayBuffer();

    const headers = new Headers();
    headers.set('content-type', upstream.headers.get('content-type') || 'application/octet-stream');
    headers.set('x-wmts-url', wmts);
    headers.set('x-upstream-status', String(upstream.status));

    return new Response(buf, { status: upstream.status, headers });
  } catch (e: any) {
    return new Response(`diag error: ${e?.message || e}`, { status: 500 });
  }
}


