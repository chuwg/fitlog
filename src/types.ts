export type WorkoutIntensity = 'rest' | 'light' | 'moderate' | 'hard';

export interface WorkoutRecord {
  date: string;
  durationMin: number;
  calories: number;
  intensity: WorkoutIntensity;
  type?: string;
}

export interface HealthSnapshot {
  sleepMinutes: number;
  deepSleepRatio: number;
  hrvMs: number;
  hrvAverageMs: number;
  restingHrBpm: number;
  restingHrAverageBpm: number;
  recentWorkouts: WorkoutRecord[];
  isMock: boolean;
}

export type ReadinessStatus = 'peak' | 'good' | 'fair' | 'fatigue';

export interface ReadinessBreakdown {
  sleep: number;
  hrv: number;
  recovery: number;
  load: number;
}

export interface Readiness {
  total: number;
  breakdown: ReadinessBreakdown;
  status: ReadinessStatus;
  label: string;
  emoji: string;
  advice: string;
}

export interface WeatherInfo {
  tempC: number;
  feelsLikeC: number;
  weatherCode: number;
  description: string;
  humidity: number;
  windKmh: number;
  pm25?: number;
  pm10?: number;
  locationName: string;
  isDefaultLocation: boolean;
}

export type ShiftKind = 'day' | 'night' | 'off';
export type ShiftDay = ShiftKind | 'post-night';

export interface ShiftConfig {
  cycle: ShiftKind[];
  startDate: string;
  dayStart: string;
  dayEnd: string;
  nightStart: string;
  nightEnd: string;
}

export type SupplementTiming = 'morning' | 'preworkout' | 'postworkout' | 'bedtime';

export interface Supplement {
  id: number;
  name: string;
  dose: string;
  timing: SupplementTiming;
  shiftAdjust: boolean;
  enabled: boolean;
}

export type SupplementBaseTimes = Record<SupplementTiming, string>;

export interface CycleDay {
  date: Date;
  kind: ShiftDay;
  isToday: boolean;
}

export interface UserProfile {
  name: string | null;
  runningGoal5kSeconds: number | null;
}

export interface MorningReportConfig {
  notificationTime: string;
  skipNight: boolean;
  adjustPostNight: boolean;
}
