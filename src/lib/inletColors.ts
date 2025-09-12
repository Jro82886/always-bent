/**
 * Masculine color palette for inlet identification
 * No pink, no purple - just strong fishing colors!
 */

export const INLET_COLORS = {
  'Manasquan': {
    color: '#0066CC',      // Deep Blue
    hex: '0066CC',
    name: 'Deep Blue'
  },
  'Barnegat': {
    color: '#228B22',      // Forest Green
    hex: '228B22',
    name: 'Forest Green'
  },
  'Cape May': {
    color: '#DC143C',      // Crimson Red
    hex: 'DC143C',
    name: 'Crimson'
  },
  'Shark River': {
    color: '#FF8C00',      // Dark Orange
    hex: 'FF8C00',
    name: 'Dark Orange'
  },
  'Absecon': {
    color: '#4B0082',      // Indigo
    hex: '4B0082',
    name: 'Indigo'
  },
  'Great Egg': {
    color: '#2F4F4F',      // Dark Slate Gray
    hex: '2F4F4F',
    name: 'Slate Gray'
  },
  'Townsends': {
    color: '#8B4513',      // Saddle Brown
    hex: '8B4513',
    name: 'Saddle Brown'
  },
  'Atlantic City': {
    color: '#000080',      // Navy
    hex: '000080',
    name: 'Navy'
  },
  'Brigantine': {
    color: '#B8860B',      // Dark Goldenrod
    hex: 'B8860B',
    name: 'Goldenrod'
  },
  'Little Egg': {
    color: '#556B2F',      // Dark Olive Green
    hex: '556B2F',
    name: 'Olive'
  }
} as const;

export type InletName = keyof typeof INLET_COLORS;

export const INLET_LIST = Object.keys(INLET_COLORS) as InletName[];