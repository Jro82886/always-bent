import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Minimal input validation
const Body = z.object({
  polygon: z.any(), // GeoJSON Polygon
  inletId: z.string(),
  days: z.number().int().min(1).max(14).default(7).optional()
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { polygon, inletId, days = 7 } = Body.parse(json);

    // TODO: replace with real queries
    // - If auth is active, get user vessel_id → query last 24–48h points ∩ polygon
    // - Fleet: query last N days points for inletId ∩ polygon
    // - Compute consecutiveDays & daysWithPresence (unique dates sorted)
    // - Optionally simplify polylines for return

    // --- MOCK SHAPE (keep types stable while backend lands) ---
    const result = {
      user: {
        present: false,
        // points: [[lon,lat,ts], ...]
      },
      fleet: {
        count: 0,
        vessels: [], // { id, name?, daysSeen, track? }
        consecutiveDays: 0,
        daysWithPresence: [] as string[]
      }
    };

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'bad request' }, { status: 400 });
  }
}
