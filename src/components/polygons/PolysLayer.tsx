"use client";

import { useEffect } from "react";
import { useMapbox } from "@/lib/MapCtx";

interface PolysLayerProps {
  iso: string;
}

export default function PolysLayer({ iso }: PolysLayerProps) {
  const map = useMapbox();

  useEffect(() => {
    if (!map) return;

    const addLayers = () => {
      // Add empty polygon source
      if (!map.getSource('sst-polygons')) {
        map.addSource('sst-polygons', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        } as any);
      }

      // Add fill layer
      if (!map.getLayer('sst-polygons-fill')) {
        map.addLayer({
          id: 'sst-polygons-fill',
          type: 'fill',
          source: 'sst-polygons',
          paint: {
            'fill-color': '#00DDEB',
            'fill-opacity': 0.12
          }
        } as any);
      }

      // Add line layer
      if (!map.getLayer('sst-polygons-line')) {
        map.addLayer({
          id: 'sst-polygons-line',
          type: 'line',
          source: 'sst-polygons',
          paint: {
            'line-color': '#06B6D4',
            'line-width': 1.4,
            'line-opacity': 0.65
          }
        } as any);
      }
    };

    if ((map as any).isStyleLoaded?.()) {
      addLayers();
    } else {
      map.once('style.load', addLayers);
    }

    // Fetch polygons data (stub for now)
    const fetchPolygons = async () => {
      try {
        const response = await fetch(`/api/polygons?date=${iso}`);
        const data = await response.json();
        const source = map.getSource('sst-polygons') as any;
        if (source?.setData) {
          source.setData(data);
        }
      } catch (error) {
        console.warn('Failed to fetch polygons:', error);
      }
    };

    fetchPolygons();

  }, [map, iso]);

  return null;
}
