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
  const base = 'https://gateway.api.globalfishingwatch.org/v3/vessels';
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const params = new URLSearchParams({
    'dataset': 'public-global-fishing-vessels:latest',
    'includes': 'vessel,positions,events',
    'vessel-types': 'fishing',
    'gear-types': 'trawlers,drifting_longlines,set_longlines,fixed_gear',
    'start-date': startDate.toISOString().split('T')[0],
    'end-date': endDate.toISOString().split('T')[0],
    'limit': '100'
  });
  
  // Add bbox or calculate from inlet
  if (bbox) {
    params.append('positions-bbox', bbox);
  } else if (inletId) {
    // Import inlet config
    const INLETS = [
      { id: 'ocean-city', center: [-74.57, 38.33], zoom: 7.5 },
      { id: 'ny-shinnecock', center: [-72.48, 40.84], zoom: 7.9 },
      { id: 'ny-montauk', center: [-71.94, 41.07], zoom: 7.8 },
      { id: 'nj-manasquan', center: [-74.03, 40.10], zoom: 7.7 },
      { id: 'nc-hatteras', center: [-75.54, 35.22], zoom: 7.3 },
      { id: 'nc-morehead', center: [-76.69, 34.72], zoom: 7.6 },
      { id: 'nc-oregon-inlet', center: [-75.54, 35.77], zoom: 7.4 }
    ];
    
    const inlet = INLETS.find(i => i.id === inletId);
    if (inlet) {
      // Approximate bbox from zoom level
      const degrees = 2.5 - (inlet.zoom - 7) * 0.5; // Rough approximation
      const [lng, lat] = inlet.center;
      const calculatedBbox = `${lng - degrees},${lat - degrees},${lng + degrees},${lat + degrees}`;
      params.append('positions-bbox', calculatedBbox);
    }
  }
  
  return `${base}?${params}`;
}

// Normalize GFW response to our expected format (as per brief)
function normalizeGFW(up: any) {
  console.log('[GFW] Raw upstream shape:', {
    hasEntries: !!up?.entries,
    entriesCount: up?.entries?.length || 0,
    firstEntry: up?.entries?.[0] ? Object.keys(up.entries[0]) : null
  });

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
  
  console.log('[GFW] Normalized:', { 
    vesselsCount: vessels.length,
    firstVessel: vessels[0] ? {
      id: vessels[0].id,
      name: vessels[0].name,
      gear: vessels[0].gear,
      hasLastPos: !!vessels[0].last_pos,
      trackLength: vessels[0].track.length
    } : null,
    eventsCount: events.length 
  });
  
  return { vessels, events };
}

export async function GET(req: Request) {
  if (!gfwEnabled) {
    return NextResponse.json({
      configured: false,
      reason: 'disabled-by-flag',
      vessels: [],
      events: []
    });
  }
  
  const { inletId, bbox, days } = parseParams(req);
  console.log('[GFW] params', { inletId, bbox, days });

  // Demo mode fallback
  if (process.env.NEXT_PUBLIC_GFW_DEMO === '1') {
    console.log('[GFW] Demo mode active');
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

  const token = process.env.GFW_API_TOKEN;
  if (!token) {
    console.log('[GFW] No token configured');
    return NextResponse.json({ 
      configured: false, 
      vessels: [], 
      events: [] 
    });
  }

  if (!inletId && !bbox) {
    console.log('[GFW] Missing params');
    return NextResponse.json({ 
      error: 'missing inlet_id/inletId or bbox',
      vessels: [], 
      events: [] 
    });
  }

  const url = gfwUpstreamUrl({ inletId, bbox, days });
  console.log('[GFW] upstream →', url.replace(token, '***'));

  try {
    const started = Date.now();
    const res = await withTimeout(fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }), TIMEOUT_MS);

    console.log('[GFW] upstream status', res.status, `${Date.now() - started}ms`);

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      console.error('[GFW] upstream error:', res.status, text.slice(0, 400));
      return NextResponse.json({ 
        error: `upstream ${res.status}`,
        vessels: [], 
        events: [] 
      });
    }

    const raw = await res.json().catch(async () => {
      const t = await res.text();
      throw new Error(`non-json body: ${t.slice(0, 200)}`);
    });

    const data = normalizeGFW(raw);
    console.log('[GFW] Success - returning', { vessels: data.vessels.length, events: data.events.length });

    // Return the normalized data directly (not wrapped)
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('[GFW] Exception:', e?.message || String(e));
    return NextResponse.json({ 
      error: e?.message || String(e),
      vessels: [], 
      events: [] 
    });
  }
}
