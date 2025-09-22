import { THRESHOLDS } from '@/config/ocean-thresholds';

export type Strength = 'weak' | 'moderate' | 'strong';

export function frontStrength(gradCper10km: number): Strength | null {
  if (gradCper10km >= THRESHOLDS.SST.FRONT_STRONG) return 'strong';
  if (gradCper10km >= THRESHOLDS.SST.FRONT_MODERATE) return 'moderate';
  return null;
}

export function inSstBand(meanC: number): boolean {
  return meanC >= THRESHOLDS.SST.TARGET_MIN && meanC <= THRESHOLDS.SST.TARGET_MAX;
}

export function inChlMidBand(mean: number): boolean {
  return mean >= THRESHOLDS.CHL.MID_BAND_MIN && mean <= THRESHOLDS.CHL.MID_BAND_MAX;
}
