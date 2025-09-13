import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client only when environment variables are available
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(url, key);
};

// GET /api/tracking/activity - Get boat activity in a polygon area
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const polygonParam = searchParams.get('polygon');
    const hoursParam = searchParams.get('hours') || '24';
    
    if (!polygonParam) {
      return NextResponse.json(
        { error: 'Polygon coordinates required' },
        { status: 400 }
      );
    }

    const polygon = JSON.parse(polygonParam);
    const hours = parseInt(hoursParam);

    // Query positions within polygon and time window
    const timeWindow = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Build polygon SQL - expecting array of [lng, lat] coordinates
    const polygonPoints = polygon.map((p: number[]) => `${p[0]} ${p[1]}`).join(',');
    const polygonWKT = `POLYGON((${polygonPoints}))`;

    // Get all positions in the polygon
    const supabase = getSupabaseClient();
    const { data: positions, error: posError } = await supabase
      .from('vessel_positions')
      .select('user_id, username, lat, lng, speed, timestamp')
      .gte('timestamp', timeWindow);

    if (posError) {
      console.error('Error querying positions:', posError);
      return NextResponse.json(
        { error: 'Failed to query activity' },
        { status: 500 }
      );
    }

    // Filter positions that are within the polygon (client-side for now)
    // In production, use PostGIS ST_Contains for better performance
    const positionsInPolygon = positions.filter(pos => 
      isPointInPolygon([pos.lng, pos.lat], polygon)
    );

    // Calculate statistics
    const uniqueBoats = new Set(positionsInPolygon.map(p => p.user_id)).size;
    const totalPositions = positionsInPolygon.length;
    
    // Find loitering/fishing activity (speed < 3 knots)
    const fishingPositions = positionsInPolygon.filter(p => p.speed < 3);
    const fishingRatio = totalPositions > 0 ? fishingPositions.length / totalPositions : 0;

    // Group by hour to find peak activity
    const hourlyActivity = positionsInPolygon.reduce((acc: any, pos) => {
      const hour = new Date(pos.timestamp).getHours();
      if (!acc[hour]) acc[hour] = new Set();
      acc[hour].add(pos.user_id);
      return acc;
    }, {});

    const peakHour = Object.entries(hourlyActivity)
      .map(([hour, users]: [string, any]) => ({
        hour: parseInt(hour),
        count: users.size
      }))
      .sort((a, b) => b.count - a.count)[0];

    // Get loitering events in the area
    const { data: loiteringEvents } = await supabase
      .from('loitering_events')
      .select('*')
      .gte('start_time', timeWindow);

    const loiteringInPolygon = (loiteringEvents || []).filter(event =>
      isPointInPolygon([event.lng, event.lat], polygon)
    );

    const totalLoiterMinutes = loiteringInPolygon.reduce((sum, event) => 
      sum + (event.duration_minutes || 0), 0
    );

    // Determine activity level
    let activityLevel = 'LOW';
    let confidence = 0.3;
    
    if (uniqueBoats >= 5) {
      activityLevel = 'HIGH';
      confidence = 0.9;
    } else if (uniqueBoats >= 3) {
      activityLevel = 'MODERATE';
      confidence = 0.7;
    } else if (uniqueBoats >= 1) {
      activityLevel = 'LOW';
      confidence = 0.5;
    } else {
      activityLevel = 'NONE';
      confidence = 0.1;
    }

    // Boost confidence if there's significant loitering
    if (totalLoiterMinutes > 60) {
      confidence = Math.min(confidence + 0.2, 1.0);
    }

    return NextResponse.json({
      success: true,
      analysis: {
        time_window: `${hours} hours`,
        unique_boats: uniqueBoats,
        total_positions: totalPositions,
        activity_level: activityLevel,
        confidence_score: confidence,
        fishing_activity: {
          loitering_events: loiteringInPolygon.length,
          total_loiter_minutes: totalLoiterMinutes,
          fishing_probability: fishingRatio
        },
        peak_activity: peakHour ? {
          hour: `${peakHour.hour}:00`,
          boats: peakHour.count
        } : null,
        // Data for SnipTool integration
        hotspot_weight: calculateHotspotWeight(uniqueBoats, totalLoiterMinutes, fishingRatio),
        description: generateActivityDescription(uniqueBoats, activityLevel, totalLoiterMinutes)
      }
    });

  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if point is in polygon
function isPointInPolygon(point: number[], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }

  return inside;
}

// Calculate weight for hotspot scoring (0.0 to 1.0)
function calculateHotspotWeight(boats: number, loiterMinutes: number, fishingRatio: number): number {
  // Normalize each factor
  const boatScore = Math.min(boats / 10, 1.0); // Max out at 10 boats
  const loiterScore = Math.min(loiterMinutes / 180, 1.0); // Max out at 3 hours
  const fishingScore = fishingRatio;

  // Weighted average
  return (boatScore * 0.4 + loiterScore * 0.4 + fishingScore * 0.2);
}

// Generate human-readable description for the analysis
function generateActivityDescription(boats: number, level: string, loiterMinutes: number): string {
  if (boats === 0) {
    return "No recent boat activity detected in this area.";
  }

  const loiterHours = Math.round(loiterMinutes / 60);
  let description = `${level} ACTIVITY: ${boats} boat${boats > 1 ? 's' : ''} detected in last 24hrs`;

  if (loiterMinutes > 30) {
    description += ` with ${loiterHours > 0 ? `${loiterHours}+ hours` : `${loiterMinutes} minutes`} of fishing activity`;
  }

  if (level === 'HIGH') {
    description += ". This concentration suggests active feeding or favorable conditions.";
  } else if (level === 'MODERATE') {
    description += ". Moderate interest from local fleet indicates potential.";
  } else {
    description += ". Limited activity, but conditions may still be developing.";
  }

  return description;
}
