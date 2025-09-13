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
  
  // South Carolina - Purple gradient
  'sc-charleston': { color: '#9b59b6', glow: 'rgba(155, 89, 182, 0.3)' },
  'sc-st-helena': { color: '#9b59b6', glow: 'rgba(155, 89, 182, 0.3)' },
  
  // Georgia - Purple
  'ga-savannah': { color: '#9b59b6', glow: 'rgba(155, 89, 182, 0.3)' },
  'ga-st-marys': { color: '#9b59b6', glow: 'rgba(155, 89, 182, 0.3)' },
  
  // Florida - Pink/Magenta gradient
  'fl-jacksonville': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-ponce': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-canaveral': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-sebastian': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-st-lucie': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-jupiter': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-lake-worth': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-port-everglades': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-miami': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  'fl-key-west': { color: '#e91e63', glow: 'rgba(233, 30, 99, 0.3)' },
  
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