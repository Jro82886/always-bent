import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { polygon, gears } = await req.json();
    if (!polygon) return NextResponse.json({ error: 'polygon required' }, { status: 400 });

    // If GFW is not configured, return 204 so UI prints "n/a"
    if (!process.env.GFW_API_TOKEN) return new Response(null, { status: 204 });

    // TODO: call your internal GFW service here; placeholder returns empty counts
    // Keep shape stable for the client
    return NextResponse.json({
      counts: { longliner: 0, drifting_longline: 0, trawler: 0, events: 0 },
      sampleVesselNames: [],
    });
  } catch (e) {
    return NextResponse.json({ error: 'clip error' }, { status: 500 });
  }
}