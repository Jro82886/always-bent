// Deterministic sampler client - matches new API format
export async function sample(
  layer: 'sst' | 'chl', 
  polygon: GeoJSON.Polygon,
  timeISO?: string
): Promise<{ mean: number; min: number; max: number; gradient: number } | null> {
  try {
    const response = await fetch('/api/rasters/sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        polygon, 
        timeISO: timeISO || new Date().toISOString(),
        layers: [layer] 
      })
    });
    
    if (!response.ok) {
      console.error(`[Sampler] HTTP ${response.status} for ${layer}`);
      const errorData = await response.json().catch(() => null);
      if (errorData?.error) {
        console.warn(`[Sampler] ${errorData.error}`);
      }
      return null;
    }
    
    const json = await response.json().catch(() => ({}));
    
    // Check if response is OK
    if (!json.ok) {
      console.warn(`[Sampler] API returned not OK for ${layer}:`, json.error);
      return null;
    }
    
    // Extract stats from the new format
    const stats = json.stats || {};
    
    if (layer === 'sst') {
      const sstData = stats.sst;
      if (!sstData || sstData.n_valid === 0) {
        console.warn(`[Sampler] No valid SST data`);
        return null;
      }
      
      return {
        mean: sstData.mean_f,
        min: sstData.min_f,
        max: sstData.max_f,
        gradient: sstData.gradient_f
      };
    } else {
      const chlData = stats.chl;
      if (!chlData || chlData.n_valid === 0) {
        console.warn(`[Sampler] No valid CHL data`);
        return null;
      }
      
      return {
        mean: chlData.mean,
        min: chlData.min,
        max: chlData.max,
        gradient: chlData.gradient
      };
    }
  } catch (error) {
    console.error(`[Sampler] Error sampling ${layer}:`, error);
    return null;
  }
}
