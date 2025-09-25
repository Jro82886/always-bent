import { ScalarStats, GFWClip } from './types';

export async function sampleScalars({
  polygon, timeISO, layers,
}: { polygon: GeoJSON.Polygon; timeISO: string; layers: Array<'sst'|'chl'>; }): Promise<{ sst?: ScalarStats|null; chl?: ScalarStats|null; }> {
  const res = await fetch('/api/rasters/sample', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ 
      polygon: { type: 'Feature', geometry: polygon, properties: {} }, 
      timeISO: timeISO, 
      layers 
    }),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Raster sample error:', error);
    
    // Return null values with reason if service not configured
    if (res.status === 503 && error.noDataAvailable) {
      const result: { sst?: ScalarStats|null; chl?: ScalarStats|null } = {};
      if (layers.includes('sst')) {
        result.sst = { mean: null, min: null, max: null, gradient: null, units: '°F', reason: 'No data available' };
      }
      if (layers.includes('chl')) {
        result.chl = { mean: null, min: null, max: null, gradient: null, units: 'mg/m³', reason: 'No data available' };
      }
      return result;
    }
    
    throw new Error(`sampler ${res.status}`);
  }
  
  const data = await res.json();
  
  // Transform response to our expected format
  const result: { sst?: ScalarStats|null; chl?: ScalarStats|null } = {};
  
  if (layers.includes('sst') && data.stats?.sst) {
    result.sst = {
      mean: data.stats.sst.mean_f || null,
      min: data.stats.sst.min_f || null,
      max: data.stats.sst.max_f || null,
      gradient: data.stats.sst.gradient_f || null,
      units: '°F'
    };
  } else if (layers.includes('sst')) {
    result.sst = { mean: null, min: null, max: null, gradient: null, units: '°F', reason: 'No data' };
  }
  
  if (layers.includes('chl') && data.stats?.chl) {
    result.chl = {
      mean: data.stats.chl.mean || null,
      min: data.stats.chl.min || null,
      max: data.stats.chl.max || null,
      gradient: data.stats.chl.gradient || null,
      units: 'mg/m³'
    };
  } else if (layers.includes('chl')) {
    result.chl = { mean: null, min: null, max: null, gradient: null, units: 'mg/m³', reason: 'No data' };
  }
  
  return result;
}

export async function clipGFW({
  polygon, days = 4,
}: { polygon: GeoJSON.Polygon; days?: number; }): Promise<GFWClip|null> {
  const res = await fetch(`/api/gfw/clip?days=${days}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ polygon, gears: ['longliner','drifting_longline','trawler'] }),
  });
  if (res.status === 204) return null; // explicitly unavailable or off
  if (!res.ok) throw new Error(`gfw clip ${res.status}`);
  return await res.json(); // { counts: { ... }, sampleVesselNames? }
}
