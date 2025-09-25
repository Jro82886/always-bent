import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';

type BBox = [number, number, number, number];
type LayerKey = 'sst' | 'chl';

function bboxFromPolygon(p: GeoJSON.Polygon): BBox | null {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const ring of p.coordinates ?? []) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLng, minLat, maxLng, maxLat].every(Number.isFinite)
    ? [minLng, minLat, maxLng, maxLat] as BBox
    : null;
}

export async function POST(req: NextRequest) {
  let body: any;
  try { 
    body = await req.json(); 
  } catch { 
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 }); 
  }

  const layers: LayerKey[] = body?.layers;
  const polygon: GeoJSON.Polygon | undefined = body?.polygon;
  let bbox: BBox | undefined = body?.bbox;

  // time: accept legacy `time` or new `timeISO`
  const timeISO: string | undefined = body?.timeISO ?? body?.time;

  if (!layers?.length) {
    return NextResponse.json({ error: 'Missing layers' }, { status: 400 });
  }
  if (!timeISO) {
    return NextResponse.json({ error: 'Missing time/timeISO' }, { status: 400 });
  }

  // Normalize geometry (prefer polygon)
  if (!bbox && polygon) {
    bbox = bboxFromPolygon(polygon) || undefined;
  }
  if (!bbox) {
    return NextResponse.json({ error: 'Missing polygon/bbox' }, { status: 400 });
  }

  // Build response with appropriate headers
  const responseData = {
    ok: true,
    normalized: { bbox, timeISO, layers },
    // For MVP verification - echo back what we received
    received: {
      hadPolygon: !!polygon,
      hadBbox: !!body?.bbox,
      polygonPoints: polygon?.coordinates?.[0]?.length ?? 0
    }
  };

  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  // Optional: deprecate bbox usage explicitly
  if (body?.bbox && !body?.polygon) {
    headers.set('Deprecation', 'true');
    headers.set('Sunset', '2025-11-01');
    headers.set('Link', '</api/v2/analysis>; rel="successor-version"');
  }

  // TODO: Call existing analysis using normalized bbox, timeISO, layers
  // const result = await analyze({ bbox, timeISO, layers });
  // responseData.result = result;

  return new NextResponse(JSON.stringify(responseData), { 
    status: 200,
    headers 
  });
}