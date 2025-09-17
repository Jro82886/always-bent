import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://api.stormglass.io/v2';
const AUTH_HEADER = { Authorization: process.env.STORMGLASS_API_KEY || '' };

function iso(dt: Date) { return dt.toISOString(); }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const hours = Number(searchParams.get('hours') ?? 72);

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat & lng are required' }, { status: 400 });
    }

    const now = new Date();
    const end = new Date(now.getTime() + hours * 3600 * 1000);

    const q = `lat=${lat}&lng=${lng}&start=${iso(now)}&end=${iso(end)}`;

    const [astronomyRes, seaRes, extremesRes] = await Promise.all([
      fetch(`${BASE}/astronomy/point?${q}`, { headers: AUTH_HEADER }),
      fetch(`${BASE}/tide/sea-level/point?${q}`, { headers: AUTH_HEADER }),
      fetch(`${BASE}/tide/extremes/point?${q}`, { headers: AUTH_HEADER }),
    ]);

    if (!astronomyRes.ok || !seaRes.ok || !extremesRes.ok) {
      const text = {
        astronomy: await astronomyRes.text(),
        sea: await seaRes.text(),
        extremes: await extremesRes.text(),
      };
      return NextResponse.json({ error: 'Upstream error', detail: text }, { status: 502 });
    }

    const [astronomy, seaLevel, extremes] = await Promise.all([
      astronomyRes.json(),
      seaRes.json(),
      extremesRes.json(),
    ]);

    // Derived helpers
    const moon = (() => {
      const first = astronomy?.data?.[0];
      const phaseText = first?.moonPhase?.current?.text ?? null;
      const phaseValue = first?.moonPhase?.current?.value ?? null;    // 0..1 (New->Full->New)
      const illumination = first?.moonPhase?.illumination ?? null;     // 0..1
      const moonrise = first?.moonrise ?? null;
      const moonset = first?.moonset ?? null;
      return { phaseText, phaseValue, illumination, moonrise, moonset };
    })();

    // Tide stage right now using nearest two points
    const tide = (() => {
      const points = seaLevel?.data ?? [];
      // Compute current stage (flood/ebb) by slope near "now"
      let stage: 'flood' | 'ebb' | null = null;
      let rateCmPerHr: number | null = null;

      if (points.length >= 2) {
        // Find two points around now
        const tNow = now.getTime();
        let i = points.findIndex((p: any) => new Date(p.time).getTime() > tNow);
        if (i < 1) i = 1;
        const p0 = points[i - 1];
        const p1 = points[i];

        const h0 = p0.seaLevel;
        const h1 = p1.seaLevel;
        const dtHr = (new Date(p1.time).getTime() - new Date(p0.time).getTime()) / 3600000;
        const dh = h1 - h0;

        rateCmPerHr = (dh / dtHr) * 100; // m->cm per hr
        stage = dh > 0 ? 'flood' : 'ebb';
      }

      return {
        stage, rateCmPerHr,
        series: points.map((p: any) => ({ time: p.time, heightM: p.seaLevel })),
        extremes: extremes?.data ?? [],
      };
    })();

    // Cache for 10 minutes (OK to be slightly stale for trends)
    return new NextResponse(
      JSON.stringify({ moon, tide, raw: { astronomy, seaLevel, extremes } }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 's-maxage=600, stale-while-revalidate=300',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: 'Unhandled', detail: e?.message }, { status: 500 });
  }
}

// Helper function for phase bucketing
export function phaseBucket(value: number) {
  if (value < 0.03 || value > 0.97) return 'New';
  if (value < 0.22) return 'Waxing Crescent';
  if (value < 0.28) return 'First Quarter';
  if (value < 0.47) return 'Waxing Gibbous';
  if (value < 0.53) return 'Full';
  if (value < 0.72) return 'Waning Gibbous';
  if (value < 0.78) return 'Last Quarter';
  return 'Waning Crescent';
}
