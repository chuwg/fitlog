import type { QuarterStats, ZoneDistribution } from '../types';
import { estimateBasketballCalories } from './calories';
import { emptyZoneDistribution, totalZoneSeconds } from './pace';

export function estimateCalories(
  durationS: number,
  avgHr: number | null,
  weightKg: number | null = null,
): number {
  return estimateBasketballCalories(durationS, avgHr, weightKg);
}

export function aggregateZones(
  quarters: QuarterStats[],
): ZoneDistribution {
  const out = emptyZoneDistribution();
  for (const q of quarters) {
    if (!q.zoneDistribution) continue;
    out[1] += q.zoneDistribution[1];
    out[2] += q.zoneDistribution[2];
    out[3] += q.zoneDistribution[3];
    out[4] += q.zoneDistribution[4];
    out[5] += q.zoneDistribution[5];
  }
  return out;
}

function ratioToStars(ratio: number): number {
  if (ratio >= 0.6) return 5;
  if (ratio >= 0.4) return 4;
  if (ratio >= 0.25) return 3;
  if (ratio >= 0.15) return 2;
  if (ratio >= 0.05) return 1;
  return 0;
}

export function effectStars(zones: ZoneDistribution): {
  aerobic: number;
  anaerobic: number;
} {
  const total = totalZoneSeconds(zones);
  if (total === 0) return { aerobic: 0, anaerobic: 0 };
  const aerobicRatio = (zones[2] + zones[3]) / total;
  const anaerobicRatio = (zones[4] + zones[5]) / total;
  return {
    aerobic: ratioToStars(aerobicRatio),
    anaerobic: ratioToStars(anaerobicRatio),
  };
}

export function tomorrowAdvice(
  durationS: number,
  zones: ZoneDistribution | null,
): string {
  const minutes = durationS / 60;
  let load = minutes;
  if (zones) {
    const total = totalZoneSeconds(zones);
    if (total > 0) {
      const intense = (zones[4] + zones[5]) / total;
      load = minutes * (1 + intense * 1.5);
    }
  }
  if (load >= 90) return '휴식 권고. 가벼운 산책 + 스트레칭으로 회복하세요';
  if (load >= 60) return '가벼운 훈련 권장. Zone 2 조깅 30분이 적당합니다';
  if (load >= 30) return '일반 훈련 가능. 컨디션에 맞춰 진행하세요';
  return '추가 훈련 가능. 인터벌이나 강도 훈련도 좋습니다';
}

export function quarterFeedback(q: QuarterStats): string {
  const total = q.zoneDistribution ? totalZoneSeconds(q.zoneDistribution) : 0;
  const intense =
    q.zoneDistribution && total > 0
      ? (q.zoneDistribution[4] + q.zoneDistribution[5]) / total
      : 0;
  if (intense >= 0.4) return '고강도 영역에 오래 머물렀어요';
  if (q.maxHr && q.maxHr >= 180) return '최고 심박이 높은 격렬한 쿼터';
  if (q.jumps >= 20) return '점프가 많은 활동량 높은 쿼터';
  if (q.sprints >= 15) return '스프린트 위주의 빠른 전개';
  return '안정적인 쿼터';
}
