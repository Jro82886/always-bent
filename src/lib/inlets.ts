export interface Inlet {
  id: string;
  name: string;
  state: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  isOverview?: boolean;
}

export const INLETS: Inlet[] = [
  // Overview
  { id: 'overview', name: 'East Coast Overview', state: '', center: [-74.5, 38.5], zoom: 5.5, isOverview: true },
  
  // Maine
  { id: 'me-portland', name: 'Portland Harbor / Casco Bay', state: 'ME', center: [-70.2460, 43.6561], zoom: 10 },
  
  // Massachusetts
  { id: 'ma-cape-cod', name: 'Cape Cod Canal East', state: 'MA', center: [-70.5183, 41.7717], zoom: 10 },
  
  // Rhode Island
  { id: 'ri-point-judith', name: 'Point Judith Harbor', state: 'RI', center: [-71.4900, 41.3617], zoom: 10 },
  
  // New York
  { id: 'ny-montauk', name: 'Montauk Harbor', state: 'NY', center: [-71.9360, 41.0710], zoom: 10 },
  { id: 'ny-shinnecock', name: 'Shinnecock Inlet', state: 'NY', center: [-72.4762, 40.8426], zoom: 10 },
  
  // New Jersey
  { id: 'nj-barnegat', name: 'Barnegat Inlet', state: 'NJ', center: [-74.1081, 39.7669], zoom: 10 },
  { id: 'nj-manasquan', name: 'Manasquan Inlet', state: 'NJ', center: [-74.0354, 40.1043], zoom: 10 },
  { id: 'nj-atlantic-city', name: 'Absecon Inlet', state: 'NJ', center: [-74.4050, 39.3704], zoom: 10 },
  
  // Delaware
  { id: 'de-indian-river', name: 'Indian River Inlet', state: 'DE', center: [-75.0677, 38.6073], zoom: 10 },
  
  // Maryland
  { id: 'md-ocean-city', name: 'Ocean City Inlet', state: 'MD', center: [-75.0906, 38.3286], zoom: 10 },
  
  // Virginia
  { id: 'va-chincoteague', name: 'Chincoteague Inlet', state: 'VA', center: [-75.4480, 37.8690], zoom: 10 },
  
  // North Carolina
  { id: 'nc-oregon', name: 'Oregon Inlet', state: 'NC', center: [-75.5255, 35.7714], zoom: 10 },
  { id: 'nc-hatteras', name: 'Hatteras Inlet', state: 'NC', center: [-75.7540, 35.2060], zoom: 10 },
  { id: 'nc-ocracoke', name: 'Ocracoke Inlet', state: 'NC', center: [-75.9927, 35.1305], zoom: 10 },
  { id: 'nc-beaufort', name: 'Beaufort Inlet', state: 'NC', center: [-76.6663, 34.6938], zoom: 10 },
  { id: 'nc-cape-fear', name: 'Cape Fear River', state: 'NC', center: [-77.9730, 33.8730], zoom: 10 },
  
  // South Carolina
  { id: 'sc-charleston', name: 'Charleston Harbor', state: 'SC', center: [-79.9000, 32.7500], zoom: 10 },
  { id: 'sc-st-helena', name: 'St. Helena Sound', state: 'SC', center: [-80.5500, 32.4330], zoom: 10 },
  
  // Georgia
  { id: 'ga-savannah', name: 'Savannah River', state: 'GA', center: [-80.9000, 32.0330], zoom: 10 },
  { id: 'ga-st-marys', name: 'St. Marys Entrance', state: 'GA/FL', center: [-81.4200, 30.7200], zoom: 10 },
  
  // Florida
  { id: 'fl-jacksonville', name: 'St. Johns River', state: 'FL', center: [-81.3830, 30.4000], zoom: 10 },
  { id: 'fl-ponce', name: 'Ponce de Leon Inlet', state: 'FL', center: [-80.9180, 29.0640], zoom: 10 },
  { id: 'fl-canaveral', name: 'Port Canaveral', state: 'FL', center: [-80.5920, 28.4158], zoom: 10 },
  { id: 'fl-sebastian', name: 'Sebastian Inlet', state: 'FL', center: [-80.4450, 27.8600], zoom: 10 },
  { id: 'fl-st-lucie', name: 'St. Lucie Inlet', state: 'FL', center: [-80.1511, 27.1669], zoom: 10 },
  { id: 'fl-jupiter', name: 'Jupiter Inlet', state: 'FL', center: [-80.0730, 26.9480], zoom: 10 },
  { id: 'fl-lake-worth', name: 'Lake Worth Inlet', state: 'FL', center: [-80.0350, 26.7720], zoom: 10 },
  { id: 'fl-port-everglades', name: 'Port Everglades', state: 'FL', center: [-80.1050, 26.0850], zoom: 10 },
  { id: 'fl-miami', name: 'Government Cut', state: 'FL', center: [-80.1300, 25.7650], zoom: 10 },
  { id: 'fl-key-west', name: 'Key West Harbor', state: 'FL Keys', center: [-81.8069, 24.5561], zoom: 10 }
];

export const DEFAULT_INLET = INLETS[0];

export function getInletById(id: string | null): Inlet | null {
  if (!id) return null;
  return INLETS.find(i => i.id === id) ?? null;
}

export function flyToInlet(map: any, inlet: Inlet) {
  if (!map) return;
  
  if (inlet.isOverview) {
    // Zoom out to full East Coast (Maine to Florida Keys visible)
    map.fitBounds([
      [-82, 24.5], // Southwest (Florida Keys)
      [-69, 44]    // Northeast (Maine)
    ], {
      padding: { top: 50, bottom: 50, left: 50, right: 50 },
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