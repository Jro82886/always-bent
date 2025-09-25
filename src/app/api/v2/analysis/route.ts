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

  const { polygon, timeISO, layers } = body;
  
  if (!polygon || polygon?.type !== 'Polygon') {
    return NextResponse.json({ error: 'polygon required' }, { status: 400 });
  }
  if (!layers?.length) {
    return NextResponse.json({ error: 'layers required' }, { status: 400 });
  }
  if (!timeISO) {
    return NextResponse.json({ error: 'timeISO required' }, { status: 400 });
  }

  // Derive bbox once, then call the same analyzer
  const bbox = bboxFromPolygon(polygon);
  if (!bbox) {
    return NextResponse.json({ error: 'Invalid polygon geometry' }, { status: 400 });
  }

  // TODO: Call the analyzer
  // const result = await analyze({ bbox, timeISO, layers });

  return NextResponse.json({ 
    ok: true,
    v2: true,
    normalized: { bbox, timeISO, layers },
    // result 
  });
}
