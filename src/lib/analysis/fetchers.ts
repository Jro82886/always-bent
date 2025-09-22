import { ScalarStats, GFWClip } from './types';

export async function sampleScalars({
  polygon, timeISO, layers,
}: { polygon: GeoJSON.Polygon; timeISO: string; layers: Array<'sst'|'chl'>; }): Promise<{ sst?: ScalarStats|null; chl?: ScalarStats|null; }> {
  const res = await fetch('/api/rasters/sample', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ polygon, time: timeISO, layers }),
  });
  if (!res.ok) throw new Error(`sampler ${res.status}`);
  const data = await res.json();
  return data; // expected shape: { sst?: ScalarStats|null, chl?: ScalarStats|null }
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
