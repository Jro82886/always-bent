import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { polygon, gears } = await req.json();
    if (!polygon) {
      return NextResponse.json({ error: 'polygon required' }, { status: 400 });
    }

    console.log('[GFW Clip] Request received for polygon with', polygon.coordinates[0].length, 'points');

    // If GFW is not configured, return stub data
    if (!process.env.GFW_API_TOKEN) {
      console.log('[GFW Clip] No token, returning stub data');
      return NextResponse.json({
        counts: { longliner: 0, drifting_longline: 0, trawler: 0, events: 0 },
        sampleVesselNames: []
      });
    }

    // TODO: Implement real GFW clipping when ready
    // For now, return stub data to unblock Analysis flow
    console.log('[GFW Clip] Returning stub data (real implementation pending)');
    
    return NextResponse.json({
      counts: { 
        longliner: 0, 
        drifting_longline: 0, 
        trawler: 0, 
        events: 0 
      },
      sampleVesselNames: []
    });
  } catch (e) {
    console.error('[GFW Clip] Error:', e);
    return NextResponse.json({ error: 'clip error' }, { status: 500 });
  }
}