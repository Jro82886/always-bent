import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const resolvedParams = await params;
  const z = resolvedParams.z;
  const x = resolvedParams.x;
  const y = resolvedParams.y.replace('.png',''); // sanitize
  const isSst = req.nextUrl.pathname.includes('/sst/');
  const tplKey = isSst ? 'CMEMS_SST_WMTS_TEMPLATE' : 'CMEMS_CHL_WMTS_TEMPLATE';
  const base = process.env[tplKey];

  if (!base) return new Response(`${tplKey} not configured`, { status: 500 });

  // Handle time parameter - use default if not specified  
  const time = req.nextUrl.searchParams.get('time') || 'default';
  const target = base.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{time}', time);

  const u = process.env.COPERNICUS_USER || '';
  const p = process.env.COPERNICUS_PASS || '';
  const auth = 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');

  try {
    const upstream = await fetch(target, {
      headers: {
        Authorization: auth,
        Accept: 'image/png',
        'User-Agent': 'alwaysbent-abfi'
      },
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text || `Upstream ${upstream.status}`, {
        status: upstream.status,
        headers: { 'x-upstream-url': target }
      });
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        'x-upstream-url': target
      }
    });
  } catch (e: any) {
    return new Response(`Fetch failed: ${e?.message || e}`, {
      status: 502,
      headers: { 'x-upstream-url': target }
    });
  }
}
