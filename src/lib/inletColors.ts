/**
 * Muted, glowing color palette for inlet identification
 * Each color is carefully chosen to be visible but not harsh
 */

export const INLET_COLORS: Record<string, { color: string; glow: string }> = {
  // Maine - Green (from screenshot)
  'me-portland': { color: '#26c281', glow: 'rgba(38, 194, 129, 0.3)' },
  
  // Massachusetts - Green (Cape Cod)
  'ma-cape-cod': { color: '#26c281', glow: 'rgba(38, 194, 129, 0.3)' },
  
  // Rhode Island - Light Blue (Point Judith)
  'ri-point-judith': { color: '#00bdff', glow: 'rgba(0, 189, 255, 0.3)' },
  
  // New York - Blues
  'ny-montauk': { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.3)' },
  'ny-shinnecock': { color: '#4169E1', glow: 'rgba(65, 105, 225, 0.3)' },
  
  // New Jersey - Orange/Turquoise
  'nj-barnegat': { color: '#f39c12', glow: 'rgba(243, 156, 18, 0.3)' },
  'nj-manasquan': { color: '#00CED1', glow: 'rgba(0, 206, 209, 0.3)' },
  'nj-atlantic-city': { color: '#FF8C00', glow: 'rgba(255, 140, 0, 0.3)' },
  
  // Delaware - Dark Orange
  'de-indian-river': { color: '#FF8C00', glow: 'rgba(255, 140, 0, 0.3)' },
  
  // Maryland - Red
  'md-ocean-city': { color: '#e74c3c', glow: 'rgba(231, 76, 60, 0.3)' },
  
  // Virginia - Red
  'va-chincoteague': { color: '#e74c3c', glow: 'rgba(231, 76, 60, 0.3)' },
  
  // North Carolina - Continue red gradient
  'nc-oregon': { color: '#e74c3c', glow: 'rgba(231, 76, 60, 0.3)' },
  'nc-hatteras': { color: '#e74c3c', glow: 'rgba(231, 76, 60, 0.3)' },
  'nc-ocracoke': { color: '#e74c3c', glow: 'rgba(231, 76, 60, 0.3)' },
  'nc-beaufort': { color: '#e74c3c', glow: 'rgba(231, 76, 60, 0.3)' },
  'nc-cape-fear': { color: '#e74c3c', glow: 'rgba(231, 76, 60, 0.3)' },
  
  // South Carolina - Steel Blue gradient
  'sc-charleston': { color: '#475569', glow: 'rgba(71, 85, 105, 0.3)' },
  'sc-st-helena': { color: '#475569', glow: 'rgba(71, 85, 105, 0.3)' },
  
  // Georgia - Deep Teal
  'ga-savannah': { color: '#0d9488', glow: 'rgba(13, 148, 136, 0.3)' },
  'ga-st-marys': { color: '#0d9488', glow: 'rgba(13, 148, 136, 0.3)' },
  
  // Florida - Navy/Ocean gradient
  'fl-jacksonville': { color: '#1e3a8a', glow: 'rgba(30, 58, 138, 0.3)' },
  'fl-ponce': { color: '#1e3a8a', glow: 'rgba(30, 58, 138, 0.3)' },
  'fl-canaveral': { color: '#1e293b', glow: 'rgba(30, 41, 59, 0.3)' },
  'fl-sebastian': { color: '#0369a1', glow: 'rgba(3, 105, 161, 0.3)' },
  'fl-st-lucie': { color: '#7c2d12', glow: 'rgba(124, 45, 18, 0.3)' },
  'fl-jupiter': { color: '#b45309', glow: 'rgba(180, 83, 9, 0.3)' },
  'fl-lake-worth': { color: '#a16207', glow: 'rgba(161, 98, 7, 0.3)' },
  'fl-port-everglades': { color: '#166534', glow: 'rgba(22, 101, 52, 0.3)' },
  'fl-miami': { color: '#0f766e', glow: 'rgba(15, 118, 110, 0.3)' },
  'fl-key-west': { color: '#4338ca', glow: 'rgba(67, 56, 202, 0.3)' },
  
  // Default/Overview
  'overview': { color: '#26c281', glow: 'rgba(38, 194, 129, 0.3)' },
  'east-coast': { color: '#26c281', glow: 'rgba(38, 194, 129, 0.3)' }
};

// Helper function to build a simple color map (for legacy compatibility)
export function buildInletColorMap(): Record<string, string> {
  const map: Record<string, string> = {};
  Object.entries(INLET_COLORS).forEach(([key, value]) => {
    map[key] = value.color;
  });
  return map;
}

// Get color for a specific inlet
export function getInletColor(inletId: string): string {
  return INLET_COLORS[inletId]?.color || '#26c281'; // Default to green
}