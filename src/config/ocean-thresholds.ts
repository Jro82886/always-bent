// All thresholds live here so Analysis & Tracking use the same truth.

export const THRESHOLDS = {
  // Sea Surface Temperature (°C)
  SST: {
    TARGET_MIN: 18.0,   // lower bound for target band (tune per species/season)
    TARGET_MAX: 24.0,   // upper bound
    // gradient (front) strength in °C per 10km; adjust to your unit if per km
    FRONT_STRONG: 1.2,  // strong front ≥ 1.2 °C / 10km
    FRONT_MODERATE: 0.6 // moderate front ≥ 0.6 °C / 10km
  },

  // Chlorophyll-a (mg/m³)
  CHL: {
    MID_BAND_MIN: 0.12, // favorable mid band min
    MID_BAND_MAX: 0.35, // favorable mid band max
    GRADIENT_STRONG: 0.08,  // strong gradient per (arbitrary) unit — tune
    GRADIENT_MODERATE: 0.04 // moderate gradient — tune
  },

  // Presence lookbacks
  PRESENCE: {
    USER_HOURS: 48,     // your vessel fixes considered "recent"
    FLEET_DAYS: 7,      // fleet window for analysis
    GFW_DAYS: 4         // commercial window for analysis
  },

  // Hotspot decision weights (optional, for Jeff's logic)
  WEIGHTS: {
    FRONT: 0.6,         // fronts dominate
    SST_BAND: 0.25,     // temp band support
    CHL_BAND: 0.15      // chl band support
  }
} as const;

export type Thresholds = typeof THRESHOLDS;