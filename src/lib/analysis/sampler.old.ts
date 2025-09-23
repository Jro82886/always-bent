// Single sampler entry point for SST/CHL data
export async function sample(
  layer: 'sst' | 'chl', 
  polygon: GeoJSON.Polygon
): Promise<{ mean: number; min: number; max: number; gradient: number } | null> {
  try {
    const response = await fetch('/api/rasters/sample', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        polygon, 
        time: new Date().toISOString(), 
        layers: [layer] 
      })
    });
    
    if (!response.ok) {
      console.error(`[Sampler] HTTP ${response.status} for ${layer}`);
      // Check if it's a "no data available" response
      const errorData = await response.json().catch(() => null);
      if (errorData?.noDataAvailable) {
        console.warn(`[Sampler] No live data available for ${layer}`);
      }
      return null;
    }
    
    const json = await response.json().catch(() => ({}));
    
    // Extract stats from the actual API response format
    const stats = json.stats || {};
    const prefix = layer === 'sst' ? 'sst_' : 'chl_';
    
    const mean = stats[`${prefix}mean`];
    const min = stats[`${prefix}min`];
    const max = stats[`${prefix}max`];
    
    // Check if we have valid data
    if (typeof mean !== 'number' || json.meta?.nodata_pct === 1) {
      console.warn(`[Sampler] No valid data for ${layer}, nodata_pct:`, json.meta?.nodata_pct);
      return null;
    }
    
    return {
      mean,
      min,
      max,
      gradient: max - min
    };
  } catch (error) {
    console.error(`[Sampler] Error sampling ${layer}:`, error);
    return null;
  }
}
