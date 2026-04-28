import type { HrZone, PaceSegment, ZoneDistribution } from '../types';

export function paceFromTargetTime(
  targetDistanceM: number,
  targetTimeS: number,
): number {
  if (targetDistanceM <= 0 || targetTimeS <= 0) return 0;
  return (targetTimeS / targetDistanceM) * 1000;
}

export function formatPace(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return '--:--';
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--:--';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2);
}

export interface PaceProConfig {
  warmupSeconds: number;
  finishSeconds: number;
  midFinishSeconds: number;
}

const DEFAULT_PACEPRO: PaceProConfig = {
  warmupSeconds: 15,
  midFinishSeconds: 5,
  finishSeconds: 10,
};

export function buildPacePro(
  basePaceSPerKm: number,
  config: PaceProConfig = DEFAULT_PACEPRO,
): PaceSegment[] {
  return [
    {
      index: 0,
      startRatio: 0,
      endRatio: 0.2,
      paceSPerKm: basePaceSPerKm + config.warmupSeconds,
      label: '워밍업',
    },
    {
      index: 1,
      startRatio: 0.2,
      endRatio: 0.7,
      paceSPerKm: basePaceSPerKm,
      label: '메인',
    },
    {
      index: 2,
      startRatio: 0.7,
      endRatio: 0.9,
      paceSPerKm: basePaceSPerKm - config.midFinishSeconds,
      label: '유지',
    },
    {
      index: 3,
      startRatio: 0.9,
      endRatio: 1.0,
      paceSPerKm: basePaceSPerKm - config.finishSeconds,
      label: '마무리',
    },
  ];
}

export function pickSegmentForProgress(
  segments: PaceSegment[],
  progressRatio: number,
): PaceSegment {
  const r = Math.max(0, Math.min(1, progressRatio));
  return (
    segments.find((s) => r >= s.startRatio && r < s.endRatio) ??
    segments[segments.length - 1]!
  );
}

const ZONE_THRESHOLDS: Array<{ zone: HrZone; min: number }> = [
  { zone: 5, min: 0.85 },
  { zone: 4, min: 0.7 },
  { zone: 3, min: 0.6 },
  { zone: 2, min: 0.5 },
  { zone: 1, min: 0 },
];

export function hrZoneFor(bpm: number, maxHr: number | null): HrZone | null {
  if (!maxHr || maxHr <= 0 || bpm <= 0) return null;
  const ratio = bpm / maxHr;
  for (const t of ZONE_THRESHOLDS) {
    if (ratio >= t.min) return t.zone;
  }
  return 1;
}

export const ZONE_LABEL: Record<HrZone, string> = {
  1: 'Zone 1',
  2: 'Zone 2',
  3: 'Zone 3',
  4: 'Zone 4',
  5: 'Zone 5',
};

export const ZONE_DESCRIPTION: Record<HrZone, string> = {
  1: '매우 가벼움',
  2: '가벼운 유산소',
  3: '중강도 유산소',
  4: '역치',
  5: '최대',
};

export const ZONE_COLOR: Record<HrZone, string> = {
  1: '#5F6C7B',
  2: '#00D4AA',
  3: '#7C9EF9',
  4: '#F5C451',
  5: '#FF5C6B',
};

export function emptyZoneDistribution(): ZoneDistribution {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
}

export function totalZoneSeconds(z: ZoneDistribution): number {
  return z[1] + z[2] + z[3] + z[4] + z[5];
}

export function predictedFinishSeconds(
  distanceM: number,
  targetDistanceM: number,
  durationS: number,
): number {
  if (distanceM <= 0 || targetDistanceM <= 0) return 0;
  const remaining = Math.max(0, targetDistanceM - distanceM);
  const currentPace = durationS / distanceM;
  return durationS + remaining * currentPace;
}

export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface FeedbackInput {
  avgPace: number;
  targetPace: number | null;
  zoneDist: ZoneDistribution | null;
  gctMs: number | null;
}

export function buildSessionFeedback(input: FeedbackInput): string {
  const lines: string[] = [];
  if (input.targetPace && input.avgPace > 0) {
    const diff = input.avgPace - input.targetPace;
    if (diff <= -5) {
      lines.push(`목표 페이스보다 ${Math.abs(Math.round(diff))}초/km 빠른 좋은 흐름`);
    } else if (diff >= 5) {
      lines.push(`목표 페이스보다 ${Math.round(diff)}초/km 느렸어요`);
    } else {
      lines.push('목표 페이스에 거의 정확하게 도달');
    }
  }
  if (input.zoneDist) {
    const total =
      input.zoneDist[1] +
      input.zoneDist[2] +
      input.zoneDist[3] +
      input.zoneDist[4] +
      input.zoneDist[5];
    if (total > 0) {
      const z5 = input.zoneDist[5] / total;
      const z2 = input.zoneDist[2] / total;
      if (z5 >= 0.3) lines.push('Zone 5에 오래 머물렀어요. 회복을 챙기세요');
      else if (z2 >= 0.6) lines.push('유산소 베이스 빌딩에 좋은 세션');
    }
  }
  if (input.gctMs && input.gctMs > 280) {
    lines.push(`GCT ${Math.round(input.gctMs)}ms — 케이던스 살짝 높여보세요`);
  }
  if (lines.length === 0) return '오늘도 좋은 러닝이었어요';
  return lines.join(' · ');
}
