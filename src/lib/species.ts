/**
 * Species groups for community chat channels
 */

export interface Species {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind color name
  description: string;
}

export const SPECIES: Species[] = [
  {
    id: 'stripers',
    name: 'Stripers',
    emoji: '🐟',
    color: 'green',
    description: 'Striped Bass hunters'
  },
  {
    id: 'tuna',
    name: 'Tuna',
    emoji: '🎣',
    color: 'blue',
    description: 'Bluefin and Yellowfin'
  },
  {
    id: 'sharks',
    name: 'Sharks',
    emoji: '🦈',
    color: 'red',
    description: 'Mako and Thresher sharks'
  },
  {
    id: 'bottom',
    name: 'Bottom',
    emoji: '⚓',
    color: 'amber',
    description: 'Fluke, Sea Bass, and more'
  },
  {
    id: 'offshore',
    name: 'Offshore',
    emoji: '🌊',
    color: 'cyan',
    description: 'Mahi, Wahoo, and Billfish'
  }
];

export function getSpeciesById(id: string): Species | undefined {
  return SPECIES.find(s => s.id === id);
}

export function getSpeciesColor(id: string): string {
  const species = getSpeciesById(id);
  if (!species) return 'cyan';
  
  // Return Tailwind color classes
  const colorMap: Record<string, string> = {
    'green': '#10b981',  // emerald-500
    'blue': '#3b82f6',   // blue-500
    'red': '#ef4444',    // red-500
    'amber': '#f59e0b',  // amber-500
    'cyan': '#06b6d4'    // cyan-500
  };
  
  return colorMap[species.color] || '#06b6d4';
}
