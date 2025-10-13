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

// Build GFW API URL
function gfwUpstreamUrl({ inletId, bbox, days }: { inletId?: string; bbox?: string; days: number }) {
  // Use v3 vessels/search endpoint as per documentation
  const base = 'https://gateway.api.globalfishingwatch.org/v3/vessels/search';

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Use correct parameter format for v3 API
  const params = new URLSearchParams({
    'datasets[0]': 'public-global-vessel-identity:latest',  // Correct dataset format
    'date-range': `${startDate.toISOString().split('T')[0]},${endDate.toISOString().split('T')[0]}`,
    'limit': '50',
    'offset': '0'
  });

  // Add bbox for geographic filtering
  if (bbox) {
    // v3 uses 'bbox' parameter for geographic filtering
    params.append('bbox', bbox);
  } else if (inletId) {
    // Import inlet config - handle both formats (with and without state prefix)
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
    if (inlet) {
      // Approximate bbox from zoom level (larger area for vessel search)
      const degrees = 1.0; // About 60 nautical miles square
      const [lng, lat] = inlet.center;
      const calculatedBbox = `${lng - degrees},${lat - degrees},${lng + degrees},${lat + degrees}`;
      params.append('bbox', calculatedBbox);
    }
  }
  
  return `${base}?${params}`;
}

// Normalize GFW response to our expected format (as per brief)
function normalizeGFW(up: any) {
  const vessels = (up?.entries ?? up?.vessels ?? []).map((entry: any) => {
    // Handle various possible structures
    const v = entry.vessel || entry;
    const positions = entry.positions || v.positions || v.track || v.coords || [];
    
    // Get gear type - be flexible with naming
    let gear: 'trawler' | 'longliner' | 'drifting_longline' = 'trawler';
    const gearStr = (v.geartype || v.gear || v.type || v.activity || '').toLowerCase();
    
    if (gearStr.includes('drifting')) {
      gear = 'drifting_longline';
    } else if (gearStr.includes('longline') || gearStr.includes('set_longline')) {
      gear = 'longliner';
    } else if (gearStr.includes('trawl')) {
      gear = 'trawler';
    }
    
    // Get last position
    const last = positions[positions.length - 1];
    
    return {
      id: String(v.id || entry.id || v.vessel_id || crypto.randomUUID()),
      name: v.shipname || v.name || v.callsign || v.mmsi || 'Unknown',
      gear,
      last_pos: last ? {
        lon: Number(last.lon || last.longitude),
        lat: Number(last.lat || last.latitude),
        t: String(last.timestamp || last.t || last.time || new Date().toISOString())
      } : { lon: 0, lat: 0, t: new Date().toISOString() },
      track: positions.map((p: any) => ({
        lon: Number(p.lon || p.longitude),
        lat: Number(p.lat || p.latitude),
        t: String(p.timestamp || p.t || p.time || '')
      }))
    };
  }).filter((v: any) => v.last_pos && v.last_pos.lon !== 0);
  
  // Extract events
  const events = Array.isArray(up?.events) ? up.events : 
    (up?.entries ?? []).flatMap((entry: any) => {
      const fishingEvents = entry.events?.filter((e: any) => 
        e.type === 'fishing' || e.type === 'apparent_fishing'
      ) || [];
      
      return fishingEvents.map((event: any) => ({
        lon: Number(event.position?.lon || event.lon),
        lat: Number(event.position?.lat || event.lat),
        t: event.start || event.timestamp,
        type: 'fishing'
      })).filter((e: any) => e.lon && e.lat);
    });

  return { vessels, events };
}

export async function GET(req: Request) {
  // API endpoint for fetching GFW vessel data
  if (!gfwEnabled) {
    return NextResponse.json({
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
          return NextResponse.json({
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
    return NextResponse.json({
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
    return NextResponse.json({
      error: 'missing inlet_id/inletId or bbox',
      vessels: [],
      events: []
    });
  }

  // Check if token exists
  if (!apiToken) {
    return NextResponse.json({
      configured: false,
      reason: 'no-token',
      message: 'GFW API token not configured',
      vessels: [],
      events: []
    });
  }

  // Try to fetch from GFW API
  const url = gfwUpstreamUrl({ inletId, bbox, days });

  try {
    const started = Date.now();
    const res = await withTimeout(fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    }), TIMEOUT_MS);

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      console.error('[GFW] upstream error:', res.status, text.slice(0, 400));

      return NextResponse.json({
        error: `GFW API returned ${res.status}`,
        message: res.status === 401 ? 'GFW token needs activation - see GFW-NEEDS-LIST.md' : 'GFW API unavailable',
        vessels: [],
        events: []
      });
    }

    const raw = await res.json().catch(async () => {
      const t = await res.text();
      throw new Error(`non-json body: ${t.slice(0, 200)}`);
    });

    const data = normalizeGFW(raw);

    // Return real data from GFW
    return NextResponse.json(data);

  } catch (e: any) {
    console.error('[GFW] Exception:', e?.message || String(e));

    return NextResponse.json({
      error: e?.message || String(e),
      message: 'GFW API request failed',
      vessels: [],
      events: []
    });
  }
}
