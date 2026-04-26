import { shiftModifier } from '../services/shift';
import type {
  HealthSnapshot,
  Readiness,
  ReadinessBreakdown,
  ReadinessStatus,
  ShiftDay,
  WorkoutIntensity,
  WorkoutRecord,
} from '../types';

function sleepScore(snap: HealthSnapshot): number {
  const hours = snap.sleepMinutes / 60;
  let base: number;
  if (hours >= 7) base = 30;
  else if (hours >= 6) base = 22;
  else if (hours >= 5) base = 14;
  else base = 6;
  const bonus = snap.deepSleepRatio >= 0.2 ? 5 : 0;
  return Math.min(30, base + bonus);
}

function hrvScore(snap: HealthSnapshot): number {
  if (snap.hrvAverageMs <= 0) return 18;
  const ratio = snap.hrvMs / snap.hrvAverageMs;
  if (ratio >= 1.1) return 25;
  if (ratio <= 0.9) return 10;
  return 18;
}

function recoveryScore(snap: HealthSnapshot): number {
  if (snap.restingHrAverageBpm <= 0) return 18;
  const diff = snap.restingHrBpm - snap.restingHrAverageBpm;
  if (diff <= -2) return 25;
  if (diff >= 3) return 10;
  return 18;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function dayBeforeKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return d.toISOString().slice(0, 10);
}

function dayIntensity(workouts: WorkoutRecord[], dayKey: string): WorkoutIntensity {
  const w = workouts.filter((x) => x.date === dayKey);
  if (w.length === 0) return 'rest';
  const ranks: Record<WorkoutIntensity, number> = { rest: 0, light: 1, moderate: 2, hard: 3 };
  return w.reduce<WorkoutIntensity>(
    (top, cur) => (ranks[cur.intensity] > ranks[top] ? cur.intensity : top),
    'rest',
  );
}

function loadScore(snap: HealthSnapshot): number {
  const yesterday = dayIntensity(snap.recentWorkouts, yesterdayKey());
  const dayBefore = dayIntensity(snap.recentWorkouts, dayBeforeKey());
  if (yesterday === 'hard' && dayBefore === 'hard') return 2;
  switch (yesterday) {
    case 'rest':
      return 20;
    case 'light':
      return 16;
    case 'moderate':
      return 12;
    case 'hard':
      return 6;
  }
}

function statusFromTotal(total: number): {
  status: ReadinessStatus;
  label: string;
  emoji: string;
  advice: string;
} {
  if (total >= 80) {
    return { status: 'peak', label: '최상', emoji: '🟢', advice: '고강도 훈련 가능' };
  }
  if (total >= 60) {
    return { status: 'good', label: '양호', emoji: '🟡', advice: '일반 훈련' };
  }
  if (total >= 40) {
    return { status: 'fair', label: '보통', emoji: '🟠', advice: '가벼운 훈련' };
  }
  return { status: 'fatigue', label: '피로', emoji: '🔴', advice: '휴식 권고' };
}

export function computeReadiness(
  snap: HealthSnapshot,
  shiftDay?: ShiftDay | null,
): Readiness {
  const breakdown: ReadinessBreakdown = {
    sleep: sleepScore(snap),
    hrv: hrvScore(snap),
    recovery: recoveryScore(snap),
    load: loadScore(snap),
  };
  const base = breakdown.sleep + breakdown.hrv + breakdown.recovery + breakdown.load;
  const modifier = shiftDay ? shiftModifier(shiftDay) : 0;
  const total = Math.max(0, Math.min(100, base + modifier));
  const { status, label, emoji, advice } = statusFromTotal(total);
  return { total, breakdown, status, label, emoji, advice };
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function recommendWorkout(
  readiness: Readiness,
  goal5kSeconds?: number | null,
): { title: string; detail: string } {
  if (goal5kSeconds && goal5kSeconds > 0) {
    const pace = goal5kSeconds / 5;
    switch (readiness.status) {
      case 'peak':
        return {
          title: '인터벌 러닝 6km',
          detail: `${formatPace(pace - 10)}/km × 4분 + 회복 2분 × 5세트. 목표 페이스보다 빠르게.`,
        };
      case 'good':
        return {
          title: '조깅 5km',
          detail: `${formatPace(pace + 20)}/km 편안한 페이스. 5k 목표 페이스로 마지막 1km 마무리.`,
        };
      case 'fair':
        return {
          title: '가벼운 조깅 3km',
          detail: `${formatPace(pace + 60)}/km 회복 페이스. 무리 없이 꾸준히.`,
        };
      case 'fatigue':
        return {
          title: '액티브 리커버리',
          detail: '20분 산책 + 스트레칭. 오늘은 몸을 회복시키는 것이 훈련.',
        };
    }
  }
  switch (readiness.status) {
    case 'peak':
      return {
        title: '인터벌 러닝 6km',
        detail: '4분 빠르게 + 2분 천천히 × 5세트. 몸 상태가 좋으니 강도 높여도 OK.',
      };
    case 'good':
      return {
        title: 'Zone 2 조깅 5km',
        detail: '대화 가능한 편안한 페이스. 심박수 60~70%대 유지.',
      };
    case 'fair':
      return {
        title: 'Zone 2 가벼운 조깅 3km',
        detail: '코로 호흡할 수 있는 페이스. 스트레칭과 모빌리티 10분 추가.',
      };
    case 'fatigue':
      return {
        title: '액티브 리커버리',
        detail: '20분 산책 + 스트레칭. 오늘은 몸을 회복시키는 것이 훈련.',
      };
  }
}
