/**
 * ABFI Bite Batch Upload Endpoint
 * Receives offline bite logs and generates ocean intelligence reports
 * Each bite gets analyzed with historical ocean data from its timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase/server"
import { analyzeOceanConditions } from '@/lib/ocean/analysis';
import { getIdentityForUser, shouldHighlight } from '@/lib/reports/enrichIdentity';
import * as turf from '@turf/turf';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const { bites } = await request.json();
    
    if (!Array.isArray(bites)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    
    
    const results = [];
    
    for (const bite of bites) {
      try {
        // Validate bite data
        if (!bite.bite_id || !bite.lat || !bite.lon || !bite.created_at_ms) {
          results.push({
            bite_id: bite.bite_id,
            status: 'error:missing_required_fields'
          });
          continue;
        }
        
        // Check if bite is too old (>24 hours)
        const ageMs = Date.now() - bite.created_at_ms;
        if (ageMs > 24 * 60 * 60 * 1000) {
          results.push({
            bite_id: bite.bite_id,
            status: 'error:expired'
          });
          continue;
        }
        
        // Check for duplicate
        const { data: existing } = await supabase
          .from('bite_reports')
          .select('id')
          .eq('bite_id', bite.bite_id)
          .single();
        
        if (existing) {
          results.push({
            bite_id: bite.bite_id,
            status: 'duplicate'
          });
          continue;
        }
        
        // Get user identity for the bite
        const identity = await getIdentityForUser(supabase, bite.user_id || user.id);
        
        // Prepare bite payload for unified reports table
        const bitePayload = {
          kind: 'bite',
          coords: { 
            lat: bite.lat, 
            lon: bite.lon, 
            accuracy_m: bite.accuracy_m 
          },
          context: bite.context || {},
          captured_at: new Date(bite.created_at_ms).toISOString(),
          source_offline: true,
          identity, // Add captain and boat info
          species: bite.species || [],
          highlight: false, // Will be determined after analysis
          // Original bite data
          bite_id: bite.bite_id,
          user_name: bite.user_name,
          notes: bite.notes,
          fish_on: bite.fish_on,
          device_tz: bite.device_tz,
          app_version: bite.app_version
        };

        // Store in unified reports table
        const { error: insertError } = await supabase
          .from('reports')
          .insert({
            user_id: bite.user_id || user.id,
            inlet_id: bite.inlet_id || 'unknown',
            type: 'bite',
            status: 'queued', // Will be updated to 'complete' after analysis
            source: 'offline',
            payload_json: bitePayload,
            meta: {
              bite_id: bite.bite_id,
              synced_at: new Date().toISOString(),
              client: { app: 'abfi', version: bite.app_version }
            }
          });
        
        // Also store in bite_reports for backward compatibility during transition
        if (!insertError) {
          await supabase
            .from('bite_reports')
            .insert({
              bite_id: bite.bite_id,
              user_id: bite.user_id,
              user_name: bite.user_name,
              created_at: new Date(bite.created_at_ms).toISOString(),
              location: `POINT(${bite.lon} ${bite.lat})`,
              lat: bite.lat,
              lon: bite.lon,
              accuracy_m: bite.accuracy_m,
              inlet_id: bite.inlet_id,
              context: bite.context,
              notes: bite.notes,
              fish_on: bite.fish_on,
              species: bite.species,
              device_tz: bite.device_tz,
              app_version: bite.app_version,
              status: 'pending_analysis'
            });
        }
        
        if (insertError) {
          
          results.push({
            bite_id: bite.bite_id,
            status: `error:${insertError.message}`
          });
          continue;
        }
        
        // Queue analysis job (async - don't block response)
        queueBiteAnalysis(bite).catch(err => {
          
        });
        
        results.push({
          bite_id: bite.bite_id,
          status: 'accepted'
        });
        
      } catch (error) {
        
        results.push({
          bite_id: bite.bite_id,
          status: `error:${String(error)}`
        });
      }
    }
    
    return NextResponse.json({ results });
    
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Queue bite for ocean analysis
 * This runs async to generate the full report with historical data
 */
async function queueBiteAnalysis(bite: any) {
  const supabase = await getSupabase();
  
  try {
    // Convert timestamp to date for ocean data query
    const biteDate = new Date(bite.created_at_ms);
    const layers_on = bite.context?.layers_on || ['sst', 'chl'];
    
    // Create a small polygon around the bite point (approx 1km radius)
    const point = turf.point([bite.lon, bite.lat]);
    const buffered = turf.buffer(point, 1, { units: 'kilometers' });
    const polygon = turf.feature(buffered?.geometry as GeoJSON.Polygon);
    
    // Call the raster sampler for real stats
    let samplerStats = null;
    let narrative = '';
    
    try {
      const samplerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rasters/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          polygon,
          time: biteDate.toISOString().split('T')[0],
          layers: layers_on.filter((l: string) => l === 'sst' || l === 'chl')
        })
      });
      
      if (samplerResponse.ok) {
        const samplerData = await samplerResponse.json();
        samplerStats = samplerData.stats;
        
        // Build simple narrative for bite
        if (samplerStats?.sst_mean) {
          narrative = `Ocean conditions: SST ${samplerStats.sst_mean.toFixed(1)}°F`;
          if (samplerStats.chl_mean) {
            narrative += `, CHL ${samplerStats.chl_mean.toFixed(2)} mg/m³`;
          }
        } else {
          narrative = 'Ocean conditions recorded';
        }
      }
    } catch (error) {
      console.error('Sampler failed for bite:', error);
    }
    
    // Fallback to legacy analysis if sampler failed
    const analysis = samplerStats || await analyzeOceanConditions({
      lat: bite.lat,
      lon: bite.lon,
      date: biteDate,
      layers: layers_on,
    });
    
    // Generate report content
    const report = samplerStats ? {
      bite_id: bite.bite_id,
      analysis_completed_at: new Date().toISOString(),
      stats: samplerStats,
      summary: narrative,
      ocean_conditions: {
        sst: samplerStats.sst_mean,
        sst_range: samplerStats.sst_max - samplerStats.sst_min,
        chl: samplerStats.chl_mean,
        front_strength: samplerStats.front_strength_p90,
      },
      confidence_score: samplerStats.front_strength_p90 > 0.5 ? 0.8 : 0.5,
      recommendations: narrative.includes('Strong temperature break') 
        ? ['Focus on the temperature edges'] 
        : ['Work the area thoroughly']
    } : {
      bite_id: bite.bite_id,
      analysis_completed_at: new Date().toISOString(),
      ocean_conditions: {
        sst: analysis.sst,
        chl: analysis.chlorophyll,
        current_speed: analysis.currentSpeed,
        current_direction: analysis.currentDirection,
        depth: analysis.depth,
        distance_to_edge: analysis.nearestEdge?.distance_m,
        edge_strength: analysis.nearestEdge?.strength,
      },
      vessel_activity: {
        nearby_count: analysis.vesselCount,
        fishing_vessels: analysis.fishingVessels,
        activity_level: analysis.activityLevel,
      },
      confidence_score: calculateConfidence(analysis),
      recommendations: generateRecommendations(analysis),
    };
    
    // Update the bite report with analysis
    await supabase
      .from('bite_reports')
      .update({
        status: 'analyzed',
        analysis: report,
        confidence_score: report.confidence_score,
      })
      .eq('bite_id', bite.bite_id);
    
    // Also update unified reports table
    const { data: reportRecord } = await supabase
      .from('reports')
      .select('id')
      .eq('meta->>bite_id', bite.bite_id)
      .single();
    
    if (reportRecord) {
      // Update payload with analysis and determine highlight
      const updatedPayload = {
        ...bite,
        analysis: report,
        highlight: shouldHighlight({ ...bite, analysis: report })
      };
      
      await supabase
        .from('reports')
        .update({
          status: 'complete',
          payload_json: updatedPayload
        })
        .eq('id', reportRecord.id);
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'bite-sync',
        action: 'bite_sync_completed',
        bite_id: bite.bite_id,
        report_id: reportRecord.id
      }));
    }
    
    
    
  } catch (error) {
    
    
    // Mark as failed
    await supabase
      .from('bite_reports')
      .update({
        status: 'analysis_failed',
        error: String(error),
      })
      .eq('bite_id', bite.bite_id);
  }
}

/**
 * Calculate confidence score based on ocean conditions
 */
function calculateConfidence(analysis: any): number {
  let score = 50; // Base score
  
  // Temperature break nearby
  if (analysis.nearestEdge?.distance_m < 500) {
    score += 20;
  } else if (analysis.nearestEdge?.distance_m < 1000) {
    score += 10;
  }
  
  // Chlorophyll concentration
  if (analysis.chlorophyll > 0.5 && analysis.chlorophyll < 2.0) {
    score += 15; // Optimal range
  }
  
  // Vessel activity
  if (analysis.fishingVessels > 0) {
    score += 10;
  }
  
  // Current presence
  if (analysis.currentSpeed > 0.1) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Generate fishing recommendations based on conditions
 */
function generateRecommendations(analysis: any): string[] {
  const recs = [];
  
  if (analysis.nearestEdge?.distance_m < 1000) {
    recs.push('Fish the temperature break - predators patrol these edges');
  }
  
  if (analysis.chlorophyll > 0.5) {
    recs.push('Good baitfish conditions detected');
  }
  
  if (analysis.currentSpeed > 0.2) {
    recs.push('Strong current - fish the edges and eddies');
  }
  
  if (analysis.fishingVessels > 2) {
    recs.push('Multiple boats working this area - fish are likely present');
  }
  
  if (recs.length === 0) {
    recs.push('Conditions are neutral - work the area thoroughly');
  }
  
  return recs;
}
