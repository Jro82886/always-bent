import { isOnLand } from './landDetection';
import { getInlet60nmBounds } from '../inletBounds';
import type { Inlet } from '../inlets';

/**
 * Check if a position is within the bounds
 * @param pos Position with lon/lat
 * @param bbox Bounding box [[west, south], [east, north]]
 */
export function pointInBbox(
  pos: { lon: number; lat: number }, 
  bbox: [[number, number], [number, number]]
): boolean {
  const [[w, s], [e, n]] = bbox;
  return pos.lon >= w && pos.lon <= e && pos.lat >= s && pos.lat <= n;
}

/**
 * Convert inlet bounds to bbox format
 */
function inletBoundsToBbox(bounds: [number, number, number, number]): [[number, number], [number, number]] {
  const [west, south, east, north] = bounds;
  return [[west, south], [east, north]];
}

/**
 * Land Guard: Check if tracking should be enabled based on inlet selection and land status
 * @param position Current GPS position
 * @param inlet Selected inlet
 * @returns Whether to show user marker and append to track
 */
export function landGuardCheck(
  position: { lat: number; lng: number },
  inlet: Inlet | null
): {
  showMarker: boolean;
  appendTrack: boolean;
  reason?: string;
} {
  if (!inlet) {
    return {
      showMarker: false,
      appendTrack: false,
      reason: 'No inlet selected'
    };
  }

  const onLand = isOnLand(position.lat, position.lng);
  
  // At sea: always show/track
  if (!onLand) {
    return {
      showMarker: true,
      appendTrack: true
    };
  }

  // On land: check if within inlet bounds
  const bounds = getInlet60nmBounds(inlet);
  const bbox = inletBoundsToBbox(bounds);
  const inside = pointInBbox({ lon: position.lng, lat: position.lat }, bbox);

  if (inside) {
    return {
      showMarker: true,
      appendTrack: true
    };
  }

  // On land, outside inlet bounds
  return {
    showMarker: false,
    appendTrack: false,
    reason: 'On land — tracking limited to your selected inlet.'
  };
}

// Helper for once-per-session notifications
const shownToasts = new Set<string>();

export function oncePerSession(key: string, callback: () => void) {
  if (!shownToasts.has(key)) {
    shownToasts.add(key);
    callback();
  }
}
