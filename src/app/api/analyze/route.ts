import { NextRequest, NextResponse } from "next/server";
import { bbox as turfBbox } from '@turf/turf';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { polygon, date, want } = await req.json() as {
      polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon
      date: string
      want: { sst: boolean; chl: boolean }
    }
    if (!polygon || !date) return NextResponse.json({ error: 'polygon+date required' }, { status: 400 })
    const bbox = turfBbox(polygon as any)

    // Try to call the raster sample endpoint
    let data: any = {};
    try {
      // Convert want object to layers array
      const layersArray: string[] = [];
      if (want.sst) layersArray.push('sst');
      if (want.chl) layersArray.push('chl');
      
      // Use the deployment URL in production
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        
      console.log('[ANALYZE] Calling raster sample at:', `${baseUrl}/api/rasters/sample`);
      
      const sample = await fetch(`${baseUrl}/api/rasters/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon,
          timeISO: date,
          layers: layersArray
        })
      });
      
      if (sample.ok) {
        const response = await sample.json();
        console.log('[ANALYZE] Raster sample response:', JSON.stringify(response, null, 2));
        
        // Extract real data from the response
        if (response.stats?.sst) {
          // SST values are already in Fahrenheit from the API
          data.sst = {
            meanC: ((response.stats.sst.mean_f - 32) * 5) / 9, // Convert F to C
            minC: ((response.stats.sst.min_f - 32) * 5) / 9,
            maxC: ((response.stats.sst.max_f - 32) * 5) / 9,
            gradientCperKm: response.stats.sst.gradient_f * 1.60934 * 5 / 9, // F/mile to C/km
          };
        }
        if (response.stats?.chl) {
          data.chl = {
            mean: response.stats.chl.mean
          };
        }
      } else {
        const errorText = await sample.text();
        console.error('[ANALYZE] Raster sample failed:', {
          status: sample.status,
          error: errorText,
          url: `${baseUrl}/api/rasters/sample`,
          payload: { polygon, timeISO: date, layers: layersArray }
        });
        // Return error instead of mock data
        return NextResponse.json({ 
          error: `Raster sampling failed: ${sample.status}`,
          details: errorText
        }, { status: 500 });
      }
    } catch (e: any) {
      console.error('[ANALYZE] Raster sample error:', e);
      // Return error instead of mock data
      return NextResponse.json({ 
        error: 'Failed to connect to ocean data service',
        details: e.message
      }, { status: 500 });
    }

    // Now data has the correct structure
    return NextResponse.json({
      areaKm2: 100, // TODO: Calculate actual area from polygon
      hasSST: !!data.sst,
      hasCHL: !!data.chl,
      sst: data.sst ? {
        meanC: data.sst.meanC,
        minC:  data.sst.minC,
        maxC:  data.sst.maxC,
        gradientCperKm: data.sst.gradientCperKm
      } : undefined,
      chl: data.chl ? {
        mean: data.chl.mean
      } : undefined,
      debug: { bbox, date, hasRealData: !!data.sst || !!data.chl }
    })
  } catch (e:any) {
    console.error('[analyze] error', e)
    return NextResponse.json({ error: 'analyze failed' }, { status: 500 })
  }
}