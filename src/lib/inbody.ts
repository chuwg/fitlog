import type { InbodyMetric, InbodyRecord } from '../types';

export const METRIC_LABEL: Record<InbodyMetric, string> = {
  weightKg: '체중',
  skeletalMuscleKg: '골격근량',
  bodyFatPct: '체지방률',
  score: '점수',
};

export const METRIC_UNIT: Record<InbodyMetric, string> = {
  weightKg: 'kg',
  skeletalMuscleKg: 'kg',
  bodyFatPct: '%',
  score: '',
};

export const METRIC_ORDER: InbodyMetric[] = [
  'weightKg',
  'skeletalMuscleKg',
  'bodyFatPct',
  'score',
];

export function metricValue(
  record: InbodyRecord,
  metric: InbodyMetric,
): number | null {
  const v = record[metric];
  return typeof v === 'number' ? v : null;
}

export function formatMetric(
  value: number | null,
  metric: InbodyMetric,
): string {
  if (value === null) return '-';
  if (metric === 'score') return String(Math.round(value));
  return value.toFixed(1);
}

export interface MetricDiff {
  current: number | null;
  previous: number | null;
  diff: number | null;
  isImprovement: boolean | null;
}

const HIGHER_IS_BETTER: Record<InbodyMetric, boolean> = {
  weightKg: false,
  skeletalMuscleKg: true,
  bodyFatPct: false,
  score: true,
};

export function metricDiff(
  current: InbodyRecord,
  previous: InbodyRecord | null,
  metric: InbodyMetric,
): MetricDiff {
  const cur = metricValue(current, metric);
  const prev = previous ? metricValue(previous, metric) : null;
  if (cur === null) return { current: null, previous: prev, diff: null, isImprovement: null };
  if (prev === null) return { current: cur, previous: null, diff: null, isImprovement: null };
  const diff = cur - prev;
  if (Math.abs(diff) < 1e-6) {
    return { current: cur, previous: prev, diff: 0, isImprovement: null };
  }
  const isImprovement = HIGHER_IS_BETTER[metric] ? diff > 0 : diff < 0;
  return { current: cur, previous: prev, diff, isImprovement };
}

export function diffArrow(diff: MetricDiff): string {
  if (diff.diff === null || diff.diff === 0) return '–';
  return diff.diff > 0 ? '▲' : '▼';
}

export function formatDiff(diff: MetricDiff, metric: InbodyMetric): string {
  if (diff.diff === null) return '-';
  if (diff.diff === 0) return '변화 없음';
  const abs = Math.abs(diff.diff);
  const sign = diff.diff > 0 ? '+' : '−';
  if (metric === 'score') return `${sign}${Math.round(abs)}`;
  return `${sign}${abs.toFixed(1)}${METRIC_UNIT[metric]}`;
}

export interface SeriesPoint {
  ts: number;
  value: number;
}

export function seriesFor(
  records: InbodyRecord[],
  metric: InbodyMetric,
): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (const r of records) {
    const v = metricValue(r, metric);
    if (v !== null) out.push({ ts: r.measuredAt, value: v });
  }
  return out;
}

export interface GoalProgress {
  current: number;
  goal: number;
  ratio: number;
  achieved: boolean;
  gap: number;
}

export function goalProgress(
  latest: InbodyRecord | null,
  goalScore: number | null,
): GoalProgress | null {
  if (!latest || latest.score === null || !goalScore) return null;
  const ratio = Math.max(0, Math.min(1, latest.score / goalScore));
  return {
    current: latest.score,
    goal: goalScore,
    ratio,
    achieved: latest.score >= goalScore,
    gap: goalScore - latest.score,
  };
}
