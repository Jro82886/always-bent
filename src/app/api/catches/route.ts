import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type Body = {
  user_id: string;
  captured_at: string;
  lat: number;
  lon: number;
  inlet_id?: string;
  species?: string;
  method?: string;
  lure?: string;
  depth_m?: number;
  weight_kg?: number;
  length_cm?: number;
  notes?: string;
  photo_url?: string;
  app_version?: string;
  device?: string;
  gps_accuracy_m?: number;
};

function isValid(body: any): body is Body {
  if (!body) return false;
  if (typeof body.user_id !== 'string') return false;
  if (typeof body.captured_at !== 'string' || Number.isNaN(Date.parse(body.captured_at))) return false;
  if (typeof body.lat !== 'number' || typeof body.lon !== 'number') return false;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!isValid(body)) {
      return Response.json({ error: 'Invalid body' }, { status: 400 });
    }
    // Persistence to Supabase DB ready for activation
    return Response.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}


