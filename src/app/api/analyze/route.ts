import { NextRequest, NextResponse } from "next/server";
import * as turf from '@turf/turf';

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
  const responseData: any = {
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

  // Get the actual ocean data
  try {
    // For now, return mock data to verify the flow works
    // TODO: Import and call the actual raster sampling logic directly
    const mockSSTData = layers.includes('sst') ? {
      mean_f: 72.5,
      min_f: 71.2,
      max_f: 74.8,
      gradient_f: 0.8,
      n_valid: 150,
      n_nodata: 10
    } : null;
    
    const mockCHLData = layers.includes('chl') ? {
      mean: 0.45,
      min: 0.2,
      max: 0.8,
      gradient: 0.15,
      n_valid: 150,
      n_nodata: 10
    } : null;
    
    const rasterData = {
      ok: true,
      stats: {
        sst: mockSSTData,
        chl: mockCHLData
      }
    };
    
    // Extract the ocean data
    const sstData = rasterData.stats?.sst;
    const chlData = rasterData.stats?.chl;
    
    // Build analysis narrative
    let narrative = '';
    
    // SST Analysis
    if (layers.includes('sst') && sstData && sstData.mean_f) {
      const tempRange = (sstData.max_f || sstData.mean_f) - (sstData.min_f || sstData.mean_f);
      if (tempRange < 0.5) {
        narrative += `Water is uniform in temperature (Δ ${tempRange.toFixed(1)}°F). Uniform water is usually less productive. `;
      } else if (tempRange >= 2.0) {
        narrative += `Sharp SST gradient of ${tempRange.toFixed(1)}°F — strong edge, favorable for pelagic activity. `;
      } else {
        narrative += `SST gradient of ${tempRange.toFixed(1)}°F — moderate edge, watch for bait concentration. `;
      }
      narrative += `Average temp: ${sstData.mean_f.toFixed(1)}°F. `;
    } else if (layers.includes('sst')) {
      narrative += 'SST data not available for this area/time. ';
    }
    
    // CHL Analysis  
    if (layers.includes('chl') && chlData && chlData.mean) {
      if (chlData.mean < 0.1) {
        narrative += `Extremely clean water (${chlData.mean.toFixed(2)} mg/m³). Bait unlikely to hold. `;
      } else if (chlData.mean >= 0.3 && chlData.mean <= 1.0) {
        narrative += `Moderate chlorophyll (${chlData.mean.toFixed(2)} mg/m³) — favorable feeding zone. `;
      } else if (chlData.mean > 2.0) {
        narrative += `Very high chlorophyll (${chlData.mean.toFixed(2)} mg/m³). Often turbid; predators may avoid. `;
      } else {
        narrative += `Chlorophyll ${chlData.mean.toFixed(2)} mg/m³ — transitional water quality. `;
      }
    } else if (layers.includes('chl')) {
      narrative += 'Chlorophyll data not available for this area/time. ';
    }
    
    // Calculate area
    const areaKm2 = polygon ? turf.area(polygon) / 1000000 : 
                    (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) * 111 * 111 * Math.cos(bbox[1] * Math.PI / 180);
    
    narrative += `Analysis area: ${areaKm2.toFixed(1)} km². `;
    
    // Build complete response
    responseData.analysis = {
      oceanData: {
        sst: sstData,
        chl: chlData
      },
      narrative: narrative.trim(),
      stats: {
        area_km2: areaKm2,
        sst_mean_f: sstData?.mean_f,
        sst_range_f: sstData ? (sstData.max_f - sstData.min_f) : null,
        chl_mean_mg_m3: chlData?.mean,
        chl_range_mg_m3: chlData ? (chlData.max - chlData.min) : null
      },
      confidence: (sstData || chlData) ? 'high' : 'no-data'
    };
    
  } catch (error) {
    console.error('Analysis error:', error);
    responseData.error = 'Analysis failed';
    responseData.analysis = {
      narrative: 'Unable to analyze ocean conditions at this time.',
      confidence: 'error'
    };
  }

  return new NextResponse(JSON.stringify(responseData), { 
    status: 200,
    headers 
  });
}