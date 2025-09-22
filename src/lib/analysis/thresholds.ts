// Safe starter thresholds; replace with Jeff's tuned values when ready
export const SST_IDEAL_RANGE_F = { min: 66, max: 74 };      // °F (tuna-friendly band)
export const SST_STRONG_FRONT_F_PER_KM = 0.8;               // gradient
export const CHL_IDEAL_RANGE = { min: 0.1, max: 0.6 };      // mg/m³
export const CHL_FRONT_PER_KM = 0.05;

export const FORMAT = {
  sst: (v?: number | null) => v == null ? 'n/a' : `${v.toFixed(1)}°F`,
  chl: (v?: number | null) => v == null ? 'n/a' : v < 0.1 ? v.toFixed(3) : v.toFixed(2),
  grad: (v?: number | null, units: '°F' | 'mg/m³' = '°F') =>
    v == null ? 'n/a' : units === '°F' ? `${v.toFixed(2)}°/km` : `${v.toFixed(3)} mg/m³/km`,
};
