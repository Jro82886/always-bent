export const runtime = 'nodejs';

export async function GET() {
  const keys = [
    'CMEMS_SST_WMTS_TEMPLATE',
    'CMEMS_CHL_WMTS_TEMPLATE',
    'COPERNICUS_USER',
    'COPERNICUS_PASS',
    'NEXT_PUBLIC_SST_TILES_URL',
    'NEXT_PUBLIC_CHL_TILES_URL'
  ];
  const out: Record<string, any> = {};
  for (const k of keys) out[k] = process.env[k] ? { present:true, len:String(process.env[k]!.length) } : { present:false };
  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type':'application/json' }});
}
