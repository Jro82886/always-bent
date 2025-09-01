'use client';

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import { useMapbox } from "@/lib/MapCtx";
import { layers } from "@/lib/layers";
import { useAppState } from "@/store/appState";

function getBbox4326(map: mapboxgl.Map): string {
  const b = map.getBounds();
  return `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`;
}

function ensureLayer(
  map: mapboxgl.Map,
  layerId: string,
  tiles: string[],
  opacity = 1,
  minzoom?: number,
  maxzoom?: number
) {
  const srcId = `src:${layerId}`;
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(srcId)) map.removeSource(srcId);
  map.addSource(srcId, { type: 'raster', tiles, tileSize: 256 } as any);
  map.addLayer({ id: layerId, type: 'raster', source: srcId, paint: { 'raster-opacity': opacity }, minzoom, maxzoom });
}

export default function Layers() {
  const map = useMapbox();
  const { isoDate } = useAppState();

  useEffect(() => {
    if (!map) return;

    const apply = () => {
      const bbox4326 = getBbox4326(map);
      layers.forEach((l) => {
        const tiles = l.tiles({ date: isoDate ?? undefined, bbox4326 });
        ensureLayer(map, l.id, tiles, l.opacity, l.minzoom, l.maxzoom);
        map.setLayoutProperty(l.id, 'visibility', l.visible ? 'visible' : 'none');
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);

    const onMoveEnd = () => apply();
    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      layers.forEach((l) => {
        if (map.getLayer(l.id)) map.removeLayer(l.id);
        const srcId = `src:${l.id}`;
        if (map.getSource(srcId)) map.removeSource(srcId);
      });
    };
  }, [map, isoDate]);

  return null;
}




