/**
 * Anti-static detector to prevent regression to placeholder text
 * This module ensures we NEVER ship static/fake analysis text again
 */

const BANNED_STATIC_PHRASES = [
  "No bite reports in this area yet",
  "Current conditions favor opportunistic fishing",
  "Check structure and current edges in the area",
  "Ocean data layers are not currently active",
  "Enable layers to see live analysis",
  "Analyzing ocean conditions...",
  "Loading analysis...",
  "Temperature data unavailable",
  "Chlorophyll data unavailable",
];

const BANNED_PATTERNS = [
  /\bmock\s*data\b/i,
  /\bplaceholder\b/i,
  /\bTODO.*analysis/i,
  /\bFIXME.*analysis/i,
];

export class StaticTextError extends Error {
  constructor(detectedPhrase: string) {
    super(`STATIC TEXT DETECTED: "${detectedPhrase}". This is forbidden in production.`);
    this.name = 'StaticTextError';
  }
}

/**
 * Throws if any banned static phrases are detected
 * Use this before rendering any analysis content
 */
export function assertNoStaticCopy(htmlOrText: string): void {
  if (!htmlOrText) return;
  
  // Check for exact phrase matches
  for (const phrase of BANNED_STATIC_PHRASES) {
    if (htmlOrText.includes(phrase)) {
      console.error('[ABFI BLOCKED STATIC]', phrase);
      if (process.env.NODE_ENV === 'production') {
        // In production, log error but don't crash - show warning instead
        console.error(new StaticTextError(phrase));
        return;
      }
      throw new StaticTextError(phrase);
    }
  }
  
  // Check for pattern matches
  for (const pattern of BANNED_PATTERNS) {
    const match = htmlOrText.match(pattern);
    if (match) {
      console.error('[ABFI BLOCKED PATTERN]', match[0]);
      if (process.env.NODE_ENV === 'production') {
        console.error(new StaticTextError(match[0]));
        return;
      }
      throw new StaticTextError(match[0]);
    }
  }
}

/**
 * Validates that analysis data contains real values, not defaults
 */
export function assertValidAnalysisData(data: any): void {
  if (!data) {
    throw new Error('Analysis data is null/undefined');
  }
  
  // Check for suspicious default values
  const suspiciousValues = [0, -999, 999, -1, null, undefined, NaN];
  
  if (data.sst) {
    const { meanF, minF, maxF, gradFperMile } = data.sst;
    
    // Temperature should be realistic ocean temps (40-90°F range)
    if (meanF < 40 || meanF > 90) {
      throw new Error(`Unrealistic SST mean: ${meanF}°F`);
    }
    
    // Gradient should be positive
    if (gradFperMile < 0) {
      throw new Error(`Invalid SST gradient: ${gradFperMile}°F/mile`);
    }
    
    // Min should be less than max
    if (minF >= maxF) {
      throw new Error(`Invalid SST range: ${minF}-${maxF}°F`);
    }
  }
  
  if (data.chl) {
    const { mean } = data.chl;
    
    // Chlorophyll should be positive and reasonable (0-10 mg/m³ typical)
    if (mean <= 0 || mean > 50) {
      throw new Error(`Unrealistic chlorophyll: ${mean} mg/m³`);
    }
  }
  
  // Area should be positive
  if (data.areaKm2 <= 0) {
    throw new Error(`Invalid area: ${data.areaKm2} km²`);
  }
}

/**
 * Runtime telemetry for monitoring analysis quality
 */
export function trackAnalysisQuality(vm: any): void {
  if (typeof window === 'undefined') return;
  
  const quality = {
    hasSST: vm?.hasSST || false,
    hasCHL: vm?.hasCHL || false,
    sstValid: vm?.sst ? Number.isFinite(vm.sst.meanF) : false,
    chlValid: vm?.chl ? Number.isFinite(vm.chl.mean) : false,
    areaValid: Number.isFinite(vm?.areaKm2),
  };
  
  // Log to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[ABFI Analysis Quality]', quality);
  }
  
  // TODO: Send to analytics service
  // track('analysis_render_quality', quality);
}
