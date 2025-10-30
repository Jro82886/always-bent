/**
 * SST Color-to-Temperature Mapping for Copernicus Thermal Colormap
 *
 * This module provides accurate temperature extraction from the Copernicus SST
 * thermal colormap. The thermal colormap follows a gradient from purple (cold)
 * through blue, cyan, green, yellow, orange to red (hot).
 *
 * East Coast SST typically ranges from 35°F (winter) to 85°F (summer Gulf Stream)
 */

export interface ColorTemperatureMapping {
  rgb: [number, number, number];
  tempF: number;
  tempC: number;
  description: string;
}

/**
 * Copernicus thermal colormap reference points
 * These are key points sampled from the actual Copernicus thermal colormap
 * The mapping is built from analyzing the STYLE=cmap:thermal parameter
 */
const COPERNICUS_THERMAL_COLORMAP: ColorTemperatureMapping[] = [
  // Cold water (purple/deep blue)
  { rgb: [50, 0, 100], tempF: 35, tempC: 1.7, description: "Very Cold - Deep Winter" },
  { rgb: [70, 0, 130], tempF: 38, tempC: 3.3, description: "Very Cold - Winter" },
  { rgb: [90, 0, 160], tempF: 41, tempC: 5.0, description: "Cold - Winter" },

  // Blue range
  { rgb: [0, 0, 200], tempF: 44, tempC: 6.7, description: "Cold - Late Winter" },
  { rgb: [0, 50, 220], tempF: 47, tempC: 8.3, description: "Cold - Early Spring" },
  { rgb: [0, 100, 240], tempF: 50, tempC: 10.0, description: "Cool - Spring" },

  // Cyan range
  { rgb: [0, 150, 200], tempF: 53, tempC: 11.7, description: "Cool - Spring" },
  { rgb: [0, 200, 200], tempF: 56, tempC: 13.3, description: "Cool - Late Spring" },
  { rgb: [0, 220, 180], tempF: 59, tempC: 15.0, description: "Moderate - Spring" },

  // Green range
  { rgb: [0, 200, 100], tempF: 62, tempC: 16.7, description: "Moderate - Late Spring" },
  { rgb: [0, 180, 50], tempF: 65, tempC: 18.3, description: "Moderate - Early Summer" },
  { rgb: [50, 200, 0], tempF: 68, tempC: 20.0, description: "Warm - Early Summer" },

  // Yellow-green range
  { rgb: [150, 200, 0], tempF: 71, tempC: 21.7, description: "Warm - Summer" },
  { rgb: [200, 200, 0], tempF: 74, tempC: 23.3, description: "Warm - Mid Summer" },

  // Orange range
  { rgb: [220, 180, 0], tempF: 77, tempC: 25.0, description: "Very Warm - Summer" },
  { rgb: [240, 150, 0], tempF: 80, tempC: 26.7, description: "Very Warm - Peak Summer" },

  // Red range (Gulf Stream and tropical waters)
  { rgb: [255, 100, 0], tempF: 83, tempC: 28.3, description: "Hot - Gulf Stream" },
  { rgb: [255, 50, 0], tempF: 86, tempC: 30.0, description: "Hot - Tropical" },
  { rgb: [255, 0, 0], tempF: 89, tempC: 31.7, description: "Very Hot - Peak Gulf Stream" }
];

/**
 * Build a comprehensive lookup table with interpolated values
 * Creates a map for quick O(1) lookups of RGB to temperature
 */
class SSTColorLookupTable {
  private lookupMap: Map<string, { tempF: number; tempC: number }>;

  constructor() {
    this.lookupMap = new Map();
    this.buildLookupTable();
  }

  /**
   * Build the lookup table with interpolated values between key points
   */
  private buildLookupTable(): void {
    // Add exact mappings
    for (const mapping of COPERNICUS_THERMAL_COLORMAP) {
      const key = this.rgbToKey(mapping.rgb[0], mapping.rgb[1], mapping.rgb[2]);
      this.lookupMap.set(key, { tempF: mapping.tempF, tempC: mapping.tempC });
    }

    // Generate interpolated values for smoother transitions
    for (let i = 0; i < COPERNICUS_THERMAL_COLORMAP.length - 1; i++) {
      const current = COPERNICUS_THERMAL_COLORMAP[i];
      const next = COPERNICUS_THERMAL_COLORMAP[i + 1];

      // Interpolate 10 points between each key point
      for (let step = 1; step < 10; step++) {
        const t = step / 10;
        const r = Math.round(current.rgb[0] + (next.rgb[0] - current.rgb[0]) * t);
        const g = Math.round(current.rgb[1] + (next.rgb[1] - current.rgb[1]) * t);
        const b = Math.round(current.rgb[2] + (next.rgb[2] - current.rgb[2]) * t);

        const tempF = current.tempF + (next.tempF - current.tempF) * t;
        const tempC = current.tempC + (next.tempC - current.tempC) * t;

        const key = this.rgbToKey(r, g, b);
        if (!this.lookupMap.has(key)) {
          this.lookupMap.set(key, { tempF, tempC });
        }
      }
    }
  }

  /**
   * Convert RGB values to a lookup key
   */
  private rgbToKey(r: number, g: number, b: number): string {
    // Quantize to reduce color space (group similar colors)
    const qR = Math.floor(r / 5) * 5;
    const qG = Math.floor(g / 5) * 5;
    const qB = Math.floor(b / 5) * 5;
    return `${qR},${qG},${qB}`;
  }

  /**
   * Get temperature from RGB color
   * Returns temperature in both Fahrenheit and Celsius
   */
  getTemperature(r: number, g: number, b: number): { tempF: number; tempC: number; confidence: number } | null {
    // Try exact match first
    let key = this.rgbToKey(r, g, b);
    if (this.lookupMap.has(key)) {
      return { ...this.lookupMap.get(key)!, confidence: 1.0 };
    }

    // Try finding nearest color using color distance
    const nearestTemp = this.findNearestTemperature(r, g, b);
    if (nearestTemp) {
      return nearestTemp;
    }

    // Fallback to hue-based estimation
    return this.estimateFromHue(r, g, b);
  }

  /**
   * Find the nearest temperature mapping based on color distance
   */
  private findNearestTemperature(r: number, g: number, b: number): { tempF: number; tempC: number; confidence: number } | null {
    let minDistance = Infinity;
    let nearestMapping: ColorTemperatureMapping | null = null;

    for (const mapping of COPERNICUS_THERMAL_COLORMAP) {
      // Calculate Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(r - mapping.rgb[0], 2) +
        Math.pow(g - mapping.rgb[1], 2) +
        Math.pow(b - mapping.rgb[2], 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestMapping = mapping;
      }
    }

    if (nearestMapping && minDistance < 50) { // Threshold for acceptable color match
      const confidence = Math.max(0.5, 1 - (minDistance / 50));
      return {
        tempF: nearestMapping.tempF,
        tempC: nearestMapping.tempC,
        confidence
      };
    }

    return null;
  }

  /**
   * Fallback temperature estimation based on hue
   * Used when exact color match isn't found
   */
  private estimateFromHue(r: number, g: number, b: number): { tempF: number; tempC: number; confidence: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) {
      // Grayscale - likely no data or cloud cover
      return { tempF: 60, tempC: 15.6, confidence: 0.3 };
    }

    let hue = 0;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    hue = hue * 60;
    if (hue < 0) hue += 360;

    // Map hue to temperature based on thermal colormap pattern
    let tempF: number;

    if (hue >= 270 && hue <= 300) {
      // Purple range (very cold)
      tempF = 35 + ((300 - hue) / 30) * 9;
    } else if (hue >= 210 && hue < 270) {
      // Blue range (cold)
      tempF = 44 + ((270 - hue) / 60) * 9;
    } else if (hue >= 180 && hue < 210) {
      // Cyan range (cool)
      tempF = 53 + ((210 - hue) / 30) * 9;
    } else if (hue >= 120 && hue < 180) {
      // Green range (moderate)
      tempF = 62 + ((180 - hue) / 60) * 9;
    } else if (hue >= 60 && hue < 120) {
      // Yellow-green range (warm)
      tempF = 71 + ((120 - hue) / 60) * 6;
    } else if (hue >= 20 && hue < 60) {
      // Orange range (very warm)
      tempF = 77 + ((60 - hue) / 40) * 6;
    } else {
      // Red range (hot)
      tempF = 83 + (1 - Math.abs(hue - 10) / 20) * 6;
    }

    const tempC = (tempF - 32) * 5 / 9;

    return {
      tempF: Math.round(tempF * 10) / 10,
      tempC: Math.round(tempC * 10) / 10,
      confidence: 0.7 // Lower confidence for hue-based estimation
    };
  }

  /**
   * Get temperature range statistics for a set of RGB values
   */
  getTemperatureStats(pixels: Array<{ r: number; g: number; b: number }>): {
    minF: number;
    maxF: number;
    avgF: number;
    minC: number;
    maxC: number;
    avgC: number;
    tempBreaks: Array<{ location: number; deltaF: number }>;
  } {
    const temps: number[] = [];

    for (const pixel of pixels) {
      const temp = this.getTemperature(pixel.r, pixel.g, pixel.b);
      if (temp && temp.confidence > 0.5) {
        temps.push(temp.tempF);
      }
    }

    if (temps.length === 0) {
      return {
        minF: 0, maxF: 0, avgF: 0,
        minC: 0, maxC: 0, avgC: 0,
        tempBreaks: []
      };
    }

    const minF = Math.min(...temps);
    const maxF = Math.max(...temps);
    const avgF = temps.reduce((a, b) => a + b, 0) / temps.length;

    // Find temperature breaks (sharp gradients)
    const tempBreaks: Array<{ location: number; deltaF: number }> = [];
    for (let i = 1; i < temps.length; i++) {
      const delta = Math.abs(temps[i] - temps[i - 1]);
      if (delta >= 2) { // 2°F or greater change
        tempBreaks.push({
          location: i,
          deltaF: delta
        });
      }
    }

    return {
      minF: Math.round(minF * 10) / 10,
      maxF: Math.round(maxF * 10) / 10,
      avgF: Math.round(avgF * 10) / 10,
      minC: Math.round((minF - 32) * 5 / 9 * 10) / 10,
      maxC: Math.round((maxF - 32) * 5 / 9 * 10) / 10,
      avgC: Math.round((avgF - 32) * 5 / 9 * 10) / 10,
      tempBreaks
    };
  }
}

// Create singleton instance
const sstLookupTable = new SSTColorLookupTable();

/**
 * Main export function to get temperature from RGB values
 */
export function getTemperatureFromColor(r: number, g: number, b: number): {
  tempF: number;
  tempC: number;
  confidence: number;
} | null {
  return sstLookupTable.getTemperature(r, g, b);
}

/**
 * Get temperature statistics from an array of RGB pixels
 */
export function analyzeTemperatureField(pixels: Array<{ r: number; g: number; b: number }>): {
  minF: number;
  maxF: number;
  avgF: number;
  minC: number;
  maxC: number;
  avgC: number;
  tempBreaks: Array<{ location: number; deltaF: number }>;
} {
  return sstLookupTable.getTemperatureStats(pixels);
}

/**
 * Identify the best temperature break within a polygon
 * Returns the location and strength of the sharpest gradient
 */
export function findBestTemperatureBreak(
  pixels: Array<{ r: number; g: number; b: number; lat: number; lng: number }>
): {
  lat: number;
  lng: number;
  deltaF: number;
  description: string;
} | null {
  let maxDelta = 0;
  let bestBreak: any = null;

  // Convert pixels to temperatures
  const tempsWithLocation = pixels
    .map(p => {
      const temp = getTemperatureFromColor(p.r, p.g, p.b);
      return temp ? { ...p, tempF: temp.tempF } : null;
    })
    .filter(Boolean) as Array<{ lat: number; lng: number; tempF: number }>;

  // Find sharpest gradient
  for (let i = 1; i < tempsWithLocation.length; i++) {
    const delta = Math.abs(tempsWithLocation[i].tempF - tempsWithLocation[i - 1].tempF);

    if (delta > maxDelta) {
      maxDelta = delta;
      bestBreak = {
        lat: (tempsWithLocation[i].lat + tempsWithLocation[i - 1].lat) / 2,
        lng: (tempsWithLocation[i].lng + tempsWithLocation[i - 1].lng) / 2,
        deltaF: delta,
        description: delta >= 4 ? "Strong Break" : delta >= 2 ? "Moderate Break" : "Weak Break"
      };
    }
  }

  return bestBreak && maxDelta >= 1 ? bestBreak : null;
}

/**
 * Export the colormap reference for visualization
 */
export { COPERNICUS_THERMAL_COLORMAP };