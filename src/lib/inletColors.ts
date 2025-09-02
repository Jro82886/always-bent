// Neutral/masculine palette (no pinks/purples)
const PALETTE = [
  '#2E86AB', // Ocean Blue
  '#2A9D8F', // Deep Green
  '#6C757D', // Steel Gray
  '#A23B3B', // Rust Red
  '#1B263B', // Navy
  '#C2B280', // Sandstone
  '#264653', // Dark Teal
  '#343A40', // Charcoal
  '#3E5C76', // Slate Blue (muted)
  '#556B2F', // Olive Drab
];

export function inletColorFromIndex(idx: number) {
  return PALETTE[idx % PALETTE.length];
}

// Assign deterministically by inlet order, with an explicit override if desired.
export function buildInletColorMap(inletIds: string[], overrides?: Record<string, string>) {
  const map: Record<string, string> = {};
  inletIds.forEach((id, i) => { map[id] = inletColorFromIndex(i); });
  if (overrides) {
    for (const k in overrides) map[k] = overrides[k];
  }
  // Special case: overview neutral
  if (map['overview']) map['overview'] = '#343A40';
  return map;
}


