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
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#00e1a7',
        'line-width': 3,
        'line-opacity': 0.8,
        'line-dasharray': [2, 1]
      }
    });

    // Add glow effect
    map.addLayer({
      id: layerId + '-glow',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#00e1a7',
        'line-width': 8,
        'line-opacity': 0.3,
        'line-blur': 4
      }
    }, layerId);
  }
}

export function clearSnipOutlineLayer(map: mapboxgl.Map) {
  if (!map) return;

  const layerId = 'snip-outline-layer';
  const sourceId = 'snip-outline';

  // Remove layers
  if (map.getLayer(layerId + '-glow')) {
    map.removeLayer(layerId + '-glow');
  }
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }

  // Remove source
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}
