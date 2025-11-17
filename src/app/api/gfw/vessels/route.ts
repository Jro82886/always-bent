import { NextResponse } from 'next/server';
import { gfwEnabled } from '@/lib/features/gfw';

export const runtime = 'nodejs';
const TIMEOUT_MS = 30000; // 30 seconds as per brief

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; stage: string; error: string };

function ok<T>(data: T) { 
  return NextResponse.json<Ok<T>>({ ok: true, data }); 
}

function err(stage: string, error: string, status = 200) {
  console.error('[GFW]', stage, error);
  return NextResponse.json<Err>({ ok: false, stage, error }, { status });
}

function parseParams(req: Request) {
  const u = new URL(req.url);
  const inletId = u.searchParams.get('inlet_id') || u.searchParams.get('inletId') || undefined;
  const bbox = u.searchParams.get('bbox') || undefined;
  const days = Number(u.searchParams.get('days') || 7);
  return { inletId, bbox, days };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms))
  ]);
}

// Parse bbox string to bounds array
function parseBbox(bbox: string): [number, number, number, number] {
  const parts = bbox.split(',').map(Number);
  return [parts[0], parts[1], parts[2], parts[3]];
}

// Get bbox from inlet ID
function getInletBbox(inletId: string): [number, number, number, number] | null {
  const INLETS = [
    { id: 'md-ocean-city', center: [-75.0906, 38.3286], zoom: 7.5 },
    { id: 'ny-shinnecock', center: [-72.48, 40.84], zoom: 7.9 },
    { id: 'ny-montauk', center: [-71.94, 41.07], zoom: 7.8 },
    { id: 'nj-manasquan', center: [-74.03, 40.10], zoom: 7.7 },
    { id: 'nc-hatteras', center: [-75.54, 35.22], zoom: 7.3 },
    { id: 'nc-morehead', center: [-76.69, 34.72], zoom: 7.6 },
    { id: 'nc-oregon-inlet', center: [-75.54, 35.77], zoom: 7.4 }
  ];

  const inlet = INLETS.find(i => i.id === inletId || i.id === inletId.replace(/^[a-z]+-/, ''));
  if (!inlet) return null;

  // Create bbox - about 2 degrees (~120 nautical miles) square for vessel search
  const degrees = 2.0;
  const [lng, lat] = inlet.center;
  return [lng - degrees, lat - degrees, lng + degrees, lat + degrees];
}

// Fetch fishing events for vessels in a geographic area using GFW Events API
async function fetchFishingEventsInArea(
  bounds: [number, number, number, number],
  days: number,
  apiToken: string
): Promise<any[]> {
  const [minLng, minLat, maxLng, maxLat] = bounds;

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    const response = await fetch('https://gateway.api.globalfishingwatch.org/v3/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        datasets: ['public-global-fishing-events:latest'],
        startDate: startDateStr,
        endDate: endDateStr,
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [minLng, minLat],
            [maxLng, minLat],
            [maxLng, maxLat],
            [minLng, maxLat],
            [minLng, minLat]
          ]]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'no error body');
      console.error('[GFW] Events API error:', response.status, response.statusText);
      console.error('[GFW] Error details:', errorText.substring(0, 500));
      return [];
    }

    const data = await response.json();
    console.log('[GFW] Events API returned:', data.entries?.length || 0, 'fishing events');
    return data.entries || [];
  } catch (error) {
    console.error('[GFW] Events API exception:', error);
    return [];
  }
}

// Normalize GFW Events API response to our expected format
function normalizeEventsToVessels(events: any[]): { vessels: any[]; events: any[] } {
  // Group events by vessel
  const vesselMap = new Map<string, any[]>();

  for (const event of events) {
    if (!event.vessel?.id || !event.position) continue;

    if (!vesselMap.has(event.vessel.id)) {
      vesselMap.set(event.vessel.id, []);
    }
    vesselMap.get(event.vessel.id)!.push(event);
  }

  // Convert grouped events into vessels
  const vessels = Array.from(vesselMap.entries()).map(([vesselId, vesselEvents]) => {
    const firstEvent = vesselEvents[0];
    const lastEvent = vesselEvents[vesselEvents.length - 1];

    // Determine gear type from vessel flag/type
    let gear: 'trawler' | 'longliner' | 'drifting_longline' = 'trawler';

    return {
      id: vesselId,
      name: firstEvent.vessel.name || `MMSI: ${firstEvent.vessel.ssvid}` || 'Unknown',
      gear,
      last_pos: {
        lon: lastEvent.position.lon,
        lat: lastEvent.position.lat,
        t: lastEvent.end || lastEvent.start
      },
      track: vesselEvents.map((e: any) => ({
        lon: e.position.lon,
        lat: e.position.lat,
        t: e.start
      }))
    };
  });

  // Extract event points for visualization
  const eventPoints = events
    .filter((e: any) => e.position && e.type === 'fishing')
    .map((e: any) => ({
      lon: e.position.lon,
      lat: e.position.lat,
      t: e.start,
      type: 'fishing'
    }));

  return { vessels, events: eventPoints };
}

export async function GET(req: Request) {
  // API endpoint for fetching GFW vessel data
  if (!gfwEnabled) {
    return ok({
      configured: false,
      reason: 'disabled-by-flag',
      vessels: [],
      events: []
    });
  }

  const { inletId, bbox, days } = parseParams(req);

  // Check token validity early
  const apiToken = process.env.NEXT_PUBLIC_GFW_API_TOKEN || process.env.GFW_API_TOKEN;

  if (apiToken) {
    try {
      // Decode JWT to check for issues
      const parts = apiToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const iat = payload.iat * 1000; // Convert to milliseconds
        const now = Date.now();

        if (iat > now) {
          return ok({
            configured: false,
            reason: 'invalid-token-future-iat',
            message: 'GFW token configuration issue - token dated in future',
            vessels: [],
            events: []
          });
        }
      }
    } catch (e) {
      // Token validation failed
    }
  }

  // Demo mode fallback
  if (process.env.NEXT_PUBLIC_GFW_DEMO === '1') {
    return ok({
      vessels: [{
        id: 'demo-1',
        name: 'Demo Longliner',
        gear: 'longliner',
        last_pos: { lon: -74.9, lat: 38.3, t: new Date().toISOString() },
        track: [
          { lon: -75, lat: 38.2, t: new Date(Date.now() - 3600000).toISOString() },
          { lon: -74.95, lat: 38.25, t: new Date(Date.now() - 1800000).toISOString() },
          { lon: -74.9, lat: 38.3, t: new Date().toISOString() }
        ]
      }, {
        id: 'demo-2',
        name: 'Demo Trawler',
        gear: 'trawler',
        last_pos: { lon: -74.7, lat: 38.5, t: new Date().toISOString() },
        track: [
          { lon: -74.8, lat: 38.4, t: new Date(Date.now() - 3600000).toISOString() },
          { lon: -74.75, lat: 38.45, t: new Date(Date.now() - 1800000).toISOString() },
          { lon: -74.7, lat: 38.5, t: new Date().toISOString() }
        ]
      }],
      events: []
    });
  }

  // Validate parameters
  if (!inletId && !bbox) {
    return err('validation', 'missing inlet_id/inletId or bbox');
  }

  // Check if token exists
  if (!apiToken) {
    return ok({
      configured: false,
      reason: 'no-token',
      message: 'GFW API token not configured',
      vessels: [],
      events: []
    });
  }

  // Determine bounds
  let bounds: [number, number, number, number] | null = null;

  if (bbox) {
    bounds = parseBbox(bbox);
  } else if (inletId) {
    bounds = getInletBbox(inletId);
    if (!bounds) {
      console.log('[GFW] validation', `Inlet '${inletId}' not found in hardcoded list. Client should send bbox instead.`);
      return err('validation', `Inlet '${inletId}' not configured. Please use map bounds instead.`);
    }
  }

  if (!bounds) {
    return err('validation', 'Either bbox or valid inlet_id is required');
  }

  // Debug: Log request details
  console.log('[GFW] Fetching fishing events in bounds:', bounds, 'for last', days, 'days');

  try {
    const started = Date.now();

    // Fetch fishing events in the area using Events API
    const events = await withTimeout(
      fetchFishingEventsInArea(bounds, days, apiToken),
      TIMEOUT_MS
    );

    console.log('[GFW] Found', events.length, 'fishing events in area');

    // Convert events to vessels and event points
    const data = normalizeEventsToVessels(events);

    console.log('[GFW] Normalized to', data.vessels.length, 'vessels with tracks');

    // Return real data from GFW
    return ok(data);

  } catch (e: any) {
    console.error('[GFW] Exception:', e?.message || String(e));

    return err('exception', e?.message || String(e));
  }
}
