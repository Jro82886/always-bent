import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({
  polygon: z.any(), // GeoJSON Polygon
  gears: z.array(z.enum(['longliner','drifting_longline','trawler'])).default([
    'longliner','drifting_longline','trawler'
  ])
});

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get('days') ?? 4);
    const { polygon, gears } = Body.parse(await req.json());

    // TODO: call your existing Vercel GFW proxy with polygon + days + gears
    // Expect counts + (optional) clipped tracks

    // --- MOCK SHAPE (stable for UI work) ---
    const result = {
      counts: { longliner: 0, drifting_longline: 0, trawler: 0, events: 0 },
      sampleNames: [] as string[],
      // tracks: [{ id, gear, coords: [[lon,lat], ...] }]
    };

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'bad request' }, { status: 400 });
  }
}
