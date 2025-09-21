/**
 * Ocean data thresholds and bands for analysis
 * Single source of truth for temperature, chlorophyll, and front detection
 */

// Sea Surface Temperature (SST) thresholds in Fahrenheit
export const SST_TARGET_MIN = 66; // °F
export const SST_TARGET_MAX = 72; // °F

// Chlorophyll-a concentration thresholds in mg/m³
export const CHL_MID_BAND_RANGE = {
  min: 0.12, // mg/m³
  max: 0.35  // mg/m³
};

// Front detection threshold (normalized 0-1)
export const FRONT_STRONG_THRESHOLD = 0.65;

// Helper functions
export function isInSSTTargetBand(tempF: number): boolean {
  return tempF >= SST_TARGET_MIN && tempF <= SST_TARGET_MAX;
}

export function isInCHLMidBand(chlMgM3: number): boolean {
  return chlMgM3 >= CHL_MID_BAND_RANGE.min && chlMgM3 <= CHL_MID_BAND_RANGE.max;
}

export function isFrontStrong(strength: number): boolean {
  return strength >= FRONT_STRONG_THRESHOLD;
}
