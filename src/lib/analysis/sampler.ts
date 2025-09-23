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
      return null;
    }
    
    const json = await response.json().catch(() => ({}));
    
    // Extract the relevant layer data
    const data = json[layer];
    
    if (!data || typeof data.mean !== 'number') {
      console.warn(`[Sampler] No valid data for ${layer}:`, data);
      return null;
    }
    
    return {
      mean: data.mean,
      min: data.min,
      max: data.max,
      gradient: data.gradient || (data.max - data.min)
    };
  } catch (error) {
    console.error(`[Sampler] Error sampling ${layer}:`, error);
    return null;
  }
}
