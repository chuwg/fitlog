import type { BasketballSession, RunningSession } from '../types';

export const DEFAULT_WEIGHT_KG = 70;

const MET = {
  running: 10,
  basketballMin: 6,
  basketballMax: 8,
} as const;

function metToKcalPerMin(met: number, weightKg: number): number {
  return (met * 3.5 * weightKg) / 200;
}

function effectiveWeight(weightKg: number | null | undefined): number {
  return weightKg && weightKg > 0 ? weightKg : DEFAULT_WEIGHT_KG;
}

export function runningCalories(
  s: Pick<RunningSession, 'durationS'>,
  weightKg: number | null,
): number {
  const minutes = s.durationS / 60;
  if (minutes <= 0) return 0;
  return Math.round(minutes * metToKcalPerMin(MET.running, effectiveWeight(weightKg)));
}

export function estimateBasketballCalories(
  durationS: number,
  avgHr: number | null,
  weightKg: number | null,
): number {
  const minutes = durationS / 60;
  if (minutes <= 0) return 0;
  const ratio = avgHr ? Math.max(0, Math.min(1, (avgHr - 100) / 80)) : 0.5;
  const met = MET.basketballMin + ratio * (MET.basketballMax - MET.basketballMin);
  return Math.round(minutes * metToKcalPerMin(met, effectiveWeight(weightKg)));
}

export function basketballCalories(
  s: Pick<BasketballSession, 'durationS' | 'avgHr' | 'caloriesKcal'>,
  weightKg: number | null,
): number {
  return s.caloriesKcal ?? estimateBasketballCalories(s.durationS, s.avgHr, weightKg);
}
