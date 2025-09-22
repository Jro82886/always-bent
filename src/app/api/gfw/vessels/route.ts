import { NextResponse } from 'next/server';
import { gfwEnabled } from '@/lib/features/gfw';

export const runtime = 'nodejs';
const TIMEOUT_MS = 15000;

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

// Normalize GFW response to our expected format
function normalize(payload: any) {
  const vessels = (payload?.entries ?? []).map((entry: any) => {
    const vessel = entry.vessel || {};
    const positions = entry.positions || [];
    
    // Get gear type
    let gear = 'unknown';
    const gearType = vessel.geartype?.toLowerCase() || '';
    
    if (gearType.includes('longline') || gearType.includes('set_longlines')) {
      gear = 'longliner';
    } else if (gearType.includes('drifting_longlines')) {
      gear = 'drifting_longline';
    } else if (gearType.includes('trawl')) {
      gear = 'trawler';
    }
    
    // Get last position
    const lastPos = positions[positions.length - 1];
    
    return {
      id: vessel.id || entry.id || crypto.randomUUID(),
      name: vessel.shipname || 'Unknown Vessel',
      gear,
      last_pos: lastPos ? {
        lon: lastPos.lon,
        lat: lastPos.lat,
        t: lastPos.timestamp
      } : null,
      track: positions.map((pos: any) => ({
        lon: pos.lon,
        lat: pos.lat,
        t: pos.timestamp
      }))
    };
  }).filter((v: any) => v.last_pos); // Only vessels with positions
  
  // Extract fishing events
  const events = (payload?.entries ?? []).flatMap((entry: any) => {
    const fishingEvents = entry.events?.filter((e: any) => 
      e.type === 'fishing' || e.type === 'apparent_fishing'
    ) || [];
    
    return fishingEvents.map((event: any) => ({
      lon: event.position?.lon,
      lat: event.position?.lat,
      t: event.start,
      type: 'fishing'
    })).filter((e: any) => e.lon && e.lat);
  });
  
  return { vessels, events };
}

export async function GET(req: Request) {
  if (!gfwEnabled) {
    return NextResponse.json({
      ok: true,
      configured: false,
      reason: 'disabled-by-flag',
    });
  }
  
  const { inletId, bbox, days } = parseParams(req);
  console.log('[GFW] params', { inletId, bbox, days });

  const token = process.env.GFW_API_TOKEN;
  if (!token) {
    return ok({ configured: false, vessels: [], events: [] });
  }

  if (!inletId && !bbox) {
    return err('params', 'missing inlet_id/inletId or bbox', 200);
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
      return err('upstream', `status=${res.status} body=${text.slice(0, 400)}`, 200);
    }

    const raw = await res.json().catch(async () => {
      const t = await res.text();
      throw new Error(`non-json body: ${t.slice(0, 200)}`);
    });

    const data = normalize(raw);
    console.log('[GFW] normalize', { vessels: data.vessels.length, events: data.events.length });

    return ok(data);
  } catch (e: any) {
    return err('catch', e?.message || String(e));
  }
}
