import type { AnalyzeAPI } from '@/types/analyze';

export async function runAnalyzeV2(polygon: GeoJSON.Polygon): Promise<AnalyzeAPI> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      polygon, 
      want: { sst: true, chl: true } 
    })
  });
  
  if (!res.ok) {
    throw new Error(`Analysis failed: ${res.status}`);
  }
  
  const data = await res.json();
  
  // For now, adapt the response to the new format
  // This is temporary until we update the API to return the new format
  return {
    areaKm2: data.analysis?.stats?.area_km2 || 0,
    hasSST: !!data.analysis?.oceanData?.sst,
    hasCHL: !!data.analysis?.oceanData?.chl,
    sst: data.analysis?.oceanData?.sst ? {
      meanC: ((data.analysis.oceanData.sst.mean_f - 32) * 5) / 9,
      minC: ((data.analysis.oceanData.sst.min_f - 32) * 5) / 9,
      maxC: ((data.analysis.oceanData.sst.max_f - 32) * 5) / 9,
      gradientCperKm: (data.analysis.oceanData.sst.gradient_f * 5 / 9) * 1.60934
    } : undefined,
    chl: data.analysis?.oceanData?.chl ? {
      mean: data.analysis.oceanData.chl.mean
    } : undefined
  };
}
