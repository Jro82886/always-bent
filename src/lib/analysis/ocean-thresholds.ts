// Ocean analysis thresholds for SST, CHL, and front detection

// SST thresholds (Fahrenheit)
export const SST_TARGET_MIN = 68;  // Optimal pelagic temperature range start
export const SST_TARGET_MAX = 74;  // Optimal pelagic temperature range end

// Chlorophyll thresholds (mg/m³)
export const CHL_MID_BAND_RANGE = [0.05, 1.5] as const;  // Optimal productivity range

// Front detection thresholds
export const FRONT_STRONG_THRESHOLD = 2.0;  // °F gradient for strong fronts
