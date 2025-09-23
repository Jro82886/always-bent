'use client';
import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { SnipResult } from './types';

type Props = {
  map: mapboxgl.Map;
  onDone: (res: SnipResult) => void;
  onCancel?: () => void;
};

export default function RectDraw({ map, onDone, onCancel }: Props) {
  const state = useRef<{
    arming: boolean;
    drawing: boolean;
    startLngLat?: mapboxgl.LngLat;
    layerId?: string;
    sourceId?: string;
    prevGestures?: {
      dragPan: boolean;
      scrollZoom: boolean;
      boxZoom: boolean;
      dragRotate: boolean;
      dblClickZoom: boolean;
      keyboard: boolean;
    };
  }>({ arming: true, drawing: false });

  useEffect(() => {
    console.log('[RectDraw] Mounting - freezing gestures');
    
    // 1) Save current gesture states then freeze all
    const g = {
      dragPan: map.dragPan.isEnabled(),
      scrollZoom: map.scrollZoom.isEnabled(),
      boxZoom: map.boxZoom.isEnabled(),
      dragRotate: map.dragRotate.isEnabled(),
      dblClickZoom: map.doubleClickZoom.isEnabled(),
      keyboard: map.keyboard.isEnabled(),
    };
    state.current.prevGestures = g;
    
    // Disable ALL interactions
    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.doubleClickZoom.disable();
    map.keyboard.disable();
    map.getCanvas().style.cursor = 'crosshair';

    // 2) Helpers to add/remove the translucent rectangle overlay
    const ensureOverlay = () => {
      if (state.current.sourceId) return;
      const sourceId = 'snip-rect-src';
      const layerId = 'snip-rect-layer';
      state.current.sourceId = sourceId;
      state.current.layerId = layerId;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': '#22e1a7',
            'fill-opacity': 0.12,
          },
        });
        map.addLayer({
          id: layerId + '-outline',
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': '#22e1a7',
            'line-width': 2,
          },
        });
      }
    };

    const clearOverlay = () => {
      const { sourceId, layerId } = state.current;
      if (layerId && map.getLayer(layerId + '-outline')) {
        map.removeLayer(layerId + '-outline');
      }
      if (layerId && map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (sourceId && map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
      state.current.layerId = undefined;
      state.current.sourceId = undefined;
    };

    // 3) DOM listeners bound to canvas (simple & reliable)
    const canvas = map.getCanvas();

    const onMouseDown = (e: MouseEvent) => {
      if (!state.current.arming) return;
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[RectDraw] Mouse down - starting draw');
      state.current.drawing = true;

      const rect = canvas.getBoundingClientRect();
      const point = new (window as any).mapboxgl.Point(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      const start = map.unproject(point);
      state.current.startLngLat = start;
      ensureOverlay();
      updateRect(start, start);
      
      // Add listeners for move and up
      window.addEventListener('mousemove', onMouseMove, true);
      window.addEventListener('mouseup', onMouseUp, true);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!state.current.drawing || !state.current.startLngLat) return;
      e.preventDefault();
      e.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const point = new (window as any).mapboxgl.Point(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      const cur = map.unproject(point);
      updateRect(state.current.startLngLat, cur);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!state.current.drawing || !state.current.startLngLat) return;
      e.preventDefault();
      e.stopPropagation();
      
      console.log('[RectDraw] Mouse up - completing draw');
      const rect = canvas.getBoundingClientRect();
      const point = new (window as any).mapboxgl.Point(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      const end = map.unproject(point);
      const start = state.current.startLngLat;
      state.current.drawing = false;

      // Normalize bbox
      const bbox = normBbox([start.lng, start.lat, end.lng, end.lat]);
      
      // Check if it's too small
      const dx = Math.abs(bbox[2] - bbox[0]);
      const dy = Math.abs(bbox[3] - bbox[1]);
      if (dx < 0.0001 || dy < 0.0001) {
        console.log('[RectDraw] Box too small, canceling');
        clearOverlay();
        restoreGestures();
        onCancel?.();
        return;
      }

      const polygon: GeoJSON.Polygon = {
        type: 'Polygon',
        coordinates: [[
          [bbox[0], bbox[1]],
          [bbox[2], bbox[1]],
          [bbox[2], bbox[3]],
          [bbox[0], bbox[3]],
          [bbox[0], bbox[1]],
        ]],
      };
      const center = { 
        lat: (bbox[1] + bbox[3]) / 2, 
        lon: (bbox[0] + bbox[2]) / 2 
      };

      // Cleanup listeners
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);

      // Leave overlay visible until consumer zooms/reviews
      console.log('[RectDraw] Emitting result:', { polygon, bbox, center });
      onDone({ polygon, bbox, center });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        console.log('[RectDraw] ESC pressed - canceling');
        // Cancel drawing
        state.current.arming = false;
        state.current.drawing = false;
        clearOverlay();
        restoreGestures();
        onCancel?.();
      }
    };

    const updateRect = (a: mapboxgl.LngLat, b: mapboxgl.LngLat) => {
      const bbox = normBbox([a.lng, a.lat, b.lng, b.lat]);
      const gj = {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [bbox[0], bbox[1]],
              [bbox[2], bbox[1]],
              [bbox[2], bbox[3]],
              [bbox[0], bbox[3]],
              [bbox[0], bbox[1]],
            ]],
          },
          properties: {},
        }],
      };
      const src = state.current.sourceId ? map.getSource(state.current.sourceId) as mapboxgl.GeoJSONSource : null;
      if (src) src.setData(gj);
    };

    const normBbox = (b: [number, number, number, number]): [number, number, number, number] => {
      const [x1, y1, x2, y2] = b;
      return [
        Math.min(x1, x2), 
        Math.min(y1, y2), 
        Math.max(x1, x2), 
        Math.max(y1, y2)
      ];
    };

    const restoreGestures = () => {
      const g = state.current.prevGestures;
      if (!g) return;
      
      console.log('[RectDraw] Restoring gestures');
      map.getCanvas().style.cursor = '';
      if (g.dragPan) map.dragPan.enable();
      if (g.scrollZoom) map.scrollZoom.enable();
      if (g.boxZoom) map.boxZoom.enable();
      if (g.dragRotate) map.dragRotate.enable();
      if (g.dblClickZoom) map.doubleClickZoom.enable();
      if (g.keyboard) map.keyboard.enable();
    };

    // Mount listeners
    canvas.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('keydown', onKeyDown, true);

    return () => {
      console.log('[RectDraw] Unmounting - cleaning up');
      try {
        canvas.removeEventListener('mousedown', onMouseDown, true);
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('mousemove', onMouseMove, true);
        window.removeEventListener('mouseup', onMouseUp, true);
        clearOverlay();
        restoreGestures();
      } catch (err) {
        console.warn('[RectDraw] Cleanup error:', err);
      }
    };
  }, [map, onDone, onCancel]);

  return null;
}
