import { NextRequest, NextResponse } from "next/server";
import { bbox as turfBbox, centroid as turfCentroid } from '@turf/turf';
import { getSupabase } from '@/lib/supabase/server';
import { analyzeSnipArea } from '@/lib/analysis/snip-report-analyzer';
import { detectOceanographicFeatures } from '@/lib/analysis/oceanographic-features';

export const runtime = 'nodejs';
export const maxDuration = 120; // Set max duration to 120 seconds for real Copernicus data

export async function POST(req: NextRequest) {
  try {
    const { polygon, date, want, inletId } = await req.json() as {
      polygon: GeoJSON.Feature<GeoJSON.Polygon> | GeoJSON.Polygon
      date: string
      want: { sst: boolean; chl: boolean }
      inletId?: string
    }
    if (!polygon || !date) return NextResponse.json({ error: 'polygon+date required' }, { status: 400 })
    const bbox = turfBbox(polygon as any)

    // Removed mock data - now using real Copernicus data

    // Try to call the raster sample function directly
    let data: any = {};
    let enhancedData: any = null; // Declare at the appropriate scope

    try {
      // Convert want object to layers array
      const layersArray: ('sst' | 'chl')[] = [];
      if (want.sst) layersArray.push('sst');
      if (want.chl) layersArray.push('chl');
      
      // Import and call the POST handler directly to avoid Vercel auth issues
      const sampleModule = await import('../rasters/sample/route');
      const sampleHandler = sampleModule.POST;
      
      // Create a NextRequest
      const sampleRequest = new NextRequest(
        new URL('http://localhost/api/rasters/sample'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            polygon,
            timeISO: date,
            layers: layersArray
          })
        }
      );

      // Create a timeout promise - wait up to 110 seconds for real data
      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 110000) // 110 second timeout (leaving 10s buffer)
      );

      // Race between the sample handler and timeout
      const sampleResponse = await Promise.race([
        sampleHandler(sampleRequest),
        timeoutPromise
      ]).catch((err) => {
        if (err.message === 'TIMEOUT') {
          // Return error for timeout - no mock data for Milestone 1
          throw new Error('Ocean data request timed out. Please try again.');
        }
        throw err;
      });

      if (sampleResponse && sampleResponse.ok) {
        const response = await sampleResponse.json();

        // Store pixel data for enhanced analysis
        let pixelData: any[] = [];

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

        // If we have pixels from the raster sample, use them for enhanced analysis
        console.log('[ANALYZE] Response has pixels?', !!response.pixels, 'Length:', response.pixels?.length);
        if (response.pixels) {
          pixelData = response.pixels;
        }

        // Run enhanced analysis - always run even without pixel data for user reports
        console.log('[ANALYZE] Pixel data length:', pixelData.length);
        try {
          console.log('[ANALYZE] Calling comprehensive analyzer with includeUserReports: true');
          enhancedData = await analyzeSnipArea(
            polygon as any,
            pixelData.length > 0 ? pixelData : [], // Pass empty array if no pixels
            {
              date: new Date(date),
              includeFleet: true,
              includeTrends: true,
              includeUserReports: true // Enable user reports from bite_reports table
            }
          );
          console.log('[ANALYZE] Enhanced data userReports:', enhancedData?.fleetActivity?.userReports);

          // Also detect oceanographic features only if we have pixel data
          if (pixelData.length > 0) {
            const features = await detectOceanographicFeatures(
              pixelData,
              bbox as [[number, number], [number, number]]
            );
            enhancedData.oceanographicFeatures = features;
          }
        } catch (e) {
          console.error('[ANALYZE] Enhanced analysis error:', e);
          // Continue without enhanced features
        }
      } else if (sampleResponse) {
        const errorText = await sampleResponse.text();
        console.error('[ANALYZE] Raster sample failed:', {
          status: sampleResponse.status,
          error: errorText
        });
        // Return error for Milestone 1 - real data only
        return NextResponse.json({
          error: 'Failed to fetch ocean data',
          details: errorText
        }, { status: 502 });
      }
    } catch (e: any) {
      console.error('[ANALYZE] Raster sample error:', e);
      // Return error for Milestone 1 - real data only
      return NextResponse.json({
        error: 'Failed to process ocean data',
        details: e.message || 'Unknown error'
      }, { status: 500 });
    }

    // Get polygon center for weather
    const center = turfCentroid(polygon as any);
    const [lng, lat] = center.geometry.coordinates;
    
    // Fetch weather data from stormio
    let weatherData = null;
    try {
      if (inletId) {
        const weatherRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather?inlet=${inletId}`);

        if (weatherRes.ok) {
          const data = await weatherRes.json();
          weatherData = {
            wind: { speed: data.weather?.windKt || 12, direction: data.weather?.windDir || "SE" },
            seas: { height: data.weather?.swellFt || 3, period: data.weather?.swellPeriod || 8 },
            temp: data.weather?.airTempF || 78,
            conditions: data.weather?.conditions || "Partly cloudy"
          };
        }
      } else {
        // Fallback mock data if no inlet
        weatherData = {
          wind: { speed: 12, direction: "SE" },
          seas: { height: 3, period: 8 },
          temp: 78,
          conditions: "Partly cloudy"
        };
      }
    } catch (e) {
      console.error('[ANALYZE] Weather fetch failed:', e);
    }
    
    // Fetch real fleet vessels from GFW API
    let fleetData = null;
    try {
      const gfwUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gfw/vessels`);

      // Pass bbox as parameter
      gfwUrl.searchParams.append('bbox', bbox.join(','));
      gfwUrl.searchParams.append('days', '7'); // Last 7 days of activity

      const gfwRes = await fetch(gfwUrl.toString());

      if (gfwRes.ok) {
        const gfwData = await gfwRes.json();

        if (gfwData.vessels && gfwData.vessels.length > 0) {
          // Convert GFW data to our format
          fleetData = {
            vessels: gfwData.vessels.slice(0, 5).map((v: any) => {
              // Calculate time ago from last position
              const lastTime = new Date(v.last_pos?.t || Date.now());
              const hoursAgo = Math.round((Date.now() - lastTime.getTime()) / (1000 * 60 * 60));
              let lastSeen = `${hoursAgo}h ago`;
              if (hoursAgo < 1) {
                const minsAgo = Math.round((Date.now() - lastTime.getTime()) / (1000 * 60));
                lastSeen = `${minsAgo}m ago`;
              } else if (hoursAgo > 24) {
                const daysAgo = Math.round(hoursAgo / 24);
                lastSeen = `${daysAgo}d ago`;
              }

              return {
                name: v.name || 'Unknown Vessel',
                type: v.gear || 'commercial',
                lastSeen: lastSeen,
                isRealData: true  // Mark as real data when available
              };
            }),
            count: gfwData.vessels.length,
            isRealData: true
          };
        } else {
          // No vessels found in area
          fleetData = {
            vessels: [],
            count: 0,
            message: "No vessels detected in this area"
          };
        }
      } else {
        console.error('[ANALYZE] GFW API error:', gfwRes.status);

        // Check specific error status
        if (gfwRes.status === 401) {
          fleetData = {
            vessels: [],
            count: 0,
            message: "Vessel tracking unavailable - GFW token needs renewal"
          };
        } else {
          fleetData = {
            vessels: [],
            count: 0,
            message: "Vessel data temporarily unavailable"
          };
        }
      }
    } catch (e) {
      console.error('[ANALYZE] Fleet fetch failed:', e);
      // Return empty fleet data on error
      fleetData = {
        vessels: [],
        count: 0
      };
    }
    
    // Fetch recent bite reports
    let reportsData = null;
    try {
      const supabase = await getSupabase();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Get reports within the bounding box
      const { data: reports, error } = await supabase
        .from('bite_reports')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .gte('lon', bbox[0])
        .lte('lon', bbox[2])
        .gte('lat', bbox[1])
        .lte('lat', bbox[3])
        .eq('status', 'analyzed')
        .limit(10);

      console.log('[ANALYZE] Bite reports query:', { error, count: reports?.length, bbox });
        
      if (reports && reports.length > 0) {
        reportsData = {
          count: reports.length,
          species: [...new Set(reports.map((r: any) => r.species).filter(Boolean))],
          recentCatch: reports[0]?.species || 'Unknown'
        };
      }
    } catch (e) {
      console.error('[ANALYZE] Reports fetch failed:', e);
    }

    // Now data has the correct structure
    const result = {
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
      weather: weatherData ? {
        wind: weatherData.wind,
        seas: weatherData.seas,
        temp: weatherData.temp,
        conditions: weatherData.conditions
      } : null,
      fleet: fleetData,
      reports: reportsData,
      debug: { bbox, date, hasRealData: !!data.sst || !!data.chl },
      // Add enhanced analysis features
      enhanced: enhancedData ? {
        score: enhancedData.score,
        temperature: enhancedData.temperature,
        chlorophyll: enhancedData.chlorophyll,
        fleetActivity: enhancedData.fleetActivity,
        trends: enhancedData.trends,
        narrative: enhancedData.narrative,
        tactical: enhancedData.tactical,
        oceanographicFeatures: enhancedData.oceanographicFeatures
      } : null
    };

    return NextResponse.json(result);
  } catch (e:any) {
    console.error('[analyze] error', e)
    return NextResponse.json({ error: 'analyze failed' }, { status: 500 })
  }
}