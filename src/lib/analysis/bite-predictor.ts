/**
 * Bite Prediction Algorithm
 * Calculates fishing activity predictions based on environmental factors
 */

export interface BiteFactors {
  moonPhase: number; // 0-1 (new moon to full moon)
  tidePhase: 'slack' | 'incoming' | 'outgoing' | 'peak';
  waterTemp: number; // Fahrenheit
  windSpeed: number; // knots
  pressure: number; // mb
  pressureTrend: 'rising' | 'falling' | 'stable';
  timeOfDay: number; // 0-24 hours
  season: 'spring' | 'summer' | 'fall' | 'winter';
}

export interface BitePrediction {
  score: number; // 0-100
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  bestTimes: string[];
  factors: {
    positive: string[];
    negative: string[];
  };
}

/**
 * Calculate bite prediction score based on environmental factors
 */
export function calculateBitePrediction(factors: BiteFactors): BitePrediction {
  let score = 50; // Base score
  const positive: string[] = [];
  const negative: string[] = [];

  // Moon phase (solunar theory)
  const moonScore = calculateMoonScore(factors.moonPhase);
  score += moonScore.adjustment;
  if (moonScore.positive) positive.push(moonScore.reason);
  else negative.push(moonScore.reason);

  // Tide phase
  const tideScore = calculateTideScore(factors.tidePhase);
  score += tideScore.adjustment;
  if (tideScore.positive) positive.push(tideScore.reason);
  else negative.push(tideScore.reason);

  // Water temperature
  const tempScore = calculateTempScore(factors.waterTemp, factors.season);
  score += tempScore.adjustment;
  if (tempScore.positive) positive.push(tempScore.reason);
  else negative.push(tempScore.reason);

  // Wind conditions
  const windScore = calculateWindScore(factors.windSpeed);
  score += windScore.adjustment;
  if (windScore.positive) positive.push(windScore.reason);
  else negative.push(windScore.reason);

  // Barometric pressure
  const pressureScore = calculatePressureScore(factors.pressure, factors.pressureTrend);
  score += pressureScore.adjustment;
  if (pressureScore.positive) positive.push(pressureScore.reason);
  else negative.push(pressureScore.reason);

  // Time of day
  const timeScore = calculateTimeScore(factors.timeOfDay);
  score += timeScore.adjustment;
  if (timeScore.positive) positive.push(timeScore.reason);

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine rating
  let rating: 'poor' | 'fair' | 'good' | 'excellent';
  if (score >= 80) rating = 'excellent';
  else if (score >= 60) rating = 'good';
  else if (score >= 40) rating = 'fair';
  else rating = 'poor';

  // Calculate best times based on factors
  const bestTimes = calculateBestTimes(factors);

  return {
    score,
    rating,
    bestTimes,
    factors: { positive, negative }
  };
}

function calculateMoonScore(moonPhase: number): { adjustment: number; positive: boolean; reason: string } {
  // Best during new moon and full moon
  const distanceFromOptimal = Math.min(moonPhase, Math.abs(0.5 - moonPhase) * 2);
  
  if (distanceFromOptimal < 0.1) {
    return { adjustment: 15, positive: true, reason: 'Major moon phase' };
  } else if (distanceFromOptimal < 0.25) {
    return { adjustment: 5, positive: true, reason: 'Minor moon phase' };
  } else {
    return { adjustment: -5, positive: false, reason: 'Neutral moon phase' };
  }
}

function calculateTideScore(tidePhase: string): { adjustment: number; positive: boolean; reason: string } {
  switch (tidePhase) {
    case 'incoming':
      return { adjustment: 10, positive: true, reason: 'Incoming tide' };
    case 'outgoing':
      return { adjustment: 8, positive: true, reason: 'Outgoing tide' };
    case 'peak':
      return { adjustment: 5, positive: true, reason: 'Peak tide' };
    case 'slack':
      return { adjustment: -10, positive: false, reason: 'Slack tide' };
    default:
      return { adjustment: 0, positive: false, reason: 'Unknown tide' };
  }
}

function calculateTempScore(waterTemp: number, season: string): { adjustment: number; positive: boolean; reason: string } {
  // Optimal temps vary by season
  const optimalRanges: Record<string, { min: number; max: number }> = {
    spring: { min: 50, max: 65 },
    summer: { min: 68, max: 78 },
    fall: { min: 55, max: 70 },
    winter: { min: 38, max: 48 }
  };
  
  const range = optimalRanges[season];
  
  if (waterTemp >= range.min && waterTemp <= range.max) {
    return { adjustment: 10, positive: true, reason: 'Optimal water temperature' };
  } else if (waterTemp < range.min - 10 || waterTemp > range.max + 10) {
    return { adjustment: -15, positive: false, reason: 'Poor water temperature' };
  } else {
    return { adjustment: -5, positive: false, reason: 'Suboptimal water temperature' };
  }
}

function calculateWindScore(windSpeed: number): { adjustment: number; positive: boolean; reason: string } {
  if (windSpeed < 5) {
    return { adjustment: -5, positive: false, reason: 'Too calm' };
  } else if (windSpeed <= 15) {
    return { adjustment: 10, positive: true, reason: 'Ideal wind conditions' };
  } else if (windSpeed <= 20) {
    return { adjustment: 0, positive: false, reason: 'Moderate wind' };
  } else {
    return { adjustment: -15, positive: false, reason: 'High winds' };
  }
}

function calculatePressureScore(pressure: number, trend: string): { adjustment: number; positive: boolean; reason: string } {
  // Fish are sensitive to pressure changes
  if (trend === 'falling' && pressure < 1010) {
    return { adjustment: 15, positive: true, reason: 'Falling pressure - fish feeding' };
  } else if (trend === 'stable' && pressure >= 1013 && pressure <= 1020) {
    return { adjustment: 5, positive: true, reason: 'Stable pressure' };
  } else if (trend === 'rising' && pressure > 1020) {
    return { adjustment: -10, positive: false, reason: 'High pressure system' };
  } else {
    return { adjustment: 0, positive: false, reason: 'Neutral pressure' };
  }
}

function calculateTimeScore(hour: number): { adjustment: number; positive: boolean; reason: string } {
  // Dawn and dusk are prime times
  if ((hour >= 5 && hour <= 7) || (hour >= 17 && hour <= 19)) {
    return { adjustment: 15, positive: true, reason: 'Prime feeding time' };
  } else if ((hour >= 4 && hour <= 9) || (hour >= 16 && hour <= 21)) {
    return { adjustment: 5, positive: true, reason: 'Good fishing hours' };
  } else if (hour >= 11 && hour <= 14) {
    return { adjustment: -5, positive: false, reason: 'Midday lull' };
  } else {
    return { adjustment: 0, positive: true, reason: 'Standard fishing hours' };
  }
}

function calculateBestTimes(factors: BiteFactors): string[] {
  const times: string[] = [];
  
  // Always include dawn and dusk
  times.push('5:30-7:30 AM (Dawn)');
  times.push('5:00-7:00 PM (Dusk)');
  
  // Add tide-based times if available
  if (factors.tidePhase === 'incoming') {
    times.push('2 hours before high tide');
  } else if (factors.tidePhase === 'outgoing') {
    times.push('First 2 hours of outgoing tide');
  }
  
  // Add moon-based times
  if (factors.moonPhase < 0.1 || factors.moonPhase > 0.9) {
    times.push('Major moon - Midday bite possible');
  }
  
  return times;
}

/**
 * Get current season based on month
 */
export function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Calculate current tide phase (simplified - would need real tide data)
 */
export function getCurrentTidePhase(tides: Array<{ type: string; time: string }>): 'slack' | 'incoming' | 'outgoing' | 'peak' {
  // This is a placeholder - real implementation would calculate based on actual tide times
  const now = new Date();
  const hour = now.getHours();
  
  // Simplified logic
  if (hour % 6 === 0) return 'slack';
  if (hour % 6 < 3) return 'incoming';
  return 'outgoing';
}
