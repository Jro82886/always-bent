// src/lib/inlets.ts

export type Inlet = {
    id: string;
    name: string;
    lat: number;
    lng: number;
  };
  
  // Starter list of major East Coast inlets (expand later)
  export const INLETS: Inlet[] = [
    { id: "maine-portland", name: "Portland, ME", lat: 43.66, lng: -70.25 },
    { id: "nh-hampton", name: "Hampton, NH", lat: 42.91, lng: -70.82 },
    { id: "ma-cape-cod", name: "Cape Cod, MA", lat: 41.67, lng: -70.25 },
    { id: "ri-narragansett", name: "Narragansett, RI", lat: 41.43, lng: -71.46 },
    { id: "ny-montauk", name: "Montauk, NY", lat: 41.04, lng: -71.95 },
    { id: "nj-barnegat", name: "Barnegat Inlet, NJ", lat: 39.76, lng: -74.11 },
    { id: "de-indian-river", name: "Indian River, DE", lat: 38.61, lng: -75.07 },
    { id: "md-ocean-city", name: "Ocean City, MD", lat: 38.33, lng: -75.09 },
    { id: "va-chesapeake", name: "Chesapeake Bay, VA", lat: 37.0, lng: -76.3 },
    { id: "nc-morehead", name: "Morehead City, NC", lat: 34.72, lng: -76.73 },
    { id: "sc-charleston", name: "Charleston, SC", lat: 32.78, lng: -79.93 },
    { id: "ga-savannah", name: "Savannah, GA", lat: 32.08, lng: -81.09 },
    { id: "fl-st-augustine", name: "St. Augustine, FL", lat: 29.89, lng: -81.31 },
    { id: "fl-cape-canaveral", name: "Cape Canaveral, FL", lat: 28.39, lng: -80.6 },
    { id: "fl-palm-beach", name: "Palm Beach Inlet, FL", lat: 26.77, lng: -80.04 },
    { id: "fl-miami", name: "Miami, FL", lat: 25.77, lng: -80.19 },
    { id: "fl-key-west", name: "Key West, FL", lat: 24.55, lng: -81.78 },
  ];
  
  export const DEFAULT_INLET = INLETS[7]; // Ocean City, MD
  
  // Haversine distance (km)
  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  
  export function nearestInlet(lat: number, lng: number, radiusMeters?: number): Inlet {
    return INLETS.reduce((closest, inlet) => {
      const d1 = haversineDistance(lat, lng, inlet.lat, inlet.lng);
      const d0 = haversineDistance(lat, lng, closest.lat, closest.lng);
      return d1 < d0 ? inlet : closest;
    }, INLETS[0]);
  }