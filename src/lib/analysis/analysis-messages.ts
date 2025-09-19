// Brand-aligned messaging for analysis features
export const ANALYSIS_MESSAGES = {
  // Layer coaching when disabled
  layers: {
    sst: {
      disabled: "Enable Sea Surface Temperature to identify thermal breaks where baitfish congregate. Temperature edges are prime feeding zones.",
      unavailable: "SST data temporarily unavailable. Try again in a few minutes or continue with available data."
    },
    chl: {
      disabled: "Enable Chlorophyll to locate nutrient-rich waters that attract the entire food chain. High chlorophyll = more baitfish.",
      unavailable: "Chlorophyll data updating. Check back shortly or analyze with temperature data alone."
    },
    vessels: {
      none: "No vessel activity in the last 4 days. This could mean untapped potential or off-season conditions.",
      limited: "Limited vessel data available. Commercial patterns are most reliable during peak fishing months."
    }
  },
  
  // Data availability messages
  availability: {
    weather: {
      missing: "Weather data unavailable. Using regional conditions for analysis.",
      distant: "Using weather from nearest buoy ({distance}nm away). Select a closer inlet for precise conditions."
    },
    tide: {
      missing: "Tidal data requires inlet selection. Using general offshore conditions.",
      error: "Tide service temporarily offline. Analysis based on other factors."
    },
    reports: {
      none: "No recent reports in this area. Be the first to log your catch and help build community intelligence.",
      old: "Latest reports are {days} days old. Conditions may have changed significantly."
    }
  },
  
  // Recommendations based on available data
  recommendations: {
    minimal: "Limited data available. For best results, enable SST and CHL layers before analyzing.",
    partial: "Analysis based on {available} data. Enable additional layers for comprehensive intelligence.",
    retry: "Some data sources timed out. Re-analyze in 30 seconds for complete results.",
    optimal: "All data sources active. You're seeing the complete picture."
  },
  
  // Professional headers (no emojis)
  headers: {
    title: "COMPREHENSIVE ANALYSIS",
    location: "Location",
    conditions: "Marine Conditions",
    ocean: "Ocean Conditions",
    vessels: "Vessel Activity", 
    reports: "Fishing Reports",
    hotspot: "PRIMARY HOTSPOT IDENTIFIED",
    recommendation: "RECOMMENDATION"
  }
};

// Helper to format professional analysis without emojis
export function formatProfessionalAnalysis(data: any): string {
  const h = ANALYSIS_MESSAGES.headers;
  
  let analysis = `${h.title}\n`;
  analysis += `${h.location}: ${data.location.lat}°${data.location.latDir}, ${data.location.lon}°${data.location.lonDir}\n`;
  analysis += `Time: ${data.timestamp}\n\n`;
  
  // Add sections without emoji decoration
  if (data.marine) {
    analysis += `${h.conditions}:\n`;
    analysis += `• Moon: ${data.marine.moon}\n`;
    analysis += `• Tide: ${data.marine.tide}\n`;
    analysis += `• Next ${data.marine.nextTide.type}: ${data.marine.nextTide.time}\n\n`;
  }
  
  // Continue formatting...
  return analysis;
}
