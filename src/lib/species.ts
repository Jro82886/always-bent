/**
 * Species categories and groups for community chat channels
 */

export interface Species {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind color name
  category: 'pelagic' | 'predator' | 'bottom' | 'inshore';
  description: string;
}

export const SPECIES: Species[] = [
  // Pelagic Hunters
  {
    id: 'tuna',
    name: 'Tuna',
    emoji: '⚡',
    color: 'blue',
    category: 'pelagic',
    description: 'Bluefin, Yellowfin, Bigeye'
  },
  {
    id: 'mahi',
    name: 'Mahi',
    emoji: '🌊',
    color: 'yellow',
    category: 'pelagic',
    description: 'Dolphinfish / Dorado'
  },
  {
    id: 'wahoo',
    name: 'Wahoo',
    emoji: '💨',
    color: 'purple',
    category: 'pelagic',
    description: 'High-speed predator'
  },
  
  // Apex Predators
  {
    id: 'stripers',
    name: 'Striped Bass',
    emoji: '🎯',
    color: 'green',
    category: 'predator',
    description: 'Coastal apex predator'
  },
  {
    id: 'bluefish',
    name: 'Bluefish',
    emoji: '🦈',
    color: 'indigo',
    category: 'predator',
    description: 'Aggressive schooling predator'
  },
  {
    id: 'sharks',
    name: 'Sharks',
    emoji: '🔱',
    color: 'red',
    category: 'predator',
    description: 'Mako, Thresher, Blue sharks'
  },
  
  // Bottom Dwellers
  {
    id: 'fluke',
    name: 'Fluke',
    emoji: '🎣',
    color: 'amber',
    category: 'bottom',
    description: 'Summer Flounder'
  },
  {
    id: 'seabass',
    name: 'Sea Bass',
    emoji: '⚓',
    color: 'slate',
    category: 'bottom',
    description: 'Black Sea Bass'
  },
  {
    id: 'tautog',
    name: 'Tautog',
    emoji: '🪨',
    color: 'stone',
    category: 'bottom',
    description: 'Blackfish / Tog'
  },
  
  // Inshore Game
  {
    id: 'weakfish',
    name: 'Weakfish',
    emoji: '🌅',
    color: 'orange',
    category: 'inshore',
    description: 'Gray Trout / Squeteague'
  },
  {
    id: 'flounder',
    name: 'Flounder',
    emoji: '🏖️',
    color: 'teal',
    category: 'inshore',
    description: 'Winter Flounder'
  },
  {
    id: 'redfish',
    name: 'Redfish',
    emoji: '🌺',
    color: 'rose',
    category: 'inshore',
    description: 'Red Drum'
  }
];

export function getSpeciesById(id: string): Species | undefined {
  return SPECIES.find(s => s.id === id);
}

export function getSpeciesColor(id: string): string {
  const species = getSpeciesById(id);
  if (!species) return '#06b6d4'; // Default cyan
  
  const colorMap: Record<string, string> = {
    'green': '#10b981',
    'blue': '#3b82f6',
    'red': '#ef4444',
    'amber': '#f59e0b',
    'cyan': '#06b6d4',
    'yellow': '#eab308',
    'purple': '#a855f7',
    'indigo': '#6366f1',
    'slate': '#64748b',
    'stone': '#78716c',
    'orange': '#fb923c',
    'teal': '#14b8a6',
    'rose': '#fb7185'
  };
  
  return colorMap[species.color] || '#06b6d4';
}

export function getSpeciesByCategory(category: 'pelagic' | 'predator' | 'bottom' | 'inshore'): Species[] {
  return SPECIES.filter(s => s.category === category);
}

export const CATEGORY_INFO = {
  pelagic: {
    name: 'Pelagic Hunters',
    description: 'Open ocean predators',
    icon: 'Zap',
    color: 'from-blue-500 to-cyan-500'
  },
  predator: {
    name: 'Apex Predators',
    description: 'Top of the food chain',
    icon: 'Target',
    color: 'from-teal-500 to-green-500'
  },
  bottom: {
    name: 'Bottom Dwellers',
    description: 'Structure and bottom fish',
    icon: 'Activity',
    color: 'from-cyan-500 to-blue-500'
  },
  inshore: {
    name: 'Inshore Game',
    description: 'Bay and nearshore species',
    icon: 'Trophy',
    color: 'from-green-500 to-teal-500'
  }
};