import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type VesselsReq = {
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  since_hours?: number;
};

function clampWindow(areaSqMi: number, since: number) {
  // If very large bbox, shorten window to reduce load
  if (areaSqMi > 2500 && since > 12) return 12;
  return since;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VesselsReq;
    const since_hours = clampWindow(estimateAreaSqMi(body.bbox), body.since_hours ?? 24);

    // Build URLs to existing internal routes
    const origin = req.nextUrl.origin;
    const bboxStr = body.bbox.join(',');

    const gfwUrl = `${origin}/api/gfw/vessels?bbox=${encodeURIComponent(bboxStr)}&days=${Math.ceil(
      since_hours / 24
    )}`;
    const fleetUrl = `${origin}/api/tracking/fleet?bbox=${encodeURIComponent(bboxStr)}&hours=${since_hours}`;

    const [gfwRes, fleetRes] = await Promise.allSettled([
      fetch(gfwUrl, { cache: 'no-store' }),
      fetch(fleetUrl, { cache: 'no-store' }),
    ]);

    let gfw_count = 0;
    let fleet_count = 0;

    if (gfwRes.status === 'fulfilled' && gfwRes.value.ok) {
      const arr = await gfwRes.value.json().catch(() => []);
      gfw_count = Array.isArray(arr) ? arr.length : 0;
    }
    if (fleetRes.status === 'fulfilled' && fleetRes.value.ok) {
      const arr = await fleetRes.value.json().catch(() => []);
      fleet_count = Array.isArray(arr) ? arr.length : 0;
    }

    const activity_score = scoreActivity(gfw_count, fleet_count);
    const activity_text = activityText(activity_score);

    const payload = {
      gfw_count,
      fleet_count,
      activity_score,
      activity_text,
      since_hours,
      server_time_utc: new Date().toISOString(),
      request_id: crypto.randomUUID(),
    };

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=600');
    return res;
  } catch (e) {
    return NextResponse.json(
      { gfw_count: 0, fleet_count: 0, activity_score: 0, activity_text: 'Low recent activity', since_hours: 24 },
      { status: 200 }
    );
  }
}

function estimateAreaSqMi(bbox: [number, number, number, number]) {
  // Rough area estimation using degrees → miles (cosine latitude correction)
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const avgLat = (minLat + maxLat) / 2;
  const milesPerDegLat = 69;
  const milesPerDegLon = 69 * Math.cos((avgLat * Math.PI) / 180);
  const width = Math.max(0, maxLon - minLon) * milesPerDegLon;
  const height = Math.max(0, maxLat - minLat) * milesPerDegLat;
  return Math.max(0, width * height);
}

function scoreActivity(gfw: number, fleet: number) {
  const total = gfw + fleet;
  if (total >= 20) return 5;
  if (total >= 12) return 4;
  if (total >= 6) return 3;
  if (total >= 2) return 2;
  if (total >= 1) return 1;
  return 0;
}

function activityText(score: number) {
  if (score >= 4) return 'High recent activity near the break';
  if (score >= 3) return 'Moderate recent activity';
  if (score >= 1) return 'Low recent activity';
  return 'Minimal activity';
}


