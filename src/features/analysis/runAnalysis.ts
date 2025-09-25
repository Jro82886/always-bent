import type { AnalyzeAPIResponse } from '@/types/analyze';

export async function runAnalysis(polygon: GeoJSON.Polygon, timeISO: string): Promise<AnalyzeAPIResponse> {
  const body = { polygon, timeISO, layers: ['sst','chl'] };
  const r = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`analysis ${r.status}`);
  return r.json();
}
