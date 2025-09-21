/**
 * Canonical list of allowed species for ABFI bite reports
 * This is the single source of truth for species selection
 */
export const ALLOWED_SPECIES = [
  'Yellowfin Tuna',
  'Bluefin Tuna',
  'Bigeye Tuna',
  'Mahi-Mahi',
  'Wahoo',
  'Marlin',
  'Swordfish',
  'Sailfish'
] as const;

export type AllowedSpecies = typeof ALLOWED_SPECIES[number];
