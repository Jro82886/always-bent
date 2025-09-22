import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inletId = searchParams.get('inlet_id');
  
  if (!inletId) {
    return NextResponse.json([]); // Soft fail - return empty array
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase configuration missing');
    return NextResponse.json([]); // Soft fail - return empty array
  }
  
  // Using imported supabase client
  
  try {
    // Get vessels online in the last 10 minutes
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    // Query vessels_latest view for online vessels
    const { data: vessels, error: vesselsError } = await supabase
      .from('vessels_latest')
      .select('*')
      .eq('inlet_id', inletId)
      .gte('recorded_at', tenMinutesAgo.toISOString())
      .order('recorded_at', { ascending: false });
    
    if (vesselsError) {
      console.error('Fleet vessels query error:', vesselsError);
      return NextResponse.json([]); // Soft fail - return empty array
    }
    
    if (!vessels || vessels.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get vessel IDs for report lookup
    const vesselIds = vessels.map(v => v.vessel_id);
    
    // Fetch latest reports for these vessels (within 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .in('meta->>vessel_id', vesselIds)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      // Continue without reports rather than failing entirely
    }
    
    // Create a map of vessel_id to latest report
    const reportsByVessel = new Map();
    if (reports) {
      reports.forEach(report => {
        const vesselId = report.meta?.vessel_id;
        if (vesselId && !reportsByVessel.has(vesselId)) {
          reportsByVessel.set(vesselId, report);
        }
      });
    }
    
    // Format response
    const response = vessels.map(vessel => {
      const latestReport = reportsByVessel.get(vessel.vessel_id);
      
      return {
        vessel_id: vessel.vessel_id,
        name: vessel.meta?.name || 'Unknown Vessel',
        inlet_id: vessel.inlet_id,
        last_seen: vessel.recorded_at,
        speed: vessel.speed_kn,
        heading: vessel.heading_deg,
        lat: vessel.lat,
        lon: vessel.lon,
        has_report: !!latestReport,
        latest_report: latestReport ? {
          id: latestReport.id,
          type: latestReport.type,
          created_at: latestReport.created_at,
          species: latestReport.payload_json?.species || [],
          summary: latestReport.payload_json?.summary || ''
        } : null
      };
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Fleet online handler crash:', error);
    return NextResponse.json([]); // Soft fail - return empty array
  }
}
