export type Inlet = {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  isOverview?: boolean;
};

/**
 * East Coast (Maine -> Florida, not past the Keys)
 * Coords are rough but serviceable for flyTo; tweak anytime.
 */
export const INLETS: Inlet[] = [
  // ---- Overview (default) ----
  // Shifted slightly offshore and adjusted zoom to bias ocean ~75% of viewport
  { id: "overview", name: "East Coast (overview)", center: [-71.8, 36.0], zoom: 4.7, isOverview: true },

  // ---- Maine ----
  { id: "penobscot_me", name: "Penobscot Bay, ME", center: [-68.80, 44.33], zoom: 9 },
  { id: "casco_me",      name: "Casco Bay, ME",      center: [-70.10, 43.70], zoom: 9 },

  // ---- New Hampshire ----
  { id: "portsmouth_nh", name: "Portsmouth Harbor, NH", center: [-70.72, 43.07], zoom: 10 },

  // ---- Massachusetts ----
  { id: "cape_ann_ma",   name: "Cape Ann, MA",       center: [-70.64, 42.65], zoom: 9 },
  { id: "boston_ma",     name: "Boston Harbor, MA",  center: [-71.02, 42.35], zoom: 10 },
  { id: "cape_cod_ma",   name: "Cape Cod Canal, MA", center: [-70.55, 41.74], zoom: 10 },
  { id: "nantucket_ma",  name: "Nantucket Inlet, MA",center: [-70.10, 41.28], zoom: 10 },

  // ---- Rhode Island ----
  { id: "newport_ri",    name: "Newport Harbor, RI", center: [-71.31, 41.49], zoom: 10 },
  { id: "pt_judith_ri",  name: "Point Judith, RI",   center: [-71.48, 41.36], zoom: 11 },

  // ---- Connecticut ----
  { id: "new_london_ct", name: "New London Harbor, CT", center: [-72.09, 41.35], zoom: 10 },
  { id: "bridgeport_ct", name: "Bridgeport Inlet, CT",  center: [-73.18, 41.17], zoom: 10 },

  // ---- New York ----
  { id: "montauk_ny",    name: "Montauk, NY",        center: [-71.94, 41.05], zoom: 9 },
  { id: "shinnecock_ny", name: "Shinnecock Inlet, NY", center: [-72.49, 40.84], zoom: 11 },
  { id: "fireisland_ny", name: "Fire Island Inlet, NY", center: [-73.29, 40.63], zoom: 11 },
  { id: "rockaway_ny",   name: "Rockaway Inlet, NY",   center: [-73.86, 40.57], zoom: 11 },

  // ---- New Jersey ----
  { id: "sandy_hook_nj", name: "Sandy Hook, NJ",       center: [-74.01, 40.42], zoom: 10 },
  { id: "manasquan_nj",  name: "Manasquan Inlet, NJ",  center: [-74.04, 40.11], zoom: 12 },
  { id: "barnegat_nj",   name: "Barnegat Inlet, NJ",   center: [-74.06, 39.76], zoom: 11 },
  { id: "absecon_nj",    name: "Absecon Inlet (AC), NJ", center: [-74.41, 39.37], zoom: 11 },
  { id: "cape_may_nj",   name: "Cape May Inlet, NJ",   center: [-74.85, 38.94], zoom: 11 },

  // ---- Delaware ----
  { id: "indian_river_de", name: "Indian River Inlet, DE", center: [-75.07, 38.61], zoom: 12 },
  { id: "delaware_bay_de", name: "Delaware Bay Entrance, DE", center: [-75.12, 38.79], zoom: 10 },

  // ---- Maryland ----
  { id: "oc_md",         name: "Ocean City, MD",        center: [-74.90, 38.33], zoom: 10 },

  // ---- Virginia ----
  { id: "chincoteague_va", name: "Chincoteague Inlet, VA", center: [-75.38, 37.84], zoom: 11 },
  { id: "chesapeake_va",   name: "Chesapeake Bay Entrance, VA", center: [-76.08, 36.97], zoom: 10 },

  // ---- North Carolina ----
  { id: "oregon_nc",     name: "Oregon Inlet, NC",     center: [-75.55, 35.77], zoom: 11 },
  { id: "hatteras_nc",   name: "Hatteras Inlet, NC",   center: [-75.76, 35.21], zoom: 11 },
  { id: "ocracoke_nc",   name: "Ocracoke Inlet, NC",   center: [-76.02, 35.08], zoom: 11 },
  { id: "beaufort_nc",   name: "Beaufort Inlet, NC",   center: [-76.68, 34.68], zoom: 11 },
  { id: "cape_fear_nc",  name: "Cape Fear (Wilmington), NC", center: [-77.97, 34.21], zoom: 10 },

  // ---- South Carolina ----
  { id: "georgetown_sc", name: "Winyah Bay (Georgetown), SC", center: [-79.17, 33.22], zoom: 10 },
  { id: "charleston_sc", name: "Charleston Harbor, SC", center: [-79.92, 32.78], zoom: 10 },
  { id: "hilton_head_sc",name: "Port Royal / Hilton Head, SC", center: [-80.72, 32.22], zoom: 10 },

  // ---- Georgia ----
  { id: "savannah_ga",   name: "Savannah River Entrance, GA", center: [-80.90, 31.98], zoom: 10 },
  { id: "brunswick_ga",  name: "St. Simons / Brunswick, GA",  center: [-81.39, 31.13], zoom: 10 },
  { id: "st_marys_ga",   name: "St. Marys Entrance, GA",      center: [-81.40, 30.72], zoom: 10 },

  // ---- Florida (Atlantic, **not past the Keys**) ----
  { id: "st_augustine_fl", name: "St. Augustine Inlet, FL", center: [-81.29, 29.90], zoom: 11 },
  { id: "ponte_vedra_fl",  name: "Ponte Vedra / Mayport, FL", center: [-81.40, 30.40], zoom: 10 },
  { id: "canaveral_fl",    name: "Port Canaveral, FL",       center: [-80.61, 28.41], zoom: 11 },
  { id: "sebastian_fl",    name: "Sebastian Inlet, FL",      center: [-80.45, 27.86], zoom: 12 },
  { id: "fort_pierce_fl",  name: "Fort Pierce Inlet, FL",    center: [-80.30, 27.47], zoom: 11 },
  { id: "st_lucie_fl",     name: "St. Lucie Inlet, FL",      center: [-80.17, 27.15], zoom: 12 },
  { id: "jupiter_fl",      name: "Jupiter Inlet, FL",        center: [-80.07, 26.95], zoom: 12 },
  { id: "lake_worth_fl",   name: "Lake Worth Inlet, FL",     center: [-80.04, 26.77], zoom: 12 },
  { id: "hillsboro_fl",    name: "Hillsboro Inlet, FL",      center: [-80.08, 26.26], zoom: 12 },
  { id: "port_everglades_fl", name: "Port Everglades (Ft. Lauderdale), FL", center: [-80.12, 26.09], zoom: 12 },
  { id: "miami_fl",        name: "Government Cut (Miami), FL", center: [-80.13, 25.77], zoom: 12 },
];

/** Default = East Coast overview */
export const DEFAULT_INLET: Inlet = INLETS.find(i => i.isOverview) ?? INLETS[0];

/** Lookup by id (returns null if not found) */
export const getInletById = (id: string | null | undefined): Inlet | null =>
  INLETS.find(i => i.id === id) ?? null;

/** Great-circle distance helper for nearestInlet */
function dist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Find the nearest inlet to a lat/lng */
export function nearestInlet(lat: number, lng: number): Inlet {
  let best = INLETS[0];
  let bestD = dist(lat, lng, best.center[1], best.center[0]);
  for (const i of INLETS) {
    const d = dist(lat, lng, i.center[1], i.center[0]);
    if (d < bestD) {
      best = i;
      bestD = d;
    }
  }
  return best;
}

/** Optional convenience: call from HeaderBar when the inlet changes */
export function flyToInlet(map: any, inlet: Inlet) {
  if (!map || !inlet) return;
  map.flyTo({ center: inlet.center, zoom: inlet.zoom, essential: true });
}


