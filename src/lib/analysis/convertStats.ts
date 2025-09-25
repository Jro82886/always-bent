// Safe conversion from nullable ScalarStats to required SamplerInput
import type { ScalarStats } from './types';

// SamplerInput expects guaranteed numbers
export interface SamplerInput {
  mean: number;
  min: number;
  max: number;
  // Optional fields can remain optional
  gradient?: number;
}

export type SamplerResult =
  | { ok: true; value: SamplerInput }
  | { ok: false; reason: 'no-data' | 'partial-data' };

export function toSamplerInput(stats: ScalarStats | null | undefined): SamplerResult {
  // No stats object at all
  if (!stats) {
    return { ok: false, reason: 'no-data' };
  }

  // Check required fields
  if (
    stats.mean == null || 
    stats.min == null || 
    stats.max == null ||
    Number.isNaN(stats.mean) ||
    Number.isNaN(stats.min) ||
    Number.isNaN(stats.max)
  ) {
    return { ok: false, reason: 'partial-data' };
  }

  const out: SamplerInput = {
    mean: stats.mean,
    min: stats.min,
    max: stats.max,
  };

  // Optional gradient
  if (stats.gradient != null && !Number.isNaN(stats.gradient)) {
    out.gradient = stats.gradient;
  }

  return { ok: true, value: out };
}
