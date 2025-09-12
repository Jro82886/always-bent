/**
 * Muted, glowing color palette for inlet identification
 * Each color is carefully chosen to be visible but not harsh
 */

export const INLET_COLORS: Record<string, { color: string; glow: string }> = {
  // Maine - Seafoam greens
  'me-portland': { color: '#4ade80', glow: 'rgba(74, 222, 128, 0.3)' },
  'me-penobscot': { color: '#34d399', glow: 'rgba(52, 211, 153, 0.3)' },
  
  // New Hampshire - Sage
  'nh-portsmouth': { color: '#86efac', glow: 'rgba(134, 239, 172, 0.3)' },
  
  // Massachusetts - Ocean teals
  'ma-gloucester': { color: '#2dd4bf', glow: 'rgba(45, 212, 191, 0.3)' },
  'ma-boston': { color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.3)' },
  'ma-plymouth': { color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.3)' },
  'ma-chatham': { color: '#0891b2', glow: 'rgba(8, 145, 178, 0.3)' },
  
  // Rhode Island - Sky blues
  'ri-newport': { color: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.3)' },
  'ri-point-judith': { color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.3)' },
  
  // Connecticut - Slate blues
  'ct-stonington': { color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)' },
  
  // New York - Deep blues
  'ny-montauk': { color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
  'ny-shinnecock': { color: '#6366f1', glow: 'rgba(99, 102, 241, 0.3)' },
  'ny-jones': { color: '#818cf8', glow: 'rgba(129, 140, 248, 0.3)' },
  
  // New Jersey - Muted corals
  'nj-sandy-hook': { color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' },
  'nj-barnegat': { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
  'nj-atlantic-city': { color: '#fb923c', glow: 'rgba(251, 146, 60, 0.3)' },
  'nj-cape-may': { color: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' },
  
  // Delaware - Sunset orange
  'de-indian-river': { color: '#ea580c', glow: 'rgba(234, 88, 12, 0.3)' },
  
  // Maryland - Warm amber
  'md-ocean-city': { color: '#dc2626', glow: 'rgba(220, 38, 38, 0.3)' },
  
  // Virginia - Soft reds
  'va-chincoteague': { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
  'va-virginia-beach': { color: '#f87171', glow: 'rgba(248, 113, 113, 0.3)' },
  
  // North Carolina - Warm yellows
  'nc-oregon-inlet': { color: '#facc15', glow: 'rgba(250, 204, 21, 0.3)' },
  'nc-hatteras': { color: '#eab308', glow: 'rgba(234, 179, 8, 0.3)' },
  'nc-ocracoke': { color: '#ca8a04', glow: 'rgba(202, 138, 4, 0.3)' },
  'nc-beaufort': { color: '#a16207', glow: 'rgba(161, 98, 7, 0.3)' },
  'nc-wilmington': { color: '#92400e', glow: 'rgba(146, 64, 14, 0.3)' },
  
  // South Carolina - Lime greens
  'sc-murrells': { color: '#84cc16', glow: 'rgba(132, 204, 22, 0.3)' },
  'sc-charleston': { color: '#65a30d', glow: 'rgba(101, 163, 13, 0.3)' },
  'sc-hilton-head': { color: '#4d7c0f', glow: 'rgba(77, 124, 15, 0.3)' },
  
  // Georgia - Forest greens
  'ga-savannah': { color: '#16a34a', glow: 'rgba(22, 163, 74, 0.3)' },
  'ga-brunswick': { color: '#15803d', glow: 'rgba(21, 128, 61, 0.3)' },
  
  // Florida - Tropical cyans
  'fl-jacksonville': { color: '#0d9488', glow: 'rgba(13, 148, 136, 0.3)' },
  'fl-ponce': { color: '#0f766e', glow: 'rgba(15, 118, 110, 0.3)' },
  'fl-sebastian': { color: '#115e59', glow: 'rgba(17, 94, 89, 0.3)' },
  'fl-jupiter': { color: '#134e4a', glow: 'rgba(19, 78, 74, 0.3)' },
  'fl-miami': { color: '#064e3b', glow: 'rgba(6, 78, 59, 0.3)' },
  'fl-keys': { color: '#022c22', glow: 'rgba(2, 44, 34, 0.3)' },
  
  // Default/Overview
  'overview': { color: '#00ffff', glow: 'rgba(0, 255, 255, 0.3)' }
};

// Helper function to build a simple color map (for legacy compatibility)
export function buildInletColorMap(): Record<string, string> {
  const map: Record<string, string> = {};
  Object.entries(INLET_COLORS).forEach(([key, value]) => {
    map[key] = value.color;
  });
  return map;
}