type LatLon = { lat: number; lng: number };
import { INLETS } from "@/lib/inlets";

const EARTH_RADIUS_KM = 6371; // Earth radius in kilometers

// Move a lat/lon ~distanceKm in direction bearing° (0=N,90=E,180=S,270=W).
export function offsetPoint(lat: number, lon: number, distanceKm: number, bearingDeg: number): LatLon {
  const delta = distanceKm / EARTH_RADIUS_KM;
  const theta = (bearingDeg * Math.PI) / 180;

  const phi1 = (lat * Math.PI) / 180;
  const lambda1 = (lon * Math.PI) / 180;

  const phi2 = Math.asin(
    Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta)
  );
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2)
    );

  return { lat: (phi2 * 180) / Math.PI, lng: (lambda2 * 180) / Math.PI };
}

// Pick a bearing based on inlet region so we always head toward the ocean.
// - Atlantic East Coast → east (90°)
// - Florida Keys / south coast → south (180°)
// - Gulf Coast (future) → south-east (135°)
export function offshoreBearing(inletId: string): number {
  const id = inletId.toLowerCase();
  if (id.includes("key") || id.includes("miami") || id.includes("cape-canaveral")) {
    return 180; // push south
  }
  // default East Coast
  return 90; // push east
}

export function waterCenterForInlet(inletId: string): LatLon {
  const inlet = INLETS.find((i) => i.id === inletId);
  if (!inlet) throw new Error("Unknown inlet: " + inletId);
  const bearing = offshoreBearing(inletId);
  return offsetPoint(inlet.center[1], inlet.center[0], 4.8, bearing); // ~3 miles = 4.8 km
}

export function chooseInitialCenter(inletId: string, _userCoords?: LatLon | null): LatLon {
  // For v1: always snap to inlet’s 3-mile offshore center
  return waterCenterForInlet(inletId);
}


