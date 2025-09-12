export interface Inlet {
  id: string;
  name: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  isOverview?: boolean;
}

export const INLETS: Inlet[] = [
  // Overview
  { id: 'overview', name: 'East Coast Overview', center: [-74.5, 38.5], zoom: 5.5, isOverview: true },
  
  // Maine
  { id: 'me-portland', name: 'Portland, ME', center: [-70.2478, 43.6591], zoom: 10 },
  { id: 'me-penobscot', name: 'Penobscot Bay, ME', center: [-68.8, 44.1], zoom: 10 },
  
  // New Hampshire
  { id: 'nh-portsmouth', name: 'Portsmouth, NH', center: [-70.7625, 43.0718], zoom: 10 },
  
  // Massachusetts
  { id: 'ma-gloucester', name: 'Gloucester, MA', center: [-70.6625, 42.6159], zoom: 10 },
  { id: 'ma-boston', name: 'Boston Harbor, MA', center: [-70.9, 42.35], zoom: 10 },
  { id: 'ma-plymouth', name: 'Plymouth, MA', center: [-70.6672, 41.9584], zoom: 10 },
  { id: 'ma-chatham', name: 'Chatham, MA', center: [-69.9597, 41.6820], zoom: 10 },
  
  // Rhode Island
  { id: 'ri-newport', name: 'Newport, RI', center: [-71.3128, 41.4901], zoom: 10 },
  { id: 'ri-point-judith', name: 'Point Judith, RI', center: [-71.4812, 41.3611], zoom: 10 },
  
  // Connecticut
  { id: 'ct-stonington', name: 'Stonington, CT', center: [-71.9067, 41.3387], zoom: 10 },
  
  // New York
  { id: 'ny-montauk', name: 'Montauk, NY', center: [-71.9506, 41.0359], zoom: 10 },
  { id: 'ny-shinnecock', name: 'Shinnecock, NY', center: [-72.4781, 40.8426], zoom: 10 },
  { id: 'ny-jones', name: 'Jones Inlet, NY', center: [-73.5646, 40.5965], zoom: 10 },
  
  // New Jersey
  { id: 'nj-sandy-hook', name: 'Sandy Hook, NJ', center: [-74.0, 40.47], zoom: 10 },
  { id: 'nj-barnegat', name: 'Barnegat Inlet, NJ', center: [-74.1065, 39.7626], zoom: 10 },
  { id: 'nj-atlantic-city', name: 'Atlantic City, NJ', center: [-74.4229, 39.3643], zoom: 10 },
  { id: 'nj-cape-may', name: 'Cape May, NJ', center: [-74.9060, 38.9326], zoom: 10 },
  
  // Delaware
  { id: 'de-indian-river', name: 'Indian River, DE', center: [-75.0690, 38.6098], zoom: 10 },
  
  // Maryland
  { id: 'md-ocean-city', name: 'Ocean City, MD', center: [-75.0849, 38.3365], zoom: 10 },
  
  // Virginia
  { id: 'va-chincoteague', name: 'Chincoteague, VA', center: [-75.3788, 37.9332], zoom: 10 },
  { id: 'va-virginia-beach', name: 'Virginia Beach, VA', center: [-75.9780, 36.8529], zoom: 10 },
  
  // North Carolina
  { id: 'nc-oregon-inlet', name: 'Oregon Inlet, NC', center: [-75.5448, 35.7752], zoom: 10 },
  { id: 'nc-hatteras', name: 'Hatteras, NC', center: [-75.6879, 35.2227], zoom: 10 },
  { id: 'nc-ocracoke', name: 'Ocracoke, NC', center: [-75.9851, 35.1146], zoom: 10 },
  { id: 'nc-beaufort', name: 'Beaufort, NC', center: [-76.6619, 34.7180], zoom: 10 },
  { id: 'nc-wilmington', name: 'Wilmington, NC', center: [-77.9447, 34.2257], zoom: 10 },
  
  // South Carolina
  { id: 'sc-murrells', name: 'Murrells Inlet, SC', center: [-79.0453, 33.5510], zoom: 10 },
  { id: 'sc-charleston', name: 'Charleston, SC', center: [-79.9311, 32.7765], zoom: 10 },
  { id: 'sc-hilton-head', name: 'Hilton Head, SC', center: [-80.7526, 32.2163], zoom: 10 },
  
  // Georgia
  { id: 'ga-savannah', name: 'Savannah, GA', center: [-81.0912, 32.0809], zoom: 10 },
  { id: 'ga-brunswick', name: 'Brunswick, GA', center: [-81.4942, 31.1499], zoom: 10 },
  
  // Florida
  { id: 'fl-jacksonville', name: 'Jacksonville, FL', center: [-81.4120, 30.4022], zoom: 10 },
  { id: 'fl-ponce', name: 'Ponce Inlet, FL', center: [-80.9273, 29.0964], zoom: 10 },
  { id: 'fl-sebastian', name: 'Sebastian, FL', center: [-80.4706, 27.8614], zoom: 10 },
  { id: 'fl-jupiter', name: 'Jupiter, FL', center: [-80.0706, 26.9342], zoom: 10 },
  { id: 'fl-miami', name: 'Miami, FL', center: [-80.1300, 25.7617], zoom: 10 },
  { id: 'fl-keys', name: 'Florida Keys', center: [-80.4473, 24.7107], zoom: 9 },
];

export const DEFAULT_INLET = INLETS[0];

export function getInletById(id: string | null): Inlet | null {
  if (!id) return null;
  return INLETS.find(i => i.id === id) ?? null;
}

export function flyToInlet(map: any, inlet: Inlet) {
  if (!map) return;
  
  if (inlet.isOverview) {
    // Zoom out to overview
    map.flyTo({
      center: inlet.center,
      zoom: inlet.zoom,
      duration: 1500,
      essential: true
    });
  } else {
    // Regular inlet zoom
    map.flyTo({
      center: inlet.center,
      zoom: inlet.zoom,
      duration: 1000,
      essential: true
    });
  }
}

// Find nearest inlet to a given lat/lng position
export function nearestInlet(lat: number, lng: number): Inlet {
  let nearest = DEFAULT_INLET;
  let minDistance = Infinity;
  
  for (const inlet of INLETS) {
    if (inlet.isOverview) continue;
    
    const [inletLng, inletLat] = inlet.center;
    const distance = Math.sqrt(
      Math.pow(lat - inletLat, 2) + Math.pow(lng - inletLng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = inlet;
    }
  }
  
  return nearest;
}