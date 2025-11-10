/**
 * Simplified species categories for community chat channels
 * Focused on Tuna and offshore pelagic species
 */

export interface Species {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind color name
  category: 'tuna' | 'offshore';
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
  {
    id: 'swordfish',
    name: 'Swordfish',
    emoji: '⚔️',
    color: 'gray',
    category: 'offshore',
    description: 'Deep water billfish'
  },
  {
    id: 'sailfish',
    name: 'Sailfish',
    emoji: '🏴‍☠️',
    color: 'sky',
    category: 'offshore',
    description: 'Fast billfish'
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
    'amber': '#f59e0b',
    'gray': '#6b7280',
    'sky': '#0ea5e9'
  };

  return colorMap[species.color] || '#06b6d4';
}

export function getSpeciesByCategory(category: 'tuna' | 'offshore'): Species[] {
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
    description: 'Mahi, Wahoo, Marlin, Swordfish, Sailfish',
    icon: 'Activity',
    color: 'from-teal-500 to-cyan-500'
  }
};