import mapboxgl from 'mapbox-gl';

export function ensureSnipOutlineLayer(map: mapboxgl.Map, polygon: GeoJSON.Polygon) {
  if (!map) return;

  const sourceId = 'snip-outline';
  const layerId = 'snip-outline-layer';

  // Create or update source
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData({
      type: 'Feature',
      geometry: polygon,
      properties: {}
    });
  } else {
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: polygon,
        properties: {}
      }
    });
  }

  // Add layer if it doesn't exist
  if (!map.getLayer(layerId)) {
    // Add glow effect (outer)
    map.addLayer({
      id: layerId + '-glow',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#00e1a7',
        'line-width': 12,
        'line-opacity': 0.4,
        'line-blur': 6
      }
    });

    // Add main line (thicker, more visible per Amanda's request)
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#00e1a7',
        'line-width': 5,  // Increased from 3 for better visibility
        'line-opacity': 1.0  // Fully opaque so lines are clearly connected
      }
    });

    // Add corner markers for bounding box corners
    map.addLayer({
      id: layerId + '-corners',
      type: 'circle',
      source: sourceId,
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'circle-radius': 8,
        'circle-color': '#00e1a7',
        'circle-opacity': 1.0,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.8
      }
    });
  }
}

export function clearSnipOutlineLayer(map: mapboxgl.Map) {
  if (!map) return;

  const layerId = 'snip-outline-layer';
  const sourceId = 'snip-outline';

  // Remove layers (including new corner markers)
  if (map.getLayer(layerId + '-corners')) {
    map.removeLayer(layerId + '-corners');
  }
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getLayer(layerId + '-glow')) {
    map.removeLayer(layerId + '-glow');
  }

  // Remove source
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}
