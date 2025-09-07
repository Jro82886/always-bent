import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = process.env;
  const base = !!env.COPERNICUS_WMTS_BASE;
  const authType = (env.COPERNICUS_AUTH_TYPE || '').toLowerCase();
  const hasBearer = authType === 'bearer' && !!env.COPERNICUS_TOKEN;
  const hasBasic = authType === 'basic' && !!env.COPERNICUS_BASIC_USER && !!env.COPERNICUS_BASIC_PASS;
  const layerChl = !!env.LAYER_CHL_DAILY;

  return NextResponse.json({
    ok: base && (hasBearer || hasBasic),
    base,
    authType: authType || null,
    authReady: hasBearer || hasBasic,
    layers: { sst: false, chl: layerChl },
  });
}


