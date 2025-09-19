import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { CatchReportRequest, StormioSnapshot } from '@/types/stormio';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body: CatchReportRequest = await req.json();
    
    // Validate required fields
    if (!body.lat || !body.lng) {
      return NextResponse.json(
        { error: 'Missing required fields: lat, lng' },
        { status: 400 }
      );
    }
    
    // Fetch Stormio snapshot for the location
    const stormioResponse = await fetch(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/stormio?lat=${body.lat}&lng=${body.lng}`
    );
    
    let conditions: any = null;
    if (stormioResponse.ok) {
      const data = await stormioResponse.json();
      // Store normalized snapshot + analysis if provided
      conditions = {
        weather: data.weather,
        moon: data.moon,
        tides: data.tides,
        sun: data.sun,
        lastIso: data.lastIso,
        analysis: body.analysis // Include analysis from Snip Tool if provided
      };
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('captain_name, boat_name')
      .eq('id', user.id)
      .single();
    
    // Insert catch report
    const { data: catchReport, error: insertError } = await supabase
      .from('catch_reports')
      .insert({
        user_id: user.id,
        captain_name: profile?.captain_name || user.email?.split('@')[0] || 'Anonymous',
        boat_name: profile?.boat_name || 'Unknown Vessel',
        species: body.species,
        lat: body.lat,
        lng: body.lng,
        location: `POINT(${body.lng} ${body.lat})`,
        selected_inlet: body.selected_inlet,
        conditions,
        notes: body.notes,
        is_abfi_bite: body.is_abfi_bite || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting catch report:', insertError);
      return NextResponse.json(
        { error: 'Failed to save report' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(catchReport);
    
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get query params
    const searchParams = req.nextUrl.searchParams;
    const inlet = searchParams.get('inlet');
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Use the optimized function if available
    if (inlet) {
      const { data, error } = await supabase.rpc('get_inlet_feed', {
        p_inlet_id: inlet,
        p_hours: hours,
        p_limit: limit
      });
      
      if (!error && data) {
        return NextResponse.json(data);
      }
    }
    
    // Fallback to direct query
    let query = supabase
      .from('catch_reports')
      .select('*')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (inlet) {
      query = query.eq('selected_inlet', inlet);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
