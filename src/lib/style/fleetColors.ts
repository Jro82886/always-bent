import { INLETS } from '@/lib/inlets';

/**
 * Get the color for a specific inlet ID
 * This is the single source of truth for inlet colors
 */
export function getInletColor(inletId: string): string {
  const inlet = INLETS.find(i => i.id === inletId);
  return inlet?.color || '#999999'; // fallback grey for unknown inlets
}

/**
 * Create a color lookup object for all inlets
 * Useful for Mapbox expressions
 */
export function getInletColorMap(): Record<string, string> {
  const colorMap: Record<string, string> = {};
  INLETS.forEach(inlet => {
    if (inlet.color) {
      colorMap[inlet.id] = inlet.color;
    }
  });
  return colorMap;
}
