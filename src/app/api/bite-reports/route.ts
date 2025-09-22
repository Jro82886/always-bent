import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from "@/lib/supabase/server"
import type { BiteReportRequest, StormioSnapshot } from '@/types/stormio';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body: BiteReportRequest = await req.json();
    
    // Validate required fields
    if (!body.bite_id || !body.location?.lat || !body.location?.lng) {
      return NextResponse.json(
        { error: 'Missing required fields: bite_id, location.lat, location.lng' },
        { status: 400 }
      );
    }
    
    // Fetch Stormio snapshot for the location
    const stormioResponse = await fetch(
      `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/stormio?lat=${body.location.lat}&lng=${body.location.lng}`
    );
    
    let context: StormioSnapshot | null = null;
    if (stormioResponse.ok) {
      const data = await stormioResponse.json();
      // Extract just the snapshot fields (exclude sources)
      context = {
        weather: data.weather,
        moon: data.moon,
        tides: data.tides,
        sun: data.sun,
        lastIso: data.lastIso
      };
    }
    
    // Get user profile for captain name
    const { data: profile } = await supabase
      .from('profiles')
      .select('captain_name')
      .eq('id', user.id)
      .single();
    
    // Insert bite report
    const { data: biteReport, error: insertError } = await supabase
      .from('bite_reports')
      .insert({
        bite_id: body.bite_id,
        user_id: user.id,
        user_name: profile?.captain_name || user.email?.split('@')[0] || 'Anonymous',
        created_at: new Date().toISOString(),
        location: `POINT(${body.location.lng} ${body.location.lat})`,
        lat: body.location.lat,
        lon: body.location.lng,
        accuracy_m: body.location.accuracy_m,
        inlet_id: body.inlet_id,
        context,
        notes: body.notes,
        fish_on: body.fish_on || false,
        species: body.species,
        status: 'pending_analysis',
        device_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        app_version: '1.0.0'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error inserting bite report:', insertError);
      return NextResponse.json(
        { error: 'Failed to save bite report' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(biteReport);
    
  } catch (error) {
    console.error('Bite report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    
    // Get query params
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '3');
    const inlet = searchParams.get('inlet');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // Build query
    let query = supabase
      .from('bite_reports')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (inlet) {
      query = query.eq('inlet_id', inlet);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching bite reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bite reports' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('Bite reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
