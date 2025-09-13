/**
 * Simplified species categories for community chat channels
 * Focused on Tuna and related offshore/inshore species
 */

export interface Species {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind color name
  category: 'tuna' | 'offshore' | 'inshore';
  description: string;
}

export const SPECIES: Species[] = [
  // TUNA CHAT - Primary focus
  {
    id: 'bluefin',
    name: 'Bluefin Tuna',
    emoji: '⚡',
    color: 'blue',
    category: 'tuna',
    description: 'Giants of the Atlantic'
  },
  {
    id: 'yellowfin',
    name: 'Yellowfin Tuna',
    emoji: '⚡',
    color: 'yellow',
    category: 'tuna',
    description: 'Football to giants'
  },
  {
    id: 'bigeye',
    name: 'Bigeye Tuna',
    emoji: '⚡',
    color: 'indigo',
    category: 'tuna',
    description: 'Deep water tuna'
  },
  
  // OFFSHORE CHAT
  {
    id: 'mahi',
    name: 'Mahi',
    emoji: '🌊',
    color: 'green',
    category: 'offshore',
    description: 'Dolphinfish / Dorado'
  },
  {
    id: 'wahoo',
    name: 'Wahoo',
    emoji: '💨',
    color: 'purple',
    category: 'offshore',
    description: 'High-speed predator'
  },
  {
    id: 'marlin',
    name: 'Marlin',
    emoji: '🎯',
    color: 'cyan',
    category: 'offshore',
    description: 'Blue & White Marlin'
  },
  
  // INSHORE CHAT
  {
    id: 'stripers',
    name: 'Striped Bass',
    emoji: '🎣',
    color: 'teal',
    category: 'inshore',
    description: 'Coastal favorite'
  },
  {
    id: 'bluefish',
    name: 'Bluefish',
    emoji: '🦈',
    color: 'slate',
    category: 'inshore',
    description: 'Aggressive schooling fish'
  },
  {
    id: 'fluke',
    name: 'Fluke',
    emoji: '🏖️',
    color: 'amber',
    category: 'inshore',
    description: 'Summer Flounder'
  }
];

export function getSpeciesById(id: string): Species | undefined {
  return SPECIES.find(s => s.id === id);
}

export function getSpeciesColor(id: string): string {
  const species = getSpeciesById(id);
  if (!species) return '#06b6d4'; // Default cyan
  
  const colorMap: Record<string, string> = {
    'blue': '#3b82f6',
    'yellow': '#eab308',
    'indigo': '#6366f1',
    'green': '#10b981',
    'purple': '#a855f7',
    'cyan': '#06b6d4',
    'teal': '#14b8a6',
    'slate': '#64748b',
    'amber': '#f59e0b'
  };
  
  return colorMap[species.color] || '#06b6d4';
}

export function getSpeciesByCategory(category: 'tuna' | 'offshore' | 'inshore'): Species[] {
  return SPECIES.filter(s => s.category === category);
}

export const CATEGORY_INFO = {
  tuna: {
    name: 'Tuna Chat',
    description: 'Bluefin, Yellowfin, Bigeye',
    icon: 'Zap',
    color: 'from-blue-500 to-cyan-500'
  },
  offshore: {
    name: 'Offshore Chat',
    description: 'Mahi, Wahoo, Billfish',
    icon: 'Activity',
    color: 'from-teal-500 to-cyan-500'
  },
  inshore: {
    name: 'Inshore Chat',
    description: 'Stripers, Blues, Fluke',
    icon: 'Trophy',
    color: 'from-green-500 to-teal-500'
  }
};