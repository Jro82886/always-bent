import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vesselId = searchParams.get('vessel_id');
  const hours = parseInt(searchParams.get('hours') || '12');
  
  if (!vesselId) {
    return NextResponse.json({ error: 'vessel_id parameter required' }, { status: 400 });
  }
  
  if (hours < 1 || hours > 48) {
    return NextResponse.json({ error: 'hours must be between 1 and 48' }, { status: 400 });
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    // Build/runtime guard: if envs are missing, don't crash production build
    return NextResponse.json({ points: [] }, { status: 200 });
  }
  
  // Create Supabase client server-side with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Calculate time window
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);
    
    // Query vessel positions for the time window
    const { data: positions, error } = await supabase
      .from('vessel_positions')
      .select('recorded_at, lat, lng')
      .eq('vessel_id', vesselId)
      .gte('recorded_at', startTime.toISOString())
      .order('recorded_at', { ascending: true })
      .limit(500); // Reasonable limit to prevent huge responses

    if (error) {
      console.error('Error fetching vessel trail:', error);
      return NextResponse.json({ error: 'Failed to fetch vessel trail' }, { status: 500 });
    }

    // Format response
    const response = {
      vessel_id: vesselId,
      hours: hours,
      points: (positions || []).map(pos => ({
        t: pos.recorded_at,
        lat: pos.lat,
        lon: pos.lng
      }))
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Fleet trail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
