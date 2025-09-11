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

  // DEBUG LOGGING
  console.log(`🚨 SST DEBUG - Tile: ${z}/${x}/${y}`);
  console.log(`🚨 SST DEBUG - Template Key: ${tplKey}`);
  console.log(`🚨 SST DEBUG - Template: ${base ? 'SET' : 'MISSING'}`);
  console.log(`🚨 SST DEBUG - User: ${process.env.COPERNICUS_USER ? 'SET' : 'MISSING'}`);
  console.log(`🚨 SST DEBUG - Pass: ${process.env.COPERNICUS_PASS ? 'SET' : 'MISSING'}`);

  if (!base) {
    console.log(`🚨 SST ERROR - ${tplKey} not configured`);
    return new Response(`${tplKey} not configured`, { status: 500 });
  }

  // Use proper ISO date format for TIME parameter
  const now = new Date();
  const isoTime = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const target = base.replace('{z}', z).replace('{x}', x).replace('{y}', y).replace('{time}', isoTime);

  console.log(`🚨 SST DEBUG - Time param: ${isoTime}`);
  console.log(`🚨 SST DEBUG - Final URL: ${target}`);

  const u = process.env.COPERNICUS_USER || '';
  const p = process.env.COPERNICUS_PASS || '';
  const auth = 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');

  try {
    console.log(`🚨 SST DEBUG - Making request to Copernicus...`);
    const upstream = await fetch(target, {
      headers: {
        Authorization: auth,
        Accept: 'image/png',
        'User-Agent': 'alwaysbent-abfi'
      },
      redirect: 'follow',
      cache: 'no-store'
    });

    console.log(`🚨 SST DEBUG - Response status: ${upstream.status}`);
    
    if (!upstream.ok) {
      const text = await upstream.text();
      console.log(`🚨 SST ERROR - Upstream failed: ${upstream.status}`);
      console.log(`🚨 SST ERROR - Full Response: ${text}`);
      return new Response(text || `Upstream ${upstream.status}`, {
        status: upstream.status,
        headers: { 'x-upstream-url': target }
      });
    }

    console.log(`🚨 SST SUCCESS - Tile loaded successfully`);

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        'x-upstream-url': target
      }
    });
  } catch (e: any) {
    console.log(`🚨 SST ERROR - Fetch failed: ${e?.message || e}`);
    return new Response(`Fetch failed: ${e?.message || e}`, {
      status: 502,
      headers: { 'x-upstream-url': target }
    });
  }
}
